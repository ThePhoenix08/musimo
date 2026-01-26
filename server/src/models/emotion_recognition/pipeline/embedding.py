from typing import Awaitable, Callable, Optional, TypeAlias

import numpy as np
import tensorflow as tf
import torch
from torch import Tensor

PROGRESS_CALLBACK: TypeAlias = Callable[[str, float], Awaitable[None]]

MODEL_EMBEDDING_OPTIONS = {
    "vggish": {"dims": 128, "hub_url": "https://tfhub.dev/google/vggish/1"},
}


class AudioEmbeddingExtractor:
    """
    Extracts embeddings from VGGish model.
    Thread-safe for concurrent inference.
    """

    def __init__(
        self,
        model_path: str,
        model_type: str = "vggish",
        device: str = "cpu",
    ):
        self.model_type = model_type.lower()
        self.device = device

        if self.model_type not in MODEL_EMBEDDING_OPTIONS:
            raise ValueError(f"Unsupported Model type: {model_type}")

        info = MODEL_EMBEDDING_OPTIONS[self.model_type]
        self.embedding_dim = info["dims"]
        # self._model = hub.KerasLayer(info['hub_url'], trainable=False)
        self._model = tf.saved_model.load(model_path)

    def __call__(self, waveform: Tensor) -> Tensor:
        # Convert torch tensor → numpy
        if isinstance(waveform, torch.Tensor):
            waveform_np = waveform.squeeze().detach().cpu().numpy()
        elif isinstance(waveform, np.ndarray):
            waveform_np = np.squeeze(waveform)
        else:
            raise TypeError(f"Unexpected waveform type: {type(waveform)}")

        # Make sure dtype and shape match VGGish requirements
        waveform_np = waveform_np.astype("float32")
        if waveform_np.ndim != 1:
            raise ValueError(
                f"Expected 1D waveform for VGGish, got shape {waveform_np.shape}"
            )

        # ✅ VGGish expects 1-D waveform, sample-rate = 16 kHz
        embeddings = self._model(waveform_np)

        # ✅ Convert TF → NumPy → Torch
        emb_np = embeddings.numpy()
        emb_tensor = torch.tensor(emb_np, dtype=torch.float32, device=self.device)

        # Optional mean pooling (if you only need one vector per segment)
        emb_tensor = emb_tensor.mean(dim=0)

        return emb_tensor

    async def extract_segments(
        self,
        segments: Tensor,
        sample_rate: int,
        progress_callback: Optional[Callable[[str, float], Awaitable[None]]] = None,
    ) -> Tensor:
        num_segments = len(segments)
        embeddings = []

        if progress_callback:
            await progress_callback(
                f"Extracting embeddings for {num_segments} segments...", 0
            )

        for i, segment in enumerate(segments):
            # Extract embedding
            emb = self(segment)
            embeddings.append(emb)

            # Report progress at regular intervals
            if progress_callback:
                # Update every segment for small batches, or every 5% for large batches
                update_interval = max(1, num_segments // 20)

                if i % update_interval == 0 or i == num_segments - 1:
                    progress = ((i + 1) / num_segments) * 100
                    await progress_callback(
                        f"Extracted embedding {i+1}/{num_segments}", progress
                    )

        result = torch.stack(embeddings, dim=0)

        if progress_callback:
            await progress_callback(
                f"Embedding extraction complete. Shape: {list(result.shape)}", 100
            )

        return result
