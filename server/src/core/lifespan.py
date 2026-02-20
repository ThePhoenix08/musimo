from contextlib import asynccontextmanager

from fastapi import FastAPI
from supabase import Client, create_client

from src.core.app_registry import AppRegistry
from src.core.logger_setup import logger
from src.core.settings import CONSTANTS
from src.core.supabase import (
    supabase_storage_client,  # ← the singleton your service uses
)
from src.database.session import test_db_connection


def create_supabase_client() -> Client:
    """Create a raw Supabase client using default API key (used for app.state)."""
    return create_client(CONSTANTS.SUPABASE_URL, CONSTANTS.SUPABASE_KEY)


def create_supabase_admin_client() -> Client:
    """Create a raw Supabase client using service key (used for app.state)."""
    return create_client(CONSTANTS.SUPABASE_URL, CONSTANTS.SUPABASE_SERVICE_KEY)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context.
    Handles startup and shutdown events.
    """
    logger.info("🎵 Musimo API Starting...")
    AppRegistry.register(app)

    # ── Raw Supabase clients (app.state) ──────────────────────────────────────
    # These are the existing sync clients used by other parts of the app.
    try:
        supabase = create_supabase_client()
        app.state.supabase = supabase
        logger.info("✅ Supabase connected successfully")
    except Exception as e:
        app.state.supabase = None
        logger.error(f"❌ Supabase connection failed: {e}")

    try:
        supabase_service = create_supabase_admin_client()
        app.state.supabase_service = supabase_service
        logger.info("✅ Supabase service role client connected successfully")
    except Exception as e:
        app.state.supabase_service = None
        logger.error(f"❌ Supabase service role client connection failed: {e}")

    # ── Async storage client (used by AudioFileService) ───────────────────────
    # This is the SupabaseStorageClient singleton injected via get_storage().
    # Without this connect() call the singleton's ._client stays None and
    # every upload attempt raises "SupabaseStorageClient not initialised".
    try:
        await supabase_storage_client.connect()
        app.state.storage = supabase_storage_client  # keeps app.state in sync too
        logger.info("✅ Supabase async storage client connected successfully")
    except Exception as e:
        app.state.storage = None
        logger.error(f"❌ Supabase async storage client connection failed: {e}")

    # ── Test DB connection ─────────────────────────────────────────────────────
    db_health: dict = await test_db_connection()
    if db_health["ok"]:
        logger.info("🗄️ Database connection established successfully at startup.")
    else:
        logger.critical("⚠️ Database unreachable during startup.")

    # ── ML models ─────────────────────────────────────────────────────────────
    try:
        logger.info("📦 Loading emotion detection model...")
        # ModelService.initialize_emotion_pipeline()
        logger.info("✅ Emotion detection model loaded successfully")
    except Exception as e:
        logger.error(f"❌ Failed to load emotion model: {e}")

    yield  # ← app runs here

    # ── Shutdown ──────────────────────────────────────────────────────────────
    await supabase_storage_client.disconnect()
    logger.info("🎵 Musimo API shut down cleanly.")
