import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from src.database.models import AnalysisRecord, AudioFile, SeparatedAudioFile

from src.database.base import Base
from src.database.mixins import (
    TimestampMixin,
    UserReferenceMixin,
    UUIDMixin,
)


class Project(UUIDMixin, TimestampMixin, UserReferenceMixin, Base):
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # 1-to-1 main/original audio
    main_audio_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("audio_files.id", ondelete="SET NULL"), unique=True
    )

    main_audio: Mapped["AudioFile"] = relationship(
        "AudioFile",
        back_populates="project",
        foreign_keys=[main_audio_id],
        lazy="selectin",
        uselist=False,
    )

    analysis_records: Mapped[List["AnalysisRecord"]] = relationship(
        "AnalysisRecord", back_populates="project", lazy="selectin"
    )

    # convenience accessor — all separated audios for this project
    separated_audios: Mapped[List["SeparatedAudioFile"]] = relationship(
        "SeparatedAudioFile",
        secondary="audio_files",  # implicit join via AudioFile.project_id
        viewonly=True,
        primaryjoin="Project.id == AudioFile.project_id",
        secondaryjoin="AudioFile.id == SeparatedAudioFile.parent_audio_id",
        lazy="selectin",
    )

    @property
    def all_audio_files(self):
        return [self.main_audio] + (self.separated_audios or [])
