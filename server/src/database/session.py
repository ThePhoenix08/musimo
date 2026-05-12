import asyncio
import logging
import time
from typing import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from src.core.settings import CONSTANTS

logger = logging.getLogger(__name__)
_engine: AsyncEngine | None = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            # CONSTANTS.ASYNC_DATABASE_URL,
            CONSTANTS.ASYNC_POOLER_DATABASE_URL,
            echo=CONSTANTS.DEBUG,
            pool_pre_ping=True,  # helps recover stale Supabase connections
            future=True,
            poolclass=None,
        )
    return _engine


_sessionmaker: async_sessionmaker[AsyncSession] | None = None


def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    global _sessionmaker

    if _sessionmaker is None:
        engine = get_engine()

        _sessionmaker = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,  # keeps attributes loaded after commit
            autoflush=False,
            autocommit=False,
        )

    return _sessionmaker


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    sessionmaker = get_sessionmaker()

    async with sessionmaker() as session:
        try:
            yield session
            await session.commit()  # optional auto-commit pattern
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def test_db_connection() -> dict:
    """
    Pings the existing SQLAlchemy async engine to verify connectivity.
    Returns True if DB is reachable, False otherwise.
    """
    start = time.perf_counter()
    engine = get_engine()
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            ok = result.scalar() == 1
            latency_ms = round((time.perf_counter() - start) * 1000, 2)
            return {"ok": ok, "latency_ms": latency_ms}
    except SQLAlchemyError as e:
        logger.error(f"❌ Database connection test failed: {e}")
        return {"ok": False, "latency_ms": None}


# Add this to your existing database.py

def run_async(coro):
    """Run an async coroutine from sync Celery task."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


async def get_db_session() -> AsyncSession:
    """Get a single async session for use in Celery tasks."""
    sessionmaker = get_sessionmaker()
    session = sessionmaker()
    return session