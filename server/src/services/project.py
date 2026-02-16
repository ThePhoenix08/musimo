from __future__ import annotations

import uuid
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.project import (
    ProjectCreateRequest,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdateRequest,
)
from src.repo.projectRepo import ProjectRepository


class ProjectService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = ProjectRepository(session)

    async def _get_or_404(
        self, project_id: uuid.UUID, user_id: uuid.UUID
    ):
        project = await self._repo.get_by_id(project_id, user_id)
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project {project_id} not found.",
            )
        return project

    async def create_project(
        self,
        user_id: uuid.UUID,
        payload: ProjectCreateRequest,
    ) -> ProjectResponse:

        project = await self._repo.create(
            user_id=user_id,
            name=payload.name,
            description=payload.description,
        )

        await self._session.commit()

        return ProjectResponse.model_validate(project)