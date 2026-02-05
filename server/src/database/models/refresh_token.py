from sqlalchemy import TEXT, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from src.database.base import Base
from src.database.mixins import TimestampMixin, UserReferenceMixin, UUIDMixin


class RefreshToken(UUIDMixin, TimestampMixin, UserReferenceMixin, Base):
    token: Mapped[str] = mapped_column(TEXT, nullable=False)
    revoked: Mapped[Boolean] = mapped_column(Boolean, default=False)
