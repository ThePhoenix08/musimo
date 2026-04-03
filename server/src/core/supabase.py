"""
Async Supabase storage client — singleton pattern.

- One instance is created at module load (`supabase_storage_client`).
- `lifespan.py` calls `.connect()` / `.disconnect()` at app startup/shutdown.
- `get_storage()` is the FastAPI dependency that injects the same instance.
- Always use the singleton — never instantiate SupabaseStorageClient elsewhere.
"""

from __future__ import annotations

import logging
from typing import Optional

from supabase import AsyncClient, acreate_client

from src.core.settings import CONSTANTS

logger = logging.getLogger(__name__)


class SupabaseStorageClient:
    def __init__(self) -> None:
        self._client: Optional[AsyncClient] = None

    # ── Lifecycle ─────────────────────────────────────────────────────────────
    async def connect(self) -> None:
        """Initialise the Supabase async client using service role key (server)."""
        self._client = await acreate_client(
            CONSTANTS.SUPABASE_URL, CONSTANTS.SUPABASE_SERVICE_KEY
        )
        logger.info(
            "✅ Supabase async storage client initialised with service role key"
        )

    async def disconnect(self) -> None:
        self._client = None
        logger.info("ℹ️ Supabase async storage client released")

    # ── Internal ──────────────────────────────────────────────────────────────
    @property
    def client(self) -> AsyncClient:
        if self._client is None:
            raise RuntimeError(
                "SupabaseStorageClient not initialised — "
                "call connect() first or use via FastAPI lifespan"
            )
        return self._client

    def _storage(self):
        return self.client.storage

    # ── Public API ────────────────────────────────────────────────────────────
    async def upload_file(
        self,
        bucket: str,
        destination_path: str,
        file_bytes: bytes,
        content_type: str = "application/octet-stream",
        upsert: bool = False,
    ) -> str:
        """Upload a file to Supabase Storage using the service role key."""
        options = {"content-type": content_type, "upsert": str(upsert).lower()}
        await self._storage().from_(bucket).upload(
            path=destination_path, file=file_bytes, file_options=options
        )
        logger.debug("Uploaded %s → bucket=%s", destination_path, bucket)
        return destination_path

    async def create_signed_url(
        self, bucket: str, path: str, expires_in: int = 3600
    ) -> str:
        """Create a signed URL for a file in storage."""
        response = (
            await self._storage()
            .from_(bucket)
            .create_signed_url(path=path, expires_in=expires_in)
        )
        return response["signedURL"]

    async def delete_file(self, bucket: str, path: str) -> None:
        """
        Delete a file from Supabase Storage.

        Supabase .remove() returns [] when the path does not exist — it does NOT
        raise. We treat an empty response as FileNotFoundError so the caller can
        decide whether to swallow it or surface it.
        """
        response = await self._storage().from_(bucket).remove([path])
        logger.debug(
            "Storage delete response bucket=%s path=%s → %s", bucket, path, response
        )

        if not response:
            raise FileNotFoundError(
                f"File not found in storage (bucket={bucket}, path={path})"
            )
        logger.debug("Deleted %s from bucket=%s", path, bucket)


# ── Singleton ─────────────────────────────────────────────────────────────────
supabase_storage_client = SupabaseStorageClient()


def get_storage() -> SupabaseStorageClient:
    """FastAPI dependency — returns the singleton connected during lifespan."""
    return supabase_storage_client
