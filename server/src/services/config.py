
from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str
    
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    
    APP_NAME: str = "Musimo"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    MAX_FILE_SIZE: int = 10485760  # 10MB
    UPLOAD_DIR: str = "uploads"
    # ALLOWED_AUDIO_EXTENSIONS: List[str] = [".mp3", ".wav", ".flac", ".ogg", ".m4a"]
    ALLOWED_AUDIO_EXTENSIONS: str = ".mp3,.wav,.flac,.ogg,.m4a"
    
    # OTP
    OTP_EXPIRE_MINUTES: int = 10
    OTP_LENGTH: int = 6
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000"
    ]

    SMTP_HOST: str = os.getenv("SMTP_HOST") or "smtp.gmail.com"
    SMTP_PORT: int = int(os.getenv("SMTP_PORT") or 587)
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME") or "mpkadam2004@gmail.com"
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD") 
    EMAIL_FROM: str = os.getenv("EMAIL_FROM") or "noreply@musimo.com"
    MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME") or "Musimo Team"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()