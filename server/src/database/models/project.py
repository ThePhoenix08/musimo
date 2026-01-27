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
