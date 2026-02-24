"""
Repository for AudioFile CRUD operations.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.enums import AudioFileStatus, AudioSourceType
from src.database.models.audio_file import AudioFile
from src.schemas.audioFile import AudioFileCreateDTO


class AudioFileRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    # ── Reads ─────────────────────────────────────────────────────────────────

    async def get_by_id(self, audio_file_id: uuid.UUID) -> Optional[AudioFile]:
        result = await self._session.execute(
            select(AudioFile).where(AudioFile.id == audio_file_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id_and_project(
        self,
        audio_file_id: uuid.UUID,
        project_id: uuid.UUID,
    ) -> Optional[AudioFile]:
        result = await self._session.execute(
            select(AudioFile).where(
                AudioFile.id == audio_file_id,
                AudioFile.project_id == project_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_checksum(self, checksum: str) -> Optional[AudioFile]:
        """Used for deduplication before storage upload."""
        result = await self._session.execute(
            select(AudioFile).where(AudioFile.checksum == checksum)
        )
        return result.scalar_one_or_none()

    async def get_all_by_project(
        self,
        project_id: uuid.UUID,
        source_type: Optional[AudioSourceType] = None,
        status: Optional[AudioFileStatus] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[AudioFile], int]:
        offset = (page - 1) * page_size

        filters = [AudioFile.project_id == project_id]
        if source_type is not None:
            filters.append(AudioFile.source_type == source_type)
        if status is not None:
            filters.append(AudioFile.status == status)

        total_result = await self._session.execute(
            select(func.count()).select_from(AudioFile).where(*filters)
        )
        total: int = total_result.scalar_one()

        items_result = await self._session.execute(
            select(AudioFile)
            .where(*filters)
            .order_by(AudioFile.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        return list(items_result.scalars().all()), total

    # ── Writes ────────────────────────────────────────────────────────────────

    async def create(self, dto: AudioFileCreateDTO) -> AudioFile:
        audio_file = AudioFile(**dto.model_dump())
        self._session.add(audio_file)
        await self._session.flush()
        await self._session.refresh(audio_file)
        return audio_file

    async def update_status(
        self,
        audio_file: AudioFile,
        status: AudioFileStatus,
    ) -> AudioFile:
        audio_file.status = status
        await self._session.flush()
        await self._session.refresh(audio_file)
        return audio_file

    async def mark_scheduled_for_deletion(
        self,
        audio_file,
        scheduled_at: datetime,
    ) -> None:
        audio_file.status = AudioFileStatus.PENDING_DELETION
        audio_file.scheduled_deletion_at = scheduled_at
        self._session.add(audio_file)
        await self._session.flush()

    async def delete(self, audio_file: AudioFile) -> None:
        await self._session.delete(audio_file)
        await self._session.flush()
