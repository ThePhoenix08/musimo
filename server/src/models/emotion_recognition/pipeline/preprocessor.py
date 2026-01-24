from dataclasses import dataclass

import torch
import torchaudio
from torch import Tensor


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
    def __init__(self, config: dict | None =None):
        self.config = Preprocessing_Config(**(config or {}))
    
    def load_audio(self, audio_path: str) -> tuple[Tensor, int]:
        waveform, sample_rate = torchaudio.load(audio_path)
        return waveform, sample_rate

    def make_mono(self, waveform: Tensor) -> Tensor:
        return waveform.mean(dim=0, keepdim=True) if waveform.shape[0] > 1 else waveform

    def resample(self, waveform: Tensor, original_sample_rate: int) -> tuple[Tensor, int]:
        if original_sample_rate != self.config.target_sr:
            waveform = torchaudio.transforms.Resample(original_sample_rate, self.config.target_sr)(waveform)
            new_sample_rate = self.config.target_sr
        return waveform, new_sample_rate

    def add_batch_dimension(self, waveform: Tensor) -> Tensor:
        return waveform.unsqueeze(0) if waveform.ndim == 1 else waveform
    
    def segment_waveform(self, waveform: Tensor, sample_rate: int):
        SAMPLES_IN_SEGMENT = int(self.config.segment_duration * sample_rate)
        SEGMENT_HOP_RATE = int(self.config.segment_hop * sample_rate)

        mono_waveform = self.make_mono(waveform) if waveform.shape[0] > 1 else waveform[0]
        TOTAL_SAMPLES = mono_waveform.shape[0]

        if TOTAL_SAMPLES < SAMPLES_IN_SEGMENT:
            PAD_LENGTH = SAMPLES_IN_SEGMENT - TOTAL_SAMPLES
            mono_waveform = torch.nn.functional.pad(mono_waveform, (0, PAD_LENGTH))
            TOTAL_SAMPLES = mono_waveform.shape[0]  # update

        MAX_START_INDEX = max(1, TOTAL_SAMPLES - SAMPLES_IN_SEGMENT + 1)
        segments: list[Tensor] = [
            mono_waveform[start:start + SAMPLES_IN_SEGMENT].unsqueeze(0).unsqueeze(0)
            for start in range(0, MAX_START_INDEX, SEGMENT_HOP_RATE)
        ]

        # ✅ Always return shape (num_segments, 1, num_samples)
        if not segments:
            return mono_waveform.unsqueeze(0).unsqueeze(0)
        return torch.cat(segments, dim=0)

    def __call__(self, audio_path, segment_audio: bool):
        """
        Preprocess audio file.
        param audio_path: Path to audio file.
        param progress_callback: Function to report progress.
        returns waveform, sample_rate, segments
        segments: Tensor of shape (num_segments, 1, segment_samples)
        """
        self.config.segment = segment_audio is not None

        waveform, sample_rate = self.load_audio(audio_path)

        if self.config.mono:
            waveform = self.make_mono(waveform)

        if self.config.resample:
            waveform, sample_rate = self.resample(waveform, sample_rate)

        waveform = self.add_batch_dimension(waveform)

        if self.config.segment:
            segments = self.segment_waveform(waveform, sample_rate)
        else:
            segments = waveform.unsqueeze(0)  # shape (1, 1, N)

        return waveform, sample_rate, segments
    
