import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

# Request Schemas


class ProjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=150, examples=["My Music Project"])
    description: Optional[str] = Field(
        None, max_length=2000, examples=["A project for analyzing concert recordings"]
    )


class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = Field(None, max_length=2000)


# Response Schemas


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: Optional[str]
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class ProjectListResponse(BaseModel):
    items: list[ProjectResponse]
    total: int
    page: int
    page_size: int
