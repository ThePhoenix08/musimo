from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field


class ApiRequest(BaseModel):
    request_id: Optional[str] = Field(
        default=None,
        description="Unique identifier for the request, useful for tracing and debugging.",
    )
    timestamp: datetime = Field(
        default_factory=datetime.now(timezone.utc),
        description="Timestamp of the request, useful for logging and debugging.",
    )
