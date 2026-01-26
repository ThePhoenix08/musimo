import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..base import Base
from ..enums import AnalysisType, JobStatus
from ..mixins import TimestampMixin, UserReferenceMixin, UUIDMixin

if TYPE_CHECKING:
    from .analysis_result import AnalysisResult
    from .audio_file import AudioFile
    from .model import Model
    from .user import User


class AnalysisJob(UUIDMixin, TimestampMixin, UserReferenceMixin, Base):
    __tablename__ = "analysis_jobs"

    audio_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("audio_files.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    model_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("models.id", ondelete="SET NULL")
    )

    analysis_type: Mapped[AnalysisType] = mapped_column(Enum(AnalysisType))
    status: Mapped[JobStatus] = mapped_column(Enum(JobStatus))

    user = relationship("User", back_populates="analysis_jobs")
    audio = relationship("AudioFile", back_populates="analysis_jobs")
    model = relationship("Model", back_populates="analysis_jobs")

    result: Mapped["AnalysisResult"] = relationship(
        "AnalysisResult",
        back_populates="job",
        uselist=False,
        cascade="all, delete-orphan",
    )
