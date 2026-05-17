# ==========================================================
# src/routes/analysis_routes.py
# NEW ROUTE
# ==========================================================

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.session import get_db
from src.schemas.analysis_record import EmotionAnalysisApiResponse
from src.services.analysis_service import AnalysisService
from src.schemas.analysis_record import InstrumentAnalysisApiResponse

router = APIRouter()


@router.get(
    "/emotion/{project_id}",
    response_model=EmotionAnalysisApiResponse,
)
async def get_emotion_analysis(
    project_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    data = await AnalysisService.get_emotion_analysis(db, project_id)

    return EmotionAnalysisApiResponse(data=data)

@router.get(
    "/instrument/{project_id}",
    response_model=InstrumentAnalysisApiResponse,
)
async def get_instrument_analysis(
    project_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    data = await AnalysisService.get_instrument_analysis(
        db,
        project_id,
    )

    return InstrumentAnalysisApiResponse(data=data)