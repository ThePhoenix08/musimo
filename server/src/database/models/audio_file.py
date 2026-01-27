from typing import TYPE_CHECKING

from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Enum

from ..base import Base
from ..enums import AudioFormat, AudioSourceType
from ..mixins import TimestampMixin, UserReferenceMixin, UUIDMixin

if TYPE_CHECKING:
    from src.database.models.analysis_job import AnalysisJob
    from src.database.models.audio_feature import AudioFeature
    from src.database.models.log import Log
    from src.database.models.seperated_source import SeparatedSource

class AudioFile(
    UUIDMixin,
    TimestampMixin,
    UserReferenceMixin,
    Base
):
    __tablename__ = "audio_files"

    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    duration: Mapped[float | None] = mapped_column(Float)
    sample_rate: Mapped[int | None] = mapped_column(Integer)
    source_type: Mapped[AudioSourceType] = mapped_column(Enum(AudioSourceType), default=AudioSourceType.ORIGINAL)
    status: Mapped[str] = mapped_column(String(50), default="uploaded")
    checksum: Mapped[str] = mapped_column(String(128), unique=True)
    channels: Mapped[int] = mapped_column(Integer)
    format: Mapped[AudioFormat] = mapped_column(Enum(AudioFormat), default=AudioFormat.MP3)

    # Relationships
    separated_sources: Mapped[list["SeparatedSource"]] = relationship(back_populates="parent_audio", lazy="selectin")
    features: Mapped[list["AudioFeature"]] = relationship(back_populates="audio", lazy="selectin")
    analysis_jobs: Mapped[list["AnalysisJob"]] = relationship(back_populates="audio", lazy="selectin")
    logs: Mapped[list["Log"]] = relationship(back_populates="audio", lazy="selectin")


# class AudioMetadata(Base):
#     __tablename__ = "audio_metadata"

#     id = Column(String(20), primary_key=True)
#     audio_id = Column(String(20), ForeignKey("audios.id", ondelete="CASCADE"))
#     basic_features = Column(JSON)
#     low_level_features = Column(JSON)
#     mid_level_features = Column(JSON)
#     high_level_features = Column(JSON)
#     created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())