from typing import Dict
from fastapi import WebSocket

jobs_storage: Dict[str, dict] = {}
websocket_connections: Dict[str, WebSocket] = {}
