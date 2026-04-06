from sqlalchemy import select
from src.database.models.audio_feature import AudioFeature


class AudioFeatureRepository:
    def __init__(self, session):
        self._session = session

    # =========================
    # Get features by audio
    # =========================
    async def get_by_audio(self, audio_file_id):
        result = await self._session.execute(
            select(AudioFeature).where(
                AudioFeature.audio_file_id == audio_file_id
            )
        )
        return list(result.scalars().all())

    # =========================
    # Create new feature
    # =========================
    async def create(
        self,
        audio_file_id,
        analysis_record_id,
        data,
        feature_type
    ):
        feature = AudioFeature(
            audio_file_id=audio_file_id,
            analysis_record_id=analysis_record_id,
            data=data,
            feature_type=feature_type
        )

        self._session.add(feature)
        await self._session.flush()
        return feature

    # =========================
    # Update existing feature
    # =========================
    async def update(self, feature, data):
        feature.data = data
        await self._session.flush()
        return feature

    # =========================
    # Delete feature
    # =========================
    async def delete(self, feature):
        await self._session.delete(feature)
        await self._session.flush()