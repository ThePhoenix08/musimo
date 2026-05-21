import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.enums import AnalysisType
from src.database.models.analysis_record import (
    EmotionAnalysisRecord,
    InstrumentAnalysisRecord,
)


class AnalysisRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    # ==========================================================
    # EMOTION ANALYSIS
    # ==========================================================

    async def get_emotion_analysis_by_project_id(
        self,
        project_id: uuid.UUID,
    ) -> EmotionAnalysisRecord | None:

        stmt = select(EmotionAnalysisRecord).filter_by(
            project_id=project_id,
            analysis_type=AnalysisType.EMOTION,
        )
        

        result = await self._session.execute(stmt)

        row = result.scalar_one_or_none()

        return row

    async def create_emotion_record(
        self,
        *,
        project_id: uuid.UUID,
        audio_file_id: uuid.UUID,
        model_id: uuid.UUID | None,
        prediction_result: dict,
        summary: dict,
        results: dict,
        embeddings: dict | list | None = None,
    ) -> EmotionAnalysisRecord:

        row = EmotionAnalysisRecord(
            project_id=project_id,
            audio_file_id=audio_file_id,
            model_id=model_id,
            summary=summary,
            results=results,
            prediction_result=prediction_result,
            vgg_embeddings=embeddings,
            analysis_type=AnalysisType.EMOTION,
        )

        self._session.add(row)

        await self._session.flush()
        await self._session.refresh(row)

        return row

    async def update_emotion_record(
        self,
        record: EmotionAnalysisRecord,
        *,
        prediction_result: dict,
        summary: dict,
        results: dict,
        embeddings: dict | list | None = None,
    ) -> EmotionAnalysisRecord:

        record.prediction_result = prediction_result
        record.summary = summary
        record.results = results
        record.vgg_embeddings = embeddings

        await self._session.flush()
        await self._session.refresh(record)

        return record

    async def delete_emotion_record(
        self,
        record: EmotionAnalysisRecord,
    ) -> None:
        await self._session.delete(record)

    # ==========================================================
    # INSTRUMENT ANALYSIS
    # ==========================================================

    async def get_instrument_by_project_id(
        self,
        project_id: uuid.UUID,
    ) -> InstrumentAnalysisRecord | None:

        stmt = select(InstrumentAnalysisRecord).where(
            InstrumentAnalysisRecord.project_id == project_id
        )

        result = await self._session.execute(stmt)

        row = result.scalar_one_or_none()

        return row

    async def create_instrument_record(
        self,
        *,
        project_id: uuid.UUID,
        audio_file_id: uuid.UUID,
        prediction_result: dict,
        summary: dict,
        results: dict,
    ) -> InstrumentAnalysisRecord:

        instruments = [
            item["instrument"]
            for item in prediction_result.get(
                "detected_instruments",
                [],
            )
        ]

        confidence_scores = {
            item["instrument"]: item["confidence"]
            for item in prediction_result.get(
                "detected_instruments",
                [],
            )
        }

        row = InstrumentAnalysisRecord(
            project_id=project_id,
            audio_file_id=audio_file_id,
            summary=summary,
            results=results,
            instruments=instruments,
            confidence_scores=confidence_scores,
            analysis_type=AnalysisType.INSTRUMENT,
        )

        self._session.add(row)

        await self._session.flush()
        await self._session.refresh(row)

        return row

    async def update_instrument_record(
        self,
        record: InstrumentAnalysisRecord,
        *,
        prediction_result: dict,
        summary: dict,
        results: dict,
    ) -> InstrumentAnalysisRecord:

        instruments = [
            item["instrument"]
            for item in prediction_result.get(
                "detected_instruments",
                [],
            )
        ]

        confidence_scores = {
            item["instrument"]: item["confidence"]
            for item in prediction_result.get(
                "detected_instruments",
                [],
            )
        }

        record.summary = summary
        record.results = results
        record.instruments = instruments
        record.confidence_scores = confidence_scores

        await self._session.flush()
        await self._session.refresh(record)

        return record