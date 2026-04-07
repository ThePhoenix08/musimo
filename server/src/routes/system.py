import asyncio
from datetime import UTC, datetime

from fastapi import APIRouter

from src.core.app_registry import AppRegistry
from src.core.settings import CONSTANTS
from src.database.session import test_db_connection
from src.models.model_service import ModelService
from src.schemas.api.response import ApiResponse

router = APIRouter()

@router.get("/api/")
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


@router.get("/api/health")
async def health_check():
    supabase = AppRegistry.get_state("supabase")
    db_health, health = await asyncio.gather(
        test_db_connection(),
        ModelService.health_check(),
    )

    all_healthy: bool = (
        db_health["ok"]
        and health["emotion_detection"]["status"] == "healthy"
        and health["instrument_detection"]["available"]
    )
    return ApiResponse(
        message=("All models loaded" if all_healthy else "Some models unavailable"),
        data={
            "status": "healthy" if supabase else "degraded",
            "emotion_detection": health["emotion_detection"],
            "instrument_detection": health["instrument_detection"],
            "database": "connected" if db_health["ok"] else "disconnected",
            "db_latency_ms": db_health["latency_ms"],
            "supabase": "connected" if supabase else "disconnected",
            "timestamp": datetime.now(UTC).isoformat() + "Z",
            "models": health,
        },
    )
