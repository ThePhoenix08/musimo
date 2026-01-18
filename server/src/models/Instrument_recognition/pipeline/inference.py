"""
Model inference module
Handles model loading and prediction
"""
import numpy as np
import tensorflow as tf
from typing import Dict, List, Tuple
import logging
import json

logger = logging.getLogger(__name__)


class InstrumentDetector:
    """Main inference class for instrument detection"""
    
    def __init__(self, model_path: str, instruments_path: str):
        """
        Initialize the detector
        
        Args:
            model_path: Path to trained Keras model
            instruments_path: Path to instruments JSON file
        """
        self.model = None
        self.instruments = []
        self.model_path = model_path
        self.instruments_path = instruments_path
        
        # Load model and instruments
        self._load_model()
        self._load_instruments()
    
    def _load_model(self):
        """Load the trained Keras model"""
        try:
            logger.info(f"Loading model from: {self.model_path}")
            self.model = tf.keras.models.load_model(self.model_path)
            logger.info(f"Model loaded successfully!")
            logger.info(f"Model input shape: {self.model.input_shape}")
            logger.info(f"Model output shape: {self.model.output_shape}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise RuntimeError(f"Could not load model: {str(e)}")
    
    def _load_instruments(self):
        """Load list of instrument names"""
        try:
            with open(self.instruments_path, 'r') as f:
                self.instruments = json.load(f)
            logger.info(f"Loaded {len(self.instruments)} instruments")
            logger.debug(f"Instruments: {self.instruments}")
        except Exception as e:
            logger.error(f"Failed to load instruments: {e}")
            raise RuntimeError(f"Could not load instruments list: {str(e)}")
    
    def predict(self, features: np.ndarray, threshold: float = 0.5) -> Dict:
        """
        Predict instruments in audio features
        
        Args:
            features: Preprocessed audio features
            threshold: Detection threshold (0.0 - 1.0)
            
        Returns:
            Dictionary with prediction results
        """
        try:
            # Make prediction
            logger.info(f"Running inference with threshold={threshold}")
            predictions = self.model.predict(features, verbose=0)[0]
            
            # Convert to float for JSON serialization
            predictions = predictions.astype(float)
            
            # Create results
            results = self._format_results(predictions, threshold)
            
            logger.info(f"Prediction complete. Detected {len(results['detected'])} instruments")
            return results
            
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            raise RuntimeError(f"Inference error: {str(e)}")
    
    def _format_results(self, predictions: np.ndarray, threshold: float) -> Dict:
        """
        Format prediction results
        
        Args:
            predictions: Raw model predictions
            threshold: Detection threshold
            
        Returns:
            Formatted results dictionary
        """
        # Get all predictions with scores
        all_predictions = []
        detected_instruments = []
        
        for i, instrument in enumerate(self.instruments):
            score = float(predictions[i])
            
            prediction_entry = {
                "instrument": instrument,
                "confidence": score,
                "percentage": round(score * 100, 2)
            }
            
            all_predictions.append(prediction_entry)
            
            # Check if above threshold
            if score >= threshold:
                detected_instruments.append(prediction_entry)
        
        # Sort by confidence (descending)
        all_predictions.sort(key=lambda x: x['confidence'], reverse=True)
        detected_instruments.sort(key=lambda x: x['confidence'], reverse=True)
        
        # Get top 5
        top_5 = all_predictions[:5]
        
        return {
            "detected": detected_instruments,
            "top_5": top_5,
            "all_predictions": all_predictions,
            "threshold": threshold,
            "total_detected": len(detected_instruments)
        }
    
    def get_model_info(self) -> Dict:
        """Get information about the loaded model"""
        if self.model is None:
            return {"error": "Model not loaded"}
        
        return {
            "model_loaded": True,
            "input_shape": str(self.model.input_shape),
            "output_shape": str(self.model.output_shape),
            "total_parameters": int(self.model.count_params()),
            "number_of_instruments": len(self.instruments),
            "instruments": self.instruments
        }