import datetime

from sqlalchemy import Boolean, DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from src.core.settings import CONSTANTS
from src.database.base import Base
from src.database.enums import OtpType
from src.database.mixins import TimestampMixin, UserReferenceMixin, UUIDMixin


class Otp(UUIDMixin, TimestampMixin, UserReferenceMixin, Base):
    code: Mapped[str] = mapped_column(String(CONSTANTS.OTP_LENGTH), nullable=False)
    purpose: Mapped[OtpType] = mapped_column(
        Enum(OtpType), default=OtpType.EMAIL_VERIFICATION
    )
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
    expires_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC)
        + datetime.timedelta(minutes=CONSTANTS.OTP_EXPIRE_MINUTES),
        nullable=False,
    )

    def is_expired(self) -> bool:
        return datetime.datetime.now(datetime.UTC) > self.expires_at
