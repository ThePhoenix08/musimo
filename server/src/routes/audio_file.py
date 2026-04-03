import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.supabase import SupabaseStorageClient, get_storage
from src.database.enums import AudioFileStatus, AudioSourceType
from src.database.session import get_db
from src.services.audio_file import AudioFileService
from src.services.dependencies import get_current_user
from src.schemas.api.response import ApiResponse, ApiErrorResponse


router = APIRouter(
    prefix="/projects/{project_id}/audio-files",
    tags=["Audio Files"],
)


# =========================
# Upload Audio File
# =========================
# @router.post(
#     "",
#     status_code=status.HTTP_201_CREATED,
#     summary="Upload an audio file to a project",
# )
# async def upload_audio_file(
#     project_id: uuid.UUID,
#     file: UploadFile = File(...),
#     db: AsyncSession = Depends(get_db),
#     user=Depends(get_current_user),
#     storage: SupabaseStorageClient = Depends(get_storage),
# ):
#     try:
#         service = AudioFileService(session=db, storage=storage)

#         result = await service.upload_audio_file(
#             project_id=project_id,
#             user_id=user.id,
#             file=file,
#         )

#         return ApiResponse(
#             message="Audio file uploaded successfully",
#             data=result.model_dump(),
#             status_code=status.HTTP_201_CREATED,
#         )

#     except Exception as e:
#         return ApiErrorResponse(
#             code="AUDIO_UPLOAD_FAILED",
#             message="Failed to upload audio file",
#             details=str(e),
#         )


# =========================
# List Audio Files
# =========================
@router.get(
    "",
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
):
    try:
        service = AudioFileService(session=db, storage=storage)

        result = await service.list_project_audio_files(
            project_id=project_id,
            user_id=user.id,
            source_type=source_type,
            status_filter=file_status,
            page=page,
            page_size=page_size,
        )

        return ApiResponse(
            message="Audio files fetched successfully",
            data=result.model_dump(),
            meta={
                "page": page,
                "page_size": page_size,
            },
        )

    except Exception as e:
        return ApiErrorResponse(
            code="AUDIO_LIST_FAILED",
            message="Failed to fetch audio files",
            details=str(e),
        )


# =========================
# Get Single Audio File
# =========================
@router.get(
    "/{audio_id}",
    summary="Get audio file metadata",
)
async def get_audio_file(
    project_id: uuid.UUID,
    audio_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
    storage: SupabaseStorageClient = Depends(get_storage),
):
    try:
        service = AudioFileService(session=db, storage=storage)

        result = await service.get_audio_file(
            audio_file_id=audio_id,
            project_id=project_id,
            user_id=user.id,
        )

        return ApiResponse(
            message="Audio file fetched successfully",
            data=result.model_dump(),
        )

    except Exception as e:
        return ApiErrorResponse(
            code="AUDIO_FETCH_FAILED",
            message="Failed to fetch audio file",
            details=str(e),
        )


# =========================
# Delete Audio File
# =========================
@router.delete(
    "/{audio_id}",
    summary="Delete audio file (Supabase storage + DB record)",
)
async def delete_audio_file(
    project_id: uuid.UUID,
    audio_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
    storage: SupabaseStorageClient = Depends(get_storage),
):
    try:
        service = AudioFileService(session=db, storage=storage)

        await service.delete_audio_file(
            audio_file_id=audio_id,
            project_id=project_id,
            user_id=user.id,
        )

        return ApiResponse(
            message="Audio file deleted successfully",
            status_code=status.HTTP_200_OK,
        )

    except Exception as e:
        return ApiErrorResponse(
            code="AUDIO_DELETE_FAILED",
            message="Failed to delete audio file",
            details=str(e),
        )