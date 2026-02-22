# app/db/base.py
import re
from datetime import datetime

from sqlalchemy import MetaData
from sqlalchemy.inspection import inspect
from sqlalchemy.orm import DeclarativeBase, declared_attr

# optional naming convention (helps with Alembic migrations)
metadata = MetaData(
    naming_convention={
        "pk": "pk_%(table_name)s",
        "fk": "fk_%(table_name)s__%(referred_table_name)s",
        "ix": "ix_%(table_name)s_%(column_0_name)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
    }
)


def camel_to_snake(name: str) -> str:
    return re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()


class Base(DeclarativeBase):
    metadata = metadata

    @declared_attr.directive
    def __tablename__(cls) -> str:
        return camel_to_snake(cls.__name__) + "s"

    def to_dict(self, include_relationships: bool = False) -> dict:
        """
        Safe for async contexts — only includes already-loaded attributes.
        """
        mapper = inspect(self)
        data = {}

        for attr in mapper.attrs:
            if not attr.key.startswith("_"):
                if attr.key in mapper.unloaded:
                    continue
                value = getattr(self, attr.key, None)

                # Handle datetime serialization
                if isinstance(value, datetime):
                    value = value.isoformat()

                data[attr.key] = value or None

        if include_relationships:
            for name, rel in mapper.relationships.items():
                if name in mapper.unloaded:
                    continue
                value = getattr(self, name)
                if value is None:
                    data[name] = None
                elif isinstance(value, list):
                    data[name] = [v.to_dict() for v in value if hasattr(v, "to_dict")]
                elif hasattr(value, "to_dict"):
                    data[name] = value.to_dict()

        return data

    def __repr__(self):
        """Readable repr for debugging."""
        cols = {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}
        return f"<{self.__class__.__name__} {cols}>"
