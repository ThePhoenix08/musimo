from sqlalchemy import select
from src.database.models.analysis_record import FeatureAnalysisRecord
from src.database.enums import AnalysisType


class FeatureAnalysisRepository:
    def __init__(self, session):
        self._session = session

    async def get_by_audio(self, audio_file_id):
        result = await self._session.execute(
            select(FeatureAnalysisRecord).where(
                FeatureAnalysisRecord.audio_file_id == audio_file_id
            )
        )
        return result.scalar_one_or_none()

    async def create(self, audio_file_id, project_id, feature_vector):
        record = FeatureAnalysisRecord(
            audio_file_id=audio_file_id,
            project_id=project_id,
            analysis_type=AnalysisType.FEATURES,
            summary_text="Audio Feature Analysis",
            results={},

            
            feature_vector=feature_vector
        )
        self._session.add(record)
        await self._session.flush()
        return record