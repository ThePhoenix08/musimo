from pathlib import Path
from typing import List, Literal

from dotenv import load_dotenv
from pydantic import Field, ValidationError, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

from .logger_setup import logger

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # goes from src/core → server/
ENV_PATH = BASE_DIR / ".env"

load_dotenv(ENV_PATH)


class Settings(BaseSettings):
    # APPLICATION
    ENV: Literal["dev", "prod"] = Field(
        "dev", description="Environment: dev, staging, prod"
    )
    APP_NAME: str = "Musimo"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str

    # Database
    DATABASE_HOST: str
    DATABASE_PORT: int = 5432
    DATABASE_NAME: str = "postgres"
    DATABASE_USER: str = "postgres"
    DATABASE_PASSWORD: str

    @computed_field
    @property
    def ASYNC_DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"

    @computed_field
    @property
    def SYNC_DATABASE_URL(self) -> str:
        return f"postgresql+psycopg2://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"

    # JWT
    JWT_ALGORITHM: str = "HS256"

    JWT_ACCESS_TOKEN_SECRET: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ACCESS_TOKEN_EXPIRE_SECONDS: int = ACCESS_TOKEN_EXPIRE_MINUTES * 60

    JWT_REFRESH_TOKEN_SECRET: str
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    REFRESH_TOKEN_EXPIRE_SECONDS: int = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60

    # I/O
    MAX_FILE_SIZE: int = 10485760  # 10MB
    UPLOAD_DIR: str = "uploads"
    # ALLOWED_AUDIO_EXTENSIONS: List[str] = [".mp3", ".wav", ".flac", ".ogg", ".m4a"]
    ALLOWED_AUDIO_EXTENSIONS: str = ".mp3,.wav,.flac,.ogg,.m4a"

    # OTP
    OTP_EXPIRE_MINUTES: int = 10
    OTP_LENGTH: int = 6

    # Session
    SESSION_SECRET_KEY: str | None = None

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = "mpkadam2004@gmail.com"
    SMTP_PASSWORD: str
    EMAIL_FROM: str = "noreply@musimo.com"
    MAIL_FROM_NAME: str = "Musimo Team"

    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH), extra="ignore", case_sensitive=True
    )


try:
    CONSTANTS = Settings()
    logger.info(
        f"✅ Loaded settings for ENV='{CONSTANTS.ENV}' (DEBUG={CONSTANTS.DEBUG})"
    )
    # print_env_summary(CONSTANTS)
except ValidationError as e:
    logger.error("\n🔥 Settings validation failed:\n", e)
    raise e
