import uuid
from typing import TYPE_CHECKING

from sqlalchemy import JSON, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database.enums import FeatureType

from ..base import Base
from ..mixins import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from .audio_file import AudioFile


class AudioFeature(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "audio_features"

    audio_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("audio_files.id", ondelete="CASCADE"), index=True)
    feature_type: Mapped[FeatureType] = mapped_column(Enum(FeatureType), default=FeatureType.LOW_LEVEL)  # low-level, mid-level, high-level, embedding
    data: Mapped[dict] = mapped_column(JSON)

    audio: Mapped["AudioFile"] = relationship("AudioFile", back_populates="features", lazy="selectin")