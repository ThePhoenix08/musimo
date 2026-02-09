"""
Audio processing service for generating mel spectrograms
"""

import librosa
import librosa.display
import matplotlib
import numpy as np

matplotlib.use("Agg")  # Use non-GUI backend
import os
from pathlib import Path

import matplotlib.pyplot as plt

from src.core.logger_setup import logger


class AudioService:
    @staticmethod
    def generate_melspectrogram(audio_path: str, output_path: str) -> bool:
        """
        Generate mel spectrogram from audio file and save as image

        Args:
            audio_path: Path to input audio file
            output_path: Path to save mel spectrogram image

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Load audio file
            y, sr = librosa.load(audio_path, sr=22050)

            # Generate mel spectrogram
            mel_spec = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128, fmax=8000)

            # Convert to dB scale
            mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)

            # Create figure and plot
            plt.figure(figsize=(10, 4))
            librosa.display.specshow(
                mel_spec_db,
                sr=sr,
                x_axis="time",
                y_axis="mel",
                fmax=8000,
                cmap="viridis",
            )
            plt.colorbar(format="%+2.0f dB")
            plt.title("Mel Spectrogram")
            plt.tight_layout()

            Path(output_path).parent.mkdir(parents=True, exist_ok=True)

            plt.savefig(output_path, dpi=100, bbox_inches="tight")
            plt.close()

            return True

        except Exception as e:
            logger.error(f"Error generating mel spectrogram: {e}")
            return False

    @staticmethod
    def get_audio_duration(audio_path: str) -> float:
        """Get audio file duration in seconds"""
        try:
            y, sr = librosa.load(audio_path, sr=None)
            return librosa.get_duration(y=y, sr=sr)
        except Exception as e:
            logger.error(f"Error getting audio duration: {e}")
            return 0.0

    @staticmethod
    def validate_audio_file(
        file_path: str, max_duration: int = 300
    ) -> tuple[bool, str]:
        """
        Validate audio file

        Args:
            file_path: Path to audio file
            max_duration: Maximum allowed duration in seconds (default 5 minutes)

        Returns:
            tuple: (is_valid, error_message)
        """
        if not os.path.exists(file_path):
            return False, "File does not exist"

        try:
            duration = AudioService.get_audio_duration(file_path)
            if duration == 0:
                return False, "Invalid audio file"

            if duration > max_duration:
                return (
                    False,
                    f"Audio duration exceeds maximum of {max_duration} seconds",
                )

            return True, ""

        except Exception as e:
            return False, f"Error validating audio: {str(e)}"
