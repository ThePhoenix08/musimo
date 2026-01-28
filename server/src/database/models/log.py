import enum
import uuid

from src.database.base import Base
from sqlalchemy import JSON, Enum, Index, Text
from sqlalchemy.orm import Mapped, mapped_column
from src.database.enums import EntityType, LogLevel

from src.database.mixins import (
    TimestampMixin,
    UserReferenceMixin,
    UUIDMixin,
)


class Log(UUIDMixin, TimestampMixin, UserReferenceMixin, Base):
    entity_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    entity_type: Mapped[EntityType] = mapped_column(Enum(EntityType), nullable=False)

    message: Mapped[str] = mapped_column(Text, nullable=False)
    log_level: Mapped[LogLevel] = mapped_column(
        Enum(LogLevel), default=LogLevel.info, nullable=False
    )

    data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    __table_args__ = (Index("ix_logs_entity_ref", "entity_type", "entity_id"),)

    def __repr__(self) -> str:
        return (
            f"<Log {self.log_level.value.upper()} "
            f"[{self.entity_type}:{self.entity_id}] - {self.message[:40]!r}>"
        )
