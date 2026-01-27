import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..base import Base
from ..mixins import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from .audio_file import AudioFile


class Log(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "logs"

    audio_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("audio_files.id", ondelete="CASCADE"), nullable=True
    )
    entity_type: Mapped[str] = mapped_column(String(50))
    message: Mapped[str] = mapped_column(Text)
    log_level: Mapped[str] = mapped_column(String(20), default="info")

    audio: Mapped["AudioFile"] = relationship(
        "AudioFile", back_populates="logs", lazy="selectin"
    )
