from contextlib import asynccontextmanager

from fastapi import FastAPI
from supabase import Client, create_client

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
    print("🎵 Musimo API Starting...")
    AppRegistry.register(app)  # ✅ register globally

    try:
        supabase = create_supabase_client()
        app.state.supabase = supabase
        print("✅ Supabase connected successfully")
    except Exception as e:
        app.state.supabase = None
        print(f"❌ Supabase connection failed: {e}")

    yield  # Hand control to FastAPI (app runs here)

    app.state.supabase = None
    print("🎵 Musimo API Shutting down...")
