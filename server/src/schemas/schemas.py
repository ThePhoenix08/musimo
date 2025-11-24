# Pydantic Models for request and response schemas
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Literal
from datetime import datetime

# Auth Schemas
class UserRegistration(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    
    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v):
        if not v.replace('_', '').isalnum():
            raise ValueError('Username must be alphanumeric (underscores allowed)')
        return v.lower()

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class OTPRequiredResponse(BaseModel):
    message: str
    requires_otp: bool

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# User Schemas
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

# Transaction Schemas
class TransactionCreate(BaseModel):
    model_type: Literal["emotion_detection", "instrument_classification"]

class TransactionResponse(BaseModel):
    transaction_id: str
    user_id: str
    model_type: str
    audio_path: str
    melspectrogram_path: str
    output: dict
    created_at: datetime

class TransactionList(BaseModel):
    transactions: list[TransactionResponse]
    total: int
    page: int
    page_size: int

# Model Schemas
class ModelPrediction(BaseModel):
    model_type: Literal["emotion_detection", "instrument_classification"]
    prediction: str
    confidence: float
    probabilities: dict

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None