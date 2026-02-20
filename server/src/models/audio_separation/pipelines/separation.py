import asyncio
import logging
import shutil
import subprocess
import sys
import traceback
import uuid
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import select

from src.core.separation_jobState import jobs_storage
from src.database.enums import AudioFileStatus, AudioFormat, SeparatedSourceLabel
from src.database.models import AudioFile, SeparatedAudioFile
from src.database.session import AsyncSessionLocal
from src.models.audio_separation.file_utils import (
    calculate_checksum,
    get_audio_duration,
    get_audio_metadata,
    upload_to_supabase_bucket,
)
from src.models.audio_separation.progress import send_progress_update
from src.routes.separate_audio import OUTPUT_FOLDER

logger = logging.getLogger(__name__)


def convert_stem_to_wav(src: Path, dst: Path) -> None:
    """Convert a stem file (any format) to WAV using ffmpeg."""
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(src),
            str(dst),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=True,
    )


def run_demucs(
    job_output_dir: Path, audio_file_path: Path
) -> subprocess.CompletedProcess:
    """
    Run Demucs in a subprocess isolated from the parent's signal handling.

    On Windows, uvicorn --reload broadcasts CTRL_C_EVENT to the entire console
    process group when restarting a worker. Without isolation, Demucs dies with
    exit code 3221225786 (STATUS_CONTROL_C_EXIT) mid-inference even though no
    key was pressed. CREATE_NEW_PROCESS_GROUP + DETACHED_PROCESS put Demucs in
    its own group/console so it never receives that broadcast.

    --mp3 avoids the torchaudio WAV encoder that requires the optional
    torchcodec package. Stems are converted back to WAV via ffmpeg below.
    """
    cmd = [
        sys.executable,
        "-m",
        "demucs",
        "-n",
        "htdemucs",
        "--mp3",
        "--out",
        str(job_output_dir),
        str(audio_file_path),
    ]

    kwargs: dict = dict(capture_output=True, text=True)

    if sys.platform == "win32":
        # CREATE_NEW_PROCESS_GROUP isolates the child from CTRL_C_EVENT
        # broadcasts sent by uvicorn --reload to the parent process group.
        #
        # DO NOT add DETACHED_PROCESS (0x008) here — it removes the console
        # context entirely, which causes Intel MKL / the Fortran runtime used
        # by PyTorch to abort with "forrtl: error (200): program aborting due
        # to window-CLOSE event" (exit 3221225786) before inference even starts.
        CREATE_NEW_PROCESS_GROUP = 0x00000200
        kwargs["creationflags"] = CREATE_NEW_PROCESS_GROUP
    else:
        kwargs["start_new_session"] = True

    logger.info("Starting demucs process")
    return subprocess.run(cmd, **kwargs)


async def separate_audio_pipeline(
    audio_file_path: Path,
    job_id: str,
    audio_id: str,
    project_id: str,
):
    """Complete audio separation pipeline with Supabase integration"""

    async with AsyncSessionLocal() as db:
        try:
            await send_progress_update(job_id, 0, "Starting audio separation...")

            duration = get_audio_duration(audio_file_path)
            logger.info(f"Audio duration: {duration:.2f} seconds")

            job_output_dir = OUTPUT_FOLDER / job_id
            job_output_dir.mkdir(exist_ok=True)

            await send_progress_update(job_id, 10, "Loading audio file...")

            # Update audio status → PROCESSING
            stmt = select(AudioFile).where(AudioFile.id == uuid.UUID(audio_id))
            result = await db.execute(stmt)
            audio_file_record = result.scalar_one_or_none()

            if audio_file_record:
                audio_file_record.status = AudioFileStatus.PROCESSING
                await db.commit()

            await send_progress_update(job_id, 25, "Separating audio...")

            demucs_result = await asyncio.to_thread(
                run_demucs, job_output_dir, audio_file_path
            )

            if demucs_result.returncode != 0:
                error_detail = (
                    demucs_result.stderr.strip()
                    or demucs_result.stdout.strip()
                    or "No output captured"
                )
                raise Exception(
                    f"Demucs failed (exit {demucs_result.returncode}): {error_detail}"
                )

            await send_progress_update(job_id, 70, "Processing separated stems...")

            model_dir = job_output_dir / "htdemucs" / audio_file_path.stem
            if not model_dir.exists():
                raise Exception(f"Output directory not found: {model_dir}")

            stems = ["vocals", "drums", "bass", "other"]
            stem_label_map = {
                "vocals": SeparatedSourceLabel.VOCALS,
                "drums": SeparatedSourceLabel.DRUMS,
                "bass": SeparatedSourceLabel.BASS,
                "other": SeparatedSourceLabel.OTHER,
            }

            separated_files_info = []

            for stem in stems:
                # Demucs writes MP3 files when --mp3 is passed
                src = model_dir / f"{stem}.mp3"
                if not src.exists():
                    logger.warning(f"Stem file not found: {src}")
                    continue

                # Convert MP3 → WAV so the rest of the pipeline is unchanged
                dst = job_output_dir / f"{audio_file_path.stem}_{stem}.wav"
                convert_stem_to_wav(src, dst)

                stem_metadata = get_audio_metadata(dst)
                stem_checksum = calculate_checksum(dst)

                storage_path = (
                    f"projects/{project_id}/separated/{job_id}/"
                    f"{audio_file_path.stem}_{stem}.wav"
                )

                public_url = await upload_to_supabase_bucket(dst, storage_path)

                separated_audio = SeparatedAudioFile(
                    id=uuid.uuid4(),
                    parent_audio_id=uuid.UUID(audio_id),
                    project_id=uuid.UUID(project_id),
                    file_path=public_url,
                    file_name=f"{audio_file_path.stem}_{stem}.wav",
                    duration=stem_metadata["duration"],
                    sample_rate=stem_metadata["sample_rate"],
                    channels=stem_metadata["channels"],
                    format=AudioFormat.WAV,
                    checksum=stem_checksum,
                    status=AudioFileStatus.PROCESSED,
                    source_label=stem_label_map[stem],
                )

                db.add(separated_audio)

                separated_files_info.append(
                    {
                        "stem_id": str(separated_audio.id),
                        "label": stem,
                        "file_name": separated_audio.file_name,
                        "storage_path": public_url,
                        "duration": stem_metadata["duration"],
                    }
                )

            await db.commit()

            # Update original file status
            if audio_file_record:
                audio_file_record.status = AudioFileStatus.PROCESSED
                await db.commit()

            shutil.rmtree(job_output_dir / "htdemucs", ignore_errors=True)

            if job_id in jobs_storage:
                jobs_storage[job_id]["stems"] = separated_files_info
                jobs_storage[job_id]["completed_at"] = datetime.now(UTC).isoformat()

            await send_progress_update(job_id, 100, "Audio separation complete!")
            logger.info(f"Job {job_id} completed successfully")
            return True

        except Exception as e:
            logger.error("Separation pipeline crashed")
            logger.error(traceback.format_exc())
            error_msg = f"Error during separation: {repr(e)}"

            # Guard against the DB session being closed/invalidated before we
            # reach the except block (e.g. the upload raised after a prior commit
            # left the connection in a bad state). Open a fresh session for the
            # status update so the rollback / commit always has a live connection.
            try:
                async with AsyncSessionLocal() as error_db:
                    stmt = select(AudioFile).where(AudioFile.id == uuid.UUID(audio_id))
                    result = await error_db.execute(stmt)
                    audio_file_record = result.scalar_one_or_none()
                    if audio_file_record:
                        audio_file_record.status = AudioFileStatus.FAILED
                        await error_db.commit()
            except Exception as db_err:
                logger.error(f"Failed to update AudioFile status to FAILED: {db_err}")

            await send_progress_update(job_id, -1, error_msg)

            if job_id in jobs_storage:
                jobs_storage[job_id]["status"] = "failed"
                jobs_storage[job_id]["message"] = error_msg

            return False
