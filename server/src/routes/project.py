
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.session import get_db
from src.services.project import ProjectService
from src.services.dependencies import get_current_user
from src.schemas.project import (
    ProjectCreateRequest,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdateRequest,
)
# from src.services.project_service import ProjectService

router = APIRouter()



@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new project",
)
async def create_project(
    payload: ProjectCreateRequest,
    db: AsyncSession = Depends(get_db),
    user= Depends(get_current_user),
) -> ProjectResponse:
    """Create a new project owned by the authenticated user."""
    service = ProjectService(db)
    return await service.create_project(user_id=user.id, payload=payload)
