from __future__ import annotations

import hashlib
import logging
import mimetypes
import uuid
from typing import Optional

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.settings import CONSTANTS
from src.core.supabase import SupabaseStorageClient
from src.database.enums import AudioFileStatus, AudioFormat, AudioSourceType
from src.repo.audioFileRepo import AudioFileRepository
from src.repo.projectRepo import ProjectRepository
from src.schemas.audioFile import (
    AudioFileCreateDTO,
    AudioFileListResponse,
    AudioFileResponse,
    AudioFileUploadResponse,
)

MAX_UPLOAD_BYTES = 200 * 1024 * 1024

SUPPORTED_MIME_TYPES: dict[str, AudioFormat] = {
    "audio/mpeg": AudioFormat.MP3,
    "audio/mp3": AudioFormat.MP3,
    "audio/wav": AudioFormat.WAV,
    "audio/x-wav": AudioFormat.WAV,
    "audio/flac": AudioFormat.FLAC,
    "audio/x-flac": AudioFormat.FLAC,
    "audio/ogg": AudioFormat.OGG,
    "audio/aac": AudioFormat.AAC,
}


def _compute_checksum(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _detect_format(file: UploadFile) -> AudioFormat:
    content_type = (file.content_type or "").lower()
    if content_type in SUPPORTED_MIME_TYPES:
        return SUPPORTED_MIME_TYPES[content_type]
    mime, _ = mimetypes.guess_type(file.filename or "")
    if mime and mime in SUPPORTED_MIME_TYPES:
        return SUPPORTED_MIME_TYPES[mime]
    raise HTTPException(
        status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        detail=(
            f"Unsupported audio format '{content_type}'. "
            f"Supported types: {', '.join(SUPPORTED_MIME_TYPES.keys())}"
        ),
    )


def _build_storage_path(
    project_id: uuid.UUID, file_id: uuid.UUID, filename: str
) -> str:
    return f"{project_id}/{file_id}/{filename}"


logger = logging.getLogger(__name__)


class AudioFileService:
    def __init__(
        self,
        session: AsyncSession,
        storage: SupabaseStorageClient,
    ) -> None:
        self._session = session
        self._audio_repo = AudioFileRepository(session)
        self._project_repo = ProjectRepository(session)
        self._storage = storage

    # ── Helpers ───────────────────────────────────────────────────────────────

    async def _assert_project_access(
        self, project_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        exists = await self._project_repo.exists(project_id, user_id)
        if not exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project {project_id} not found.",
            )

    async def _get_audio_file_or_404(
        self, audio_file_id: uuid.UUID, project_id: uuid.UUID
    ):
        audio_file = await self._audio_repo.get_by_id_and_project(
            audio_file_id, project_id
        )
        if audio_file is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"AudioFile {audio_file_id} not found in project {project_id}.",
            )
        return audio_file

    # ── Upload ────────────────────────────────────────────────────────────────

    async def upload_audio_file(
        self,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
        file: UploadFile,
    ) -> AudioFileUploadResponse:
        await self._assert_project_access(project_id, user_id)

        raw_bytes = await file.read()
        if len(raw_bytes) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {MAX_UPLOAD_BYTES // (1024*1024)} MB.",
            )

        audio_format = _detect_format(file)
        checksum = _compute_checksum(raw_bytes)

        existing = await self._audio_repo.get_by_checksum(checksum)
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A file with the same content already exists (id={existing.id}).",
            )

        file_id = uuid.uuid4()
        storage_path = _build_storage_path(
            project_id, file_id, file.filename or f"{file_id}.bin"
        )

        content_type = file.content_type or "application/octet-stream"
        try:
            await self._storage.upload_file(
                bucket=CONSTANTS.SUPABASE_AUDIO_SOURCE_BUCKET,
                destination_path=storage_path,
                file_bytes=raw_bytes,
                content_type=content_type,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Storage upload failed: {exc}",
            ) from exc

        dto = AudioFileCreateDTO(
            project_id=project_id,
            file_path=storage_path,
            file_name=file.filename or f"{file_id}.bin",
            checksum=checksum,
            format=audio_format,
            status=AudioFileStatus.UPLOADED,
            source_type=AudioSourceType.ORIGINAL,
        )
        audio_file = await self._audio_repo.create(dto)
        await self._project_repo.set_main_audio(project_id, audio_file.id)

        return AudioFileUploadResponse.model_validate(audio_file)

    # ── GET /projects/{project_id}/audio-files ────────────────────────────────

    async def list_project_audio_files(
        self,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
        source_type: Optional[AudioSourceType] = None,
        status_filter: Optional[AudioFileStatus] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> AudioFileListResponse:
        await self._assert_project_access(project_id, user_id)
        items, total = await self._audio_repo.get_all_by_project(
            project_id=project_id,
            source_type=source_type,
            status=status_filter,
            page=page,
            page_size=page_size,
        )
        return AudioFileListResponse(
            items=[AudioFileResponse.model_validate(f) for f in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    # ── GET /projects/{project_id}/audio-files/{audio_id} ────────────────────

    async def get_audio_file(
        self,
        audio_file_id: uuid.UUID,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> AudioFileResponse:
        await self._assert_project_access(project_id, user_id)
        audio_file = await self._get_audio_file_or_404(audio_file_id, project_id)
        return AudioFileResponse.model_validate(audio_file)

    # ── DELETE /projects/{project_id}/audio-files/{audio_id} ─────────────────

    async def delete_audio_file(
        self,
        audio_file_id: uuid.UUID,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        await self._assert_project_access(project_id, user_id)
        audio_file = await self._get_audio_file_or_404(audio_file_id, project_id)

        try:
            await self._storage.delete_file(
                bucket=CONSTANTS.SUPABASE_AUDIO_SOURCE_BUCKET,
                path=audio_file.file_path,
            )
        except FileNotFoundError:
            # File already gone from storage — still delete the DB record
            logger.warning(
                "File not found in storage during delete (already removed?): %s",
                audio_file.file_path,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Storage deletion failed: {exc}",
            ) from exc

        await self._audio_repo.delete(audio_file)
