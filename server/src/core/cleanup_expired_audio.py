import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from sqlalchemy import select

from src.database.session import get_fresh_session_factory
from src.database.models.audio_file import AudioFile
from src.core.supabase import SupabaseStorageClient
from src.core.settings import CONSTANTS

logger = logging.getLogger(__name__)

BUCKETS = [
    CONSTANTS.SUPABASE_AUDIO_SOURCE_BUCKET,
    CONSTANTS.SUPABASE_AUDIO_STEM_BUCKET,
]

async def _cleanup():
    session_factory, engine = get_fresh_session_factory()
    storage = SupabaseStorageClient()
    await storage.connect()

    try:
        async with session_factory() as db:
            result = await db.execute(
                select(AudioFile).where(
                    AudioFile.scheduled_deletion_at <= datetime.now(timezone.utc)
                )
            )
            expired_files = result.scalars().all()

            for audio in expired_files:
                for bucket in BUCKETS:
                    try:
                        await storage.delete_file(bucket, audio.file_path)
                    except FileNotFoundError:
                        pass
                    except Exception as e:
                        logger.warning(f"Failed deleting {audio.file_path} from {bucket}: {e}")
    finally:
        await storage.disconnect()
        await engine.dispose()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async def run_periodically():
        while True:
            try:
                await _cleanup()
            except Exception as e:
                logger.error(f"Cleanup cycle failed: {e}")
            await asyncio.sleep(24 * 60 * 60)

    task = asyncio.create_task(run_periodically())
    yield
    task.cancel()

app = FastAPI(lifespan=lifespan)