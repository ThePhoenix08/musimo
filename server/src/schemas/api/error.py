from typing import Any, Optional

from pydantic import BaseModel, Field


class ApiError(BaseModel):
    """
    Standardized API error object used in every error response.
    """

    code: str = Field(
        ..., description="Application-specific error code (e.g., 'USER_NOT_FOUND')."
    )
    message: str = Field(..., description="Human-readable error message.")
    details: Optional[Any] = Field(
        None, description="Optional context or validation details."
    )
