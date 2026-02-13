from typing import Dict, List, Optional
from pydantic import BaseModel


class AudioUploadResponse(BaseModel):
    job_id: str
    audio_id: str
    status: str
    message: str
    file_name: str
    created_at: str


class JobStatus(BaseModel):
    job_id: str
    audio_id: str
    status: str
    progress: int
    message: str
    input_file: Optional[str] = None
    output_folder: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None
    stems: Optional[List[Dict[str, str]]] = None


class ProgressUpdate(BaseModel):
    job_id: str
    progress: int
    message: str


class StemInfo(BaseModel):
    stem_id: str
    label: str
    file_name: str
    storage_path: str
    duration: Optional[float] = None