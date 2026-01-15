from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from src.models.audio_separation.app.utils.file_utils import save_temp_audio
from src.models.audio_separation.app.pipelines.separation import separate_audio
from pathlib import Path


router = APIRouter(prefix="/audio", tags=["Audio"])

@router.post("/separate")
async def separate_audio_route(file: UploadFile = File(...)):

    
    if not file.filename.lower().endswith((".wav", ".mp3", ".flac")):
        raise HTTPException(status_code=400, detail="Unsupported audio format")

    # Save temp file
    job_id, audio_path = save_temp_audio(file)

    try:
        stems = separate_audio(audio_path, job_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "job_id": job_id,
        "stems": {
            "bass": f"/audio/download/{job_id}/bass",
            "drums": f"/audio/download/{job_id}/drums",
            "other": f"/audio/download/{job_id}/other",
            "vocals": f"/audio/download/{job_id}/vocals"
        }
    }


@router.get("/download/{job_id}/{stem}")
def download_stem(job_id: str, stem: str):

    stem_dir=Path("temp/outputs")/job_id/"htdemucs"/job_id

    allowed={"vocals", "drums", "bass", "other"}

    if stem not in allowed:
        raise HTTPException(status_code=400, detail="Invalid stem")


    stem_path = stem_dir / f"{stem}.wav"

    if not stem_path.exists():
        raise HTTPException(status_code=404, detail="Stem not found")

    return FileResponse(
        stem_path,
        media_type="audio/wav",
        filename=f"{stem}.wav"
    )