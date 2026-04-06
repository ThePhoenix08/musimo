import librosa
import numpy as np
import tempfile
import os

from fastapi import HTTPException, status

from src.repo.audioFileRepo import AudioFileRepository
from src.repo.audioFeatureRepo import FeatureAnalysisRepository
from src.repo.featureanalysisrepo import AudioFeatureRepository
from src.database.enums import FeatureType
from src.core.settings import CONSTANTS


class AudioFeatureService:

    def __init__(self, session, storage):
        self._session = session
        self._audio_repo = AudioFileRepository(session)
        self._feature_repo = AudioFeatureRepository(session)
        self._analysis_repo = FeatureAnalysisRepository(session)
        self._storage = storage

    # =========================
    # Extract Features
    # =========================
    async def extract_and_store(self, audio_file_id):

        # 🔹 Get audio
        audio = await self._audio_repo.get_by_id(audio_file_id)
        if not audio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audio not found"
            )

        # 🔹 Download file from Supabase
        file_bytes = await self._storage.download_file(
            bucket=CONSTANTS.SUPABASE_AUDIO_SOURCE_BUCKET,
            path=audio.file_path,
        )

        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to download audio file"
            )

        temp_path = None

        try:
            # 🔹 Save temp file
            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                tmp.write(file_bytes)
                temp_path = tmp.name

            # 🔹 Load audio
            y, sr = librosa.load(temp_path, sr=None)

            # ======================
            # Feature Extraction
            # ======================
            mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)

            features = {
                "mfcc": {
                    "mean": np.mean(mfcc, axis=1).tolist(),
                    "std": np.std(mfcc, axis=1).tolist(),
                },
                "zcr": {
                    "mean": float(np.mean(librosa.feature.zero_crossing_rate(y))),
                    "std": float(np.std(librosa.feature.zero_crossing_rate(y))),
                },
                "rms": {
                    "mean": float(np.mean(librosa.feature.rms(y=y))),
                    "std": float(np.std(librosa.feature.rms(y=y))),
                }
            }

            # ======================
            # DB Operations
            # ======================

            analysis = await self._analysis_repo.get_by_audio(audio_file_id)

            if not analysis:
                # analysis = await self._analysis_repo.create(audio_file_id)
                analysis = await self._analysis_repo.create(
                    audio_file_id=audio_file_id,
                    project_id=audio.project_id,
                    feature_vector=features   
                )

            # Check existing feature
            existing_feature = None
            for f in audio.audio_features:
                if f.analysis_record_id == analysis.id:
                    existing_feature = f
                    break

            if existing_feature:
                existing_feature.data = features
            else:
                await self._feature_repo.create(
                    audio_file_id=audio.id,
                    analysis_record_id=analysis.id,
                    data=features,
                    feature_type=FeatureType.LOW_LEVEL
                )

            await self._session.commit()

            return {"success": True}

        finally:
            # 🔹 Cleanup temp file
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

    # =========================
    # Get Features
    # =========================
    async def get_all_features(self, audio_file_id):

        audio = await self._audio_repo.get_by_id(audio_file_id)

        if not audio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audio not found"
            )

        result = []

        for feature in audio.audio_features:
            result.append({
                "analysis_id": str(feature.analysis_record_id),
                "feature_type": str(feature.feature_type),
                "data": feature.data
            })

        return result