# // security and authentication service
import secrets
from datetime import UTC, datetime, timedelta
from typing import Literal, Optional, Tuple, TypedDict
from uuid import uuid4

import argon2
import jwt
from jose import JWTError
from server.src.core.settings import CONSTANTS
from server.src.database.models import RefreshToken
from server.src.schemas.token import (
    Access_Token_Payload,
    Refresh_Token_Payload,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.models.user import User


class STORE_REFRESH_TOKEN_PAYLOAD(TypedDict):
    user_id: str
    device_info: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]


def FIND_ALL_USERS_BY_EMAIL_OR_USERNAME_QUERY(email: str, username: str):
    return select(User).where((User.email == email) | (User.username == username))


def FIND_USER_BY_EMAIL_QUERY(email: str):
    return select(User).where(User.email == email)


def FIND_USER_BY_ID_QUERY(user_id: str):
    return select(User).where(User.id == user_id)


def FIND_REFRESH_TOKEN_QUERY(refresh_token: str):
    return select(RefreshToken).where(RefreshToken.token == refresh_token)


class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        return argon2.hash(password)

    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        try:
            argon2.verify_password(password, hashed)
        except Exception:
            return False

    @staticmethod
    def get_expiry_timestamp(
        expiry_constant_secs: int, given_expires_delta: Optional[timedelta] = None
    ):
        now = datetime.datetime.now()
        expires_delta = given_expires_delta or timedelta(seconds=expiry_constant_secs)
        return (now + expires_delta).timestamp()

    @staticmethod
    def get_current_timestamp():
        return datetime.datetime.now().timestamp()

    @staticmethod
    def create_access_token(subject_id: int, expires_delta: Optional[timedelta] = None):
        EXPIRY = AuthService.get_expiry_timestamp(
            CONSTANTS.ACCESS_TOKEN_EXPIRE_SECONDS, expires_delta
        )

        payload = Access_Token_Payload(
            sub=subject_id,
            iat=int(AuthService.get_current_timestamp()),
            exp=int(EXPIRY),
        )

        encoded = jwt.encode(
            payload,
            CONSTANTS.JWT_ACCESS_TOKEN_SECRET,
            algorithm=CONSTANTS.JWT_ALGORITHM,
        )

        return encoded

    @staticmethod
    def create_refresh_token(
        subject_id: int, expires_delta: Optional[timedelta] = None
    ):
        EXPIRY = AuthService.get_expiry_timestamp(
            CONSTANTS.REFRESH_TOKEN_EXPIRE_SECONDS, expires_delta
        )

        payload = Refresh_Token_Payload(
            sub=subject_id,
            iat=int(AuthService.get_current_timestamp()),
            exp=int(EXPIRY),
            jti=secrets.token_urlsafe(16),
        )

        encoded = jwt.encode(
            payload,
            CONSTANTS.JWT_REFRESH_TOKEN_SECRET,
            algorithm=CONSTANTS.JWT_ALGORITHM,
        )

        return encoded

    @staticmethod
    async def store_refresh_token(
        db: AsyncSession, token_str: str, data: STORE_REFRESH_TOKEN_PAYLOAD
    ) -> RefreshToken:
        refresh_token = RefreshToken(
            device_info=data.device_info,
            user_agent=data.user_agent,
            ip_address=data.ip_address,
            user_id=data.user_id,
            token=token_str,
            revoked=False,
        )

        db.add(refresh_token)
        await db.commit()
        await db.refresh(refresh_token)
        return refresh_token

    @staticmethod
    async def rotate_access_token(
        db: AsyncSession, old_refresh_token: str
    ) -> Optional[dict]:
        payload = AuthService.decode_token(old_refresh_token)
        if not payload or payload.get("type") != "refresh":
            return None

        user_id = payload.get("sub")
        if not user_id:
            return None

        result = await db.execute(FIND_REFRESH_TOKEN_QUERY(old_refresh_token))
        stored_token = result.scaler_one_or_none()

        if not stored_token:
            return None

        if stored_token.expires_at < datetime.now(UTC):
            stored_token.revoked = True
            await db.commit()
            return None

        new_access_token = AuthService.create_access_token(subject_id=user_id)
        await db.commit()

        return new_access_token

    @staticmethod
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

    @staticmethod
    async def create_user(
        db: AsyncSession, name: str, username: str, email: str, password: str
    ) -> Optional[Tuple[User, dict]]:
        """
        Create a new user in the database and return the user and JWT tokens.
        Returns None if email or username already exists.
        """
        result = await db.execute(
            FIND_ALL_USERS_BY_EMAIL_OR_USERNAME_QUERY(email, username)
        )
        existing_user = result.scalar_one_or_none()
        if existing_user:
            return None

        user = User(
            id=uuid4(),
            name=name,
            username=username,
            email=email,
            password=AuthService.hash_password(password),
        )

        db.add(user)
        await db.commit()
        await db.refresh(user)

        tokens = {
            "access_token": AuthService.create_access_token(subject_id=str(user.id)),
            "refresh_token": AuthService.create_refresh_token(subject_id=str(user.id)),
        }

        await AuthService.store_refresh_token(db, user.id, tokens["refresh_token"])

        return user, tokens

    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(FIND_USER_BY_EMAIL_QUERY(email))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        result = await db.execute(FIND_USER_BY_ID_QUERY(user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def authenticate_user(
        db: AsyncSession, email: str, password: str
    ) -> Optional[User]:
        user = await AuthService.get_user_by_email(db, email)

        if not user:
            return None

        if not AuthService.verify_password(password, user.password_hash):
            return None

        return user

    @staticmethod
    async def invalidate_refresh_token(db: AsyncSession, refresh_token: str) -> bool:
        result = await db.execute(FIND_REFRESH_TOKEN_QUERY(refresh_token))
        record = result.scalar_one_or_none()
        if not record or not record.revoked:
            return False
        record.revoked = True
        await db.commit()
        return True

    @staticmethod
    async def logout_user(db: AsyncSession, refresh_token: str) -> bool:
        result = await db.execute(FIND_REFRESH_TOKEN_QUERY(refresh_token))
        token = result.scalar_one_or_none()
        if not token:
            return False

        token.revoked = True
        await db.commit()
        return True
