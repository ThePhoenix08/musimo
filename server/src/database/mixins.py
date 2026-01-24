import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import TIMESTAMP, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import (
    Mapped,
    declarative_mixin,
    declared_attr,
    mapped_column,
    relationship,
)

if TYPE_CHECKING:
    from .models.project import Project
    from .models.user import User


class IDMixin:
    """Mixin to add an integer primary key column to a SQLAlchemy model."""

    id: Mapped[int] = mapped_column(
        primary_key=True, autoincrement=True, unique=True, nullable=False
    )


class UUIDMixin:
    """Mixin to add a UUID primary key column to a SQLAlchemy model."""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )


class TimestampMixin:
    """Mixin to add created_at and updated_at timestamp columns to a SQLAlchemy model."""

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


@declarative_mixin
class UserReferenceMixin:
    """
    Mixin that adds a `user_id` foreign key and `user` relationship
    to any model that belongs to a User.
    """

    @declared_attr
    def user_id(cls) -> Mapped[str]:
        return mapped_column(
            ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
        )

    @declared_attr
    def user(cls) -> Mapped["User"]:
        return relationship(
            "User",
            back_populates=cls.__tablename__,  # optionally set a dynamic backref name
            lazy="selectin",
        )


@declarative_mixin
class ProjectReferenceMixin:

    @declared_attr
    def project_id(cls) -> Mapped[uuid.UUID]:
        return mapped_column(
            ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
        )

    @declared_attr
    def project(cls) -> Mapped["Project"]:
        return relationship(
            "Project", back_populates=cls.__tablename__, lazy="selectin"
        )
