# app/schemas/auth.py
import re
from dataclasses import dataclass
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from src.core.settings import CONSTANTS


@dataclass
class REGEXES:
    ALPHA_NUMERIC_UNDERSCORE = r"^[a-zA-Z0-9_]+$"
    ALPHA_SPACE = r"^[a-zA-Z ]+$"
    ATLEAST_ONE_ALPHA_UPPERCASE = r"[A-Z]"
    ATLEAST_ONE_ALPHA_LOWERCASE = r"[a-z]"
    ATLEAST_ONE_NUMBER = r"[0-9]"
    ATLEAST_ONE_SPECIAL_CHAR = r"[^0-9A-Za-z]"


class SignUpRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, pattern=REGEXES.ALPHA_SPACE)
    username: str = Field(
        ..., min_length=3, max_length=50, pattern=REGEXES.ALPHA_NUMERIC_UNDERSCORE
    )
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if (
            len(v) < CONSTANTS.PASSWORD_MIN_LENGTH
            or len(v) > CONSTANTS.PASSWORD_MAX_LENGTH
        ):
            raise ValueError("Password must be between 8 and 32 characters long.")
        if not re.search(REGEXES.ATLEAST_ONE_ALPHA_UPPERCASE, v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(REGEXES.ATLEAST_ONE_ALPHA_LOWERCASE, v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(REGEXES.ATLEAST_ONE_NUMBER, v):
            raise ValueError("Password must contain at least one number.")
        if not re.search(REGEXES.ATLEAST_ONE_SPECIAL_CHAR, v):
            raise ValueError("Password must contain at least one special character.")
        return v


class RegisterUserResponse(BaseModel):
    user_id: UUID
    username: str
    email: EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
