import logging

from src.core.separation_jobState import jobs_storage, websocket_connections

logger = logging.getLogger(__name__)


async def send_progress_update(job_id: str, progress: int, message: str):
    """Send progress update to WebSocket client and update job storage"""
    progress_data = {
        "job_id": job_id,
        "progress": progress,
        "message": message,
    }

    logger.info(f"Job {job_id}: {progress}% - {message}")

    # Update job storage
    if job_id in jobs_storage:
        jobs_storage[job_id]["progress"] = progress
        jobs_storage[job_id]["message"] = message
        if progress == 100:
            jobs_storage[job_id]["status"] = "completed"
        elif progress == -1:
            jobs_storage[job_id]["status"] = "failed"
        else:
            jobs_storage[job_id]["status"] = "processing"

    # Send to WebSocket if connected
    if job_id in websocket_connections:
        try:
            await websocket_connections[job_id].send_json(progress_data)
        except Exception as e:
            logger.error(f"Error sending WebSocket message for job {job_id}: {e}")
