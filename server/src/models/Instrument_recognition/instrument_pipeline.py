"""
Complete instrument detection pipeline
Orchestrates all components for end-to-end prediction
"""
import time
import logging
from typing import Dict, Optional
from pathlib import Path

from .pipeline.preprocessor import AudioPreprocessor
from .pipeline.inference import InstrumentDetector
from .pipeline.postprocessor import ResultPostprocessor
from .pipeline.embeddings import FeatureExtractor
from .config import Config

logger = logging.getLogger(__name__)


class InstrumentDetectionPipeline:
    """
    Complete pipeline for instrument detection
    
    Workflow:
    1. Load and validate audio file
    2. Preprocess audio → extract features
    3. Run inference → get predictions
    4. Postprocess results → format output
    """
    
    def __init__(
        self, 
        model_path: str = None,
        instruments_path: str = None,
        config: dict = None
    ):
        """
        Initialize the complete pipeline
        
        Args:
            model_path: Path to model file (uses Config default if None)
            instruments_path: Path to instruments JSON (uses Config default if None)
            config: Configuration dict (uses Config defaults if None)
        """
        logger.info("Initializing InstrumentDetectionPipeline...")
        
        # Use config defaults if not provided
        self.model_path = model_path or Config.MODEL_PATH
        self.instruments_path = instruments_path or Config.INSTRUMENTS_PATH
        self.config = config or Config.get_config_dict()
        
        # Initialize components
        self.preprocessor = AudioPreprocessor(self.config)
        self.detector = InstrumentDetector(self.model_path, self.instruments_path)
        self.postprocessor = ResultPostprocessor()
        self.feature_extractor = FeatureExtractor(self.detector.model)
        
        logger.info("Pipeline initialized successfully!")
    
    def predict(
        self, 
        audio_path: str, 
        threshold: float = None,
        include_embeddings: bool = False,
        detailed: bool = False
    ) -> Dict:
        """
        Run complete prediction pipeline
        
        Args:
            audio_path: Path to audio file
            threshold: Detection threshold (uses config default if None)
            include_embeddings: Whether to include feature embeddings
            detailed: Whether to return detailed response
            
        Returns:
            Prediction results dictionary
        """
        start_time = time.time()
        
        try:
            logger.info(f"Processing audio file: {audio_path}")
            
            # Set threshold
            threshold = threshold or self.config['threshold']
            
            # Step 1: Validate audio file
            self.preprocessor.validate_audio_file(audio_path)
            
            # Step 2: Preprocess audio
            logger.info("Preprocessing audio...")
            features = self.preprocessor.preprocess(audio_path)
            
            # Step 3: Run inference
            logger.info("Running model inference...")
            predictions = self.detector.predict(features, threshold)
            
            # Step 4: Postprocess results
            processing_time = time.time() - start_time
            
            if detailed:
                results = self.postprocessor.format_detailed_response(
                    predictions,
                    include_all=True,
                    audio_info=self._get_audio_info(audio_path)
                )
            else:
                results = self.postprocessor.format_for_api(
                    predictions,
                    processing_time
                )
            
            # Optional: Add embeddings
            if include_embeddings:
                embeddings = self.feature_extractor.get_embeddings(features)
                results['embeddings'] = {
                    'shape': embeddings.shape,
                    'data': embeddings.tolist()
                }
            
            logger.info(f"Prediction completed in {processing_time:.3f}s")
            return results
            
        except Exception as e:
            logger.error(f"Pipeline error: {e}")
            return self.postprocessor.format_error_response(
                str(e),
                error_type=type(e).__name__
            )
    
    def predict_batch(
        self, 
        audio_paths: list, 
        threshold: float = None
    ) -> Dict[str, Dict]:
        """
        Process multiple audio files
        
        Args:
            audio_paths: List of audio file paths
            threshold: Detection threshold
            
        Returns:
            Dictionary mapping file paths to results
        """
        results = {}
        
        for audio_path in audio_paths:
            logger.info(f"Processing {audio_path}...")
            results[audio_path] = self.predict(audio_path, threshold)
        
        return results
    
    def _get_audio_info(self, audio_path: str) -> Dict:
        """
        Get metadata about audio file
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Audio metadata dictionary
        """
        import os
        import librosa
        
        try:
            # Get file info
            file_size = os.path.getsize(audio_path)
            file_name = os.path.basename(audio_path)
            
            # Get audio duration
            duration = librosa.get_duration(path=audio_path)
            
            return {
                "filename": file_name,
                "file_size_mb": round(file_size / (1024 * 1024), 2),
                "duration_seconds": round(duration, 2),
                "format": os.path.splitext(audio_path)[1][1:]
            }
        except Exception as e:
            logger.warning(f"Could not get audio info: {e}")
            return {"filename": os.path.basename(audio_path)}
    
    def get_model_info(self) -> Dict:
        """Get information about the loaded model"""
        return self.detector.get_model_info()
    
    def get_available_layers(self) -> Dict:
        """Get available layers for embedding extraction"""
        return self.feature_extractor.get_available_layers()
    
    def health_check(self) -> Dict:
        """
        Perform health check on pipeline components
        
        Returns:
            Health status dictionary
        """
        health = {
            "status": "healthy",
            "components": {}
        }
        
        try:
            # Check preprocessor
            health["components"]["preprocessor"] = {
                "status": "ok",
                "config": self.config
            }
            
            # Check model
            model_info = self.detector.get_model_info()
            health["components"]["detector"] = {
                "status": "ok",
                "model_loaded": model_info.get("model_loaded", False),
                "instruments_count": model_info.get("number_of_instruments", 0)
            }
            
            # Check postprocessor
            health["components"]["postprocessor"] = {
                "status": "ok"
            }
            
        except Exception as e:
            health["status"] = "unhealthy"
            health["error"] = str(e)
        
        return health


# Singleton instance for reuse
_pipeline_instance: Optional[InstrumentDetectionPipeline] = None


def get_pipeline() -> InstrumentDetectionPipeline:
    """
    Get or create singleton pipeline instance
    
    Returns:
        InstrumentDetectionPipeline instance
    """
    global _pipeline_instance
    
    if _pipeline_instance is None:
        _pipeline_instance = InstrumentDetectionPipeline()
    
    return _pipeline_instance