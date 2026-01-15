import uuid
import shutil
from pathlib import Path

UPLOAD_DIR = Path("temp/uploads")
OUTPUT_DIR = Path("temp/outputs")

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def save_temp_audio(file):
    file_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{file_id}.wav"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return file_id, file_path

def cleanup_files(*paths):
    for path in paths:
        if path.exists():
            path.unlink()
