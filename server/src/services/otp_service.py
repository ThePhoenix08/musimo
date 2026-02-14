import secrets
import string
from datetime import UTC, datetime, timedelta
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import and_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.settings import CONSTANTS
from src.database.enums import OtpType
from src.database.models import Otp
from src.utils.db_util import db_query


def SET_UNUSED_OTPS_FOR_DELETE_MUTATION(email: str, purpose: str):
    return (
        update(Otp)
        .filter(
            Otp.email == email,
            Otp.purpose == purpose,
            Otp.is_used == False,  # noqa: E712
        )
        .values(is_used=True)
    )


def FIND_ALL_USER_PURPOSE_OTPS_QUERY(email: str, code: str, purpose: str):
    return (
        select(Otp)
        .filter(
            Otp.email == email,
            Otp.code == code,
            Otp.purpose == purpose,
            Otp.is_used == False,  # noqa: E712
        )
        .order_by(Otp.expires_at.desc())
    )


def FIND_ALL_USER_PENDING_OTPS_QUERY(user_id: str, purpose: str):
    return (
        select(Otp)
        .filter(
            Otp.user_id == user_id,
            Otp.purpose == purpose,
            Otp.is_used == False,  # noqa: E712
        )
        .order_by(Otp.expires_at.desc())
    )


def INVALIDATE_ALL_PENDING_OTPS_MUTATION(user_id: str, purpose: str | None = None):
    CONDITIONS = [Otp.user_id == user_id, Otp.is_used == False]
    if purpose:
        CONDITIONS.append(Otp.purpose == purpose)
    return update(Otp).where(and_(*CONDITIONS)).values(is_used=True)


class OtpService:
    @staticmethod
    async def _generate_otp() -> str:
        return "".join(
            secrets.choice(string.digits) for _ in range(CONSTANTS.OTP_LENGTH)
        )

    @staticmethod
    async def create_and_store_otp(
        db: AsyncSession, user_id: str, email: str, purpose: OtpType
    ) -> Optional[Otp]:
        otp_code = await OtpService._generate_otp()
        expires_at = datetime.now(UTC) + timedelta(minutes=CONSTANTS.OTP_EXPIRE_MINUTES)

        mutation = SET_UNUSED_OTPS_FOR_DELETE_MUTATION(email, purpose)
        await db_query(
            db, mutation, f"Error setting unused OTPs for deletion for email: {email}."
        )
        otp = Otp(
            user_id=user_id,
            email=email,
            code=otp_code,
            purpose=purpose,
            is_used=False,
            expires_at=expires_at,
        )

        db.add(otp)
        await db.commit()
        await db.refresh(otp)
        return otp

    @staticmethod
    async def verify_otp(
        db: AsyncSession, email: str, code: str, purpose: OtpType
    ) -> bool:
        """
        @raises HTTPException: [HTTP_401_UNAUTHORIZED, HTTP_410_GONE]
        """
        query = FIND_ALL_USER_PURPOSE_OTPS_QUERY(email, code, purpose)
        result = await db_query(db, query, f"Error verifying OTP for email: {email}.")

        otp = result.scalar_one_or_none()

        if not otp:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OTP"
            )

        if otp.expires_at < datetime.now(UTC):
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="Expired OTP")

        otp.is_used = True
        await db.commit()
        return True

    @staticmethod
    async def has_pending_otp(db: AsyncSession, user_id: str, purpose: OtpType) -> bool:
        query = FIND_ALL_USER_PENDING_OTPS_QUERY(user_id, purpose.value)
        result = await db_query(
            db, query, f"Error fetching pending OTPs of user: {user_id}"
        )
        return result.scalar_one_or_none() is not None

    @staticmethod
    async def invalidate_otp(
        db: AsyncSession, user_id: str, purpose: OtpType | None = None
    ):
        mutation = INVALIDATE_ALL_PENDING_OTPS_MUTATION(user_id, purpose)
        await db_query(
            db, mutation, f"Error invalidating pending OTPs of user: {user_id}"
        )
        await db.commit()
        return
