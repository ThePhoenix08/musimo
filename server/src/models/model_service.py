"""
ML Model service for emotion detection and instrument classification
NOTE: This is a placeholder - integrate your actual trained models here
"""

import json
from typing import Dict
from .emotion_recognition.config import ConfigManager
from .emotion_recognition.emotion_pipeline import GEMS9Pipeline, PredictionType

# =========================== UTILITY ===========================
def validate_prediction_type(prediction_type: str) -> PredictionType:
    try:
        if(prediction_type.lower() == "both"):
            return PredictionType.COMBINED
        pred_type = PredictionType(prediction_type)
        return pred_type
    except ValueError:
        valid_types = [pt.value for pt in PredictionType]
        raise ValueError(
            f"Invalid prediction_type: {prediction_type}. Valid options are {valid_types}."
        )
def format_prediction_result(result) -> Dict:
    if hasattr(result, "to_json"):
        return json.loads(result.to_json())
    elif isinstance(result, dict):
        return result
    else:
        raise TypeError("Unexpected prediction result type.")

#=========================== MODEL SERVICE ===========================

class ModelService:
    #=========================== EMOTION PREDICTION ===========================
    emotion_pipeline = None

    @classmethod
    def initialize_emotion_pipeline(cls):
        if cls.emotion_pipeline is None:
            config = ConfigManager.load_from_json()
            cls.emotion_pipeline = GEMS9Pipeline(config)

    @classmethod
    async def predict_emotion(
        cls,
        audio_path: str,
        prediction_type: str = "both",
    ) -> Dict:
        prediction_type = validate_prediction_type(prediction_type)
        ModelService.initialize_emotion_pipeline()
        result = await cls.emotion_pipeline.predict(audio_path, prediction_type)
        return format_prediction_result(result)

    #=========================== INSTRUMENT PREDICTION ===========================
    # Placeholder instrument labels
    # INSTRUMENT_LABELS = [
    #     "piano",
    #     "guitar",
    #     "violin",
    #     "drums",
    #     "flute",
    #     "saxophone",
    #     "trumpet",
    #     "bass",
    #     "vocals",
    # ]

    # @staticmethod
    # def predict_instrument(melspectrogram_path: str) -> Dict:
    #     """
    #     Predict instrument from mel spectrogram

    #     Args:
    #         melspectrogram_path: Path to mel spectrogram image

    #     Returns:
    #         dict: Prediction results with probabilities
    #     """
    #     # TODO: Load your trained instrument classification model
    #     # model = load_model('path/to/instrument_model.h5')
    #     # image = preprocess_image(melspectrogram_path)
    #     # predictions = model.predict(image)

    #     # PLACEHOLDER: Random predictions for demonstration
    #     probabilities = {}
    #     total = 0
    #     for label in ModelService.INSTRUMENT_LABELS:
    #         prob = random.uniform(0.05, 0.95)
    #         probabilities[label] = round(prob, 4)
    #         total += prob

    #     # Normalize probabilities
    #     probabilities = {k: round(v / total, 4) for k, v in probabilities.items()}

    #     # Get top prediction
    #     top_instrument = max(probabilities.items(), key=lambda x: x[1])

    #     return {
    #         "prediction": top_instrument[0],
    #         "confidence": top_instrument[1],
    #         "probabilities": probabilities,
    #     }

    # =========================== GENERIC PREDICTION ===========================

    # @staticmethod
    # def predict(
    #     model_type: Literal["emotion_detection", "instrument_classification"],
    #     melspectrogram_path: str,
    # ) -> Dict:
    #     """
    #     Run prediction based on model type

    #     Args:
    #         model_type: Type of model to use
    #         melspectrogram_path: Path to mel spectrogram image

    #     Returns:
    #         dict: Prediction results
    #     """
    #     if model_type == "emotion_detection":
    #         return ModelService.predict_emotion(melspectrogram_path)
    #     elif model_type == "instrument_classification":
    #         return ModelService.predict_instrument(melspectrogram_path)
    #     else:
    #         raise ValueError(f"Unknown model type: {model_type}")
