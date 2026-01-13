import torch
import numpy as np
from dataclasses import dataclass, asdict
import json

@dataclass
class StaticPrediction:
    emotions: dict
    duration_seconds: float
    num_segments: int
    model_version: str = "GEMS-9"
    
    def to_json(self): return json.dumps(asdict(self), indent=2)

@dataclass
class DynamicPrediction:
    timestamps: list
    emotions: dict
    duration_seconds: float
    segment_duration: float
    
    def to_json(self): return json.dumps(asdict(self), indent=2)

@dataclass
class CombinedPrediction:
    static: StaticPrediction
    dynamic: DynamicPrediction
    
    def to_json(self): return json.dumps({
        "static": asdict(self.static),
        "dynamic": asdict(self.dynamic)
    }, indent=2)

class EmotionPostprocessor:
    """Handles label scaling and prediction formatting."""

    def __init__(self, emotion_names, scaling_factors, device="cpu"):
        self.emotion_names = emotion_names
        self.scaling_factors = torch.tensor(
            [scaling_factors[name] for name in emotion_names],
            dtype=torch.float32,
            device=device,
        )

    def apply_scaling(self, preds: torch.Tensor):
        return preds * self.scaling_factors

    def to_static(self, preds: torch.Tensor, duration, num_segments):
        preds = preds.cpu().numpy()[0]
        emotions = {n: float(v) for n, v in zip(self.emotion_names, preds)}
        return StaticPrediction(emotions, duration, num_segments)

    def to_dynamic(self, preds: np.ndarray, timestamps, duration, segment_duration):
        emotions = {n: preds[:, i].tolist() for i, n in enumerate(self.emotion_names)}
        return DynamicPrediction(timestamps, emotions, duration, segment_duration)
