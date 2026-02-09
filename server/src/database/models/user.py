from typing import TYPE_CHECKING, List

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..base import Base
from ..mixins import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from src.database.models import Log, Otp, Project, RefreshToken


class User(UUIDMixin, TimestampMixin, Base):
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)

    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    otps: Mapped[list["Otp"]] = relationship(
        "Otp", back_populates="user", cascade="all, delete-orphan"
    )

    projects: Mapped[List["Project"]] = relationship(
        "Project", back_populates="user", cascade="all, delete-orphan"
    )

    logs: Mapped[List["Log"]] = relationship(
        "Log", back_populates="user", cascade="all, delete-orphan"
    )

    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
