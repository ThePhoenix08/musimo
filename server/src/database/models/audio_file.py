from typing import TYPE_CHECKING, List
from uuid import UUID
from sqlalchemy import ForeignKey

from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Enum

from src.database.models.project import Project

from ..base import Base
from ..enums import AudioFormat, AudioSourceType
from ..mixins import TimestampMixin, UserReferenceMixin, UUIDMixin

if TYPE_CHECKING:
    from server.src.database.models.analysis_job import AnalysisJob
    from server.src.database.models.audio_feature import AudioFeature
    from server.src.database.models.log import Log
    from server.src.database.models.separated_source import SeparatedSource

class AudioFile(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "audio_files"

    project_id: Mapped[UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    duration: Mapped[float | None] = mapped_column(Float)
    sample_rate: Mapped[int | None] = mapped_column(Integer)
    checksum: Mapped[str | None] = mapped_column(String(128), unique=True)

    project = relationship("Project", back_populates="audio_files")

    features: Mapped[list["AudioFeature"]] = relationship(
        "AudioFeature",
        back_populates="audio",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    separated_sources: Mapped[list["SeparatedSource"]] = relationship(
        "SeparatedSource",
        back_populates="parent_audio",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    logs: Mapped[list["Log"]] = relationship(
        "Log",
        back_populates="audio",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    analysis_jobs: Mapped[list["AnalysisJob"]] = relationship(
        "AnalysisJob",
        back_populates="audio",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
