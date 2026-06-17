from dotenv import load_dotenv
from celery import Celery

load_dotenv(override=True)

from src.core.settings import CONSTANTS  # noqa: E402


celery_app = Celery(
    "stem_worker",
    broker=CONSTANTS.REDIS_URL,
    backend=CONSTANTS.REDIS_URL,
    include=["src.services.stem_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
)
