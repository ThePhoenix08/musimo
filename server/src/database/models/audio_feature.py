from sqlalchemy import JSON, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from src.database.enums import FeatureType

from src.database.base import Base
from src.database.mixins import TimestampMixin, UUIDMixin, AudioFileReferenceMixin

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.database.models.analysis_record import FeatureAnalysisRecord


class AudioFeature(UUIDMixin, TimestampMixin, AudioFileReferenceMixin, Base):
    analysis_record_id: Mapped[uuid.UUID] = mapped_column(
        "FeatureAnalysisRecord",
        ForeignKey("feature_analysis_records.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    feature_analysis_record: Mapped["FeatureAnalysisRecord"] = relationship(
        "FeatureAnalysisRecord", back_populates="audio_features", lazy="selectin"
    )
    feature_type: Mapped[FeatureType] = mapped_column(
        Enum(FeatureType), default=FeatureType.LOW_LEVEL
    )
    data: Mapped[dict] = mapped_column(JSON)
