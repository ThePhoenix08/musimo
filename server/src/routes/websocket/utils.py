import logging
from tempfile import NamedTemporaryFile

from fastapi import WebSocket
from fastapi.websockets import WebSocketState

logger = logging.getLogger(__name__)

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

def create_progress_callback(session_id: str):
    """Create a callback function for progress updates"""

    async def callback(update: dict):
        await manager.send_json(session_id, update)

    return callback

async def write_temp_audio_file(file_bytes: bytes, suffix: str = ".wav") -> str:
    temp = NamedTemporaryFile(delete=False, suffix=suffix)
    temp.close()

    with open(temp.name, "wb") as f:
        f.write(file_bytes)

    return temp.name