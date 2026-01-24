"""
Audio preprocessing module
Handles loading and preparing audio files for the model
"""
import logging
from typing import Tuple

import librosa
import numpy as np

logger = logging.getLogger(__name__)


class AudioPreprocessor:
    """Handles all audio preprocessing operations"""
    
    def __init__(self, config: dict):
        """
        Initialize preprocessor with configuration
        
        Args:
            config: Dictionary with preprocessing parameters
        """
        self.sample_rate = config['sample_rate']
        self.duration = config['duration']
        self.n_mels = config['n_mels']
        self.n_fft = config['n_fft']
        self.hop_length = config['hop_length']
        
        logger.info(f"AudioPreprocessor initialized with config: {config}")
    
    def load_audio(self, audio_path: str) -> Tuple[np.ndarray, int]:
        """
        Load audio file
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Tuple of (audio_data, sample_rate)
        """
        try:
            y, sr = librosa.load(
                audio_path, 
                sr=self.sample_rate, 
                duration=self.duration,
                mono=True  # Convert to mono
            )
            logger.info(f"Loaded audio: {audio_path} | Duration: {len(y)/sr:.2f}s")
            return y, sr
        except Exception as e:
            logger.error(f"Failed to load audio {audio_path}: {e}")
            raise ValueError(f"Could not load audio file: {str(e)}")
    
    def normalize_length(self, audio: np.ndarray) -> np.ndarray:
        """
        Pad or trim audio to target length
        
        Args:
            audio: Audio time series
            
        Returns:
            Audio with fixed length
        """
        target_length = self.sample_rate * self.duration
        
        if len(audio) < target_length:
            # Pad with zeros
            padding = target_length - len(audio)
            audio = np.pad(audio, (0, padding), mode='constant')
            logger.debug(f"Padded audio by {padding} samples")
        elif len(audio) > target_length:
            # Trim
            audio = audio[:target_length]
            logger.debug(f"Trimmed audio to {target_length} samples")
        
        return audio
    
    def extract_mel_spectrogram(self, audio: np.ndarray) -> np.ndarray:
        """
        Extract mel-spectrogram features from audio
        
        Args:
            audio: Audio time series
            
        Returns:
            Normalized mel-spectrogram in dB scale
        """
        try:
            # Compute mel-spectrogram
            mel_spec = librosa.feature.melspectrogram(
                y=audio,
                sr=self.sample_rate,
                n_mels=self.n_mels,
                n_fft=self.n_fft,
                hop_length=self.hop_length
            )
            
            # Convert to dB scale
            mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
            
            # Normalize (Z-score normalization)
            mean = mel_spec_db.mean()
            std = mel_spec_db.std()
            mel_spec_normalized = (mel_spec_db - mean) / (std + 1e-8)
            
            logger.debug(f"Mel-spectrogram shape: {mel_spec_normalized.shape}")
            return mel_spec_normalized
            
        except Exception as e:
            logger.error(f"Failed to extract mel-spectrogram: {e}")
            raise ValueError(f"Feature extraction failed: {str(e)}")
    
    def preprocess(self, audio_path: str) -> np.ndarray:
        """
        Complete preprocessing pipeline
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Preprocessed features ready for model input
        """
        # Load audio
        audio, sr = self.load_audio(audio_path)
        
        # Normalize length
        audio = self.normalize_length(audio)
        
        # Extract features
        features = self.extract_mel_spectrogram(audio)
        
        # Reshape for model input: (1, n_mels, time_steps)
        features = features.reshape(1, features.shape[0], features.shape[1])
        
        logger.info(f"Preprocessing complete. Output shape: {features.shape}")
        return features
    
    def validate_audio_file(self, file_path: str, max_size_mb: int = 50) -> bool:
        """
        Validate audio file before processing
        
        Args:
            file_path: Path to audio file
            max_size_mb: Maximum file size in MB
            
        Returns:
            True if valid, raises ValueError otherwise
        """
        import os
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise ValueError(f"File not found: {file_path}")
        
        # Check file size
        file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
        if file_size_mb > max_size_mb:
            raise ValueError(
                f"File too large: {file_size_mb:.2f}MB (max: {max_size_mb}MB)"
            )
        
        # Check file extension
        allowed_exts = {'.mp3', '.wav', '.ogg', '.flac', '.m4a'}
        ext = os.path.splitext(file_path)[1].lower()
        if ext not in allowed_exts:
            raise ValueError(
                f"Unsupported format: {ext}. Allowed: {allowed_exts}"
            )
        
        logger.info(f"Audio file validated: {file_path} ({file_size_mb:.2f}MB)")
        return True