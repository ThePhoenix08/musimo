# app/schemas/otp.py
from pydantic import BaseModel, EmailStr, Field
from server.src.core.settings import CONSTANTS
from server.src.database.enums import OtpType


class OtpVerifyRequest(BaseModel):
    email: EmailStr
    code: str = Field(
        ..., min_length=CONSTANTS.OTP_LENGTH, max_length=CONSTANTS.OTP_LENGTH
    )
    purpose: OtpType


class OtpVerifyResponse(BaseModel):
    verified: bool = Field(default=False)


class OtpRequest(BaseModel):
    email: EmailStr
    purpose: OtpType
