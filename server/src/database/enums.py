import enum


class AudioSourceType(enum.Enum):
    ORIGINAL = "original"
    SEPARATED = "separated"


class SeparatedSourceLabel(enum.Enum):
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


class AudioFileStatus(enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"
    PENDING_DELETION = "pending_deletion"


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


class OtpType(enum.Enum):
    EMAIL_VERIFICATION = "email_verification"
    PASSWORD_RESET = "password_reset"
    TWO_FACTOR_AUTH = "two_factor_auth"


class LogLevel(enum.Enum):
    info = "info"
    warning = "warning"
    error = "error"
    debug = "debug"


class EntityType(enum.Enum):
    audio_file = "audio_file"
    analysis_record = "analysis_record"
    project = "project"


__all__ = [
    "AudioSourceType",
    "SeparatedSourceLabel",
    "AnalysisType",
    "AudioFormat",
    "AudioFileStatus",
    "FeatureType",
    "JobStatus",
    "OtpType",
    "LogLevel",
    "EntityType",
]
