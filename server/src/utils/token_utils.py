import secrets
from datetime import datetime, timedelta
from typing import Literal, Optional

import jwt
from jose import JWTError
from server.src.core.settings import CONSTANTS
from server.src.schemas.token import (
    Access_Token_Payload,
    Refresh_Token_Payload,
)


def get_expiry_timestamp(
    expiry_constant_secs: int, given_expires_delta: Optional[timedelta] = None
):
    now = datetime.datetime.now()
    expires_delta = given_expires_delta or timedelta(seconds=expiry_constant_secs)
    return (now + expires_delta).timestamp()


def get_current_timestamp():
    return datetime.datetime.now().timestamp()


def create_access_token(subject_id: int, expires_delta: Optional[timedelta] = None):
    EXPIRY = get_expiry_timestamp(CONSTANTS.ACCESS_TOKEN_EXPIRE_SECONDS, expires_delta)

    payload = Access_Token_Payload(
        sub=subject_id,
        iat=int(get_current_timestamp()),
        exp=int(EXPIRY),
    )

    encoded = jwt.encode(
        payload, CONSTANTS.JWT_ACCESS_TOKEN_SECRET, algorithm=CONSTANTS.JWT_ALGORITHM
    )

    return encoded


def create_refresh_token(subject_id: int, expires_delta: Optional[timedelta] = None):
    EXPIRY = get_expiry_timestamp(CONSTANTS.REFRESH_TOKEN_EXPIRE_SECONDS, expires_delta)

    payload = Refresh_Token_Payload(
        sub=subject_id,
        iat=int(get_current_timestamp()),
        exp=int(EXPIRY),
        jti=secrets.token_urlsafe(16),
    )

    encoded = jwt.encode(
        payload, CONSTANTS.JWT_REFRESH_TOKEN_SECRET, algorithm=CONSTANTS.JWT_ALGORITHM
    )

    return encoded


def decode_token(token: str, type: Literal["access", "refresh"]):
    try:
        SECRET = (
            CONSTANTS.JWT_ACCESS_TOKEN_SECRET
            if type == "access"
            else CONSTANTS.JWT_REFRESH_TOKEN_SECRET
        )
        payload = jwt.decode(token, SECRET, algorithms=[CONSTANTS.JWT_ALGORITHM])

        if type == "access":
            payload = Access_Token_Payload(**payload)
        elif type == "refresh":
            payload = Refresh_Token_Payload(**payload)

        return payload
    except JWTError:
        return None
