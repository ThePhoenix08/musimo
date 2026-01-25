from typing import TYPE_CHECKING, List

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..base import Base
from ..mixins import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from .project import Project


class User(
    UUIDMixin,
    TimestampMixin,
    Base
):
    __tablename__ = 'users'

   

    name: Mapped[str] = mapped_column(String(50), nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)

    # audios = relationship("Audio", back_populates="user", cascade="all, delete-orphan")
    # reports = relationship("AnalysisReport", back_populates="user", cascade="all, delete-orphan")