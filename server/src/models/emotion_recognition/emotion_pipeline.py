import asyncio
from concurrent.futures import ThreadPoolExecutor
from enum import Enum
from pathlib import Path
from typing import Optional

import numpy as np
import torch

from src.models.emotion_recognition.config import ConfigManager
from src.models.emotion_recognition.pipeline.embedding import AudioEmbeddingExtractor
from src.models.emotion_recognition.pipeline.inference import GEMS9EmotionRecognizer
from src.models.emotion_recognition.pipeline.postprocessor import (
    CombinedPrediction,
    DynamicPrediction,
    EmotionPostprocessor,
    StaticPrediction,
    format_prediction_result,
)
from src.models.emotion_recognition.pipeline.preprocessor import Preprocessor
from src.models.progress_tracker import ProgressTracker


class PredictionType(Enum):
    STATIC = "static"
    DYNAMIC = "dynamic"
    COMBINED = "combined"


class GEMS9Pipeline:
    """Flexible, modular inference pipeline with runtime parameters."""

    def __init__(self, config=None):
        self.cfg = config or ConfigManager.load_from_json()
        self.device = torch.device(self.cfg.DEVICE)
        print(f"🚀 Initializing GEMS-9 Pipeline on {self.device}")

        # Core Components
        self.preprocessor = Preprocessor(
            {
                "mono": True,
                "resample": True,
                "target_sr": self.cfg.SAMPLE_RATE,
            }
        )

        self.embedding_extractor = AudioEmbeddingExtractor(
            model_path=self.cfg.VGGISH_MODEL_DIR,
            model_type=self.cfg.EMBEDDING_TYPE,
            device=self.device,
        )

        checkpoint = torch.load(
            Path(self.cfg.MODEL_PATH), map_location=self.device, weights_only=True
        )

        # Load Model
        self.model = GEMS9EmotionRecognizer(
            embedding_dim=self.cfg.EMBEDDING_DIM,
            hidden_dim=self.cfg.HIDDEN_DIM,
            num_emotions=self.cfg.NUM_EMOTIONS,
            pooling_method=self.cfg.POOLING_METHOD,
            use_lstm=self.cfg.USE_LSTM,
            dropout=self.cfg.DROPOUT,
        ).to(self.device)

        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.model.eval()

        # Postprocessor
        self.postprocessor = EmotionPostprocessor(
            self.cfg.EMOTION_NAMES, self.cfg.SCALING_FACTORS, device=self.device
        )

        # Thread pool for async ops
        self.executor = ThreadPoolExecutor(max_workers=self.cfg.NUM_WORKERS)
        print("✅ GEMS-9 Pipeline Ready")

    # ---------------------------------------------------------------
    # Core prediction logic
    # ---------------------------------------------------------------
    async def _predict_static(
        self, embeddings, duration, num_segments, tracker: Optional[ProgressTracker]
    ) -> StaticPrediction:
        if tracker:
            await tracker.update_progress("predict", 10, "Preparing batch...")

        with torch.no_grad():
            batch = embeddings.unsqueeze(0).to(self.device)

            if tracker:
                await tracker.update_progress(
                    "predict", 30, "Running model inference..."
                )

                # Use progress-aware forward if available
            if hasattr(self.model, "forward_with_progress"):
                preds = await self.model.forward_with_progress(
                    batch,
                    lambda msg, prog: (
                        tracker.update_progress(
                            "predict", 30 + prog * 0.5, msg  # 30-80%
                        )
                        if tracker
                        else None
                    ),
                )
            else:
                preds = self.model(batch)

            if tracker:
                await tracker.update_progress(
                    "predict", 85, "Applying scaling factors..."
                )

            preds = self.postprocessor.apply_scaling(preds)

            if tracker:
                await tracker.update_progress(
                    "predict", 95, "Formatting static prediction..."
                )

        result = self.postprocessor.to_static(preds, duration, num_segments)

        if tracker:
            await tracker.update_progress("predict", 100, "Static prediction complete")

        return result

    async def _predict_dynamic(
        self, embeddings, duration, tracker: Optional[ProgressTracker]
    ) -> DynamicPrediction:
        num_segments = embeddings.shape[0]
        seg_dur = duration / num_segments
        timestamps = [i * seg_dur for i in range(num_segments)]

        if tracker:
            await tracker.update_progress(
                "predict",
                5,
                f"Processing {num_segments} segments for dynamic prediction...",
            )

        preds_list = []
        with torch.no_grad():
            for i, seg in enumerate(embeddings):
                seg_batch = seg.unsqueeze(0).unsqueeze(0).to(self.device)
                out = self.model(seg_batch)
                out = self.postprocessor.apply_scaling(out)
                preds_list.append(out.cpu().numpy()[0])

                # Update progress for each segment
                if tracker:
                    progress = 5 + ((i + 1) / num_segments) * 90  # 5-95%
                    await tracker.update_progress(
                        "predict", progress, f"Processed segment {i+1}/{num_segments}"
                    )

        preds = np.array(preds_list)

        if tracker:
            await tracker.update_progress(
                "predict", 98, "Formatting dynamic prediction..."
            )

        result = self.postprocessor.to_dynamic(preds, timestamps, duration, seg_dur)

        if tracker:
            await tracker.update_progress("predict", 100, "Dynamic prediction complete")

        return result

    async def _predict_combined(
        self, embeddings, duration, num_segments, tracker: Optional[ProgressTracker]
    ):
        if tracker:
            await tracker.update_progress(
                "predict", 0, "Starting combined prediction..."
            )

        # Static prediction (0-40%)
        if tracker:
            await tracker.update_progress("predict", 5, "Computing static emotion...")

        static_pred = await self._predict_static(
            embeddings,
            duration,
            num_segments,
            # Create a sub-tracker for static that maps to 5-45%
            tracker=(
                type(
                    "obj",
                    (object,),
                    {
                        "update_progress": lambda _self, step, prog, msg: (
                            tracker.update_progress(
                                "predict",
                                5 + prog * 0.4,  # Map 0-100 to 5-45
                                f"[Static] {msg}",
                            )
                            if tracker
                            else None
                        )
                    },
                )()
                if tracker
                else None
            ),
        )
        if tracker:
            await tracker.update_progress(
                "predict", 50, "Computing dynamic emotions..."
            )

        dynamic_pred = await self._predict_dynamic(
            embeddings,
            duration,
            # Create a sub-tracker for dynamic that maps to 50-95%
            tracker=(
                type(
                    "obj",
                    (object,),
                    {
                        "update_progress": lambda _step, step, prog, msg: (
                            tracker.update_progress(
                                "predict",
                                50 + prog * 0.45,  # Map 0-100 to 50-95
                                f"[Dynamic] {msg}",
                            )
                            if tracker
                            else None
                        )
                    },
                )()
                if tracker
                else None
            ),
        )

        if tracker:
            await tracker.update_progress("predict", 98, "Combining predictions...")

        result = CombinedPrediction(static_pred, dynamic_pred)

        if tracker:
            await tracker.update_progress(
                "predict", 100, "Combined prediction complete"
            )

        return result

    # ---------------------------------------------------------------
    # Async Prediction Entry
    # ---------------------------------------------------------------
    async def predict_async(
        self,
        audio_path: str,
        prediction_type: PredictionType = PredictionType.COMBINED,
        tracker: Optional[ProgressTracker] = None,
    ):
        """
        Perform inference with runtime control.
        params:
          - segmentAudio: "True" / "False"
          - predictionType: "static" / "dynamic" / "combined"
        """

        # Runtime params
        prediction_type = prediction_type.name.lower()
        segment_audio = prediction_type in [
            PredictionType.DYNAMIC.value,
            PredictionType.COMBINED.value,
        ]
        try:
            # Run preprocessing with internal progress callbacks
            waveform, sr, segments = await self.preprocessor(
                audio_path,
                segment_audio=segment_audio,
                tracker=tracker if tracker else None,
            )

            duration = waveform.shape[-1] / sr
            if not segment_audio:
                segments = waveform.unsqueeze(0)
            num_segments = len(segments)

            if tracker:
                await tracker.start_step(
                    "extract_embeddings",
                    f"Extracting embeddings from {num_segments} segments...",
                )

            embeddings = await self.embedding_extractor.extract_segments(
                segments,
                sr,
                progress_callback=lambda msg, prog: (
                    tracker.update_progress("extract_embeddings", prog, msg)
                    if tracker
                    else None
                ),
            )

            if tracker:
                await tracker.complete_step(
                    "extract_embeddings",
                    metadata={"embedding_shape": list(embeddings.shape)},
                )

            prediction_type_str = prediction_type.lower()

            if tracker:
                await tracker.start_step(
                    "predict", f"Running {prediction_type_str} emotion prediction..."
                )

            # Run appropriate prediction with progress
            if prediction_type_str == PredictionType.STATIC.value:
                result = await self._predict_static(
                    embeddings, duration, num_segments, tracker
                )
            elif prediction_type_str == PredictionType.DYNAMIC.value:
                result = await self._predict_dynamic(embeddings, duration, tracker)
            elif prediction_type_str == PredictionType.COMBINED.value:
                result = await self._predict_combined(
                    embeddings, duration, num_segments, tracker
                )
            else:
                raise ValueError(f"Invalid predictionType: {prediction_type_str}")

            if tracker:
                await tracker.complete_step(
                    "predict", metadata={"prediction_type": prediction_type_str}
                )

            if tracker:
                await tracker.start_step("postprocess", "Formatting results...")
                await tracker.update_progress(
                    "postprocess", 50, "Converting to JSON..."
                )

            formatted_result = format_prediction_result(result)

            if tracker:
                await tracker.update_progress("postprocess", 100, "Complete!")
                await tracker.complete_step("postprocess")

            return formatted_result

        except Exception as e:
            if tracker:
                current_step = tracker.current_step_id
                if current_step:
                    await tracker.fail_step(current_step, str(e))
                await tracker.fail_pipeline(str(e))
            raise

    # ---------------------------------------------------------------
    # Sync Wrapper
    # ---------------------------------------------------------------
    def predict(
        self, audio_path: str, prediction_type: PredictionType = PredictionType.COMBINED
    ):
        """Safe sync/async hybrid entrypoint for inference."""
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            return self.predict_async(audio_path, prediction_type)
        else:
            return asyncio.run(self.predict_async(audio_path, prediction_type))
