from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from dotenv import load_dotenv
from ..core.settings import CONSTANTS

DATABASE_URL: str = f"postgresql+asyncpg://{CONSTANTS.DATABASE_USER}:{CONSTANTS.DATABASE_PASSWORD}@{CONSTANTS.DATABASE_HOST}:{CONSTANTS.DATABASE_PORT}/{CONSTANTS.DATABASE_NAME}"
async_engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(bind=async_engine, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session