from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from src.core.settings import CONSTANTS

# Create async engine
engine = create_async_engine(
    CONSTANTS.ASYNC_DATABASE_URL,
    echo=CONSTANTS.DEBUG,
    pool_pre_ping=True,  # prevents stale Supabase connections
    future=True,
)


# Create session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# Dependency for FastAPI
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            # Ensures proper cleanup even if exception occurs
            await session.close()
