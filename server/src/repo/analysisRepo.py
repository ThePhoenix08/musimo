import json
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

    @staticmethod
    def sanitize_json(value):
        return json.loads(json.dumps(value, default=str))

    def sanitize_row(self, row):
        if row.results is not None:
            row.results = self.sanitize_json(row.results)

        if hasattr(row, "prediction_result") and row.prediction_result is not None:
            row.prediction_result = self.sanitize_json(row.prediction_result)

        if hasattr(row, "vgg_embeddings") and row.vgg_embeddings is not None:
            row.vgg_embeddings = self.sanitize_json(row.vgg_embeddings)

        return row

    async def get_emotion_analysis_by_project_id(
        self,
        project_id: uuid.UUID,
    ) -> EmotionAnalysisRecord | None:
        stmt = select(EmotionAnalysisRecord).where(
            EmotionAnalysisRecord.project_id == project_id
        )

        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_emotion_record(
        self,
        *,
        project_id: uuid.UUID,
        audio_file_id: uuid.UUID,
        model_id: uuid.UUID | None,
        prediction_result: dict,
        summary_text: str,
        results: dict,
        embeddings: dict | list | None = None,
    ) -> EmotionAnalysisRecord:
        row = EmotionAnalysisRecord(
            project_id=project_id,
            audio_file_id=audio_file_id,
            model_id=model_id,
            summary_text=summary_text,
            results=results,
            prediction_result=prediction_result,
            vgg_embeddings=embeddings,
        )

        self._session.add(row)
        await self._session.flush()
        await self._session.refresh(row)

        row = self.sanitize_row(row)

        return row

    async def update_emotion_record(
        self,
        record: EmotionAnalysisRecord,
        *,
        prediction_result: dict,
        summary_text: str,
        results: dict,
        embeddings: dict | list | None = None,
    ) -> EmotionAnalysisRecord:
        record.prediction_result = prediction_result
        record.summary_text = summary_text
        record.results = results
        record.vgg_embeddings = embeddings

        await self._session.flush()
        await self._session.refresh(record)

        record = self.sanitize_row(record)

        return record

    async def delete_emotion_record(self, record: EmotionAnalysisRecord) -> None:
        await self._session.delete(record)
    
    async def get_instrument_by_project_id(
        self,
        project_id: uuid.UUID,
    ) -> InstrumentAnalysisRecord | None:

        stmt = select(InstrumentAnalysisRecord).where(
            InstrumentAnalysisRecord.project_id == project_id,
            InstrumentAnalysisRecord.analysis_type == AnalysisType.INSTRUMENT
        )

        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def create_instrument_record(
        self,
        *,
        project_id: uuid.UUID,
        audio_file_id: uuid.UUID,
        prediction_result: dict,
        summary_text: str,
        results: dict,
    ) -> InstrumentAnalysisRecord:

        instruments = [
            item["instrument"]
            for item in prediction_result.get("detected_instruments", [])
        ]

        confidence_scores = {
            item["instrument"]: item["confidence"]
            for item in prediction_result.get("detected_instruments", [])
        }

        row = InstrumentAnalysisRecord(
            project_id=project_id,
            audio_file_id=audio_file_id,
            summary_text=summary_text,
            results=results,
            instruments=instruments,
            confidence_scores=confidence_scores,
            analysis_type=AnalysisType.INSTRUMENT  
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
        summary_text: str,
        results: dict,
    ) -> InstrumentAnalysisRecord:

        # Extract again (same logic as create)
        instruments = [
            item["instrument"]
            for item in prediction_result.get("detected_instruments", [])
        ]

        confidence_scores = {
            item["instrument"]: item["confidence"]
            for item in prediction_result.get("detected_instruments", [])
        }

    # Update fields
        record.summary_text = summary_text
        record.results = results
        record.instruments = instruments
        record.confidence_scores = confidence_scores

        await self._session.flush()
        await self._session.refresh(record)

        return record
    

