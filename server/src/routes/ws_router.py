"""
WebSocket Audio Analysis Router
Handles real-time emotion and instrument analysis with progress tracking
"""

import json
import logging
import os
import uuid
from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, WebSocketException
from fastapi.websockets import WebSocketState

from ..models.model_service import ModelService
from ..models.progress_tracker import ProgressTracker

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ws", tags=["WebSocket"])

EMOTION_PIPELINE_STEPS = [
    {"id": "load_audio", "name": "Loading Audio File"},
    {"id": "preprocess", "name": "Preprocessing Audio"},
    {"id": "extract_embeddings", "name": "Extracting Audio Embeddings"},
    {"id": "predict", "name": "Running Emotion Model"},
    {"id": "postprocess", "name": "Formatting Results"},
]


class ConnectionManager:
    """Manages active WebSocket connections"""

    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        logger.info(f"WebSocket connected: {session_id}")

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            logger.info(f"WebSocket disconnected: {session_id}")

    async def send_json(self, session_id: str, message: dict):
        """Send JSON message to specific connection"""
        if session_id in self.active_connections:
            websocket = self.active_connections[session_id]
            if websocket.client_state == WebSocketState.CONNECTED:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to {session_id}: {e}")
                    self.disconnect(session_id)


manager = ConnectionManager()


# =========================== HELPER FUNCTIONS ===========================


def create_progress_callback(session_id: str):
    """Create a callback function for progress updates"""

    async def callback(update: dict):
        await manager.send_json(session_id, update)

    return callback


async def save_uploaded_file(file_data: bytes, filename: str) -> str:
    """Save uploaded file data to temporary file"""
    file_ext = Path(filename).suffix or ".wav"
    temp_file = NamedTemporaryFile(delete=False, suffix=file_ext)
    temp_file.close()

    with open(temp_file.name, "wb") as f:
        f.write(file_data)

    return temp_file.name


# =========================== EMOTION ANALYSIS WEBSOCKET ===========================


@router.websocket("/analyze-emotion")
async def ws_analyze_emotion(websocket: WebSocket):
    """
    WebSocket endpoint for real-time emotion analysis with progress tracking

    Client sends:
    {
        "action": "analyze",
        "file_data": "base64_encoded_audio",  // or send as binary
        "filename": "audio.wav",
        "prediction_type": "both"  // optional: "static", "dynamic", "both"
    }

    Server sends progress updates:
    {
        "type": "step_started" | "progress_update" | "step_completed" | "pipeline_completed" | "error",
        "session_id": "...",
        "overall_progress": 45.5,
        "step": {...},
        "all_steps": [...]
    }
    """
    session_id = str(uuid.uuid4())
    await manager.connect(session_id, websocket)
    temp_file_path = None

    try:
        # Send connection confirmation
        await websocket.send_json(
            {
                "type": "connected",
                "session_id": session_id,
                "message": "WebSocket connection established",
            }
        )

        while True:
            # Receive message from client
            data = await websocket.receive()

            # Handle binary data (raw audio file)
            if "bytes" in data:
                file_data = data["bytes"]
                filename = f"audio_{session_id}.wav"
                prediction_type = "both"

            # Handle JSON message
            elif "text" in data:
                message = json.loads(data["text"])
                action = message.get("action")

                if action == "analyze":
                    # Extract file data (base64 or binary)
                    import base64

                    file_data_b64 = message.get("file_data")
                    if file_data_b64:
                        file_data = base64.b64decode(file_data_b64)
                    else:
                        await websocket.send_json(
                            {"type": "error", "error": "No file_data provided"}
                        )
                        continue

                    filename = message.get("filename", f"audio_{session_id}.wav")
                    prediction_type = message.get("prediction_type", "both")

                elif action == "cancel":
                    await websocket.send_json(
                        {"type": "cancelled", "message": "Analysis cancelled by user"}
                    )
                    break

                else:
                    await websocket.send_json(
                        {"type": "error", "error": f"Unknown action: {action}"}
                    )
                    continue

            else:
                continue

            # Save uploaded file
            temp_file_path = await save_uploaded_file(file_data, filename)

            # Create progress tracker
            progress_callback = create_progress_callback(session_id)
            tracker = ProgressTracker(
                steps=EMOTION_PIPELINE_STEPS,
                callback=progress_callback,
                session_id=session_id,
            )

            # Send analysis started message
            await websocket.send_json(
                {
                    "type": "analysis_started",
                    "session_id": session_id,
                    "filename": filename,
                    "prediction_type": prediction_type,
                }
            )

            # Run emotion analysis with progress tracking
            try:
                result = await ModelService.predict_emotion_with_progress(
                    audio_path=temp_file_path,
                    prediction_type=prediction_type,
                    tracker=tracker,
                )

                # Send completion with results
                await tracker.complete_pipeline(result)

                await websocket.send_json(
                    {
                        "type": "analysis_complete",
                        "session_id": session_id,
                        "result": result,
                    }
                )

            except Exception as e:
                logger.error(f"Emotion analysis error: {e}", exc_info=True)
                await tracker.fail_pipeline(str(e))

                await websocket.send_json(
                    {
                        "type": "error",
                        "session_id": session_id,
                        "error": str(e),
                        "error_type": type(e).__name__,
                    }
                )

            finally:
                # Cleanup temp file
                if temp_file_path and os.path.exists(temp_file_path):
                    try:
                        os.unlink(temp_file_path)
                    except Exception as e:
                        logger.warning(f"Failed to delete temp file: {e}")

    except WebSocketDisconnect:
        logger.info(f"Client disconnected: {session_id}")

    except WebSocketException as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
        try:
            if websocket.client_state == WebSocketState.CONNECTED:
                await websocket.send_json({"type": "error", "error": str(e)})
        except Exception as e:
            logger.warning(f"Failed to send error message: {e}")

    finally:
        manager.disconnect(session_id)
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                logger.warning(f"Failed to delete temp file: {e}")
