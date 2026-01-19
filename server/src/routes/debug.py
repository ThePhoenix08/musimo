"""
Audio Analysis Router
Handles both emotion detection and instrument classification endpoints
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import JSONResponse
from tempfile import NamedTemporaryFile
import shutil
import os
import logging

from ..models.model_service import ModelService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/audio", tags=["Debug"])


# =========================== EMOTION ENDPOINTS ===========================

# @router.post("/predict-emotion")
# async def predict_emotion(
#     file: UploadFile = File(..., description="Audio file for emotion detection"),
#     prediction_type: str = Query(
#         default="both",
#         description="Prediction type: 'static', 'dynamic', or 'both'"
#     )
# ):
#     """
#     Predict emotion from audio file
    
#     **Prediction Types:**
#     - static: Static emotion prediction
#     - dynamic: Dynamic emotion prediction
#     - both: Both static and dynamic predictions
#     """
#     temp_path = None
    
#     try:
#         # Save uploaded file
#         temp_path = NamedTemporaryFile(delete=False, suffix=".wav")
#         with open(temp_path.name, "wb") as buffer:
#             shutil.copyfileobj(file.file, buffer)
        
#         # Predict emotion
#         result = await ModelService.predict_emotion(temp_path.name, prediction_type)
        
#         return JSONResponse(content=result)
        
#     except Exception as e:
#         logger.error(f"Emotion prediction error: {e}", exc_info=True)
#         raise HTTPException(status_code=500, detail=str(e))
#     finally:
#         # Cleanup temp file
#         if temp_path and os.path.exists(temp_path.name):
#             os.unlink(temp_path.name)

@router.post("/predict-audio")
async def debug_predict_audio(
    file: UploadFile = File(..., description="Audio file for emotion detection"),
    prediction_type: str = Query(
        default="both",
        description="Prediction type: 'static', 'dynamic', or 'both'"
    )
):
    ModelService.initialize_emotion_pipeline()

    temp_path = NamedTemporaryFile(delete=False, suffix=".wav")
    with open(temp_path.name, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = await ModelService.predict_emotion(temp_path, prediction_type)
    return result


# =========================== INSTRUMENT ENDPOINTS ===========================

@router.post("/predict-instrument")
async def predict_instrument(
    file: UploadFile = File(...),
    threshold: float = Query(0.5, ge=0.0, le=1.0),
    detailed: bool = Query(False),
):
    temp_path = None

    try:
        allowed_ext = {".mp3", ".wav", ".ogg", ".flac", ".m4a"}
        file_ext = os.path.splitext(file.filename)[1].lower()

        if file_ext not in allowed_ext:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: {file_ext}"
            )

        # ✅ Windows-safe temp file
        temp_path = NamedTemporaryFile(delete=False, suffix=file_ext)
        temp_path.close()  # VERY IMPORTANT on Windows

        with open(temp_path.name, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        logger.info(f"Processing instrument detection: {file.filename}")

        result = await ModelService.predict_instrument(
            audio_path=temp_path.name,
            threshold=threshold,
            detailed=detailed,
            filename=file.filename
        )

        return JSONResponse(content=result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Instrument prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # ✅ Manual cleanup
        if temp_path and os.path.exists(temp_path.name):
            os.unlink(temp_path.name)

@router.get("/instruments")
async def get_instruments():
    """
    Get list of all detectable instruments
    
    **Returns:**
    - List of 20 instruments the model can detect
    - Total count
    """
    try:
        info = await ModelService.get_instrument_info()
        
        if info.get("success"):
            return JSONResponse(content={
                "success": True,
                "instruments": info.get("instruments", []),
                "total": info.get("total_instruments", 0)
            })
        else:
            raise HTTPException(status_code=500, detail=info.get("error", "Unknown error"))
            
    except Exception as e:
        logger.error(f"Error getting instruments: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/instrument-info")
async def get_instrument_model_info():
    """
    Get detailed information about the instrument detection model
    
    **Returns:**
    - Model architecture details
    - List of supported instruments
    - Model parameters and configuration
    """
    try:
        info = await ModelService.get_instrument_info()
        return JSONResponse(content=info)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================== COMBINED ANALYSIS ===========================

@router.post("/predict-all")
async def predict_all(
    file: UploadFile = File(..., description="Audio file for complete analysis"),
    emotion_type: str = Query(
        default="both",
        description="Emotion prediction type"
    ),
    instrument_threshold: float = Query(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Instrument detection threshold"
    )
):
    """
    Analyze audio for BOTH emotion and instruments
    
    **Returns:**
    - Emotion predictions (static/dynamic/both)
    - Detected instruments with confidence scores
    - Complete audio analysis in one request
    
    **Example Response:**
    ```json
    {
        "success": true,
        "emotion": {...},
        "instruments": {
            "detected_instruments": [...],
            "total_detected": 2
        }
    }
    ```
    """
    temp_path = None
    
    try:
        # Validate file
        allowed_ext = {".mp3", ".wav", ".ogg", ".flac", ".m4a"}
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_ext:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported format: {file_ext}"
            )
        
        # Save temp file
        temp_path = NamedTemporaryFile(delete=False, suffix=file_ext)
        with open(temp_path.name, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"Running combined analysis: {file.filename}")
        
        # Predict both emotion and instruments
        result = await ModelService.predict_both(
            audio_path=temp_path.name,
            emotion_prediction_type=emotion_type,
            instrument_threshold=instrument_threshold
        )
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Combined prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path and os.path.exists(temp_path.name):
            os.unlink(temp_path.name)


# =========================== HEALTH CHECK ===========================

@router.get("/health")
async def health_check():
    """
    Check health status of all audio analysis models
    
    **Returns:**
    - Status of emotion detection model
    - Status of instrument detection model
    """
    try:
        health = await ModelService.health_check()
        return JSONResponse(content={
            "status": "healthy",
            "models": health
        })
    except Exception as e:
        return JSONResponse(
            content={"status": "unhealthy", "error": str(e)},
            status_code=503
        )