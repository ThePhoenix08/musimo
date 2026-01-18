"""
Configuration file for Instrument Detection API
Contains all model parameters and settings
"""
import os
from typing import Dict, Any

class Config:
    """Configuration class for the instrument detection model"""
    
    # Model Configuration (Must match your training config)
    SAMPLE_RATE: int = 22050
    DURATION: int = 10  # seconds
    N_MELS: int = 128
    N_FFT: int = 2048
    HOP_LENGTH: int = 512
    
    # Detection threshold
    DEFAULT_THRESHOLD: float = 0.5
    
    # File paths
    BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)
    MODEL_PATH = os.path.join(BASE_DIR, "checkpoints", "best_model.keras")
    INSTRUMENTS_PATH = os.path.join(BASE_DIR, "checkpoints", "instruments.json")
    CONFIG_PATH = os.path.join(BASE_DIR, "checkpoints", "config.json")
    
    # Upload settings
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50 MB
    ALLOWED_EXTENSIONS: set = {".mp3", ".wav", ".ogg", ".flac", ".m4a"}
    
    # API Settings  
    API_TITLE: str = "Instrument Detection API"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = """
    🎵 Deep Learning API for Multi-Instrument Detection in Audio
    
    This API uses a CNN-CRNN model to identify musical instruments in audio files.
    
    **Features:**
    - Upload audio files (MP3, WAV, OGG, FLAC, M4A)
    - Detect multiple instruments simultaneously
    - Get confidence scores for each instrument
    - Adjustable detection threshold
    
    **Model Architecture:**
    - CNN layers for spectral feature extraction
    - Bidirectional LSTM for temporal pattern recognition
    - Multi-label classification with sigmoid activation
    """
    
    @classmethod
    def get_config_dict(cls) -> Dict[str, Any]:
        """Return configuration as dictionary"""
        return {
            "sample_rate": cls.SAMPLE_RATE,
            "duration": cls.DURATION,
            "n_mels": cls.N_MELS,
            "n_fft": cls.N_FFT,
            "hop_length": cls.HOP_LENGTH,
            "threshold": cls.DEFAULT_THRESHOLD
        }
    
    @classmethod
    def ensure_directories(cls):
        """Create necessary directories if they don't exist"""
        os.makedirs(os.path.join(cls.BASE_DIR, "models"), exist_ok=True)
        os.makedirs(cls.UPLOAD_DIR, exist_ok=True)


# Create directories on import
Config.ensure_directories()