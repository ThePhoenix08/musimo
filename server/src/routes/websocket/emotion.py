import logging
import os
import uuid

from fastapi import WebSocket, WebSocketDisconnect
from fastapi.websockets import WebSocketState

from src.models.progress_tracker import ProgressTracker
from src.routes.websocket.utils import (
    create_progress_callback,
    manager,
    write_temp_audio_file,
)
from src.routes.websocket.ws_router import router
from src.services.analysis_service import AnalysisService
from src.services.audio_file import AudioFileService
from src.services.project import ProjectService

logger = logging.getLogger(__name__)


EMOTION_PIPELINE_STEPS = [
    {"id": "load_audio", "name": "Loading Audio File"},
    {"id": "preprocess", "name": "Preprocessing Audio"},
    {"id": "extract_embeddings", "name": "Extracting Audio Embeddings"},
    {"id": "predict", "name": "Running Emotion Model"},
    {"id": "postprocess", "name": "Formatting Results"},
]

# WS ROUTE: api/ws/analyze-emotion/{project_id}
# steps
    # extract project_id
    # check if project exists
        # ProjectService => checkProjectExists
    # extract main_audio_id of project
    # seek and grab audio from bucket of that id
        # AudioFileService => getAudioFileFromBucketById
    # start the analysis pipeline on the audio
        # AnalysisService => predict_emotion_with_progress
    # analysis pipeline
    # upon completion, store results into emotion_analysis_record
        # AnalysisService => CreateEmotionAnalysisRecord
    # send response back

@router.websocket("/analyze-emotion/{project_id}")
async def ws_analyze_emotion(websocket: WebSocket, project_id: str):
    session_id = str(uuid.uuid4())
    temp_audio_path = None

    await manager.connect(session_id, websocket)

    tracker = ProgressTracker(
        steps=EMOTION_PIPELINE_STEPS,
        callback=create_progress_callback(session_id),
        session_id=session_id
    )

    try:
        await websocket.send_json(
            {
                "type": "connected",
                "session_id": session_id,
                "project_id": project_id,
            }
        )

        # validate project
        await tracker.start_step("validate_project")

        project = await ProjectService.check_project_exists(project_id)

        if not project:
            raise ValueError("Project not found")

        await tracker.complete_step("validate_project")

        # fetch audio file
        await tracker.start_step("fetch_audio")

        if not project.main_audio_id:
            raise ValueError("Project has no main audio")

        audio_bytes = await AudioFileService.get_audio_file_from_bucket_by_id(
            project.main_audio_id
        )

        temp_audio_path = await write_temp_audio_file(audio_bytes)

        await tracker.complete_step("fetch_audio")

        # run analysis
        result = await AnalysisService.predict_emotion_with_progress(
            audio_path=temp_audio_path,
            prediction_type="both",
            tracker=tracker,
        )

        # store results
        await tracker.start_step("store_results")

        saved_record = await AnalysisService.create_emotion_analysis_record(
            project_id=project_id,
            audio_file_id=project.main_audio_id,
            result=result,
        )

        await tracker.complete_step("store_results")

        # complete
        await tracker.complete_pipeline(result)

        await websocket.send_json(
            {
                "type": "analysis_complete",
                "session_id": session_id,
                "project_id": project_id,
                "analysis_id": str(saved_record.id),
                "result": result,
            }
        )

    except WebSocketDisconnect:
        logger.info("Client disconnected")

    except Exception as e:
        logger.exception("Emotion WS failed")

        try:
            await tracker.fail_pipeline(str(e))
        except Exception:
            pass

        if websocket.client_state == WebSocketState.CONNECTED:
            await websocket.send_json(
                {
                    "type": "error",
                    "session_id": session_id,
                    "error": str(e),
                    "error_type": type(e).__name__,
                }
            )

    finally:
        manager.disconnect(session_id)

        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.unlink(temp_audio_path)
            except Exception:
                pass
