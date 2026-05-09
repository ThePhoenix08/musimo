from datetime import datetime, timezone
from sqlalchemy import select

from server.src.services import celery_app
from src.database.session import get_fresh_session_factory
from src.database.models.audio_file import AudioFile
from src.core.supabase import SupabaseStorageClient
from src.core.settings import CONSTANTS


@celery_app.task
def cleanup_expired_audio():
    import asyncio
    asyncio.run(_cleanup())


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
                try:
                    await storage.delete_file(
                        CONSTANTS.SUPABASE_AUDIO_SOURCE_BUCKET,
                        audio.file_path
                    )

                    await db.delete(audio)

                except Exception as e:
                    print(f"Failed deleting {audio.file_path}: {e}")

            await db.commit()

    finally:
        await engine.dispose()