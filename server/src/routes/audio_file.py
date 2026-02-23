import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.supabase import SupabaseStorageClient, get_storage
from src.database.enums import AudioFileStatus, AudioSourceType
from src.database.session import get_db
from src.schemas.audioFile import (
    AudioFileListResponse,
    AudioFileResponse,
    AudioFileUploadResponse,
)
from src.services.audio_file import AudioFileService
from src.services.dependencies import get_current_user

router = APIRouter(
    prefix="/projects/{project_id}/audio-files",
    tags=["Audio Files"],
)


@router.post(
    "",
    response_model=AudioFileUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload an audio file to a project",
)
async def upload_audio_file(
    project_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
    storage: SupabaseStorageClient = Depends(get_storage),
) -> AudioFileUploadResponse:
    service = AudioFileService(session=db, storage=storage)
    return await service.upload_audio_file(
        project_id=project_id,
        user_id=user.id,
        file=file,
    )


@router.get(
    "",
    response_model=AudioFileListResponse,
    summary="List all audio files in a project",
)
async def list_project_audio_files(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
    storage: SupabaseStorageClient = Depends(get_storage),
    source_type: Optional[AudioSourceType] = Query(default=None),
    file_status: Optional[AudioFileStatus] = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> AudioFileListResponse:
    service = AudioFileService(session=db, storage=storage)
    return await service.list_project_audio_files(
        project_id=project_id,
        user_id=user.id,
        source_type=source_type,
        status_filter=file_status,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{audio_id}",
    response_model=AudioFileResponse,
    summary="Get audio file metadata",
)
async def get_audio_file(
    project_id: uuid.UUID,
    audio_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
    storage: SupabaseStorageClient = Depends(get_storage),
) -> AudioFileResponse:
    service = AudioFileService(session=db, storage=storage)
    return await service.get_audio_file(
        audio_file_id=audio_id,
        project_id=project_id,  # ← now passed through
        user_id=user.id,
    )


@router.delete(
    "/{audio_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete audio file (Supabase storage + DB record)",
)
async def delete_audio_file(
    project_id: uuid.UUID,
    audio_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
    storage: SupabaseStorageClient = Depends(get_storage),
) -> None:
    service = AudioFileService(session=db, storage=storage)
    await service.delete_audio_file(
        audio_file_id=audio_id,
        project_id=project_id,  # ← now passed through
        user_id=user.id,
    )
