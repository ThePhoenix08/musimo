from __future__ import annotations

import asyncio
import uuid
from typing import Optional

from sqlalchemy import exists, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.database.models.project import Project

PROJECT_POPULATE = [
    selectinload(Project.main_audio),
    selectinload(Project.separated_audios),
    selectinload(Project.emotion_analysis_record),
    selectinload(Project.instrument_analysis_record),
    selectinload(Project.feature_analysis_record),
    selectinload(Project.separation_analysis_record),
]


class ProjectRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(
        self, project_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[Project]:
        result = await self._session.execute(
            select(Project)
            .where(
                Project.id == project_id,
                Project.user_id == user_id,
            )
            .options(*PROJECT_POPULATE)
        )
        return result.scalar_one_or_none()

    async def get_all_by_user(
        self,
        user_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Project], int]:
        """Return (items, total_count) for paginated project listing."""

        offset = (page - 1) * page_size

        total_stmt = (
            select(func.count()).select_from(Project).where(Project.user_id == user_id)
        )

        items_stmt = (
            select(Project)
            .where(Project.user_id == user_id)
            .order_by(Project.created_at.desc())
            .offset(offset)
            .limit(page_size)
            .options(*PROJECT_POPULATE)
        )

        total_result, items_result = await asyncio.gather(
            self._session.execute(total_stmt),
            self._session.execute(items_stmt),
        )

        total: int = total_result.scalar_one()
        items = list(items_result.scalars().all())

        return items, total

    async def exists(self, project_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        stmt = select(
            exists().where(Project.id == project_id, Project.user_id == user_id)
        )
        result = await self._session.execute(stmt)
        return result.scalar()

    async def create(
        self,
        user_id: uuid.UUID,
        name: str,
        description: Optional[str] = None,
    ) -> Project:
        project = Project(
            user_id=user_id,
            name=name,
            description=description,
        )
        self._session.add(project)
        await self._session.flush()  # populate PK/timestamps without committing
        await self._session.refresh(project)
        return project

    async def update(
        self,
        project: Project,
        name: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Project:
        if name is not None:
            project.name = name
        if description is not None:
            project.description = description
        await self._session.flush()
        await self._session.refresh(project)
        return project

    async def set_main_audio(
        self,
        project_id: uuid.UUID,
        audio_id: uuid.UUID,
    ) -> None:
        stmt = (
            update(Project)
            .where(Project.id == project_id)
            .values(main_audio_id=audio_id)
        )

        await self._session.execute(stmt)
        await self._session.flush()

    async def delete(self, project: Project) -> None:
        await self._session.delete(project)
        await self._session.flush()
