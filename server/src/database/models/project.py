from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from src.database.models import AnalysisRecord, AudioFile

from src.database.base import Base
from src.database.mixins import (
    TimestampMixin,
    UserReferenceMixin,
    UUIDMixin,
)


class Project(UUIDMixin, TimestampMixin, UserReferenceMixin, Base):
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    analysis_records: Mapped[List["AnalysisRecord"]] = relationship(
        "AnalysisRecord",
        back_populates="project",
        lazy="selectin",
    )
    audio_files: Mapped[List["AudioFile"]] = relationship(
        "AudioFile", back_populates="project"
    )
