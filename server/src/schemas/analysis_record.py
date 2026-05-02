import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class BaseAnalysisRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    model_id: Optional[uuid.UUID]
    summary_text: str
    created_at: datetime
    updated_at: datetime


class EmotionAnalysisRecordResponse(BaseAnalysisRecordResponse):
    vgg_embeddings: Optional[dict | list]
    prediction_result: dict


class InstrumentAnalysisRecordResponse(BaseAnalysisRecordResponse):
    instruments: List[str]
    confidence_scores: dict


class FeatureAnalysisRecordResponse(BaseAnalysisRecordResponse):
    feature_vector: dict


class SeparationAnalysisRecordResponse(BaseAnalysisRecordResponse):
    separated_files: list  # or create proper schema later
