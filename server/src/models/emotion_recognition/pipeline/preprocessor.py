from dataclasses import dataclass
from typing import Awaitable, Callable, Optional, TypeAlias

import torch
import torchaudio
from torch import Tensor

from src.models.progress_tracker import ProgressTracker

PROGRESS_CALLBACK: TypeAlias = Callable[[str, float], Awaitable[None]]


@dataclass
class Preprocessing_Config:
    mono: bool = True
    resample: bool = True
    target_sr: int = 16000

    segment: bool = False
    segment_duration: float = 5.0
    segment_hop: float = 2.5


class Preprocessor:
    """
    Audio preprocessing: load, mono, resample, segment.
    Configurable via preprocess_config dict.
    """

    def __init__(self, config: dict | None = None):
        self.config = Preprocessing_Config(**(config or {}))

    async def load_audio(
        self, audio_path: str, tracker: Optional[ProgressTracker] = None
    ) -> tuple[Tensor, int]:
        if tracker:
            await tracker.update_progress("load_audio", 10, "Loading audio file...")

        waveform, sample_rate = torchaudio.load(audio_path)

        if tracker:
            await tracker.update_progress(
                "load_audio",
                90,
                f"Loaded {waveform.shape[-1]} samples at {sample_rate}Hz",
            )

        return waveform, sample_rate

    def make_mono(self, waveform: Tensor) -> Tensor:
        return waveform.mean(dim=0, keepdim=True) if waveform.shape[0] > 1 else waveform

    async def resample(
        self,
        waveform: Tensor,
        original_sample_rate: int,
        progress_callback: Optional[PROGRESS_CALLBACK] = None,
    ) -> tuple[Tensor, int]:
        if original_sample_rate != self.config.target_sr:
            if progress_callback:
                await progress_callback(
                    f"Resampling from {original_sample_rate}Hz to {self.config.target_sr}Hz...",
                    30,
                )

            resampler = torchaudio.transforms.Resample(
                original_sample_rate, self.config.target_sr
            )
            waveform = resampler(waveform)

            if progress_callback:
                await progress_callback("Resampling complete", 100)

            return waveform, self.config.target_sr

        return waveform, original_sample_rate

    def add_batch_dimension(self, waveform: Tensor) -> Tensor:
        return waveform.unsqueeze(0) if waveform.ndim == 1 else waveform

    async def segment_waveform(
        self,
        waveform: Tensor,
        sample_rate: int,
        progress_callback: Optional[PROGRESS_CALLBACK] = None,
    ):
        SAMPLES_IN_SEGMENT = int(self.config.segment_duration * sample_rate)
        SEGMENT_HOP_RATE = int(self.config.segment_hop * sample_rate)

        mono_waveform = (
            self.make_mono(waveform) if waveform.shape[0] > 1 else waveform[0]
        )
        TOTAL_SAMPLES = mono_waveform.shape[0]

        if TOTAL_SAMPLES < SAMPLES_IN_SEGMENT:
            PAD_LENGTH = SAMPLES_IN_SEGMENT - TOTAL_SAMPLES
            mono_waveform = torch.nn.functional.pad(mono_waveform, (0, PAD_LENGTH))
            TOTAL_SAMPLES = mono_waveform.shape[0]  # update

        MAX_START_INDEX = max(1, TOTAL_SAMPLES - SAMPLES_IN_SEGMENT + 1)
        NUM_SEGMENTS = len(range(0, MAX_START_INDEX, SEGMENT_HOP_RATE))
        if progress_callback:
            await progress_callback(f"Creating {NUM_SEGMENTS} segments...", 30)

        # segments: list[Tensor] = [
        #     mono_waveform[start : start + SAMPLES_IN_SEGMENT].unsqueeze(0).unsqueeze(0)
        #     for start in range(0, MAX_START_INDEX, SEGMENT_HOP_RATE)
        # ]

        segments: list[Tensor] = []
        for i, start in enumerate(range(0, MAX_START_INDEX, SEGMENT_HOP_RATE)):
            segment = (
                mono_waveform[start : start + SAMPLES_IN_SEGMENT]
                .unsqueeze(0)
                .unsqueeze(0)
            )
            segments.append(segment)

            # Update progress every 10 segments or at key milestones
            if progress_callback and (i % 10 == 0 or i == NUM_SEGMENTS - 1):
                progress = 30 + (i / NUM_SEGMENTS) * 70  # 30-100%
                await progress_callback(
                    f"Segmented {i + 1}/{NUM_SEGMENTS} chunks", progress
                )

        if not segments:
            return mono_waveform.unsqueeze(0).unsqueeze(0)

        result = torch.cat(segments, dim=0)

        if progress_callback:
            await progress_callback(f"Created {len(segments)} segments", 100)

        return result

    async def __call__(
        self,
        audio_path,
        segment_audio: bool,
        tracker: Optional[ProgressTracker] = None,
    ):
        """
        Preprocess audio file.
        param audio_path: Path to audio file.
        param tracker: Function to report progress.
        returns waveform, sample_rate, segments
        segments: Tensor of shape (num_segments, 1, segment_samples)
        """
        self.config.segment = segment_audio is not None

        if tracker:
            await tracker.start_step("load_audio", "Starting audio loading...")

        waveform, sample_rate = await self.load_audio(audio_path, tracker)

        if tracker:
            await tracker.complete_step("load_audio", "Audio loading complete")
            await tracker.start_step("preprocess", "Starting preprocessing...")

        if self.config.mono:
            if tracker:
                await tracker.update_progress("preprocess", 10, "Converting to mono...")
            waveform = self.make_mono(waveform)
            if tracker:
                await tracker.update_progress(
                    "preprocess", 15, "Mono conversion complete"
                )

        if self.config.resample:
            if tracker:
                await tracker.update_progress(
                    "preprocess", 20, "Preparing resampling..."
                )

            waveform, sample_rate = await self.resample(
                waveform,
                sample_rate,
                lambda msg, prog: (
                    tracker.update_progress("preprocess", 20 + prog * 0.20, msg)
                    if tracker
                    else None
                ),
            )

            if tracker:
                await tracker.update_progress("preprocess", 45, "Resampling complete")

        # Step 4: Add batch dimension (45-60%)
        if tracker:
            await tracker.update_progress(
                "preprocess", 50, "Formatting tensor dimensions..."
            )

        waveform = self.add_batch_dimension(waveform)

        if tracker:
            await tracker.update_progress("preprocess", 55, "Tensor formatted")

        # Step 5: Segmentation (60-100%)
        if self.config.segment:
            if tracker:
                await tracker.update_progress(
                    "preprocess", 60, "Starting segmentation..."
                )

            segments = await self.segment_waveform(
                waveform,
                sample_rate,
                lambda msg, prog: (
                    tracker.update_progress("preprocess", 60 + prog * 0.40, msg)
                    if tracker
                    else None
                ),
            )
        else:
            if tracker:
                await tracker.update_progress(
                    "preprocess", 90, "No segmentation needed"
                )
            segments = waveform.unsqueeze(0)  # shape (1, 1, N)

        if tracker:
            await tracker.update_progress("preprocess", 100, "Preprocessing complete")

        return waveform, sample_rate, segments
