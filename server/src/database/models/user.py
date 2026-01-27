from typing import TYPE_CHECKING, List

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..base import Base
from ..mixins import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from .project import Project


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    # id VARCHAR(12) PRIMARY KEY,
    # name VARCHAR(100) NOT NULL,
    # username VARCHAR(50) UNIQUE NOT NULL,
    # email VARCHAR(255) UNIQUE NOT NULL,
    # password_hash TEXT NOT NULL,
    # created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    # updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    # projects -< relationship to Project model

    name: Mapped[str] = mapped_column(String(50), nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)

    projects: Mapped[List["Project"]] = relationship(
        "Project", back_populates="user", lazy="selectin"
    )
