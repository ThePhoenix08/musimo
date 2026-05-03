import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


# =====================================================
# BASE
# =====================================================

class BaseAnalysisRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    audio_file_id: uuid.UUID
    model_id: Optional[uuid.UUID]

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


# =====================================================
# INSTRUMENT
# =====================================================

class InstrumentAnalysisRecordResponse(BaseAnalysisRecordResponse):
    instruments: list[str]
    confidence_scores: dict[str, Any]


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


# =====================================================
# WRAPPERS
# =====================================================

class EmotionAnalysisApiResponse(BaseModel):
    success: bool = True
    data: EmotionAnalysisRecordResponse