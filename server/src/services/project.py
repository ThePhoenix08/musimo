from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.repo.projectRepo import ProjectRepository
from src.schemas.project import (
    ProjectCreateRequest,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdateRequest,
)


class ProjectService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = ProjectRepository(session)

    async def _get_or_404(self, project_id: uuid.UUID, user_id: uuid.UUID):
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

    async def get_project(
        self,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> ProjectResponse:
        project = await self._get_or_404(project_id, user_id)
        return ProjectResponse.model_validate(project)

    async def list_projects(
        self,
        user_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> ProjectListResponse:
        items, total = await self._repo.get_all_by_user(
            user_id=user_id, page=page, page_size=page_size
        )
        return ProjectListResponse(
            items=[ProjectResponse.model_validate(p) for p in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def update_project(
        self,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
        payload: ProjectUpdateRequest,
    ) -> ProjectResponse:
        project = await self._get_or_404(project_id, user_id)
        updated = await self._repo.update(
            project=project,
            name=payload.name,
            description=payload.description,
        )

        await self._session.commit()
        return ProjectResponse.model_validate(updated)

    async def delete_project(
        self,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        project = await self._get_or_404(project_id, user_id)
        await self._repo.delete(project)
        await self._session.commit()

        return print("Project deleted: ", project_id)
