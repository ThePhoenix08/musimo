# src/models/audio_separation/file_utils.py
import hashlib
import json
import logging
import subprocess
from pathlib import Path
from typing import Dict

from src.core.lazy_loads import get_storage
from src.core.settings import Settings

logger = logging.getLogger(__name__)

INPUT_FOLDER = Path("input")
OUTPUT_FOLDER = Path("output")
TEMP_FOLDER = Path("temp")

INPUT_FOLDER.mkdir(exist_ok=True)
OUTPUT_FOLDER.mkdir(exist_ok=True)
TEMP_FOLDER.mkdir(exist_ok=True)

_settings = Settings()


# CHECKSUM
def calculate_checksum(file_path: Path) -> str:
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256_hash.update(chunk)
    return sha256_hash.hexdigest()


#  DURATION
def get_audio_duration(audio_path: Path) -> float:
    try:
        cmd = [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(audio_path),
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return float(result.stdout.strip())
    except Exception as e:
        logger.warning(f"Could not get duration: {e}")
        return 0.0


#  METADATA
def get_audio_metadata(audio_path: Path) -> Dict:
    try:
        file_size_bytes = audio_path.stat().st_size

        cmd = [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration,format_name:stream=sample_rate,channels",
            "-of",
            "json",
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
            "file_size": file_size_bytes,
        }

    except Exception as e:
        logger.error(f"Error getting audio metadata: {e}")
        return {
            "duration": 0.0,
            "sample_rate": 44100,
            "channels": 2,
            "format": "unknown",
            "file_size": 0,
        }


#  UPLOAD (FIXED)
async def upload_to_supabase_bucket(
    file_path: Path,
    storage_path: str,
    bucket_name: str = None,
) -> str:
    try:
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        storage = await get_storage()

        if not storage:
            raise RuntimeError("Supabase client not initialized")

        bucket = bucket_name or _settings.SUPABASE_BUCKET

        with open(file_path, "rb") as f:
            file_bytes = f.read()

        #  use wrapper
        await storage.upload_file(
            bucket=bucket,
            destination_path=storage_path,
            file_bytes=file_bytes,
            content_type="audio/wav",
        )

        public_url = (
            f"{_settings.SUPABASE_URL}/storage/v1/object/public/"
            f"{bucket}/{storage_path}"
        )

        logger.info(f"Uploaded {file_path.name} → {storage_path}")

        return public_url

    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise
