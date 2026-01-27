from typing import Any, Optional

from pydantic import BaseModel, Field


class ApiError(BaseModel):
    code: str = Field(
        ..., description="Application-specific error code, e.g., 'USER_NOT_FOUND'."
    )
    message: str = Field(..., description="Human-readable error message.")
    details: Optional[Any] = Field(
        None, description="Optional additional context or validation details."
    )
