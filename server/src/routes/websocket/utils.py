import logging
from tempfile import NamedTemporaryFile

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        old = self.active_connections.get(session_id)

        if old:
            try:
                await old.close()
            except Exception:
                pass

        await websocket.accept()
        self.active_connections[session_id] = websocket

    async def disconnect(self, session_id: str):
        websocket = self.active_connections.pop(session_id, None)

        if websocket:
            try:
                await websocket.close()
            except Exception:
                pass

    async def send_json(self, session_id: str, message: dict):
        websocket = self.active_connections.get(session_id)

        if not websocket:
            return

        try:
            await websocket.send_json(message)
        except Exception:
            logger.exception(f"Error sending to {session_id}")
            await self.disconnect(session_id)


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
