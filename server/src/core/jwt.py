# app/core/jwt.py
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt

from src.core.settings import CONSTANTS  # Your Pydantic settings

JWT_SECRET = CONSTANTS.JWT_SECRET_KEY
JWT_ALGORITHM = CONSTANTS.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = CONSTANTS.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = CONSTANTS.REFRESH_TOKEN_EXPIRE_DAYS


def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Generate a JWT access token for a user.
    """
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {
        "sub": user_id,
        "exp": expire,
        "type": "access"
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token


def create_refresh_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Generate a JWT refresh token for a user.
    """
    expire = datetime.utcnow() + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    payload = {
        "sub": user_id,
        "exp": expire,
        "type": "refresh"
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token
