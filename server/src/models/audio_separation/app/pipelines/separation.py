import subprocess
from pathlib import Path

OUTPUT_DIR = Path("temp/outputs")


def separate_audio(audio_path: Path, job_id: str):
    output_path = OUTPUT_DIR / job_id
    output_path.mkdir(parents=True, exist_ok=True)

    command = ["demucs", "-n", "htdemucs", "-o", str(output_path), str(audio_path)]

    subprocess.run(command, check=True)

    # Demucs deterministic output path
    stem_dir = output_path / "htdemucs" / audio_path.stem

    return {
        "vocals": stem_dir / "vocals.wav",
        "drums": stem_dir / "drums.wav",
        "bass": stem_dir / "bass.wav",
        "other": stem_dir / "other.wav",
    }
