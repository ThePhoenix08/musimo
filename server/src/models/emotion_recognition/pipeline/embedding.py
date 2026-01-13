import torch
from torch import Tensor
import numpy as np
import tensorflow_hub as hub

MODEL_EMBEDDING_OPTIONS = {
    'vggish': {
        'dims': 128,
        'hub_url': "https://tfhub.dev/google/vggish/1"
    },
}

class AudioEmbeddingExtractor:
    """
    Extracts embeddings from VGGish model.
    Thread-safe for concurrent inference.
    """

    def __init__(
            self, 
            model_type: str = "vggish",
            device: str = "cpu"
        ):
        self.model_type = model_type.lower()
        self.device = device

        if self.model_type not in MODEL_EMBEDDING_OPTIONS:
            raise ValueError(f"Unsupported Model type: {model_type}")

        info = MODEL_EMBEDDING_OPTIONS[self.model_type]
        self.embedding_dim = info['dims']
        self._model = hub.KerasLayer(info['hub_url'], trainable=False)

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
            raise ValueError(f"Expected 1D waveform for VGGish, got shape {waveform_np.shape}")

        # ✅ VGGish expects 1-D waveform, sample-rate = 16 kHz
        embeddings = self._model(waveform_np)

        # ✅ Convert TF → NumPy → Torch
        emb_np = embeddings.numpy()
        emb_tensor = torch.tensor(emb_np, dtype=torch.float32, device=self.device)

        # Optional mean pooling (if you only need one vector per segment)
        emb_tensor = emb_tensor.mean(dim=0)

        return emb_tensor

    def extract_segments(self, segments: Tensor, sample_rate: int) -> Tensor:
        embeddings = [self(segment) for segment in segments]
        return torch.stack(embeddings, dim=0)