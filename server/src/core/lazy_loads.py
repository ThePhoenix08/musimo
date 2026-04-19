import asyncio
import logging

from supabase import Client, create_client

from src.core.app_registry import AppRegistry
from src.core.settings import CONSTANTS
from src.core.supabase import (
    supabase_storage_client,
)
from src.database.session import get_engine, test_db_connection
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


_engine_lock = asyncio.Lock()


async def get_db_engine():
    app = AppRegistry.get()

    if app.state.db_engine is None:
        async with _engine_lock:
            if app.state.db_engine is None:
                logger.info("🗄️ Initializing DB engine...")
                app.state.db_engine = await get_engine()
                logger.info("✅ DB engine ready")

    return app.state.db_engine


async def _warmup_db():
    try:
        await test_db_connection()
        logger.info("✅ DB warmup complete")
    except Exception as e:
        logger.warning(f"DB warmup failed: {e}")


async def _warmup_emotion_model():
    try:
        await get_emotion_model()
        logger.info("✅ Emotion model warmed")
    except Exception as e:
        logger.warning(f"Model warmup failed: {e}")


async def _warmup_storage():
    try:
        await get_storage()
        logger.info("✅ Storage warmed")
    except Exception as e:
        logger.warning(f"Storage warmup failed: {e}")


async def _warmup_supabase():
    try:
        get_supabase()
        logger.info("✅ Supabase warmed")
    except Exception as e:
        logger.warning(f"Supabase warmup failed: {e}")


_bg_warmed = False
_warmup_lock = asyncio.Lock()

WARMUP_TASKS = {
    "db": _warmup_db,
    "emotion_model": _warmup_emotion_model,
    "storage": _warmup_storage,
    "supabase": _warmup_supabase,
}

async def background_warmup(config: dict[str, bool] | None = None):
    global _bg_warmed

    if _bg_warmed:
        return

    async with _warmup_lock:
        if _bg_warmed:
            return

        config = config or {}

        logger.info("🔥 Starting background warmup...")

        tasks = []

        for name, task in WARMUP_TASKS.items():
            if config.get(name, False):
                logger.info(f"🔥 Warmup enabled: {name}")
                tasks.append(task())

        if not tasks:
            logger.info("⚡ No warmup tasks enabled")
            return

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, Exception):
                logger.warning(f"Warmup task failed: {result}")

        logger.info("✅ Background warmup complete")
        _bg_warmed = True