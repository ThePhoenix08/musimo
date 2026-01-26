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


<<<<<<< HEAD
class UUIDMixin:
=======
class IDMixin:
    """Mixin to add an integer primary key column to a SQLAlchemy model."""
    id: Mapped[int] = mapped_column(
        primary_key=True, autoincrement=True, unique=True, nullable=False
    )


class UUIDMixin:
    """Mixin to add a UUID primary key column to a SQLAlchemy model."""
>>>>>>> 3fde25a (minor updates)
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )


class TimestampMixin:
<<<<<<< HEAD
=======
    """Mixin to add created_at and updated_at timestamps to a model."""
>>>>>>> 3fde25a (minor updates)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


@declarative_mixin
class UserReferenceMixin:
<<<<<<< HEAD
=======
    """Mixin that adds a user_id foreign key and relationship to User."""

>>>>>>> 3fde25a (minor updates)
    @declared_attr
    def user_id(cls) -> Mapped[uuid.UUID]:
        return mapped_column(
            ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )

    @declared_attr
<<<<<<< HEAD
    def user(cls) -> Mapped["User"]:
        return relationship(
            "User",
            back_populates=cls.__tablename__,
            lazy="selectin",
        )
=======
    def user(cls):
        return relationship("User", lazy="selectin")
>>>>>>> 3fde25a (minor updates)


@declarative_mixin
class ProjectReferenceMixin:
<<<<<<< HEAD
=======
    """Mixin that adds a project_id foreign key and relationship to Project."""

>>>>>>> 3fde25a (minor updates)
    @declared_attr
    def project_id(cls) -> Mapped[uuid.UUID]:
        return mapped_column(
            ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
<<<<<<< HEAD
            index=True,
=======
            index=True
>>>>>>> 3fde25a (minor updates)
        )

    @declared_attr
    def project(cls) -> Mapped["Project"]:
        return relationship(
            "Project",
<<<<<<< HEAD
            back_populates=cls.__tablename__,
=======
            back_populates="audios",  # Replace with actual back_populates on Project
>>>>>>> 3fde25a (minor updates)
            lazy="selectin",
        )
