from typing import Optional

from sqlalchemy import TEXT, Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from src.database.base import Base
from src.database.mixins import TimestampMixin, UserReferenceMixin, UUIDMixin


class RefreshToken(UUIDMixin, TimestampMixin, UserReferenceMixin, Base):
    token: Mapped[str] = mapped_column(TEXT, nullable=False)
    revoked: Mapped[Boolean] = mapped_column(Boolean, default=False)
    device_info: Mapped[Optional[str]] = mapped_column(String(255))
    ip_address: Mapped[Optional[str]] = mapped_column(String(64))
    user_agent: Mapped[Optional[str]] = mapped_column(String(512))
