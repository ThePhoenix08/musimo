# app/schemas/errors.py
from typing import Optional
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
