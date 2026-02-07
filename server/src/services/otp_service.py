import secrets
import string
from datetime import UTC, datetime, timedelta
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.settings import CONSTANTS
from src.database.enums import OtpType
from src.database.models import Otp


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


def FIND_ALL_USER_OTPS_QUERY(email: str, code: str, purpose: str):
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

        await db.execute(SET_UNUSED_OTPS_FOR_DELETE_MUTATION(email, purpose.value))

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
        result = await db.execute(FIND_ALL_USER_OTPS_QUERY(email, code, purpose.value))

        otp = result.scaler_one_or_none()

        if not otp:
            return False

        if otp.expires_at < datetime.now(UTC):
            return False

        otp.is_used = True
        await db.commit()
        return True
