from dotenv import load_dotenv
load_dotenv(override=True)

from celery import Celery

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