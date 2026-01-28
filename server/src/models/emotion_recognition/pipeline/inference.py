from typing import Awaitable, Callable, Optional, TypeAlias

import torch.nn as nn
import torch.nn.functional as F

PROGRESS_CALLBACK: TypeAlias = Callable[[str, float], Awaitable[None]]


class TemporalAttentionPooling(nn.Module):
    """
    Attention-based pooling over temporal segments.
    Learns to weight important segments for final prediction.
    """

    def __init__(self, input_dim):
        super().__init__()
        self.attention = nn.Sequential(
            nn.Linear(input_dim, 128), nn.Tanh(), nn.Linear(128, 1)
        )

    def forward(self, x):
        # x: (batch, seq_len, features)
        attn_weights = self.attention(x)  # (batch, seq_len, 1)
        attn_weights = F.softmax(attn_weights, dim=1)
        weighted = x * attn_weights
        return weighted.sum(dim=1)  # (batch, features)


class GEMS9EmotionRecognizer(nn.Module):
    """
    Complete GEMS-9 emotion recognition model.

    Architecture:
    1. Pretrained audio embeddings (YAMNet/PANNs) - frozen or fine-tuned
    2. Temporal aggregation (attention/LSTM/mean pooling)
    3. FC layers → 9 GEMS-9 outputs

    Handles variable-length audio by:
    - Segmenting into fixed-length chunks
    - Processing each segment through embedding model
    - Aggregating segment embeddings temporally
    """

    def __init__(
        self,
        embedding_dim=128,
        hidden_dim=512,
        num_emotions=9,
        pooling_method="attention",
        use_lstm=True,
        dropout=0.3,
    ):
        super().__init__()

        self.pooling_method = pooling_method
        self.use_lstm = use_lstm

        # Temporal modeling (optional)
        if use_lstm:
            self.lstm = nn.LSTM(
                embedding_dim,
                hidden_dim // 2,  # bidirectional
                num_layers=2,
                batch_first=True,
                bidirectional=True,
                dropout=dropout,
            )
            lstm_out_dim = hidden_dim
        else:
            lstm_out_dim = embedding_dim

        # Temporal pooling
        if pooling_method == "attention":
            self.pooling = TemporalAttentionPooling(lstm_out_dim)
        elif pooling_method == "mean":
            self.pooling = lambda x: x.mean(dim=1)
        else:
            raise ValueError(f"Unknown pooling method: {pooling_method}")

        # Emotion prediction head
        self.classifier = nn.Sequential(
            nn.Linear(lstm_out_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.BatchNorm1d(hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 2, num_emotions),
            nn.Sigmoid(),  # Output probabilities [0, 1]
        )

    async def forward_with_progress(
        self, embeddings, progress_callback: Optional[PROGRESS_CALLBACK] = None
    ):
        """
        Args:
            embeddings: (batch, num_segments, embedding_dim)
        Returns:
            emotions: (batch, 9) - GEMS-9 probabilities
        """
        # Temporal modeling
        if self.use_lstm:
            if progress_callback:
                await progress_callback("Running LSTM temporal modeling...", 0)
            lstm_out, _ = self.lstm(embeddings)
            if progress_callback:
                await progress_callback(
                    f"LSTM output shape: {list(lstm_out.shape)}", 40
                )
        else:
            lstm_out = embeddings
            if progress_callback:
                await progress_callback("Skipping LSTM (not enabled)", 40)

        if progress_callback:
            await progress_callback(f"Applying {self.pooling_method} pooling...", 40)

        # Temporal pooling
        pooled = self.pooling(lstm_out)

        if progress_callback:
            await progress_callback(f"Pooled to shape: {list(pooled.shape)}", 60)

        if progress_callback:
            await progress_callback("Running emotion classifier...", 60)

        x = pooled
        for i, layer in enumerate(self.classifier):
            x = layer(x)

            if progress_callback and i % 2 == 0:  # Update every 2 layers
                progress = 60 + ((i + 1) / len(self.classifier)) * 40
                await progress_callback(
                    f"Classifier layer {i + 1}/{len(self.classifier)}", progress
                )

        # Emotion prediction
        emotions = x

        if progress_callback:
            await progress_callback("Emotion prediction complete", 100)

        return emotions

    def forward(self, embeddings):
        """
        Standard forward pass (backward compatible, no progress tracking).

        Args:
            embeddings: (batch, num_segments, embedding_dim)
        Returns:
            emotions: (batch, 9) - GEMS-9 probabilities
        """
        # Temporal modeling
        if self.use_lstm:
            lstm_out, _ = self.lstm(embeddings)
        else:
            lstm_out = embeddings

        # Temporal pooling
        pooled = self.pooling(lstm_out)

        # Emotion prediction
        emotions = self.classifier(pooled)

        return emotions
