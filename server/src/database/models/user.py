from sqlalchemy.orm import Mapped, mapped_column, String, relationship

from .mixins import TimestampMixin, UUIDMixin
from ..base import Base

class User(
    UUIDMixin,
    TimestampMixin,
    Base
):
    __tablename__ = 'users'

    # id VARCHAR(12) PRIMARY KEY,
    # name VARCHAR(100) NOT NULL,
    # username VARCHAR(50) UNIQUE NOT NULL,
    # email VARCHAR(255) UNIQUE NOT NULL,
    # password TEXT NOT NULL,
    # created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    # updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

    name: Mapped[str] = mapped_column(String(50), nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)

    audios = relationship("Audio", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("AnalysisReport", back_populates="user", cascade="all, delete-orphan")