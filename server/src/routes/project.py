from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.supabase import SupabaseStorageClient, get_storage
from src.services.audio_file import AudioFileService
from src.database.session import get_db
from src.schemas.project import (
    ProjectCreateRequest,
    ProjectUpdateRequest,
)
from src.services.dependencies import get_current_user
from src.services.project import ProjectService

from src.schemas.api.response import ApiResponse, ApiErrorResponse  


router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create project and upload an audio file",
)
async def create_project_with_audio(
    name: str = Form(...),
    description: str | None = Form(None),
    file: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
    storage: SupabaseStorageClient = Depends(get_storage),
):
    try:
        project_service = ProjectService(db)
        audio_service = AudioFileService(session=db, storage=storage)

        project_payload = ProjectCreateRequest(
            name=name,
            description=description,
        )

        project = await project_service.create_project(
            user_id=user.id,
            payload=project_payload,
        )

        audio_data = None

        if file:
            audio = await audio_service.upload_audio_file(
                project_id=project.id,
                user_id=user.id,
                file=file,
            )
            audio_data = audio.model_dump()

        return ApiResponse(
            message="Project created successfully"
                    + (" and audio uploaded" if file else ""),
            data={
                "project": project.model_dump(),
                "audio_file": audio_data,
            },
            status_code=status.HTTP_201_CREATED,
        )

    except Exception as e:
        return ApiErrorResponse(
            code="PROJECT_CREATE_WITH_AUDIO_FAILED",
            message="Failed to create project",
            details=str(e),
        )


@router.get(
    "",
    summary="List all projects",
)
async def list_projects(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    try:
        service = ProjectService(db)
        result = await service.list_projects(
            user_id=user.id, page=page, page_size=page_size
        )

        return ApiResponse(
            message="Projects fetched successfully",
            data=result.model_dump(),
            meta={
                "page": page,
                "page_size": page_size,
            },
        )
    except Exception as e:
        return ApiErrorResponse(
            code="PROJECT_LIST_FAILED",
            message="Failed to fetch projects",
            details=str(e),
        )


@router.get(
    "/{project_id}",
    summary="Get a single project",
)
async def get_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    try:
        service = ProjectService(db)
        project = await service.get_project(
            project_id=project_id, user_id=user.id
        )

        return ApiResponse(
            message="Project fetched successfully",
            data=project.model_dump(),
        )
    except Exception as e:
        return ApiErrorResponse(
            code="PROJECT_FETCH_FAILED",
            message="Failed to fetch project",
            details=str(e),
        )


@router.patch(
    "/{project_id}",
    summary="Update a project",
)
async def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    try:
        service = ProjectService(db)
        project = await service.update_project(
            project_id=project_id,
            user_id=user.id,
            payload=payload,
        )

        return ApiResponse(
            message="Project updated successfully",
            data=project.model_dump(),
        )
    except Exception as e:
        return ApiErrorResponse(
            code="PROJECT_UPDATE_FAILED",
            message="Failed to update project",
            details=str(e),
        )


@router.delete(
    "/{project_id}",
    summary="Delete a project",
)
async def delete_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
) -> None:
    service = ProjectService(db)
    await service.delete_project(project_id=project_id, user_id=user.id)