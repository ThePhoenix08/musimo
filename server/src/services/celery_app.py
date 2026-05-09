from dotenv import load_dotenv
load_dotenv(override=True)  # 👈 must be first before any other imports

from celery import Celery
from celery.schedules import crontab


celery_app = Celery(
    "stem_worker",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
    include=["src.services.stem_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
)


celery_app.conf.beat_schedule = {
    "cleanup-expired-audio-every-hour": {
        "task": "src.tasks.cleanup_expired_audio.cleanup_expired_audio",
        "schedule": crontab(minute=0),
    },
}