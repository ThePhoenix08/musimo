"""
Audio processing service for generating mel spectrograms
"""

import uuid  # ADD

import librosa
import logging
import os

from fastapi import HTTPException  # ADD
from sqlalchemy import select  # ADD

from src.schemas.audioFile import AudioFileResponse
from src.database.models.audio_file import AudioFile  # ADD — adjust path if needed

logger = logging.getLogger(__name__)


class AudioService:


    def __init__(self, session, storage):
        self.session = session
        self.storage = storage

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

    async def get_project_primary_audio(  # FIXED: now correctly indented inside class
        self,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
    ):
        result = await self.session.execute(  # FIXED: indentation
            select(AudioFile)
            .where(
                AudioFile.project_id == project_id
            )
            .limit(1)
        )
        audio = result.scalar_one_or_none()

        if not audio:
            raise HTTPException(
                status_code=404,
                detail="No audio file found for this project",
            )

        return AudioFileResponse.model_validate(audio)