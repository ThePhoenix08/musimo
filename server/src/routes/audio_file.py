from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.supabase import SupabaseStorageClient, get_storage
from src.database.session import get_db
from src.services.dependencies import get_current_user
from src.schemas.audioFile import (
    AudioFileListResponse,
    AudioFileResponse,
    AudioFileUploadResponse,
)
from src.database.enums import AudioFileStatus, AudioSourceType
from src.services.audio_file import AudioFileService

router = APIRouter(
    prefix="/projects/{project_id}/audio-files",
    tags=["Audio Files"],
)

@router.post(
    "/",
    response_model=AudioFileUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_audio_file(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
    storage: SupabaseStorageClient = Depends(get_storage),
    file: UploadFile = File(...),
) -> AudioFileUploadResponse:
    service = AudioFileService(session=db, storage=storage)
    return await service.upload_audio_file(
        project_id=project_id,
        user_id=user.id,
        file=file,
    )
