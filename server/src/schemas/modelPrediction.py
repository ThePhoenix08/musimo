from typing import Literal
from pydantic import BaseModel


class ModelPrediction(BaseModel):
    model_type: Literal["emotion_detection", "instrument_classification"]
    prediction: str
    confidence: float
    probabilities: dict