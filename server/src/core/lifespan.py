import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.core.app_registry import AppRegistry
from src.core.lazy_loads import background_warmup
from src.core.supabase import supabase_storage_client
from src.database.session import get_engine

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context.
    Handles startup and shutdown events.
    """

    logger.info("🎵 Musimo API Starting...")

    # Register app
    AppRegistry.register(app)

    # ── Lazy placeholders (NO heavy initialization here) ──────────────
    app.state.supabase = None
    app.state.supabase_service = None
    app.state.storage = None
    app.state.emotion_model = None
    app.state.db_engine = None

    asyncio.create_task(background_warmup())

    logger.info("⚡ Lazy initialization enabled (fast startup)")

    yield  # ← app runs here

    # ── Shutdown ─────────────────────────────────────────────────────
    try:
        if supabase_storage_client.is_connected:
            await supabase_storage_client.disconnect()
    except Exception:
        pass

    try:
        engine = get_engine()
        await engine.dispose()
    except Exception:
        pass

    logger.info("🎵 Musimo API shut down cleanly.")
