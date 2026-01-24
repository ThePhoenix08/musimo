import enum


class AudioSourceType(enum.Enum):
    ORIGINAL = "original"
    VOCALS = "vocals"
    DRUMS = "drums"
    BASS = "bass"
    OTHER = "other"


class AnalysisType(enum.Enum):
    EMOTION = "emotion"
    INSTRUMENT = "instrument"
    FEATURES = "features"
    SEPARATION = "separation"


class AudioFormat(enum.Enum):
    WAV = "wav"
    MP3 = "mp3"
    FLAC = "flac"
    AAC = "aac"
    OGG = "ogg"


class FeatureType(enum.Enum):
    LOW_LEVEL = "low_level"
    MID_LEVEL = "mid_level"
    HIGH_LEVEL = "high_level"
    EMBEDDINGS = "embeddings"
    MEL_SPECTROGRAM = "mel_spectrogram"


class JobStatus(enum.Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"