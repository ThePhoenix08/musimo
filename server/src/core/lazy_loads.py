import asyncio
import logging

from supabase import Client, create_client

from src.core.app_registry import AppRegistry
from src.core.settings import CONSTANTS
from src.core.supabase import (
    supabase_storage_client,
)
from src.database.session import test_db_connection
from src.models.model_service import ModelService

logger = logging.getLogger(__name__)


def create_supabase_client() -> Client:
    return create_client(CONSTANTS.SUPABASE_URL, CONSTANTS.SUPABASE_KEY)


def get_supabase():
    app = AppRegistry.get()

    if app.state.supabase is None:
        app.state.supabase = create_supabase_client()

    return app.state.supabase


def create_supabase_admin_client() -> Client:
    return create_client(
        CONSTANTS.SUPABASE_URL,
        CONSTANTS.SUPABASE_SERVICE_KEY,
    )


def get_supabase_admin():
    app = AppRegistry.get()

    if app.state.supabase_service is None:
        app.state.supabase_service = create_supabase_admin_client()

    return app.state.supabase_service


_storage_lock = asyncio.Lock()


async def get_storage():
    app = AppRegistry.get()

    if app.state.storage is None:
        async with _storage_lock:
            if app.state.storage is None:
                await supabase_storage_client.connect()
                app.state.storage = supabase_storage_client

    return app.state.storage


_model_lock = asyncio.Lock()


async def get_emotion_model():
    app = AppRegistry.get()

    if app.state.emotion_model is None:
        async with _model_lock:
            if app.state.emotion_model is None:
                logger.info("📦 Loading emotion detection model...")
                app.state.emotion_model = ModelService.initialize_emotion_pipeline()
                logger.info("✅ Emotion model loaded")

    return app.state.emotion_model


_db_warmed = False


async def background_warmup():
    global _db_warmed

    if _db_warmed:
        return

    try:
        await test_db_connection()
        logger.info("DB warmup complete")
        _db_warmed = True
    except Exception:
        logger.warning("DB warmup failed")
