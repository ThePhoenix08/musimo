import asyncio
import torch
import numpy as np
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from .pipeline.preprocessor import Preprocessor
from .pipeline.embedding import AudioEmbeddingExtractor
from .pipeline.inference import GEMS9EmotionRecognizer
from .pipeline.postprocessor import EmotionPostprocessor, StaticPrediction, DynamicPrediction, CombinedPrediction

from dataclasses import dataclass
from enum import Enum
from .config import ConfigManager

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
        self.preprocessor = Preprocessor({
            "mono": True,
            "resample": True,
            "target_sr": self.cfg.SAMPLE_RATE,
        })

        self.embedding_extractor = AudioEmbeddingExtractor(
            model_type=self.cfg.EMBEDDING_TYPE, device=self.device
        )

        checkpoint = torch.load(Path(self.cfg.MODEL_PATH), map_location=self.device, weights_only=True)

        # Load Model
        self.model = GEMS9EmotionRecognizer(
            embedding_dim=self.cfg.EMBEDDING_DIM,
            hidden_dim=self.cfg.HIDDEN_DIM,
            num_emotions=self.cfg.NUM_EMOTIONS,
            pooling_method=self.cfg.POOLING_METHOD,
            use_lstm=self.cfg.USE_LSTM,
            dropout=self.cfg.DROPOUT
        ).to(self.device)
        
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.model.eval()

        # Postprocessor
        self.postprocessor = EmotionPostprocessor(
            self.cfg.EMOTION_NAMES,
            self.cfg.SCALING_FACTORS,
            device=self.device
        )

        # Thread pool for async ops
        self.executor = ThreadPoolExecutor(max_workers=self.cfg.NUM_WORKERS)
        print("✅ GEMS-9 Pipeline Ready")

    # ---------------------------------------------------------------
    # Core prediction logic
    # ---------------------------------------------------------------
    def _predict_static(self, embeddings, duration, num_segments) -> StaticPrediction :
        with torch.no_grad():
            batch = embeddings.unsqueeze(0).to(self.device)
            preds = self.model(batch)
            preds = self.postprocessor.apply_scaling(preds)
        return self.postprocessor.to_static(preds, duration, num_segments)

    def _predict_dynamic(self, embeddings, duration) -> DynamicPrediction:
        num_segments = embeddings.shape[0]
        seg_dur = duration / num_segments
        timestamps = [i * seg_dur for i in range(num_segments)]

        preds_list = []
        with torch.no_grad():
            for seg in embeddings:
                seg_batch = seg.unsqueeze(0).unsqueeze(0).to(self.device)
                out = self.model(seg_batch)
                out = self.postprocessor.apply_scaling(out)
                preds_list.append(out.cpu().numpy()[0])

        preds = np.array(preds_list)
        return self.postprocessor.to_dynamic(preds, timestamps, duration, seg_dur)

    def _predict_combined(self, embeddings, duration, num_segments):
        static_pred = self._predict_static(embeddings, duration, num_segments)
        dynamic_pred = self._predict_dynamic(embeddings, duration)
        return CombinedPrediction(static_pred, dynamic_pred)

    # ---------------------------------------------------------------
    # Async Prediction Entry
    # ---------------------------------------------------------------
    async def predict_async(self, audio_path: str, prediction_type: PredictionType = PredictionType.COMBINED):
        """
        Perform inference with runtime control.
        params:
          - segmentAudio: "True" / "False"
          - predictionType: "static" / "dynamic" / "combined"
        """
        loop = asyncio.get_event_loop()

        # Runtime params
        prediction_type = prediction_type.name.lower()
        segment_audio = prediction_type in [PredictionType.DYNAMIC.value, PredictionType.COMBINED.value]

        # Step 1: Preprocessing
        waveform, sr, segments = await loop.run_in_executor(
            self.executor,
            lambda: self.preprocessor(
                audio_path,
                segment_audio=segment_audio
            )
        )

        duration = waveform.shape[-1] / sr

        # If segmentation disabled, override segments
        if not segment_audio:
            segments = waveform.unsqueeze(0)

        num_segments = len(segments)

        # Step 2: Embedding Extraction
        embeddings = await loop.run_in_executor(
            self.executor,
            lambda: self.embedding_extractor.extract_segments(segments, sr)
        )

        # Step 3: Prediction branching
        if prediction_type == PredictionType.STATIC.value:
            return await loop.run_in_executor(
                self.executor, self._predict_static, embeddings, duration, num_segments
            )

        elif prediction_type == PredictionType.DYNAMIC.value:
            return await loop.run_in_executor(
                self.executor, self._predict_dynamic, embeddings, duration
            )

        elif prediction_type == PredictionType.COMBINED.value:
            return await loop.run_in_executor(
                self.executor, self._predict_combined, embeddings, duration, num_segments
            )

        else:
            raise ValueError(f"Invalid predictionType: {prediction_type}")

    # ---------------------------------------------------------------
    # Sync Wrapper
    # ---------------------------------------------------------------
    def predict(self, audio_path: str, prediction_type: PredictionType = PredictionType.COMBINED):
        """Safe sync/async hybrid entrypoint for inference."""
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            return self.predict_async(audio_path, prediction_type)
        else:
            return asyncio.run(self.predict_async(audio_path, prediction_type))


