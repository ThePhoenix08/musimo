from __future__ import annotations

import threading
from typing import Any, Optional

from fastapi import FastAPI


class AppRegistry:
    """
    Thread-safe singleton registry for FastAPI app instance.
    Allows global access to app.state from anywhere in the codebase.
    """

    _app: Optional[FastAPI] = None
    _lock = threading.Lock()

    @classmethod
    def register(cls, app: FastAPI):
        with cls._lock:
            if cls._app is not None:
                raise RuntimeError("App already registered")
            cls._app = app

    @classmethod
    def get(cls) -> FastAPI:
        with cls._lock:
            if cls._app is None:
                raise RuntimeError(
                    "⚠️ App not registered yet. "
                    "Call `AppRegistry.register(app)` inside lifespan before use."
                )
            return cls._app

    @classmethod
    def get_state(cls, key: str, default: Any = None) -> Any:
        """Safely retrieve a key from app.state (returns default if not found)."""
        app = cls.get_app()
        return getattr(app.state, key, default)

    @classmethod
    def set_state(cls, key: str, value: Any):
        """Set a key-value pair into app.state dynamically."""
        app = cls.get_app()
        setattr(app.state, key, value)
