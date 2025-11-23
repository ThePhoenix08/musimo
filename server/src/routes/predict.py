# API routes for Musical AI model predictions
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from typing import Dict, Literal
from pathlib import Path
from src.schemas.schemas import ModelPrediction
from src.services.dependencies import get_current_user
from src.services.audio_service import AudioService
from src.models.model_service import ModelService
from src.services.database_client import get_supabase_client
from src.services.config import settings
import os
import secrets

router = APIRouter()

def generate_transaction_id() -> str:
    """Generate unique transaction ID"""
    return f"txn_{secrets.token_urlsafe(16)}"

@router.post("/predict", response_model=ModelPrediction)
async def predict_audio(
    audio_file: UploadFile = File(...),
    model_type: Literal["emotion_detection", "instrument_classification"] = Form(...),
    current_user: Dict = Depends(get_current_user)
):
       
    file_ext = os.path.splitext(audio_file.filename)[1].lower()
    if file_ext not in settings.ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid audio format. Allowed: {', '.join(settings.ALLOWED_AUDIO_EXTENSIONS)}"
        )
    
    contents = await audio_file.read()
    if len(contents) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum of {settings.MAX_FILE_SIZE / (1024*1024):.1f}MB"
        )
    
    try:
        transaction_id = generate_transaction_id()
        
        upload_dir = Path(settings.UPLOAD_DIR)
        audio_dir = upload_dir / "audio" / current_user["id"]
        spectrogram_dir = upload_dir / "spectrograms" / current_user["id"]
        
        audio_dir.mkdir(parents=True, exist_ok=True)
        spectrogram_dir.mkdir(parents=True, exist_ok=True)
        
        audio_filename = f"{transaction_id}{file_ext}"
        audio_path = audio_dir / audio_filename
        
        with open(audio_path, "wb") as f:
            f.write(contents)
        
        is_valid, error_msg = AudioService.validate_audio_file(str(audio_path))
        if not is_valid:
            os.remove(audio_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
        
        spectrogram_filename = f"{transaction_id}.png"
        spectrogram_path = spectrogram_dir / spectrogram_filename
        
        success = AudioService.generate_melspectrogram(
            str(audio_path),
            str(spectrogram_path)
        )
        
        if not success:
            os.remove(audio_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate mel spectrogram"
            )
        
        prediction_result = ModelService.predict(
            model_type=model_type,
            melspectrogram_path=str(spectrogram_path)
        )
        
        supabase = get_supabase_client()
        
        transaction_data = {
            "transaction_id": transaction_id,
            "user_id": current_user["id"],
            "model_type": model_type,
            "audio_path": str(audio_path),
            "melspectrogram_path": str(spectrogram_path),
            "output": prediction_result
        }
        
        result = supabase.table('transactions').insert(transaction_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save transaction"
            )
        
        log_data = {
            "user_id": current_user["id"],
            "transaction_id": transaction_id,
            "action": "model_prediction",
            "model_type": model_type,
            "status": "success"
        }
        supabase.table('logs').insert(log_data).execute()
        
        return ModelPrediction(
            model_type=model_type,
            prediction=prediction_result["prediction"],
            confidence=prediction_result["confidence"],
            probabilities=prediction_result["probabilities"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        try:
            supabase = get_supabase_client()
            log_data = {
                "user_id": current_user["id"],
                "action": "model_prediction",
                "model_type": model_type,
                "status": "error",
                "error_message": str(e)
            }
            supabase.table('logs').insert(log_data).execute()
        except:
            pass
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing audio: {str(e)}"
        )

@router.get("/models")
async def get_available_models():
    """Get list of available models"""
    return {
        "models": [
            {
                "type": "emotion_detection",
                "name": "Music Emotion Detection",
                "description": "Detects emotional content in music",
                "labels": ModelService.EMOTION_LABELS
            },
            {
                "type": "instrument_classification",
                "name": "Instrument Classification",
                "description": "Identifies musical instruments in audio",
                "labels": ModelService.INSTRUMENT_LABELS
            }
        ]
    }