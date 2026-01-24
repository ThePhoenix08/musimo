"""
ML Model service for emotion detection and instrument classification
"""

import json
import os
import sys
from typing import Dict

from .emotion_recognition.config import ConfigManager
from .emotion_recognition.emotion_pipeline import GEMS9Pipeline, PredictionType

# Add instrument detection to path
INSTRUMENT_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'instrument_detection')
if INSTRUMENT_MODEL_PATH not in sys.path:
    sys.path.insert(0, INSTRUMENT_MODEL_PATH)

# Import instrument detection components
try:
    from .Instrument_recognition.instrument_pipeline import get_pipeline
    INSTRUMENT_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Instrument detection not available: {e}")
    INSTRUMENT_AVAILABLE = False


# =========================== UTILITY ===========================
def validate_prediction_type(prediction_type: str) -> PredictionType:
    try:
        if prediction_type.lower() == "both":
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


# =========================== MODEL SERVICE ===========================

class ModelService:
    # =========================== EMOTION PREDICTION ===========================
    emotion_pipeline = None

    @classmethod
    def initialize_emotion_pipeline(cls):
        """Initialize emotion detection pipeline"""
        if cls.emotion_pipeline is None:
            config = ConfigManager.load_from_json()
            cls.emotion_pipeline = GEMS9Pipeline(config)

    @classmethod
    async def predict_emotion(
        cls,
        audio_path: str,
        prediction_type: str = "both",
    ) -> Dict:
        """
        Predict emotion from audio file
        
        Args:
            audio_path: Path to audio file
            prediction_type: Type of prediction ("static", "dynamic", "both")
            
        Returns:
            Dict with emotion prediction results
        """
        prediction_type = validate_prediction_type(prediction_type)
        ModelService.initialize_emotion_pipeline()
        result = await cls.emotion_pipeline.predict(audio_path, prediction_type)
        return format_prediction_result(result)

    # =========================== INSTRUMENT PREDICTION ===========================
    instrument_pipeline = None

    @classmethod
    def initialize_instrument_pipeline(cls):
        """Initialize instrument detection pipeline (lazy loading)"""
        if not INSTRUMENT_AVAILABLE:
            raise RuntimeError(
                "Instrument detection is not available. "
                "Please ensure instrument_detection module is properly installed."
            )
        
        if cls.instrument_pipeline is None:
            cls.instrument_pipeline = get_pipeline()

    @classmethod
    async def predict_instrument(
        cls,
        audio_path: str,
        threshold: float = 0.5,
        detailed: bool = False,
        filename: str = None
    ) -> Dict:
        """
        Predict instruments from audio file
        
        Args:
            audio_path: Path to audio file (supports MP3, WAV, OGG, FLAC, M4A)
            threshold: Detection threshold (0.0-1.0, default: 0.5)
            detailed: Return detailed response with all predictions
            filename: Original filename for metadata
            
        Returns:
            Dict with instrument prediction results
            
        Example response:
            {
                "success": true,
                "detected_instruments": [
                    {"instrument": "guitar", "confidence": 0.87, "percentage": 87.0},
                    {"instrument": "drums", "confidence": 0.65, "percentage": 65.0}
                ],
                "top_predictions": [...],
                "total_detected": 2,
                "threshold": 0.5,
                "processing_time_seconds": 1.234
            }
        """
        try:
            # Initialize pipeline if needed
            cls.initialize_instrument_pipeline()
            
            # Run prediction
            result = cls.instrument_pipeline.predict(
                audio_path=audio_path,
                threshold=threshold,
                include_embeddings=False,
                detailed=detailed
            )
            
            # Format response to match your service pattern
            if result.get("success"):
                # Extract data from nested structure if present
                data = result.get("data", result)
                
                formatted_result = {
                    "success": True,
                    "detected_instruments": data.get("detected_instruments", []),
                    "top_predictions": data.get("top_predictions", []),
                    "total_detected": data.get("statistics", {}).get("total_detected", 
                                              data.get("total_detected", 0)),
                    "threshold": threshold,
                    "filename": filename
                }
                
                # Add processing time if available
                if "processing_time_seconds" in data:
                    formatted_result["processing_time_seconds"] = data["processing_time_seconds"]
                
                # Add all predictions if detailed
                if detailed and "all_predictions" in data:
                    formatted_result["all_predictions"] = data["all_predictions"]
                
                return formatted_result
            else:
                return result
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__
            }

    @classmethod
    async def get_instrument_info(cls) -> Dict:
        """
        Get information about the instrument detection model
        
        Returns:
            Dict with model info including supported instruments
        """
        try:
            cls.initialize_instrument_pipeline()
            info = cls.instrument_pipeline.get_model_info()
            
            return {
                "success": True,
                "model_loaded": info.get("model_loaded", False),
                "instruments": info.get("instruments", []),
                "total_instruments": info.get("number_of_instruments", 0),
                "model_details": {
                    "input_shape": info.get("input_shape", "Unknown"),
                    "output_shape": info.get("output_shape", "Unknown"),
                    "parameters": info.get("total_parameters", 0)
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    @classmethod
    async def predict_both(
        cls,
        audio_path: str,
        emotion_prediction_type: str = "both",
        instrument_threshold: float = 0.5
    ) -> Dict:
        """
        Predict both emotion and instruments from the same audio file
        
        Args:
            audio_path: Path to audio file
            emotion_prediction_type: Emotion prediction type ("static", "dynamic", "both")
            instrument_threshold: Instrument detection threshold
            
        Returns:
            Dict with both emotion and instrument predictions
        """
        try:
            # Get emotion prediction
            emotion_result = await cls.predict_emotion(
                audio_path, 
                emotion_prediction_type
            )
            
            # Get instrument prediction
            instrument_result = await cls.predict_instrument(
                audio_path,
                threshold=instrument_threshold,
                detailed=False
            )
            
            return {
                "success": True,
                "emotion": emotion_result,
                "instruments": instrument_result
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__
            }

    # =========================== HEALTH CHECK ===========================
    
    @classmethod
    async def health_check(cls) -> Dict:
        """
        Check health status of all models
        
        Returns:
            Dict with health status of emotion and instrument models
        """
        health_status = {
            "emotion_detection": {
                "available": cls.emotion_pipeline is not None,
                "status": "healthy" if cls.emotion_pipeline is not None else "not_initialized"
            },
            "instrument_detection": {
                "available": INSTRUMENT_AVAILABLE,
                "status": "healthy" if cls.instrument_pipeline is not None else "not_initialized"
            }
        }
        
        return health_status