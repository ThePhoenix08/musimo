import os
import sys
from datetime import UTC, datetime

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from src.core.app_registry import AppRegistry
from src.core.error_setup import setup_error_beautifier
from src.core.global_error_hook import setup_global_error_hooks
from src.core.settings import CONSTANTS
from src.core.supabase_connect import lifespan
from src.middlewares.exception_handler import register_exception_handlers
from src.models.model_service import ModelService
from src.routes import debug, register_routes, ws_router
from src.schemas import ApiResponse

# PRE-STARTUP CONFIGURATION
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
sys.dont_write_bytecode = True

# APP INITIALIZATION
app = FastAPI(
    title=CONSTANTS.APP_NAME,
    description="AI-powered music emotion detection and instrument classification",
    version=CONSTANTS.APP_VERSION,
    lifespan=lifespan,
)

# ERROR HANDLING SETUP
setup_global_error_hooks()
register_exception_handlers(app)

# MIDDLEWARE SETUP
# Session middleware
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

# ROUTER REGISTRATION
register_routes(app)
app.include_router(ws_router.router)
if CONSTANTS.ENV == "dev":
    app.include_router(debug.router, prefix="/debug", tags=["Debug"])


# SYSTEM ROUTES
@app.get("/", tags=["System"])
async def root():
    """Root route showing app metadata and status."""
    data = {
        "app_name": CONSTANTS.APP_NAME,
        "version": CONSTANTS.APP_VERSION,
        "environment": CONSTANTS.ENV,
        "debug": CONSTANTS.DEBUG,
        "status": "active",
        "message": f"Welcome to {CONSTANTS.APP_NAME} 🎵",
        "timestamp": datetime.now(UTC).isoformat() + "Z",
        "endpoints": {
            "websocket_emotion": "/ws/analyze-emotion",
            "websocket_instrument": "/ws/analyze-instrument",
            "rest_docs": "/docs",
            "rest_health": "/health",
        },
    }
    return ApiResponse(success=True, data=data)


@app.get("/health", tags=["System"])
async def health_check():
    """Basic health check endpoint for uptime monitoring."""
    supabase = AppRegistry.get_state("supabase")
    db_status = "connected" if supabase else "disconnected"
    health = await ModelService.health_check()

    all_healthy = (
        health["emotion_detection"]["status"] == "healthy"
        and health["instrument_detection"]["available"]
    )
    return ApiResponse(
        success=True,
        data={
            "status": "healthy" if supabase else "degraded",
            "emotion_detection": health["emotion_detection"],
            "instrument_detection": health["instrument_detection"],
            "supabase": db_status,
            "timestamp": datetime.now(UTC).isoformat() + "Z",
            "models": health,
            "message": (
                "All models loaded" if all_healthy else "Some models unavailable"
            ),
        },
    )


# MAIN ENTRY POINT
if __name__ == "__main__":
    setup_error_beautifier(enable=True)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
