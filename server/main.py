# ruff: noqa: I001, E402


import asyncio
import sys

# MUST be set before anything else touches the event loop
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())


import asyncio
import warnings


warnings.filterwarnings("ignore", category=FutureWarning)

import os
from typing import Literal

ENV: Literal["dev", "prod"] = os.getenv("ENV", "dev").lower()
IS_DEV = ENV == "dev"

from src.core.pretty_errors import setup_error_beautifier

setup_error_beautifier(IS_DEV=IS_DEV, enable=True)

from src.core.logger_setup import logger

logger.info("Logger initialized")

from src.core.error_hooks import setup_global_error_hooks

setup_global_error_hooks()

from datetime import UTC, datetime

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from src.core.app_registry import AppRegistry
from src.core.settings import CONSTANTS
from src.core.lifespan import lifespan
from src.middlewares.exception_handler import register_exception_handlers
from src.models.model_service import ModelService
from src.routes import debug, register_routes, ws_router
from src.schemas.api.response import ApiResponse


os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
sys.dont_write_bytecode = True


app = FastAPI(
    title=CONSTANTS.APP_NAME,
    description="AI-powered music emotion detection and instrument classification",
    version=CONSTANTS.APP_VERSION,
    lifespan=lifespan,
)


register_exception_handlers(app)


if not CONSTANTS.SESSION_SECRET_KEY:
    raise ValueError("SESSION_SECRET_KEY environment variable is not set")

app.add_middleware(SessionMiddleware, secret_key=CONSTANTS.SESSION_SECRET_KEY)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CONSTANTS.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


register_routes(app)
app.include_router(ws_router.router)
if CONSTANTS.ENV == "dev":
    app.include_router(debug.router, prefix="/debug", tags=["Debug"])


@app.get("/", tags=["System"])
async def root():
    data = {
        "app_name": CONSTANTS.APP_NAME,
        "version": CONSTANTS.APP_VERSION,
        "environment": CONSTANTS.ENV,
        "debug": CONSTANTS.DEBUG,
        "status": "active",
        "timestamp": datetime.now(UTC).isoformat() + "Z",
        "endpoints": {
            "websocket_emotion": "/ws/analyze-emotion",
            "websocket_instrument": "/ws/analyze-instrument",
            "rest_docs": "/docs",
            "rest_health": "/health",
        },
    }
    return ApiResponse(
        message=f"Welcome to {CONSTANTS.APP_NAME} 🎵",
        data=data,
    )


@app.get("/health", tags=["System"])
async def health_check():
    supabase = AppRegistry.get_state("supabase")
    db_status = "connected" if supabase else "disconnected"
    health = await ModelService.health_check()

    all_healthy = (
        health["emotion_detection"]["status"] == "healthy"
        and health["instrument_detection"]["available"]
    )
    return ApiResponse(
        message=("All models loaded" if all_healthy else "Some models unavailable"),
        data={
            "status": "healthy" if supabase else "degraded",
            "emotion_detection": health["emotion_detection"],
            "instrument_detection": health["instrument_detection"],
            "supabase": db_status,
            "timestamp": datetime.now(UTC).isoformat() + "Z",
            "models": health,
        },
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_config=None)
