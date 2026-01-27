from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from src.core.settings import CONSTANTS

async_engine = create_async_engine(CONSTANTS.ASYNC_DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(bind=async_engine, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
