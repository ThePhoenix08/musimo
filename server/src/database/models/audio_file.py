import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database.base import Base
from src.database.enums import (
    AudioFileStatus,
    AudioFormat,
    AudioSourceType,
    SeparatedSourceLabel,
)
from src.database.mixins import (
    ProjectReferenceMixin,
    TimestampMixin,
    UserReferenceMixin,
    UUIDMixin,
)

if TYPE_CHECKING:
    from src.database.models.analysis_record import AnalysisRecord


class AudioFile(
    UUIDMixin, TimestampMixin, UserReferenceMixin, ProjectReferenceMixin, Base
):
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_name: Mapped[str] = mapped_column(String(256), nullable=False)
    duration: Mapped[float | None] = mapped_column(Float)
    sample_rate: Mapped[int | None] = mapped_column(Integer)
    channels: Mapped[int] = mapped_column(Integer)
    format: Mapped[AudioFormat] = mapped_column(
        Enum(AudioFormat), default=AudioFormat.MP3
    )
    checksum: Mapped[str] = mapped_column(String(128), unique=True)
    status: Mapped[AudioFileStatus] = mapped_column(
        Enum(AudioFileStatus), default=AudioFileStatus.UPLOADED
    )

    # Discriminator
    source_type: Mapped[AudioSourceType] = mapped_column(
        Enum(AudioSourceType), default=AudioSourceType.ORIGINAL, nullable=False
    )

    __mapper_args__ = {
        "polymorphic_on": source_type,
        "polymorphic_identity": AudioSourceType.ORIGINAL,
    }

    # Relationships
    analysis_records: Mapped[list["AnalysisRecord"]] = relationship(
        "AnalysisRecord",
        back_populates="audio",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    separated_sources: Mapped[list["SeparatedAudioFile"]] = relationship(
        "SeparatedAudioFile",
        back_populates="parent_audio",
        lazy="selectin",
        cascade="all, delete-orphan",
    )


class SeparatedAudioFile(AudioFile):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("audio_files.id", ondelete="CASCADE"),
        primary_key=True,
    )

    parent_audio_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("audio_files.id", ondelete="SET NULL"),
        index=True,
        nullable=False,
    )

    source_label: Mapped[SeparatedSourceLabel] = mapped_column(
        Enum(SeparatedSourceLabel)
    )

    # Relationship to parent (original audio)
    parent_audio: Mapped["AudioFile"] = relationship(
        "AudioFile",
        remote_side=["AudioFile.id"],
        back_populates="separated_sources",
        lazy="selectin",
    )

    __mapper_args__ = {
        "polymorphic_identity": AudioSourceType.SEPARATED,
        "inherit_condition": id == AudioFile.id,
    }
