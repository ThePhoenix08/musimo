# app/schemas/analysis.py
from datetime import datetime
from typing import Dict, Literal

from pydantic import BaseModel


class AnalysisRequestSchema(BaseModel):
    analysis_type: Literal[
        "emotion_prediction",
        "instrument_detection",
        "audio_segmentation",
        "feature_extraction"
    ]
    config: Dict


class AnalysisReportSchema(BaseModel):
    analysis_type: str
    model_name: str
    output: Dict
    created_at: datetime
