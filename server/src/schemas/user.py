# app/schemas/user.py
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    id: str
    name: str
    username: str
    email: str
    created_at: datetime


class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
