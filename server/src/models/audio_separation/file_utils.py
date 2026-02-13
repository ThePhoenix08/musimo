import os
import hashlib
import json
import logging
import subprocess
from pathlib import Path
from typing import Dict

from src.core.settings import Settings
from src.core.app_registry import AppRegistry

logger = logging.getLogger(__name__)

INPUT_FOLDER = Path("input")
OUTPUT_FOLDER = Path("output")
TEMP_FOLDER = Path("temp")
INPUT_FOLDER.mkdir(exist_ok=True)
OUTPUT_FOLDER.mkdir(exist_ok=True)
TEMP_FOLDER.mkdir(exist_ok=True)

# Instantiate settings once at module level so all functions share the same
# instance. The original code called Settings.SUPABASE_BUCKET as a class
# attribute, which raises AttributeError because pydantic-settings fields only
# exist on instances, not on the class itself.
_settings = Settings()


def calculate_checksum(file_path: Path) -> str:
    """Calculate SHA256 checksum of a file"""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def get_audio_duration(audio_path: Path) -> float:
    """Get audio duration in seconds using ffprobe"""
    try:
        cmd = [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(audio_path),
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return float(result.stdout.strip())
    except Exception as e:
        logger.warning(f"Could not get audio duration: {e}")
        return 0.0


def get_audio_metadata(audio_path: Path) -> Dict:
    """Get audio metadata using ffprobe"""
    try:
        cmd = [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration,format_name:stream=sample_rate,channels",
            "-of", "json",
            str(audio_path),
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)

        duration = float(data.get("format", {}).get("duration", 0))
        sample_rate = int(data.get("streams", [{}])[0].get("sample_rate", 44100))
        channels = int(data.get("streams", [{}])[0].get("channels", 2))
        format_name = data.get("format", {}).get("format_name", "unknown").split(",")[0]

        return {
            "duration": duration,
            "sample_rate": sample_rate,
            "channels": channels,
            "format": format_name,
        }
    except Exception as e:
        logger.error(f"Error getting audio metadata: {e}")
        return {
            "duration": 0.0,
            "sample_rate": 44100,
            "channels": 2,
            "format": "unknown",
        }


async def upload_to_supabase_bucket(file_path: Path, storage_path: str) -> str:
    """Upload file to Supabase storage bucket and return public URL"""
    try:
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        # Use the service role client so RLS does not block background uploads.
        # The anon client (stored as "supabase") operates under the user's JWT,
        # which is not present in background pipeline tasks → 403 RLS violation.
        # The service role client bypasses RLS and is safe for trusted server-side
        # operations. It is registered at startup alongside the anon client.
        supabase = AppRegistry.get_state("supabase_service")
        if not supabase:
            raise RuntimeError(
                "Supabase service role client is not initialized. "
                "Ensure AppRegistry.set_state('supabase_service', ...) is called in lifespan."
            )

        with open(file_path, "rb") as f:
            response = supabase.storage.from_(_settings.SUPABASE_BUCKET).upload(
                path=storage_path,
                file=f,
                file_options={
                    "content-type": "audio/wav",
                    "upsert": "true",   # must be a string — httpx rejects bool header values
                },
            )

        if hasattr(response, "error") and response.error:
            raise Exception(f"Supabase upload error: {response.error}")

        public_url_response = supabase.storage.from_(
            _settings.SUPABASE_BUCKET
        ).get_public_url(storage_path)

        if isinstance(public_url_response, dict):
            public_url = public_url_response.get("publicUrl")
        else:
            public_url = public_url_response

        if not public_url:
            raise Exception("Failed to retrieve public URL from Supabase")

        logger.info(f"Successfully uploaded {file_path.name} → {storage_path}")
        return public_url

    except Exception as e:
        logger.error(f"Error uploading to Supabase: {e}")
        raise