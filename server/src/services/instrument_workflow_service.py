import os
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.services.analysis_service import AnalysisService
from src.services.audio_file import AudioFileService
from src.services.project import ProjectService


class InstrumentWorkflowService:
    def __init__(self, session: AsyncSession, storage):
        self._session = session
        self._project_service = ProjectService(session)
        self._audio_service = AudioFileService(session, storage)
        self._analysis_service = AnalysisService(session)

    async def run(
        self,
        *,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
        tracker,
    ) -> dict:
        temp_path = None

        try:
            # ✅ Validate project
            await tracker.start_step("validate_project")

            project = await self._project_service._get_or_404(
                project_id,
                user_id,
            )

            if not project.main_audio_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Project has no main audio file.",
                )

            await tracker.complete_step("validate_project")

            # ✅ Fetch audio
            await tracker.start_step("fetch_audio")

            audio = await self._audio_service.get_audio_file(
                audio_file_id=project.main_audio_id,
                project_id=project_id,
                user_id=user_id,
            )

            file_bytes = await self._audio_service._storage.download_file(
                bucket="audio_source",
                path=audio.file_path,
            )

            suffix = os.path.splitext(audio.file_name)[1] or ".wav"

            from src.routes.websocket.utils import write_temp_audio_file
            temp_path = await write_temp_audio_file(file_bytes, suffix)

            await tracker.complete_step("fetch_audio")

            # ✅ Run instrument model
            await tracker.start_step("predict")

            result = await self._analysis_service.run_instrument_model(
                audio_path=temp_path,
            )

            await tracker.complete_step("predict")

            # ✅ Store results
            await tracker.start_step("store_results")

            row = await self._analysis_service.upsert_instrument_analysis(
                project_id=project_id,
                audio_file_id=project.main_audio_id,
                prediction_result=result,
            )

            await tracker.complete_step("store_results")

            return {
                "analysis_id": str(row.id),
                "project_id": str(project_id),
                "result": result,
            }

        finally:
            if temp_path and os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                except Exception:
                    pass