import os
import tempfile

import librosa
import numpy as np
from fastapi import HTTPException, status

from src.core.settings import CONSTANTS
from src.database.enums import FeatureType
from src.repo.audioFeatureRepo import FeatureAnalysisRepository
from src.repo.audioFileRepo import AudioFileRepository
from src.repo.featureanalysisrepo import AudioFeatureRepository


def convert_numpy(obj):
    import numpy as np

    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (np.float32, np.float64)):
        return float(obj)
    elif isinstance(obj, (np.int32, np.int64)):
        return int(obj)
    elif isinstance(obj, dict):
        return {k: convert_numpy(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy(i) for i in obj]
    return obj

class AudioFeatureService:

    def __init__(self, session, storage):
        self._session = session
        self._audio_repo = AudioFileRepository(session)
        self._feature_repo = AudioFeatureRepository(session)
        self._analysis_repo = FeatureAnalysisRepository(session)
        self._storage = storage

    
    """# Extract Features"""
  
    async def extract_and_store(self, audio_file_id):

        """# Get audio"""
        audio = await self._audio_repo.get_by_id(audio_file_id)
        if not audio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audio not found"
            )

        """ # Download file from Supabase"""
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
            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                tmp.write(file_bytes)
                temp_path = tmp.name

            """Load audio"""
            y, sr = librosa.load(temp_path, sr=None)

            """  # Feature Extraction """        

            mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            
            """# MFCC Delta"""
            mfcc_delta = librosa.feature.delta(mfcc)
            
            """ Spectral Features """
            centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
            bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)
            contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
            rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
            flatness = librosa.feature.spectral_flatness(y=y)

            """# Rhythm Features"""
            onset_env = librosa.onset.onset_strength(y=y, sr=sr)
            tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
            tempogram = librosa.feature.tempogram(onset_envelope=onset_env, sr=sr)
            
            """Mel Spectrogram"""
            mel = librosa.feature.melspectrogram(y=y, sr=sr)
            log_mel = librosa.power_to_db(mel)
            
            """ Chroma Features"""
            chroma = librosa.feature.chroma_stft(y=y, sr=sr)
            
            """ Tonal Features  """
            y_harmonic = librosa.effects.harmonic(y)
            tonnetz = librosa.feature.tonnetz(y=y_harmonic, sr=sr)

            features = {
                "simple_rate": sr,
                "Audio_Length": len(y) / sr,
                "mfcc": {
                    "mean": np.mean(mfcc, axis=1).tolist(),
                    "std": np.std(mfcc, axis=1).tolist(),
                },
                "mfcc_delta": {
                    "mean": np.mean(mfcc_delta, axis=1).tolist(),
                    "std": np.std(mfcc_delta, axis=1).tolist(),
                },
                # Time-domain features
                "zcr": {
                    "mean": float(np.mean(librosa.feature.zero_crossing_rate(y))),
                    "std": float(np.std(librosa.feature.zero_crossing_rate(y))),
                },
                # Energy
                "rms": {
                    "mean": float(np.mean(librosa.feature.rms(y=y))),
                    "std": float(np.std(librosa.feature.rms(y=y))),
                },
                "spectral_centroid": {
                    "mean": float(np.mean(centroid)),
                    "std": float(np.std(centroid)),
                },
                "spectral_bandwidth": {
                    "mean": float(np.mean(bandwidth)),
                    "std": float(np.std(bandwidth)),
                },
                "spectral_contrast": {
                    "mean": np.mean(contrast, axis=1).tolist(),
                    "std": np.std(contrast, axis=1).tolist(),
                },
                "spectral_rolloff": {
                    "mean": float(np.mean(rolloff)),
                    "std": float(np.std(rolloff)),
                },
                "spectral_flatness": {
                    "mean": float(np.mean(flatness)),
                    "std": float(np.std(flatness)),
                },
                "tempo": tempo,
                # "tempogram": {
                #     "mean": np.mean(tempogram, axis=1).tolist(),
                #     "std": np.std(tempogram, axis=1).tolist(),
                # },
                # "mel": {
                #     "mean": np.mean(log_mel, axis=1).tolist(),
                #     "std": np.std(log_mel, axis=1).tolist(),
                # },
                "chroma": {
                    "mean": np.mean(chroma, axis=1).tolist(),
                    "std": np.std(chroma, axis=1).tolist(),
                },
                "tonnetz": {
                    "mean": np.mean(tonnetz, axis=1).tolist(),
                    "std": np.std(tonnetz, axis=1).tolist(),
                },
            }

            features = convert_numpy(features)
        
            """          # DB Operations          """

            analysis = await self._analysis_repo.get_by_audio(audio_file_id)

            if not analysis:
                # analysis = await self._analysis_repo.create(audio_file_id)
                analysis = await self._analysis_repo.create(
                    audio_file_id=audio_file_id,
                    project_id=audio.project_id,
                    feature_vector=features   
                )

            """# Check existing feature"""
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
            """# Cleanup temp file"""
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

    """    # Get Features """  
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