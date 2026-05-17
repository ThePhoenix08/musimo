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

    async def extract_and_store(self, audio_file_id):

        audio = await self._audio_repo.get_by_id(audio_file_id)

        if not audio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audio not found",
            )
        """ # Download file from Supabase"""
        file_bytes = await self._storage.download_file(
            bucket=CONSTANTS.SUPABASE_AUDIO_SOURCE_BUCKET,
            path=audio.file_path,
        )

        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to download audio file",
            )

        temp_path = None

        try:
            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                tmp.write(file_bytes)
                temp_path = tmp.name

            # OPTIMIZED AUDIO LOADING

            TARGET_SR = 22050
            N_FFT = 1024
            HOP_LENGTH = 512

            y, sr = librosa.load(
                temp_path,
                sr=TARGET_SR,
            )

            y = y.astype(np.float32)

            stft = np.abs(
                librosa.stft(
                    y,
                    n_fft=N_FFT,
                    hop_length=HOP_LENGTH,
                )
            )

            mfcc = librosa.feature.mfcc(
                y=y,
                sr=sr,
                n_mfcc=13,
                n_fft=N_FFT,
                hop_length=HOP_LENGTH,
            )

            mfcc_delta = librosa.feature.delta(mfcc)

            mfcc_mean = np.mean(mfcc, axis=1)
            mfcc_std = np.std(mfcc, axis=1)

            mfcc_delta_mean = np.mean(mfcc_delta, axis=1)
            mfcc_delta_std = np.std(mfcc_delta, axis=1)

            centroid = librosa.feature.spectral_centroid(
                S=stft,
                sr=sr,
            )

            bandwidth = librosa.feature.spectral_bandwidth(
                S=stft,
                sr=sr,
            )

            contrast = librosa.feature.spectral_contrast(
                S=stft,
                sr=sr,
            )

            rolloff = librosa.feature.spectral_rolloff(
                S=stft,
                sr=sr,
            )

            flatness = librosa.feature.spectral_flatness(
                S=stft,
            )

            onset_env = librosa.onset.onset_strength(
                y=y,
                sr=sr,
                hop_length=HOP_LENGTH,
            )

            tempo, beats = librosa.beat.beat_track(
                onset_envelope=onset_env,
                sr=sr,
            )

            chroma = librosa.feature.chroma_stft(
                S=stft,
                sr=sr,
            )

            y_harmonic = librosa.effects.harmonic(y)

            tonnetz = librosa.feature.tonnetz(
                y=y_harmonic,
                sr=sr,
            )

            zcr = librosa.feature.zero_crossing_rate(
                y,
                hop_length=HOP_LENGTH,
            )

            rms = librosa.feature.rms(
                S=stft,
                frame_length=N_FFT,
                hop_length=HOP_LENGTH,
            )

            features = {
                "simple_rate": sr,
                "Audio_Length": len(y) / sr,

                "mfcc": {
                    "mean": mfcc_mean.tolist(),
                    "std": mfcc_std.tolist(),
                },

                "mfcc_delta": {
                    "mean": mfcc_delta_mean.tolist(),
                    "std": mfcc_delta_std.tolist(),
                },

                "zcr": {
                    "mean": float(np.mean(zcr)),
                    "std": float(np.std(zcr)),
                },

                "rms": {
                    "mean": float(np.mean(rms)),
                    "std": float(np.std(rms)),
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

                "tempo": float(np.mean(tempo)),

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

            analysis = await self._analysis_repo.get_by_audio(audio_file_id)

            if not analysis:
                analysis = await self._analysis_repo.create(
                    audio_file_id=audio_file_id,
                    project_id=audio.project_id,
                    feature_vector=features,
                )

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
                    feature_type=FeatureType.LOW_LEVEL,
                )

            await self._session.commit()

            return {
                "analysis_id": str(analysis.id),
                "audio_file_id": str(audio.id),
                "features": features,
            }

        finally:

            """# Cleanup temp file"""

            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

    """# Get Features"""

    async def get_all_features(self, audio_file_id):

        audio = await self._audio_repo.get_by_id(audio_file_id)

        if not audio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audio not found",
            )

        result = []

        for feature in audio.audio_features:

            result.append(
                {
                    "analysis_id": str(feature.analysis_record_id),
                    "feature_type": str(feature.feature_type),
                    "data": feature.data,
                }
            )

        return result