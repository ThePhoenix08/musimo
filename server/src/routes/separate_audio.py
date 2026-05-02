import logging
import tempfile
import traceback
import uuid
from pathlib import Path
from io import BytesIO

import aiofiles
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from supabase_auth import User

from src.database.models import AudioFile, SeparatedAudioFile
from src.database.session import get_db
from src.models.audio_separation.pipelines.separation import separate_audio_pipeline
from src.services.dependencies import get_current_user
from src.core.supabase import SupabaseStorageClient, get_storage
from src.core.settings import CONSTANTS
from src.schemas.api.response import ApiResponse, ApiErrorResponse

logger = logging.getLogger(__name__)
router = APIRouter()


# PROCESS AUDIO
@router.post("/api/audio/process/{audio_id}")
async def process_audio(
    audio_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    storage: SupabaseStorageClient = Depends(get_storage),
):
    temp_input: Path | None = None

    try:
        try:
            audio_uuid = uuid.UUID(audio_id)
        except ValueError:
            return ApiErrorResponse(
                code="INVALID_ID",
                message="Invalid audio ID format",
                http_status=400,
            )

        result = await db.execute(select(AudioFile).where(AudioFile.id == audio_uuid))
        audio = result.scalar_one_or_none()

        if not audio:
            return ApiErrorResponse(
                code="NOT_FOUND",
                message="Audio not found",
                http_status=404,
            )

        if str(audio.project.user_id) != str(current_user.id):
            return ApiErrorResponse(
                code="FORBIDDEN",
                message="Not authorized",
                http_status=403,
            )

        file_bytes = await storage.download_file(
            bucket=CONSTANTS.SUPABASE_AUDIO_SOURCE_BUCKET,
            path=audio.file_path,
        )

        if not file_bytes:
            return ApiErrorResponse(
                code="EMPTY_FILE",
                message="Downloaded file is empty",
                http_status=400,
            )

        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            temp_input = Path(tmp.name)

        async with aiofiles.open(temp_input, "wb") as f:
            await f.write(file_bytes)

        stems = await separate_audio_pipeline(
            temp_input,
            str(audio.id),
            str(audio.project_id),
        )

        if not stems:
            return ApiErrorResponse(
                code="NO_STEMS",
                message="Audio processed but no stems generated",
                http_status=422,
            )

        return ApiResponse(
            message="Audio processed successfully",
            data={
                "audio_id": str(audio.id),
                "project_id": str(audio.project_id),
                "count": len(stems),
                "stems": stems,
            },
        )

    except Exception as e:
        logger.error(traceback.format_exc())
        return ApiErrorResponse(
            code="PROCESS_FAILED",
            message="Failed to process audio",
            details=str(e),
        )

    finally:
        if temp_input and temp_input.exists():
            temp_input.unlink(missing_ok=True)


# GET STEMS
@router.get("/api/audio/{audio_id}/stems")
async def get_stems(
    audio_id: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        try:
            audio_uuid = uuid.UUID(audio_id)
        except ValueError:
            return ApiErrorResponse(
                code="INVALID_ID",
                message="Invalid audio ID format",
                http_status=400,
            )

        result = await db.execute(
            select(SeparatedAudioFile).where(
                SeparatedAudioFile.parent_audio_id == audio_uuid
            )
        )

        stems = result.scalars().all()

        if not stems:
            return ApiErrorResponse(
                code="NO_STEMS",
                message="No stems found",
                http_status=404,
            )

        data = [
            {
                "id": str(stem.id),
                "file_name": stem.file_name,
                "file_url": f"{CONSTANTS.AUDIO_STORAGE_BASE_URL}/{stem.file_path}",
                "file_size": stem.file_size,
                "source_type": stem.source_type.value,
                "created_at": stem.created_at,
            }
            for stem in stems
        ]

        return ApiResponse(
            message="Stems fetched successfully",
            data={
                "count": len(data),
                "stems": data,
            },
        )

    except Exception as e:
        logger.error(traceback.format_exc())
        return ApiErrorResponse(
            code="FETCH_FAILED",
            message="Failed to fetch stems",
            details=str(e),
        )


#  DELETE AUDIO
@router.delete("/api/audio/{audio_id}")
async def delete_audio(
    audio_id: str,
    db: AsyncSession = Depends(get_db),
    storage: SupabaseStorageClient = Depends(get_storage),
):
    try:
        audio_uuid = uuid.UUID(audio_id)

        result = await db.execute(select(AudioFile).where(AudioFile.id == audio_uuid))
        audio = result.scalar_one_or_none()

        if not audio:
            return ApiErrorResponse(
                code="NOT_FOUND",
                message="Audio not found",
                http_status=404,
            )

        for stem in audio.separated_sources:
            try:
                await storage.delete_file("audio_stem", stem.file_path)
            except Exception:
                logger.warning(f"Failed to delete stem: {stem.file_path}")

        await storage.delete_file(
            CONSTANTS.SUPABASE_AUDIO_SOURCE_BUCKET,
            audio.file_path,
        )

        await db.delete(audio)
        await db.commit()

        return ApiResponse(message="Audio and stems deleted")

    except Exception as e:
        logger.error(traceback.format_exc())
        return ApiErrorResponse(
            code="DELETE_FAILED",
            message="Failed to delete audio",
            details=str(e),
        )


#  DOWNLOAD STEM
@router.get("/api/audio/stem/{stem_id}/download")
async def download_stem(
    stem_id: str,
    db: AsyncSession = Depends(get_db),
    storage: SupabaseStorageClient = Depends(get_storage),
):
    try:
        stem_uuid = uuid.UUID(stem_id)

        result = await db.execute(
            select(SeparatedAudioFile).where(SeparatedAudioFile.id == stem_uuid)
        )
        stem = result.scalar_one_or_none()

        if not stem:
            return ApiErrorResponse(
                code="NOT_FOUND",
                message="Stem not found",
                http_status=404,
            )

        file_bytes = await storage.download_file(
            bucket="audio_stem",
            path=stem.file_path,
        )

        if not file_bytes:
            return ApiErrorResponse(
                code="FILE_MISSING",
                message="File not found in storage",
                http_status=404,
            )

        return StreamingResponse(
            BytesIO(file_bytes),
            media_type="audio/mpeg",
            headers={"Content-Disposition": f'attachment; filename="{stem.file_name}"'},
        )

    except Exception as e:
        logger.error(traceback.format_exc())
        return ApiErrorResponse(
            code="DOWNLOAD_FAILED",
            message="Failed to download stem",
            details=str(e),
        )


#  HEALTH
@router.get("/health")
async def health():
    return ApiResponse(message="Service is healthy")
