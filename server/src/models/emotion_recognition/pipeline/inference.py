import torch
import torch.nn as nn
import torch.nn.functional as F

class TemporalAttentionPooling(nn.Module):
    """
    Attention-based pooling over temporal segments.
    Learns to weight important segments for final prediction.
    """
    def __init__(self, input_dim):
        super().__init__()
        self.attention = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.Tanh(),
            nn.Linear(128, 1)
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
    def __init__(self, 
                 embedding_dim=128,
                 hidden_dim=512,
                 num_emotions=9,
                 pooling_method='attention',
                 use_lstm=True,
                 dropout=0.3):
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
                dropout=dropout
            )
            lstm_out_dim = hidden_dim
        else:
            lstm_out_dim = embedding_dim
        
        # Temporal pooling
        if pooling_method == 'attention':
            self.pooling = TemporalAttentionPooling(lstm_out_dim)
        elif pooling_method == 'mean':
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
            nn.Sigmoid()  # Output probabilities [0, 1]
        )
    
    def forward(self, embeddings):
        """
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
