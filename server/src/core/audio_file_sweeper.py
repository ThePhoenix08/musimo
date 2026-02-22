
from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.settings import CONSTANTS
from src.core.supabase import SupabaseStorageClient
from src.repo.audioFileRepo import AudioFileRepository

logger = logging.getLogger(__name__)


async def sweep_expired_audio_files(
    session: AsyncSession,
    storage: SupabaseStorageClient,
) -> int:
    """
    Finds all AudioFile rows past their scheduled_deletion_at, deletes the
    object from Supabase Storage, then removes the DB record.
    Returns the number of files successfully purged.
    """
    repo = AudioFileRepository(session)
    now = datetime.now(timezone.utc)
    due = await repo.get_due_for_deletion(now)

    purged = 0
    for audio_file in due:
        try:
            await storage.delete_file(
                bucket=CONSTANTS.SUPABASE_AUDIO_SOURCE_BUCKET,
                path=audio_file.file_path,
            )
        except FileNotFoundError:
            logger.warning(
                "Sweeper: file already gone from storage, removing DB record anyway. path=%s",
                audio_file.file_path,
            )
        except Exception:
            logger.exception(
                "Sweeper: storage deletion failed, skipping for now. path=%s",
                audio_file.file_path,
            )
            continue  # leave it for the next sweep cycle

        await repo.hard_delete(audio_file)
        purged += 1
        logger.info("Sweeper: purged audio_file id=%s path=%s", audio_file.id, audio_file.file_path)

    if purged:
        await session.commit()

    return purged