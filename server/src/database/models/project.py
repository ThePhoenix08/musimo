from typing import TYPE_CHECKING, List, Optional
import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from src.database.models import AnalysisRecord, AudioFile

from src.database.base import Base
from src.database.mixins import (
    TimestampMixin,
    UserReferenceMixin,
    UUIDMixin,
)


class Project(UUIDMixin, TimestampMixin, UserReferenceMixin, Base):
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Main audio reference ──────────────────────────────────────────────────
    main_audio_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("audio_files.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
    )
    main_audio: Mapped[Optional["AudioFile"]] = relationship(
        "AudioFile",
        foreign_keys=[main_audio_id],
        lazy="select",
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    analysis_records: Mapped[List["AnalysisRecord"]] = relationship(
        "AnalysisRecord",
        back_populates="project",
        lazy="selectin",
    )
    audio_files: Mapped[List["AudioFile"]] = relationship(
        "AudioFile",
        back_populates="project",
        foreign_keys="AudioFile.project_id",   # ← disambiguates from main_audio_id
    )