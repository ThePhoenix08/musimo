import time

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.core.logger_setup import logger
from src.core.settings import CONSTANTS

# ✅ Create async engine
engine = create_async_engine(
    CONSTANTS.ASYNC_DATABASE_URL,
    echo=CONSTANTS.DEBUG,
    pool_pre_ping=True,  # helps recover stale Supabase connections
    future=True,
)


# ✅ Create async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # keeps attributes loaded after commit
    autoflush=False,
    autocommit=False,
)


async def get_db():
    async with AsyncSessionLocal() as session:
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
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            ok = result.scalar() == 1
            latency_ms = round((time.perf_counter() - start) * 1000, 2)
            return {"ok": ok, "latency_ms": latency_ms}
    except SQLAlchemyError as e:
        logger.error(f"❌ Database connection test failed: {e}")
        return {"ok": False, "latency_ms": None}
