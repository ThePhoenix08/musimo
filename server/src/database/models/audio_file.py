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
    TimestampMixin,
    UUIDMixin,
)

if TYPE_CHECKING:
    from src.database.models import (
        AnalysisRecord,
        AudioFeature,
        Project,
        SeparationAnalysisRecord,
    )


class AudioFile(UUIDMixin, TimestampMixin, Base):
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
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE")
    )

    # Discriminator
    source_type: Mapped[AudioSourceType] = mapped_column(
        Enum(AudioSourceType), default=AudioSourceType.ORIGINAL, nullable=False
    )

    # Relationships
    project: Mapped["Project"] = relationship(
        "Project",
        back_populates="main_audio",
        foreign_keys="[Project.main_audio_id]",
        lazy="selectin",
        uselist=False,
    )
    analysis_records: Mapped[list["AnalysisRecord"]] = relationship(
        "AnalysisRecord",
        back_populates="audio_file",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    separated_sources: Mapped[list["SeparatedAudioFile"]] = relationship(
        "SeparatedAudioFile",
        back_populates="parent_audio",
        cascade="all, delete-orphan",
        lazy="selectin",
        foreign_keys="SeparatedAudioFile.parent_audio_id",
    )

    audio_features: Mapped[list["AudioFeature"]] = relationship(
        "AudioFeature",
        back_populates="audio_file",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    __mapper_args__ = {
        "polymorphic_on": source_type,
        "polymorphic_identity": AudioSourceType.ORIGINAL,
    }


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

    parent_audio: Mapped["AudioFile"] = relationship(
        "AudioFile",
        remote_side=[AudioFile.id],
        back_populates="separated_sources",
        lazy="selectin",
        foreign_keys=[parent_audio_id],
    )

    separation_analysis_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("separation_analysis_records.id", ondelete="SET NULL"),
        index=True,
    )

    separation_analysis: Mapped["SeparationAnalysisRecord"] = relationship(
        "SeparationAnalysisRecord",
        back_populates="separated_files",  # ✅ reciprocal link
        lazy="selectin",
    )

    __mapper_args__ = {
        "polymorphic_identity": AudioSourceType.SEPARATED,
        "inherit_condition": id == AudioFile.id,
    }
