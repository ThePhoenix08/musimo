from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger_setup import logger


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
