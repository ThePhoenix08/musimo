import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..base import Base
from ..enums import AudioSourceType
from ..mixins import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from .audio_file import AudioFile


class SeparatedSource(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "separated_sources"

    parent_audio_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("audio_files.id", ondelete="CASCADE"), index=True)
    source_type: Mapped[AudioSourceType] = mapped_column(Enum(AudioSourceType))
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    duration: Mapped[float | None] = mapped_column(Float)

    parent_audio: Mapped["AudioFile"] = relationship("AudioFile", back_populates="separated_sources", lazy="selectin")