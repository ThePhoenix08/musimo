import logging
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.model_service import ModelService
from src.models.progress_tracker import ProgressTracker
from src.repo.analysisRepo import AnalysisRepository
from src.schemas.analysis_record import EmotionAnalysisRecordResponse

logger = logging.getLogger(__name__)


class AnalysisService:
    def __init__(self, session: AsyncSession):
        self._session = session
        self._repo = AnalysisRepository(session)

    async def run_emotion_model(
        self,
        *,
        audio_path: str,
        prediction_type: str,
        tracker: ProgressTracker,
    ) -> dict:
        return await ModelService.predict_emotion_with_progress(
            audio_path=audio_path,
            prediction_type=prediction_type,
            tracker=tracker,
        )

    def _generate_summary(self, result: dict) -> str:
        """
        Keep simple for now. Upgrade later with LLM summaries if needed.
        """
        if "static" in result:
            return "Emotion analysis completed successfully."

        return "Emotion prediction generated."

    async def upsert_emotion_analysis(
        self,
        *,
        project_id: uuid.UUID,
        audio_file_id: uuid.UUID,
        prediction_result: dict,
        embeddings: dict | list | None = None,
        model_id: uuid.UUID | None = None,
    ):
        existing = await self._repo.get_emotion_analysis_by_project_id(project_id)

        summary = self._generate_summary(prediction_result)

        if existing:
            row = await self._repo.update_emotion_record(
                existing,
                prediction_result=prediction_result,
                summary_text=summary,
                results=prediction_result,
                embeddings=embeddings,
            )
        else:
            row = await self._repo.create_emotion_record(
                project_id=project_id,
                audio_file_id=audio_file_id,
                model_id=model_id,
                prediction_result=prediction_result,
                summary_text=summary,
                results=prediction_result,
                embeddings=embeddings,
            )

        await self._session.commit()
        return row
    
    @staticmethod
    async def get_emotion_analysis(
        db,
        project_id: uuid.UUID,
    ) -> EmotionAnalysisRecordResponse:
        repo = AnalysisRepository(session=db)

        row = await repo.get_emotion_analysis_by_project_id(project_id)

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Emotion analysis not found",
            )
        
        logger.debug(row)

        return EmotionAnalysisRecordResponse.model_validate(row)
    
    async def run_instrument_model(
        self,
        *,
        audio_path: str,
    ) -> dict:
        return await ModelService.predict_instrument(
        audio_path=audio_path,
        threshold=0.5,
        detailed=False,
    )

    async def upsert_instrument_analysis(
        self,
        *,
        project_id: uuid.UUID,
        audio_file_id: uuid.UUID,
        prediction_result: dict,
    ):
        existing = await self._repo.get_instrument_by_project_id(project_id)

        summary = "Instrument analysis completed successfully."

        if existing:
            row = await self._repo.update_instrument_record(
            existing,
            prediction_result=prediction_result,
            summary_text=summary,
            results=prediction_result,
        )
        else:
            row = await self._repo.create_instrument_record(
            project_id=project_id,
            audio_file_id=audio_file_id,
            prediction_result=prediction_result,
            summary_text=summary,
            results=prediction_result,
        )

        await self._session.commit()
        return row