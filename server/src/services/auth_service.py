# // security and authentication service
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Literal, Optional
from uuid import uuid4

import jwt
from argon2 import PasswordHasher
from argon2 import exceptions as argon2_exceptions
from fastapi import HTTPException, Request, status
from sqlalchemy import and_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger_setup import logger
from src.core.settings import CONSTANTS
from src.database.models import RefreshToken
from src.database.models.user import User
from src.schemas.token import (
    Access_Token_Payload,
    Refresh_Token_Payload,
)
from src.utils.db_util import db_query

ph = PasswordHasher(
    time_cost=3,  # number of iterations
    memory_cost=64 * 1024,  # 64 MB
    parallelism=4,  # number of threads
    hash_len=32,  # hash output length in bytes
    salt_len=16,  # salt length in bytes
)


@dataclass
class STORE_REFRESH_TOKEN_METADATA:
    user_id: str
    ip_address: Optional[str]
    user_agent: Optional[str]

    def __init__(self, request: Request, user_id: str):
        self.user_id = user_id
        self.ip_address = request.client.host if request.client else None
        self.user_agent = dict(request.headers)["user-agent"]


def FIND_ALL_USERS_BY_EMAIL_OR_USERNAME_QUERY(email: str, username: str):
    return select(User).where((User.email == email) | (User.username == username))


def FIND_USER_BY_EMAIL_QUERY(email: str):
    return select(User).where(User.email == email)


def FIND_USER_BY_ID_QUERY(user_id: str):
    return select(User).where(User.id == user_id)


def FIND_REFRESH_TOKEN_QUERY(refresh_token: str):
    return select(RefreshToken).where(RefreshToken.token == refresh_token)


def REVOKE_USER_REFRESH_TOKENS_MUTATION(
    user_id: str, user_agent: str | None = None, ip_address: str | None = None
):
    conditions = [RefreshToken.user_id == user_id, RefreshToken.revoked == False]
    if user_agent:
        conditions.append(RefreshToken.user_agent == user_agent)
    if ip_address:
        conditions.append(RefreshToken.ip_address == ip_address)

    return (
        update(RefreshToken)
        .where(and_(*conditions))
        .values(revoked=True)
        .execution_options(synchronize_session=False)
    )


class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        return ph.hash(password)

    @staticmethod
    def verify_password(password: str, hash: str) -> bool:
        try:
            return ph.verify(hash, password)
        except argon2_exceptions.VerifyMismatchError:
            return False
        except Exception:
            return False

    @staticmethod
    def needs_rehash(hashed_password: str) -> bool:
        try:
            return ph.check_needs_rehash(hashed_password)
        except Exception:
            return False

    @staticmethod
    def get_expiry_timestamp(
        expiry_constant_secs: int, given_expires_delta: Optional[timedelta] = None
    ):
        now = datetime.now()
        expires_delta = given_expires_delta or timedelta(seconds=expiry_constant_secs)
        return (now + expires_delta).timestamp()

    @staticmethod
    def get_current_timestamp():
        return datetime.now().timestamp()

    @staticmethod
    def create_access_token(subject_id: int, expires_delta: Optional[timedelta] = None):
        EXPIRY = AuthService.get_expiry_timestamp(
            CONSTANTS.ACCESS_TOKEN_EXPIRE_SECONDS, expires_delta
        )

        payload = Access_Token_Payload(
            sub=str(subject_id),
            iat=int(AuthService.get_current_timestamp()),
            exp=int(EXPIRY),
        )

        encoded = jwt.encode(
            dict(payload),
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
            sub=str(subject_id),
            iat=int(AuthService.get_current_timestamp()),
            exp=int(EXPIRY),
            jti=secrets.token_urlsafe(16),
        )

        encoded = jwt.encode(
            dict(payload),
            CONSTANTS.JWT_REFRESH_TOKEN_SECRET,
            algorithm=CONSTANTS.JWT_ALGORITHM,
        )

        return encoded

    @staticmethod
    async def store_refresh_token(
        db: AsyncSession, token_str: str, data: STORE_REFRESH_TOKEN_METADATA
    ) -> RefreshToken:
        refresh_token = RefreshToken(
            ip_address=data.ip_address,
            user_agent=data.user_agent,
            user_id=data.user_id,
            token=token_str,
            revoked=False,
        )

        db.add(refresh_token)
        await db.commit()
        await db.refresh(refresh_token)
        return refresh_token

    @staticmethod
    async def verify_refresh_token(db: AsyncSession, refresh_token_str: str) -> str:
        try:
            payload = AuthService.decode_token(
                refresh_token_str, "refresh"
            ).model_dump()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"JWT Error {str(e)}",
            )

        user_id: str = payload.get("sub")
        user = await AuthService.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User does not exist with user id: {user_id}",
            )

        stored_refresh_token = await db_query(
            db,
            FIND_REFRESH_TOKEN_QUERY(refresh_token_str),
            f"Error fetching stored refresh token to compare for user: {user_id}",
        )
        if not stored_refresh_token:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User does not exist with user id: {user_id}",
            )

        return user_id

    @staticmethod
    def decode_token(token: str, type: Literal["access", "refresh"]):
        """
        @throws JWTError, ExpiredSignatureError, TypeError
        """
        try:
            secret = (
                CONSTANTS.JWT_ACCESS_TOKEN_SECRET
                if type == "access"
                else CONSTANTS.JWT_REFRESH_TOKEN_SECRET
            )

            decoded = jwt.decode(token, secret, algorithms=[CONSTANTS.JWT_ALGORITHM])

            if decoded.get("type") != type:
                raise TypeError(
                    f"Required token of type '{type}', received '{decoded.get('type')}'."
                )

            if not decoded.get("sub"):
                raise KeyError("Token missing subject (user_id).")

            if type == "access":
                return Access_Token_Payload(**decoded)
            return Refresh_Token_Payload(**decoded)
        except jwt.PyJWTError as e:
            raise Exception(f"({type} token): {str(e)}")

    @staticmethod
    async def create_user(
        db: AsyncSession,
        name: str,
        username: str,
        email: str,
        password: str,
    ) -> Optional[User]:
        """
        Create a new user in the database and return the user and JWT tokens.
        Returns None if email or username already exists.
        """
        query = FIND_ALL_USERS_BY_EMAIL_OR_USERNAME_QUERY(email, username)
        result = await db_query(
            db, query, f"Error checking if user (email: {email}) already exists."
        )
        existing_user = result.scalar_one_or_none()
        if existing_user:
            return None

        user = User(
            id=uuid4(),
            name=name,
            username=username,
            email=email,
            password_hash=AuthService.hash_password(password),
        )

        db.add(user)
        await db.commit()
        await db.refresh(user)

        return user

    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        query = FIND_USER_BY_EMAIL_QUERY(email)
        result = await db_query(db, query, f"Error fetching user by email: {email}.")
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        query = FIND_USER_BY_ID_QUERY(user_id)
        result = await db_query(db, query, f"Error fetching user by id: {user_id}.")
        return result.scalar_one_or_none()

    @staticmethod
    async def authenticate_user(
        db: AsyncSession, email: str, password: str
    ) -> Optional[User]:
        user = await AuthService.get_user_by_email(db, email)

        if not user:
            return None

        if not AuthService.verify_password(password, user.password_hash):
            logger.warning("password verification failed.")
            return None

        if AuthService.needs_rehash(user.password_hash):
            user.password_hash = AuthService.hash_password(password)
            await db.commit()

        return user

    @staticmethod
    async def revoke_refresh_token(
        db: AsyncSession,
        user_id: str,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> bool:
        mutation = REVOKE_USER_REFRESH_TOKENS_MUTATION(user_id, user_agent, ip_address)
        result = await db_query(
            db, mutation, f"Error revoking user ({user_id}) refresh token."
        )
        await db.commit()

        revoked_count = result.rowcount or 0
        logger.info(
            f"Revoked {revoked_count} refresh tokens for user={user_id} "
            f"(user_agent={user_agent or '*'}, ip={ip_address or '*'})"
        )
        return True if revoked_count > 0 else False

    @staticmethod
    async def set_email_as_verfied(db: AsyncSession, user_id: str) -> bool:
        query = FIND_USER_BY_ID_QUERY(user_id)
        result = await db_query(db, query, f"Error fetching user by id: {user_id}.")
        user: User = result.scalar_one_or_none()
        if not user:
            return False

        user.email_verified = True
        await db.commit()
        return True
