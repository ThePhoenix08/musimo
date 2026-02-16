from __future__ import annotations

import hashlib
import mimetypes
import uuid
from typing import Optional

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.audioFile import (
    AudioFileCreateDTO,
    AudioFileListResponse,
    AudioFileResponse,
    AudioFileUploadResponse,
)
from src.core.settings import CONSTANTS
from src.core.supabase import SupabaseStorageClient
from src.database.enums import AudioFileStatus, AudioFormat, AudioSourceType
from src.repo.audioFileRepo import AudioFileRepository
from src.repo.projectRepo import ProjectRepository

# Maximum allowed upload size: 200 MB
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
    # "audio/mp4": AudioFormat.M4A,
    # "audio/x-m4a": AudioFormat.M4A,
}


def _compute_checksum(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _detect_format(file: UploadFile) -> AudioFormat:
    """Resolve AudioFormat from Content-Type or filename extension."""
    content_type = (file.content_type or "").lower()
    if content_type in SUPPORTED_MIME_TYPES:
        return SUPPORTED_MIME_TYPES[content_type]

    # Fallback: guess from filename
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


def _build_storage_path(project_id: uuid.UUID, file_id: uuid.UUID, filename: str) -> str:
    """
    Storage path pattern: {project_id}/{file_id}/{original_filename}

    Keeps files namespaced per project and uniquely keyed per upload.
    """
    suffix = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    return f"{project_id}/{file_id}/{filename}"


class AudioFileService:
    def __init__(
        self,
        session: AsyncSession,
        storage: SupabaseStorageClient,
    ) -> None:
        self._session = session               # ← add this
        self._audio_repo = AudioFileRepository(session)
        self._project_repo = ProjectRepository(session)
        self._storage = storage

    # ── Helpers ───────────────────────────────────────────────────────────────

    async def _assert_project_access(
        self, project_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        
        print("project_id:", project_id)
        print("user_id:", user_id)

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

    # ── Public API ────────────────────────────────────────────────────────────

    async def upload_audio_file(
        self,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
        file: UploadFile,
    ) -> AudioFileUploadResponse:
        """
        Validate → deduplicate → upload to Supabase → persist DB record.
        """
        # 1. Project ownership check
        await self._assert_project_access(project_id, user_id)

        # 2. Read file bytes & enforce size limit
        raw_bytes = await file.read()
        if len(raw_bytes) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {MAX_UPLOAD_BYTES // (1024*1024)} MB.",
            )

        # 3. Detect format (raises 415 if unsupported)
        audio_format = _detect_format(file)

        # 4. Compute checksum — used for deduplication
        checksum = _compute_checksum(raw_bytes)

        # 5. Deduplication check
        existing = await self._audio_repo.get_by_checksum(checksum)
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A file with the same content already exists (id={existing.id}).",
            )

        # 6. Build a stable file_id before upload so path is deterministic
        file_id = uuid.uuid4()
        storage_path = _build_storage_path(project_id, file_id, file.filename or f"{file_id}.bin")

        # 7. Upload to Supabase storage
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

        # 8. Persist DB record
        dto = AudioFileCreateDTO(
            project_id=project_id,
            file_path=storage_path,
            file_name=file.filename or f"{file_id}.bin",
            checksum=checksum,
            format=audio_format,
            status=AudioFileStatus.UPLOADED,
            source_type=AudioSourceType.ORIGINAL,
        )
        # Override the auto-generated UUID so it matches the storage path
        audio_file = await self._audio_repo.create(dto)
        print("audio file", audio_file)
        
        await self._project_repo.set_main_audio(project_id, audio_file.id)
        await self._session.commit()  
        return AudioFileUploadResponse.model_validate(audio_file)