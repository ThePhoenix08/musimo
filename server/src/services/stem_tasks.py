import asyncio
import tempfile
import traceback
import logging
import uuid
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from supabase import acreate_client

from src.core.settings import CONSTANTS
from src.database.models.audio_file import AudioFile
from src.models.audio_separation.pipelines.separation import separate_audio_pipeline
from src.services.celery_app import celery_app
from src.services.stem_service import update_stem_status

logger = logging.getLogger(__name__)


def get_fresh_session_factory():
    engine = create_async_engine(
        CONSTANTS.ASYNC_POOLER_DATABASE_URL,
        poolclass=NullPool,
        echo=False,
    )
    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False,
    )
    return session_factory, engine


async def _run_separation(audio_id: str, project_id: str):
    temp_input: Path | None = None
    session_factory, engine = get_fresh_session_factory()

    # Fresh Supabase client — no singleton, no lifespan needed
    supabase_client = await acreate_client(
        CONSTANTS.SUPABASE_URL,
        CONSTANTS.SUPABASE_SERVICE_KEY,
    )

    try:
        # FIX #6: one session for the entire task — passed into the pipeline
        # so there is never a second session racing against this one.
        async with session_factory() as db:
            try:
                # Mark as processing
                await update_stem_status(db, audio_id, "processing")

                # Fetch audio record
                result = await db.execute(
                    select(AudioFile).where(AudioFile.id == uuid.UUID(audio_id))
                )
                audio = result.scalar_one_or_none()
                if not audio:
                    raise ValueError(f"AudioFile {audio_id} not found")

                # Download source file from Supabase storage
                file_bytes = await supabase_client.storage.from_(
                    CONSTANTS.SUPABASE_AUDIO_SOURCE_BUCKET
                ).download(audio.file_path)

                if not file_bytes:
                    raise ValueError("Downloaded file is empty")

                # Write to temp file for demucs
                with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
                    temp_input = Path(tmp.name)
                    tmp.write(file_bytes)

                # FIX #6: pass db into pipeline — pipeline no longer creates its own engine
                stems = await separate_audio_pipeline(
                    temp_input,
                    audio_id,
                    project_id,
                    supabase_client,
                    db,  # ← single shared session
                )

                if not stems:
                    raise ValueError("No stems generated")

                # stems = list of dicts with source_type + file_url
                stems_map = {s["source_type"]: s["file_url"] for s in stems}
                await update_stem_status(db, audio_id, "done", stems=stems_map)

            except Exception as e:
                logger.error(f"Stem separation failed: {e}\n{traceback.format_exc()}")
                await update_stem_status(db, audio_id, "failed", error=str(e))
                raise

            finally:
                if temp_input and temp_input.exists():
                    temp_input.unlink(missing_ok=True)

    finally:
        # FIX #9: guard shutdown_asyncgens so a broken loop doesn't mask the real error
        try:
            await engine.dispose()
        except Exception:
            pass


@celery_app.task(bind=True, max_retries=2)
def separate_stems_task(self, audio_id: str, project_id: str):
    logger.info(f"Celery stem task started — audio_id={audio_id} project_id={project_id}")
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(_run_separation(audio_id, project_id))
    except Exception as e:
        logger.error(traceback.format_exc())
        raise self.retry(exc=e, countdown=10)
    finally:
        # FIX #9: safely shut down async generators before closing the loop
        try:
            loop.run_until_complete(loop.shutdown_asyncgens())
        except Exception:
            pass
        loop.close()
        asyncio.set_event_loop(None)