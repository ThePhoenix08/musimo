from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from src.core.logger_setup import logger
from src.core.settings import CONSTANTS


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
    engine = create_async_engine(CONSTANTS.ASYNC_DATABASE_URL, echo=False)
    try:
        async with engine.begin() as conn:
            result = await conn.execute("SELECT 1")
            row = result.scalar()
            if row == 1:
                logger.info("✅ Database connection verified successfully")
                return True
            else:
                logger.warning("⚠️ Database responded but returned unexpected result")
                return False
    except SQLAlchemyError as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False
    finally:
        await engine.dispose()
