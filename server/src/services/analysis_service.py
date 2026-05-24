import json
import logging
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from src.models.model_service import ModelService
from src.models.progress_tracker import ProgressTracker
from src.repo.analysisRepo import AnalysisRepository
from src.schemas.analysis_record import EmotionAnalysisRecordResponse
from src.services.llm_service import LLMSummaryService

logger = logging.getLogger(__name__)


class AnalysisService:
    def __init__(self, session: AsyncSession):
        self._session = session
        self._repo = AnalysisRepository(session)
        self._llm_summary = LLMSummaryService()

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

    async def _generate_summary(self, result: dict, summary_type: str) -> dict | None:
        try:
            summary = self._llm_summary.generate(
            summary_type=summary_type,  
            data=json.dumps(result),
        )
            return summary

        except Exception:
            logger.exception("Failed generating %s summary", summary_type)
            return None


    async def upsert_emotion_analysis(
        self,
        *,
        project_id: uuid.UUID,
        audio_file_id: uuid.UUID,    
        prediction_result: dict,
        embeddings: dict | list | None = None,
        model_id: uuid.UUID | None = None,
    ):

        summary = await self._generate_summary(prediction_result, summary_type="emotion")

        if not summary:
            summary = {}

        existing = await self._repo.get_emotion_analysis_by_project_id(project_id)

        if existing:
            row = await self._repo.update_emotion_record(
                existing,
                prediction_result=prediction_result,
                summary=summary,
                results=prediction_result,
                embeddings=embeddings,
            )

        else:
            try:
                row = await self._repo.create_emotion_record(
                    project_id=project_id,
                    audio_file_id=audio_file_id,
                    model_id=model_id,
                    prediction_result=prediction_result,
                    summary=summary,
                    results=prediction_result,
                    embeddings=embeddings,
                )

            except IntegrityError:
                await self._session.rollback()
                self._session.expire_all()

                existing = await self._repo.get_emotion_analysis_by_project_id(
                    project_id
                )

                if not existing:
                    raise

                row = await self._repo.update_emotion_record(
                    existing,
                    prediction_result=prediction_result,
                    summary=summary,
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

    async def delete_emotion_analysis(
        self,
        project_id: uuid.UUID
    ):
        row = await self._repo.get_emotion_analysis_by_project_id(
            project_id
        )

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Emotion analysis not found",
            )

        await self._repo.delete_emotion_record(row)

        await self._session.commit()

        return {
            "message": "Emotion analysis deleted successfully",
        }
    
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
        
        summary = await self._generate_summary(prediction_result, summary_type="instrument")

        if not summary:
            summary = {}

        existing = await self._repo.get_instrument_by_project_id(project_id)

        if existing:
            row = await self._repo.update_instrument_record(
            existing,
            prediction_result=prediction_result,
            summary=summary,
            results=prediction_result,
        )
        else:
            row = await self._repo.create_instrument_record(
            project_id=project_id,
            audio_file_id=audio_file_id,
            prediction_result=prediction_result,
            summary=summary,
            results=prediction_result,
        )

        await self._session.commit()
        return row

    @staticmethod
    async def get_instrument_analysis(
        db,
        project_id: uuid.UUID,
    ):
        repo = AnalysisRepository(session=db)

        row = await repo.get_instrument_by_project_id(project_id)

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Instrument analysis not found",
            )

        return row