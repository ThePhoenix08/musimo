import time
from dataclasses import asdict, dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Optional

from src.core.logger_setup import logger

"""
Progress tracking system for ML pipelines with WebSocket support
"""


class StepStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class PipelineStep:
    """Represents a single step in the pipeline"""

    id: str
    name: str
    status: StepStatus = StepStatus.PENDING
    progress: float = 0.0  # 0-100
    message: Optional[str] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    metadata: Optional[dict] = None

    def to_dict(self):
        data = asdict(self)
        data["status"] = self.status.value
        data["duration"] = self.duration
        return data

    @property
    def duration(self) -> Optional[float]:
        if self.start_time and self.end_time:
            return self.end_time - self.start_time
        elif self.start_time:
            return time.time() - self.start_time
        return None


class ProgressTracker:
    """
    Tracks progress through a multi-step pipeline and emits updates via callback

    Usage:
        tracker = ProgressTracker(steps=[...], callback=emit_to_websocket)
        await tracker.start_step("preprocessing", message="Loading audio...")
        await tracker.update_progress("preprocessing", 50, "Resampling...")
        await tracker.complete_step("preprocessing", metadata={"duration": 1.2})
    """

    def __init__(
        self,
        steps: list[dict],
        callback: Optional[Callable] = None,
        session_id: Optional[str] = None,
    ):
        """
        Args:
            steps: List of dicts with 'id' and 'name' keys
            callback: Async function to call with updates
            session_id: Unique identifier for this processing session
        """
        self.steps = {
            step["id"]: PipelineStep(id=step["id"], name=step["name"]) for step in steps
        }
        self.callback = callback
        self.session_id = session_id or datetime.now().isoformat()
        self.overall_progress = 0.0
        self.start_time = time.time()
        self.current_step_id = None

    async def _emit_update(self, event_type: str, data: dict):
        """Emit update through callback if available"""
        if self.callback:
            try:
                await self.callback(
                    {
                        "type": event_type,
                        "session_id": self.session_id,
                        "timestamp": datetime.now().isoformat(),
                        "overall_progress": self.overall_progress,
                        "total_duration": time.time() - self.start_time,
                        **data,
                    }
                )
            except Exception as e:
                logger.error(f"Error emitting update: {e}")

    async def start_step(self, step_id: str, message: Optional[str] = None):
        """Mark a step as started"""
        if step_id not in self.steps:
            raise ValueError(f"Unknown step: {step_id}")

        step = self.steps[step_id]
        step.status = StepStatus.IN_PROGRESS
        step.start_time = time.time()
        step.progress = 0.0
        step.message = message
        self.current_step_id = step_id

        await self._emit_update(
            "step_started",
            {
                "step": step.to_dict(),
                "all_steps": [s.to_dict() for s in self.steps.values()],
            },
        )

    async def update_progress(
        self,
        step_id: str,
        progress: float,
        message: Optional[str] = None,
        metadata: Optional[dict] = None,
    ):
        """Update progress within a step (0-100)"""
        if step_id not in self.steps:
            raise ValueError(f"Unknown step: {step_id}")

        step = self.steps[step_id]
        step.progress = max(0, min(100, progress))
        if message:
            step.message = message
        if metadata:
            step.metadata = {**(step.metadata or {}), **metadata}

        # Calculate overall progress
        total_steps = len(self.steps)
        completed_steps = sum(
            1 for s in self.steps.values() if s.status == StepStatus.COMPLETED
        )
        current_step_contribution = step.progress / 100 / total_steps
        self.overall_progress = (completed_steps / total_steps * 100) + (
            current_step_contribution * 100
        )

        await self._emit_update(
            "progress_update",
            {
                "step": step.to_dict(),
                "all_steps": [s.to_dict() for s in self.steps.values()],
            },
        )

    async def complete_step(
        self,
        step_id: str,
        message: Optional[str] = None,
        metadata: Optional[dict] = None,
    ):
        """Mark a step as completed"""
        if step_id not in self.steps:
            raise ValueError(f"Unknown step: {step_id}")

        step = self.steps[step_id]
        step.status = StepStatus.COMPLETED
        step.end_time = time.time()
        step.progress = 100.0
        if message:
            step.message = message
        if metadata:
            step.metadata = {**(step.metadata or {}), **metadata}

        # Update overall progress
        completed_steps = sum(
            1 for s in self.steps.values() if s.status == StepStatus.COMPLETED
        )
        self.overall_progress = (completed_steps / len(self.steps)) * 100

        await self._emit_update(
            "step_completed",
            {
                "step": step.to_dict(),
                "all_steps": [s.to_dict() for s in self.steps.values()],
            },
        )

    async def fail_step(self, step_id: str, error: str):
        """Mark a step as failed"""
        if step_id not in self.steps:
            raise ValueError(f"Unknown step: {step_id}")

        step = self.steps[step_id]
        step.status = StepStatus.FAILED
        step.end_time = time.time()
        step.message = error

        await self._emit_update(
            "step_failed",
            {
                "step": step.to_dict(),
                "error": error,
                "all_steps": [s.to_dict() for s in self.steps.values()],
            },
        )

    async def skip_step(self, step_id: str, reason: str):
        """Mark a step as skipped"""
        if step_id not in self.steps:
            raise ValueError(f"Unknown step: {step_id}")

        step = self.steps[step_id]
        step.status = StepStatus.SKIPPED
        step.message = reason

        await self._emit_update(
            "step_skipped",
            {
                "step": step.to_dict(),
                "reason": reason,
                "all_steps": [s.to_dict() for s in self.steps.values()],
            },
        )

    async def complete_pipeline(self, result: Any = None):
        """Mark entire pipeline as completed"""
        self.overall_progress = 100.0

        await self._emit_update(
            "pipeline_completed",
            {
                "all_steps": [s.to_dict() for s in self.steps.values()],
                "total_duration": time.time() - self.start_time,
                "result": result,
            },
        )

    async def fail_pipeline(self, error: str):
        """Mark entire pipeline as failed"""
        await self._emit_update(
            "pipeline_failed",
            {
                "error": error,
                "all_steps": [s.to_dict() for s in self.steps.values()],
                "total_duration": time.time() - self.start_time,
            },
        )

    def get_summary(self) -> dict:
        """Get current state summary"""
        return {
            "session_id": self.session_id,
            "overall_progress": self.overall_progress,
            "total_duration": time.time() - self.start_time,
            "steps": [s.to_dict() for s in self.steps.values()],
            "current_step": self.current_step_id,
        }
