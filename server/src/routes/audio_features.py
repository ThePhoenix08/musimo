import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.supabase import get_storage
from src.database.session import get_db
from src.schemas.api.response import ApiErrorResponse, ApiResponse
from src.services.audio_feature_service import AudioFeatureService

router = APIRouter()


""" Extract Features API """

@router.post("/extract")
async def extract_audio_features(
    audio_file_id: uuid.UUID = Query(..., description="Audio file ID"),
    db: AsyncSession = Depends(get_db),
    storage=Depends(get_storage)
):
    try:
        service = AudioFeatureService(db, storage)

        result = await service.extract_and_store(audio_file_id)

        return ApiResponse(
            message="Features extracted successfully",
            data=result
        )

    except Exception as e:
        print(f"Error in extract_audio_features: {str(e)}")  # Debugging log
        await db.rollback() 
        return ApiErrorResponse(
            code="FEATURE_EXTRACTION_FAILED",
            message="Failed to extract features",
            details=str(e),
        )


""" Get Features API"""

@router.get("/list")
async def get_audio_features(
    audio_file_id: uuid.UUID = Query(..., description="Audio file ID"),
    db: AsyncSession = Depends(get_db),
):
    try:
        service = AudioFeatureService(db, None)

        result = await service.get_all_features(audio_file_id)

        return ApiResponse(
            message="Features fetched successfully",
            data=result
        )

    except Exception as e:
        return ApiErrorResponse(
            code="FEATURE_FETCH_FAILED",
            message="Failed to fetch features",
            details=str(e),
        )