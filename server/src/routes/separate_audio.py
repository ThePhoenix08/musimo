import shutil
import subprocess
import traceback
import uuid
from datetime import datetime
from pathlib import Path

import aiofiles
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from supabase_auth import User

from src.core.logger_setup import logger
from src.core.separation_jobState import jobs_storage, websocket_connections
from src.database.enums import (
    AudioFileStatus,
    AudioFormat,
    JobStatus,
)
from src.database.models import AudioFile, SeparatedAudioFile
from src.database.models.project import Project
from src.database.session import get_db
from src.models.audio_separation.file_utils import (
    INPUT_FOLDER,
    OUTPUT_FOLDER,
    calculate_checksum,
    get_audio_metadata,
)
from src.models.audio_separation.pipelines.separation import separate_audio_pipeline
from src.schemas.audioSeparation import AudioUploadResponse
from src.services.dependencies import get_current_user

router = APIRouter()


def convert_to_wav(input_path: Path) -> Path:
    """Convert any audio file to WAV using ffmpeg"""
    output_path = input_path.with_suffix(".wav")
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(input_path),
            str(output_path),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=True,
    )
    return output_path


@router.websocket("/ws/jobs/{job_id}")
async def websocket_job_progress(websocket: WebSocket, job_id: str):
    """WebSocket endpoint for real-time job progress updates"""
    await websocket.accept()
    websocket_connections[job_id] = websocket

    try:
        if job_id in jobs_storage:
            await websocket.send_json(
                {
                    "job_id": job_id,
                    "progress": jobs_storage[job_id]["progress"],
                    "message": jobs_storage[job_id]["message"],
                }
            )

        while True:
            try:
                await websocket.receive_text()
                await websocket.send_json({"type": "pong"})
            except WebSocketDisconnect:
                break

    except Exception as e:
        logger.error(f"WebSocket error for job {job_id}: {e}")
    finally:
        if job_id in websocket_connections:
            del websocket_connections[job_id]


@router.post("/api/audio/upload", response_model=AudioUploadResponse)
async def upload_audio(
    file: UploadFile = File(...),
    project_id: str = None,
    background_tasks: BackgroundTasks = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload audio file for separation.
    - Saves file locally and converts to WAV
    - Stores metadata in database
    - Initiates background separation task
    """
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        job_id = str(uuid.uuid4())
        audio_id = str(uuid.uuid4())

        # Resolve or create project
        if not project_id:
            new_project = Project(
                name=f"Project {datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                description="Auto-created project",
                user_id=current_user.id,
            )
            db.add(new_project)
            await db.commit()
            await db.refresh(new_project)
            project_id = str(new_project.id)
        else:
            result = await db.execute(
                select(Project).where(Project.id == uuid.UUID(project_id))
            )
            existing_project = result.scalar_one_or_none()
            if not existing_project:
                raise HTTPException(status_code=400, detail="Invalid project_id")

        # Save uploaded file
        file_extension = Path(file.filename).suffix
        local_filename = f"{job_id}{file_extension}"
        local_file_path = INPUT_FOLDER / local_filename

        async with aiofiles.open(local_file_path, "wb") as f:
            content = await file.read()
            await f.write(content)

        logger.info(f"Saved uploaded file: {local_file_path}")

        # Convert to WAV and use that as the source for all downstream processing
        converted_path = convert_to_wav(local_file_path)
        metadata = get_audio_metadata(converted_path)
        checksum = calculate_checksum(converted_path)
        local_file_path = converted_path

        # Check for duplicate checksum and return existing record if found
        existing = await db.execute(
            select(AudioFile).where(AudioFile.checksum == checksum)
        )
        existing_record = existing.scalar_one_or_none()
        if existing_record:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"This audio file has already been uploaded "
                    f"(audio_id={existing_record.id}). "
                    "Use the existing record or delete it first."
                ),
            )

        # Create AudioFile record
        audio_file = AudioFile(
            id=uuid.UUID(audio_id),
            project_id=uuid.UUID(project_id),
            file_path=str(local_file_path),
            file_name=file.filename,
            duration=metadata["duration"],
            sample_rate=metadata["sample_rate"],
            channels=metadata["channels"],
            format=AudioFormat.WAV,
            checksum=checksum,
            status=AudioFileStatus.UPLOADED,
        )

        db.add(audio_file)
        await db.commit()
        await db.refresh(audio_file)

        logger.info(f"Created AudioFile record with ID: {audio_id}")

        # Initialize job state
        jobs_storage[job_id] = {
            "job_id": job_id,
            "audio_id": audio_id,
            "project_id": project_id,
            "status": "queued",
            "progress": 0,
            "message": "Audio uploaded, queued for separation",
            "input_file": file.filename,
            "created_at": datetime.utcnow().isoformat(),
            "stems": [],
        }

        background_tasks.add_task(
            separate_audio_pipeline,
            local_file_path,
            job_id,
            audio_id,
            project_id,
        )

        logger.info(f"Background separation task started for job {job_id}")

        return AudioUploadResponse(
            job_id=job_id,
            audio_id=audio_id,
            status="queued",
            message="Audio uploaded successfully. Separation started.",
            file_name=file.filename,
            created_at=datetime.utcnow().isoformat(),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading audio: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/jobs/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    """Get the status of a separation job"""
    if job_id not in jobs_storage:
        raise HTTPException(status_code=404, detail="Job not found")

    job_data = jobs_storage[job_id]

    return JobStatus(
        job_id=job_data["job_id"],
        audio_id=job_data["audio_id"],
        status=job_data["status"],
        progress=job_data["progress"],
        message=job_data["message"],
        input_file=job_data.get("input_file"),
        created_at=job_data["created_at"],
        completed_at=job_data.get("completed_at"),
        stems=job_data.get("stems", []),
    )


@router.get("/api/jobs")
async def list_jobs():
    """List all separation jobs"""
    return {"jobs": list(jobs_storage.values()), "total": len(jobs_storage)}


@router.get("/api/audio/{audio_id}/stems")
async def get_audio_stems(audio_id: str, db: AsyncSession = Depends(get_db)):
    """Get all separated stems for an audio file"""
    try:
        # Query separated audio files
        stmt = select(SeparatedAudioFile).where(
            SeparatedAudioFile.parent_audio_id == uuid.UUID(audio_id)
        )
        result = await db.execute(stmt)
        stems = result.scalars().all()

        if not stems:
            raise HTTPException(status_code=404, detail="No stems found for this audio")

        return {
            "audio_id": audio_id,
            "stems": [
                {
                    "stem_id": str(stem.id),
                    "label": stem.source_label.value,
                    "file_name": stem.file_name,
                    "file_path": stem.file_path,
                    "duration": stem.duration,
                    "sample_rate": stem.sample_rate,
                    "channels": stem.channels,
                    "status": stem.status.value,
                }
                for stem in stems
            ],
        }

    except Exception as e:
        logger.error(f"Error fetching stems: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/api/jobs/{job_id}")
async def delete_job(job_id: str):
    """Delete a job and clean up associated files"""
    if job_id not in jobs_storage:
        raise HTTPException(status_code=404, detail="Job not found")

    # Clean up local files
    job_output_dir = OUTPUT_FOLDER / job_id
    if job_output_dir.exists():
        shutil.rmtree(job_output_dir)

    # Remove from storage
    del jobs_storage[job_id]

    return {"message": "Job deleted successfully", "job_id": job_id}


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Demucs Audio Separator",
        "version": "1.0.0",
        "active_jobs": len(jobs_storage),
        "websocket_connections": len(websocket_connections),
    }
