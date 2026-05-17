import logging

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


async def db_query(
    db: AsyncSession,
    query,
    fail_message: str = "Database operation failed.",
):
    try:
        result = await db.execute(query)
        return result
    except SQLAlchemyError as e:
        await db.rollback()
        logger.exception(f"{fail_message}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=fail_message,
        )
    except Exception as e:
        await db.rollback()
        logger.exception(f"Unexpected error during DB query: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


async def test_db_connection() -> bool:
    """
    Test connection to the async database.
    Returns True if reachable, False otherwise.
    """
    import time

    from src.database.session import get_engine

    start = time.perf_counter()
    engine = get_engine()

    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            ok = result.scalar() == 1
            latency_ms = round((time.perf_counter() - start) * 1000, 2)
            return {"ok": ok, "latency_ms": latency_ms}
    except SQLAlchemyError as exc:
        logger.error("❌ Database connection test failed: %s", exc)
        return {"ok": False, "latency_ms": None}
