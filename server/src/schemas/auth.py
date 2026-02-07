# app/schemas/auth.py
from dataclasses import dataclass
from typing import Final
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


@dataclass
class REGEXES:
    ALPHA_NUMERIC_UNDERSCORE: Final[str] = "^[a-zA-Z0-9_]+$"
    ALPHA_SPACE: Final[str] = "^[a-zA-Z ]+$"
    STRONG_PASSWORD: Final[str] = (
        "^(?=.*?[0-9])(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[^0-9A-Za-z]).{8,32}$"
    )


class SignUpRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, pattern=REGEXES.ALPHA_SPACE)
    username: str = Field(
        ..., min_length=3, max_length=50, pattern=REGEXES.ALPHA_NUMERIC_UNDERSCORE
    )
    email: EmailStr
    password: str = Field(..., min_length=8, pattern=REGEXES.STRONG_PASSWORD)


class RegisterUserResponse(BaseModel):
    user_id: UUID
    username: str
    email: EmailStr
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str
