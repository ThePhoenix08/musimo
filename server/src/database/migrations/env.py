# ------------------------------------------------------
# Import app metadata (ONLY metadata, not sessions)
# ------------------------------------------------------
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from dotenv import load_dotenv
from sqlalchemy import engine_from_config, pool

from src.core.settings import CONSTANTS
from src.database.base import Base

# ------------------------------------------------------
# Load environment
# ------------------------------------------------------
load_dotenv()

# ------------------------------------------------------
# Make project importable
# ------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parents[1]  # server/
sys.path.insert(0, str(BASE_DIR))

# ------------------------------------------------------
# Alembic configuration
# ------------------------------------------------------
config = context.config

DATABASE_URL = CONSTANTS.SYNC_DATABASE_URL

config.set_main_option("sqlalchemy.url", DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


# ------------------------------------------------------
# Offline migrations
# ------------------------------------------------------
def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


# ------------------------------------------------------
# Online migrations (SYNC ONLY)
# ------------------------------------------------------
def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


# ------------------------------------------------------
# Entry point
# ------------------------------------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
