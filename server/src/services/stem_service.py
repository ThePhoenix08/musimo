import logging
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.database.models.audio_file import AudioFile, SeparatedAudioFile
from src.database.models.analysis_record import SeparationAnalysisRecord
from src.database.enums import (
    AudioFileStatus,
    SeparatedSourceLabel,
    SeparationStatus,
    AnalysisType,
)

logger = logging.getLogger(__name__)

STEM_LABEL_MAP = {
    "vocals": SeparatedSourceLabel.VOCALS,
    "drums":  SeparatedSourceLabel.DRUMS,
    "bass":   SeparatedSourceLabel.BASS,
    "other":  SeparatedSourceLabel.OTHER,
}

# Literal type alias makes call-sites self-documenting
StemStatusLiteral = str  # "processing" | "done" | "failed"

_AUDIO_STATUS_MAP: dict[StemStatusLiteral, AudioFileStatus] = {
    "processing": AudioFileStatus.PROCESSING,
    "done":       AudioFileStatus.PROCESSED,
    "failed":     AudioFileStatus.FAILED,
}

_SEPARATION_STATUS_MAP: dict[StemStatusLiteral, SeparationStatus] = {
    "processing": SeparationStatus.PROCESSING,
    "done":       SeparationStatus.COMPLETED,
    "failed":     SeparationStatus.FAILED,
}


async def update_stem_status(
    db: AsyncSession,
    audio_id: str,
    status: StemStatusLiteral,       # "processing" | "done" | "failed"
    stems: dict | None = None,       # {"vocals": "url", "drums": "url", ...}
    error: str | None = None,
) -> None:
    """
    Atomically update AudioFile.status and the associated SeparationAnalysisRecord.

    - Creates the SeparationAnalysisRecord if it doesn't exist yet.
    - On "done": stores stem URL map in results JSON.
    - On "failed": stores error message in results JSON.
    - Does NOT create SeparatedAudioFile rows — the pipeline handles that.
    """
    try:
        audio_uuid = uuid.UUID(audio_id) if isinstance(audio_id, str) else audio_id

        # 1. Fetch AudioFile
        result = await db.execute(select(AudioFile).where(AudioFile.id == audio_uuid))
        audio = result.scalar_one_or_none()
        if not audio:
            logger.error(f"AudioFile {audio_id} not found — cannot update stem status")
            return

        # 2. Fetch or create SeparationAnalysisRecord
        rec_result = await db.execute(
            select(SeparationAnalysisRecord).where(
                SeparationAnalysisRecord.project_id == audio.project_id
            )
        )
        separation_record = rec_result.scalar_one_or_none()

        if not separation_record:
            separation_record = SeparationAnalysisRecord(
                project_id=audio.project_id,
                audio_file_id=audio.id,
                analysis_type=AnalysisType.SEPARATION,
                results={},
                summary_text="",
                separation_status=SeparationStatus.PENDING,
            )
            db.add(separation_record)
            await db.flush()

        # 3. Apply status mappings
        audio.status = _AUDIO_STATUS_MAP[status]
        separation_record.separation_status = _SEPARATION_STATUS_MAP[status]

        # 4. On done: store stem URLs in results JSON
        if status == "done" and stems:
            separation_record.results = {"stems": stems}
            separation_record.summary_text = f"{len(stems)} stems separated successfully"

        # 5. On failed: store error message
        if status == "failed" and error:
            separation_record.results = {"error": error}
            separation_record.summary_text = f"Separation failed: {error}"

        await db.commit()
        logger.info(f"Audio {audio_id} stem status → {status}")

    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update stem status for {audio_id}: {e}")
        raise