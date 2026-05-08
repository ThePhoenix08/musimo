import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


# =====================================================
# COMMON API RESPONSE
# =====================================================

class ApiResponse(BaseModel):
    success: bool = True


# =====================================================
# BASE
# =====================================================

class BaseAnalysisRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    audio_file_id: Optional[uuid.UUID] = None
    model_id: Optional[uuid.UUID] = None

    analysis_type: str
    summary_text: Optional[str] = None

    created_at: datetime
    updated_at: datetime


# =====================================================
# EMOTION
# =====================================================

class EmotionAnalysisRecordResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        use_enum_values=True,
        arbitrary_types_allowed=True,
    )

    id: uuid.UUID
    project_id: uuid.UUID
    model_id: uuid.UUID | None = None
    audio_file_id: uuid.UUID | None = None

    analysis_type: str
    summary_text: str

    created_at: datetime
    updated_at: datetime

    results: dict[str, Any] | None = None
    prediction_result: dict[str, Any] | None = None
    vgg_embeddings: dict[str, Any] | list[Any] | None = None


class EmotionAnalysisApiResponse(ApiResponse):
    data: EmotionAnalysisRecordResponse


# =====================================================
# INSTRUMENT
# =====================================================

class InstrumentAnalysisRecordResponse(BaseAnalysisRecordResponse):
    model_config = ConfigDict(from_attributes=True)

    instruments: list[str]
    confidence_scores: dict[str, Any]

    results: dict[str, Any] | None = None


class InstrumentAnalysisApiResponse(ApiResponse):
    data: InstrumentAnalysisRecordResponse


# =====================================================
# FEATURES
# =====================================================

class FeatureAnalysisRecordResponse(BaseAnalysisRecordResponse):
    feature_vector: dict[str, Any]


# =====================================================
# SEPARATION
# =====================================================

class SeparationAnalysisRecordResponse(BaseAnalysisRecordResponse):
    separated_files: list[Any]