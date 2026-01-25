
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..base import Base
from ..mixins import TimestampMixin, UserReferenceMixin, UUIDMixin

if TYPE_CHECKING:
    from .audio_file import AudioFile


class Project(UUIDMixin, TimestampMixin, UserReferenceMixin, Base):
    __tablename__ = "projects"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    audio_files: Mapped[List["AudioFile"]] = relationship(
        back_populates="project",
        lazy="selectin",
    )
from sqlalchemy import Column, Integer, String, Float, Text, TIMESTAMP, func, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from sqlalchemy.orm import relationship

from src.database.mixins import TimestampMixin, UUIDMixin
from ..base import Base

class Project(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "projects"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    user = relationship("User", back_populates="projects")
    audios = relationship(
        "Audio",
        back_populates="project",
        cascade="all, delete-orphan"
    )
