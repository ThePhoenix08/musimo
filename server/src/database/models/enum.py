import enum


class AnalysisType(str, enum.Enum):
    EMOTION = "emotion"
    INSTRUMENT = "instrument"
    SEGMENTATION = "segmentation"
    FEATURE_EXTRACTION = "feature_extraction"


class AnalysisStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
