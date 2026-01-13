# routes/debug_routes.py
from tempfile import NamedTemporaryFile
from fastapi import APIRouter, UploadFile
import shutil
from ..models.model_service import ModelService

router = APIRouter()

@router.post("/predict-audio")
async def debug_predict_audio(file: UploadFile, prediction_type: str = "static"):
    ModelService.initialize_emotion_pipeline()

    temp_path = NamedTemporaryFile(delete=False, suffix=".wav")
    with open(temp_path.name, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = await ModelService.predict_emotion(temp_path, prediction_type)
    return result
