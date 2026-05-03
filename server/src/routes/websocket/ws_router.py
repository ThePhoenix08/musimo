import logging
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.websockets import WebSocketState

from src.core.lazy_loads import get_storage
from src.database.session import get_sessionmaker
from src.models.progress_tracker import ProgressTracker
from src.services.dependencies import get_current_ws_user
from src.services.emotion_workflow_service import (
    EmotionWorkflowService,
)

logger = logging.getLogger(__name__)
SessionLocal = get_sessionmaker()

router = APIRouter(prefix="/api/ws", tags=["WebSocket"])


EMOTION_PIPELINE_STEPS = [
    {"id": "validate_project", "name": "Validating Project"},
    {"id": "fetch_audio", "name": "Fetching Audio File"},
    {"id": "load_audio", "name": "Loading Audio"},
    {"id": "preprocess", "name": "Preprocessing Audio"},
    {"id": "extract_embeddings", "name": "Extracting Embeddings"},
    {"id": "predict", "name": "Running Emotion Model"},
    {"id": "postprocess", "name": "Formatting Results"},
    {"id": "store_results", "name": "Saving Analysis"},
]


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, sid: str, ws: WebSocket):
        await ws.accept()
        self.active_connections[sid] = ws

    def disconnect(self, sid: str):
        self.active_connections.pop(sid, None)

    async def send_json(self, sid: str, payload: dict):
        ws = self.active_connections.get(sid)

        if not ws:
            return

        if ws.client_state != WebSocketState.CONNECTED:
            return

        await ws.send_json(payload)


manager = ConnectionManager()


def create_callback(session_id: str):
    async def callback(update: dict):
        await manager.send_json(session_id, update)

    return callback


@router.websocket("/analyze-emotion/{project_id}")
async def ws_analyze_emotion(
    websocket: WebSocket, 
    project_id: str,
):
    session_id = str(uuid.uuid4())

    await manager.connect(session_id, websocket)

    try:
        async with SessionLocal() as session:
            user_id = await get_current_ws_user(websocket, session)

            await websocket.send_json(
                {
                    "type": "connected",
                    "message": "Authenticated successfully",
                    "user_id": str(user_id),
                    "project_id": project_id,
                }
            )

        await websocket.send_json(
            {
                "type": "connected",
                "session_id": session_id,
            }
        )

        tracker = ProgressTracker(
            steps=EMOTION_PIPELINE_STEPS,
            callback=create_callback(session_id),
            session_id=session_id,
        )

        async with SessionLocal() as session:
            storage = await get_storage()

            workflow = EmotionWorkflowService(
                session=session,
                storage=storage,
            )

            result = await workflow.run(
                project_id=project_id,
                user_id=user_id,
                tracker=tracker,
            )

        await tracker.complete_pipeline(result)

        await websocket.send_json(
            {
                "type": "analysis_complete",
                "session_id": session_id,
                **result,
            }
        )

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")

    except Exception as e:
        logger.exception("Emotion WS failed")

        try:
            await websocket.send_json(
                {
                    "type": "error",
                    "session_id": session_id,
                    "error": str(e),
                }
            )
        except Exception:
            pass

    finally:
        manager.disconnect(session_id)