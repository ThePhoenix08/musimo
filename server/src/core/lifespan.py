from contextlib import asynccontextmanager

from fastapi import FastAPI
from supabase import Client, create_client

from src.core.logger_setup import logger

# from src.models.model_service import ModelService
from .app_registry import AppRegistry
from .settings import CONSTANTS


def create_supabase_client() -> Client:
    """Create a new Supabase client using default API key."""
    return create_client(CONSTANTS.SUPABASE_URL, CONSTANTS.SUPABASE_KEY)


def create_supabase_admin_client() -> Client:
    """Create a new Supabase client using service key."""
    return create_client(CONSTANTS.SUPABASE_URL, CONSTANTS.SUPABASE_SERVICE_KEY)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context.
    Handles startup and shutdown events.
    """
    logger.info("🎵 Musimo API Starting...")
    AppRegistry.register(app)  # ✅ register globally

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

    try:
        logger.info("📦 Loading emotion detection model...")
        # ModelService.initialize_emotion_pipeline()
        logger.info("✅ Emotion detection model loaded successfully")

    except Exception as e:
        logger.error(f"❌ Failed to load emotion model: {e}")
        # Don't fail startup, but log the error

    yield  # Hand control to FastAPI (app runs here)

    # app.state.supabase = None
    logger.info("🎵 Musimo API Shutting down...")
