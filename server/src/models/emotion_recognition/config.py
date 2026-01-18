from pydantic_settings import BaseSettings
from pydantic import Field
from pathlib import Path
import json
import torch

BASE =  Path(__file__).resolve()
EMOTION_MODEL_CHECKPOINT = BASE.parent.parent.parent / "checkpoints/emotion/A2G9_VGG_clean.pt"
VGGISH_MODEL_DIR = BASE.parent.parent.parent / "checkpoints/vggish_local"

class ConfigManager(BaseSettings):
    """
    Unified configuration for model, audio, and inference.

    Priority:
        1️⃣ JSON file (config.json)
        2️⃣ Defaults defined below

    Notes:
        - No dependency on environment variables.
        - Safe fallback to defaults if config.json is missing or incomplete.
    """

    # ------------------------------------------------------------------
    # 🔹 PATHS & ENVIRONMENT
    # ------------------------------------------------------------------
    MODEL_PATH: str = Field(default=EMOTION_MODEL_CHECKPOINT.as_posix())
    VGGISH_MODEL_DIR: str = Field(default=VGGISH_MODEL_DIR.as_posix())
    CONFIG_JSON_PATH: str = Field(default="config.json")
    DEVICE: str = Field(default="cuda" if torch.cuda.is_available() else "cpu")

    # ------------------------------------------------------------------
    # 🔹 AUDIO SETTINGS
    # ------------------------------------------------------------------
    SAMPLE_RATE: int = Field(default=16000)
    SEGMENT_DURATION: float = Field(default=5.0)
    SEGMENT_OVERLAP: float = Field(default=0.5)

    # ------------------------------------------------------------------
    # 🔹 MODEL ARCHITECTURE
    # ------------------------------------------------------------------
    EMBEDDING_TYPE: str = Field(default="vggish")
    EMBEDDING_DIM: int = Field(default=128)
    HIDDEN_DIM: int = Field(default=512)
    NUM_EMOTIONS: int = Field(default=9)
    USE_LSTM: bool = Field(default=True)
    POOLING_METHOD: str = Field(default="attention")
    DROPOUT: float = Field(default=0.3)

    # ------------------------------------------------------------------
    # 🔹 INFERENCE SETTINGS
    # ------------------------------------------------------------------
    BATCH_SIZE: int = Field(default=8)
    NUM_WORKERS: int = Field(default=4)

    # ------------------------------------------------------------------
    # 🔹 EMOTION LABELS & SCALING
    # ------------------------------------------------------------------
    EMOTION_NAMES: list[str] = [
        "Wonder",
        "Transcendence",
        "Tenderness",
        "Nostalgia",
        "Peacefulness",
        "Power",
        "Joyful Activation",
        "Tension",
        "Sadness",
    ]

    SCALING_FACTORS: dict[str, float] = {
        "Wonder": 1.0,
        "Transcendence": 1.0,
        "Tenderness": 1.0,
        "Nostalgia": 1.0,
        "Peacefulness": 1.0,
        "Power": 1.0,
        "Joyful Activation": 1.0,
        "Tension": 0.4,
        "Sadness": 1.0,
    }

    # ------------------------------------------------------------------
    # 🔹 JSON Loader
    # ------------------------------------------------------------------
    @classmethod
    def load_from_json(cls, json_path: str | None = None):
        """Safely load configuration from a JSON file with defaults fallback."""
        cfg = cls()
        json_path = json_path or cfg.CONFIG_JSON_PATH

        if Path(json_path).exists():
            try:
                with open(json_path, "r") as f:
                    data = json.load(f)
                for key, value in data.items():
                    if hasattr(cfg, key):
                        setattr(cfg, key, value)
            except Exception as e:
                print(f"⚠️ Error loading config.json: {e}")
        else:
            print(f"⚠️ Config file not found at {json_path}. Using defaults.")

        return cfg
