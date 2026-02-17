

from __future__ import annotations

from sqlalchemy import update
import uuid
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.models.project import Project


class ProjectRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session


    async def get_by_id(
        self, project_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[Project]:
        result = await self._session.execute(
            select(Project).where(
                Project.id == project_id,
                Project.user_id == user_id,
            )
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

        total_result = await self._session.execute(
            select(func.count()).select_from(Project).where(Project.user_id == user_id)
        )
        total: int = total_result.scalar_one()

        items_result = await self._session.execute(
            select(Project)
            .where(Project.user_id == user_id)
            .order_by(Project.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        items = list(items_result.scalars().all())
        return items, total

    async def exists(self, project_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        result = await self._session.execute(
            select(func.count())
            .select_from(Project)
            .where(Project.id == project_id, Project.user_id == user_id)
        )
        return result.scalar_one() > 0


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
        await self._session.flush()   # populate PK/timestamps without committing
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
        await self._session.commit()

    async def delete(self, project: Project) -> None:
        await self._session.delete(project)
