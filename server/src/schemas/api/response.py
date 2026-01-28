from datetime import datetime, timezone
from typing import Generic, Optional, TypeVar

from pydantic import BaseModel, Field

from src.schemas.api.error import ApiError

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    response_id: Optional[str] = Field(
        default=None,
        description="Unique identifier for the response, useful for tracing and debugging.",
    )
    timestamp: datetime = Field(
        default_factory=datetime.now(timezone.utc),
        description="Timestamp of the response, useful for logging and debugging.",
    )
    success: bool = Field(..., description="Indicates if the request was successful.")
    data: Optional[T] = Field(None, description="Response data payload.")
    error: Optional[ApiError] = Field(
        None, description="Error information if request failed."
    )
    meta: Optional[dict] = Field(
        None, description="Optional metadata (e.g., pagination, count, etc.)."
    )

    class Config:
        arbitrary_types_allowed = True
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {"id": "uuid", "name": "Example"},
                "error": None,
                "meta": {"page": 1, "total": 42},
                "timestamp": "2026-01-25T12:34:56Z",
            }
        }
