import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"  # Disable oneDNN optimizations for TensorFlow

import sys
from datetime import datetime, UTC

# Compact error traces
sys.dont_write_bytecode = True  # keeps logs clean

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from src.core.app_registry import AppRegistry
from src.core.db_connect import lifespan
from src.core.error_setup import setup_error_beautifier
from src.core.global_error_hook import setup_global_error_hooks
from src.core.settings import settings
from src.middlewares.error_handler import register_exception_handlers
from src.routes import auth, predict, transaction, user, debug

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered music emotion detection and instrument classification",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)
setup_global_error_hooks()
register_exception_handlers(app)

# Session middleware
if not settings.SESSION_SECRET_KEY:
    raise ValueError("SESSION_SECRET_KEY environment variable is not set")

app.add_middleware(SessionMiddleware, secret_key=settings.SESSION_SECRET_KEY)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(user.router, prefix="/user", tags=["User"])
app.include_router(transaction.router, prefix="/transaction", tags=["Transaction"])
app.include_router(predict.router, prefix="/model", tags=["Model"])
if settings.ENV == "dev":
    app.include_router(debug.router, prefix="/debug", tags=["Debug"])

@app.get("/", tags=["System"])
async def root():
    """Root route showing app metadata and status."""
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENV,
        "debug": settings.DEBUG,
        "status": "active",
        "message": f"Welcome to {settings.APP_NAME} 🎵",
        "timestamp": datetime.now(UTC).isoformat() + "Z",
    }


@app.get("/health", tags=["System"])
async def health_check():
    """Basic health check endpoint for uptime monitoring."""
    supabase = AppRegistry.get_state("supabase")
    db_status = "connected" if supabase else "disconnected"
    return {
        "status": "healthy" if supabase else "degraded",
        "supabase": db_status,
        "timestamp": datetime.now(UTC).isoformat() + "Z",
    }


if __name__ == "__main__":
    setup_error_beautifier(enable=True)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
