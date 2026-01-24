from typing import TYPE_CHECKING

from sqlalchemy import Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..base import Base
from ..enums import AnalysisType
from ..mixins import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from .analysis_job import AnalysisJob


class Model(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "models"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[AnalysisType] = mapped_column(Enum(AnalysisType))
    version: Mapped[str] = mapped_column(String(50), default="v1.0")
    description: Mapped[str | None] = mapped_column(Text)
    checkpoint_path: Mapped[str | None] = mapped_column(String(500))

    analysis_jobs: Mapped[list["AnalysisJob"]] = relationship(back_populates="model", lazy="selectin")
