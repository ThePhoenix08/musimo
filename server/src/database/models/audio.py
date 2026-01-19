from sqlalchemy import Column, Integer, String, Float, Text, TIMESTAMP, func, ForeignKey, 
from sqlalchemy.orm import relationship
from ..base import Base
from .mixins import UUIDMixin, TimestampMixin, UserReferenceMixin

class Audio(
    UUIDMixin,
    TimestampMixin,
    UserReferenceMixin,
    Base
):
    __tablename__ = 'audios'

    file_path: Mapped[str] = mapped_column(Text, nullable=False)