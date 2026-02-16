import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from src.database.enums import AudioFileStatus, AudioFormat, AudioSourceType


#  Response Schemas 

class AudioFileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    file_name: str
    file_path: str
    duration: Optional[float]
    sample_rate: Optional[int]
    channels: int
    format: AudioFormat
    checksum: str
    status: AudioFileStatus
    source_type: AudioSourceType
    created_at: datetime
    updated_at: datetime


class AudioFileUploadResponse(BaseModel):
    """Returned immediately after upload — metadata may still be processing."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    file_name: str
    file_path: str
    status: AudioFileStatus
    source_type: AudioSourceType
    checksum: str
    created_at: datetime


class AudioFileListResponse(BaseModel):
    items: list[AudioFileResponse]
    total: int
    page: int
    page_size: int


#  Internal / Service DTOs 

class AudioFileCreateDTO(BaseModel):
    """Internal DTO used by the service layer to persist a new AudioFile record."""
    project_id: uuid.UUID
    file_path: str          # supabase storage path
    file_name: str
    checksum: str
    channels: int = Field(default=1)
    format: AudioFormat = AudioFormat.MP3
    duration: Optional[float] = None
    sample_rate: Optional[int] = None
    status: AudioFileStatus = AudioFileStatus.UPLOADED
    source_type: AudioSourceType = AudioSourceType.ORIGINAL