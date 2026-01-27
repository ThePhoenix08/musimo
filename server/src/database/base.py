# app/db/base.py
from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

# optional naming convention (helps with Alembic migrations)
metadata = MetaData(
    naming_convention={
        "pk": "pk_%(table_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "ix": "ix_%(table_name)s_%(column_0_name)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
    }
)


class Base(DeclarativeBase):
    metadata = metadata


from src.database.models import (  # noqa: E402
    analysis_job,
    analysis_result,
    audio_feature,
    audio_file,
    log,
    model,
    project,
    seperated_source,
    user,
)

__all__ = [
    "analysis_job",
    "analysis_result",
    "audio_feature",
    "audio_file",
    "log",
    "model",
    "project",
    "seperated_source",
    "user",
]
