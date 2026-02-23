from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.session import get_db
from src.schemas.project import (
    ProjectCreateRequest,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdateRequest,
)
from src.services.dependencies import get_current_user
from src.services.project import ProjectService

router = APIRouter(prefix="/projects", tags=["Projects"])  # ← plural, no trailing param


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new project",
)
async def create_project(
    payload: ProjectCreateRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
) -> ProjectResponse:
    service = ProjectService(db)
    return await service.create_project(user_id=user.id, payload=payload)


@router.get(
    "",
    response_model=ProjectListResponse,
    summary="List all projects",
)
async def list_projects(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> ProjectListResponse:
    service = ProjectService(db)
    return await service.list_projects(user_id=user.id, page=page, page_size=page_size)


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Get a single project",
)
async def get_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
) -> ProjectResponse:
    service = ProjectService(db)
    return await service.get_project(project_id=project_id, user_id=user.id)


@router.patch(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Update a project",
)
async def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
) -> ProjectResponse:
    service = ProjectService(db)
    return await service.update_project(
        project_id=project_id, user_id=user.id, payload=payload
    )


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a project",
)
async def delete_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
) -> None:
    service = ProjectService(db)
    await service.delete_project(project_id=project_id, user_id=user.id)
