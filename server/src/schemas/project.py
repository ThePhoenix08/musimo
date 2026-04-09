import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from src.schemas.audioFile import AudioFileResponse

# Request Schemas


class ProjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=150, examples=["My Music Project"])
    description: Optional[str] = Field(
        None, max_length=2000, examples=["A project for analyzing concert recordings"]
    )


class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = Field(None, max_length=2000)


# Response Schemas

class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: Optional[str]
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    main_audio_id: Optional[uuid.UUID]

    # populated relationships
    main_audio: Optional[AudioFileResponse] = None
    separated_audios: list[AudioFileResponse] = []
    # emotion_analysis_record: Optional["EmotionAnalysisRecord"] = None
    # instrument_analysis_record: Optional["InstrumentAnalysisRecord"] = None
    # feature_analysis_record: Optional["FeatureAnalysisRecord"] = None
    # separation_analysis_record: Optional["SeparationAnalysisRecord"] = None



class ProjectListResponse(BaseModel):
    items: list[ProjectResponse]
    total: int
    page: int
    page_size: int
