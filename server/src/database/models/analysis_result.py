import uuid
from typing import TYPE_CHECKING

from sqlalchemy import JSON, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..base import Base
from ..mixins import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from .analysis_job import AnalysisJob


class AnalysisResult(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "analysis_results"

    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("analysis_jobs.id", ondelete="CASCADE"), unique=True)
    results: Mapped[dict] = mapped_column(JSON)
    summary_text: Mapped[str | None] = mapped_column(Text)
    visualization_paths: Mapped[dict | None] = mapped_column(JSON)

    job: Mapped["AnalysisJob"] = relationship("AnalysisJob", back_populates="result", lazy="selectin")