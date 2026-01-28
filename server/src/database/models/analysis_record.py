from typing import List, TYPE_CHECKING
from sqlalchemy import Enum, ForeignKey, JSON, Text
import uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from torch import Tensor
from src.database.models.audio_file import AudioFile
from src.models.emotion_recognition.pipeline.postprocessor import (
    CombinedPrediction,
    DynamicPrediction,
    StaticPrediction,
)
from src.database.enums import AnalysisType
from src.database.base import Base
from src.database.mixins import (
    ProjectReferenceMixin,
    UUIDMixin,
    TimestampMixin,
    UserReferenceMixin,
    AudioFileReferenceMixin,
)

if TYPE_CHECKING:
    from src.database.models import Model, AudioFeature


class AnalysisRecord(
    UUIDMixin,
    TimestampMixin,
    UserReferenceMixin,
    AudioFileReferenceMixin,
    ProjectReferenceMixin,
    Base,
):
    analysis_type: Mapped[AnalysisType] = mapped_column(Enum(AnalysisType))
    results: Mapped[dict] = mapped_column(JSON)
    summary_text: Mapped[str] = mapped_column(Text)

    model_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("models.id", ondelete="SET NULL"), nullable=True,
    )

    model: Mapped["Model"] = relationship(
        "Model", back_populates="analysis_records", lazy="selectin"
    )

    __mapper_args__ = {
        "polymorphic_on": analysis_type,
        "polymorphic_identity": "base",
    }


class EmotionAnalysisRecord(AnalysisRecord):
    id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("analysis_records.id"), primary_key=True
    )
    vgg_embeddings: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    prediction_result: Mapped[
        StaticPrediction | DynamicPrediction | CombinedPrediction
    ] = mapped_column(JSON)

    __mapper_args__ = {
        "polymorphic_identity": AnalysisType.EMOTION,
    }


class InstrumentAnalysisRecord(AnalysisRecord):
    id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("analysis_records.id"), primary_key=True
    )
    instruments: Mapped[list[str]] = mapped_column(JSON)
    confidence_scores: Mapped[dict] = mapped_column(JSON)

    __mapper_args__ = {
        "polymorphic_identity": AnalysisType.INSTRUMENT,
    }


class FeatureAnalysisRecord(AnalysisRecord):
    id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("analysis_records.id"), primary_key=True
    )
    feature_vector: Mapped[dict] = mapped_column(JSON)
    audio_features: Mapped[list["AudioFeature"]] = relationship(
        "AudioFeature", back_populates="analysis_record", lazy="selectin"
    )

    __mapper_args__ = {
        "polymorphic_identity": AnalysisType.FEATURES,
    }


class SeparationAnalysisRecord(AnalysisRecord):
    id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("analysis_records.id"), primary_key=True
    )
    separated_files: Mapped[List["AudioFile"]] = relationship(
        "AudioFile",
        back_populates="separation_analysis",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    __mapper_args__ = {
        "polymorphic_identity": AnalysisType.SEPARATION,
    }
