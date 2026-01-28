from typing import List, List, Optional

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship


from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.database.models import AnalysisRecord

from src.database.base import Base
from src.database.mixins import (
    AudioFileReferenceMixin,
    TimestampMixin,
    UserReferenceMixin,
    UUIDMixin,
)


class Project(
    UUIDMixin, TimestampMixin, UserReferenceMixin, AudioFileReferenceMixin, Base
):
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    analysis_records: Mapped[List["AnalysisRecord"]] = relationship(
        "AnalysisRecord",
        back_populates="project",
        lazy="selectin",
    )
