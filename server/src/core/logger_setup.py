import json
import logging
import os
import re
import sys
import traceback
from datetime import UTC, datetime

import pretty_errors

IS_DEV: bool = os.getenv("ENV", "dev") == "dev"

logger = logging.getLogger("app")
logger.setLevel(logging.DEBUG if IS_DEV else logging.INFO)

stream_handler = logging.StreamHandler(sys.stdout)

# Detect your own files only
PROJECT_TRACEBACK_PATTERN = re.compile(
    r"[\\/](server[\\/](src|tests))[\\/].+\.py", re.IGNORECASE
)


# --- Pretty Traceback Filter -------------------------------------------------
def filter_pretty_traceback(exc_info):
    type_, value, tb = exc_info
    full_tb = "".join(traceback.format_exception(type_, value, tb))

    filtered = [
        line
        for line in full_tb.splitlines()
        if PROJECT_TRACEBACK_PATTERN.search(line)
        or line.strip().startswith(type_.__name__)
        or line.strip().startswith(str(value))
    ]
    if not filtered:
        return "".join(pretty_errors.excepthook(type_, value, tb))
    return "\n".join(filtered)


# --- Dev Formatter -----------------------------------------------------------
class DevFormatter(logging.Formatter):
    """Rich color formatter with source-aware highlights."""

    RESET = "\033[0m"
    DIM = "\033[2m"
    BOLD = "\033[1m"

    # Base colors
    COLORS = {
        "DEBUG": "\033[36m",  # cyan
        "INFO": "\033[92m",  # green
        "WARNING": "\033[93m",  # yellow
        "ERROR": "\033[91m",  # red
        "CRITICAL": "\033[95m",  # magenta
    }

    # Source-specific accents
    SOURCE_COLORS = {
        "app": "\033[38;5;45m",  # bright blue
        "uvicorn": "\033[38;5;208m",  # orange
        "sqlalchemy": "\033[38;5;141m",  # purple
        "other": "\033[38;5;250m",  # gray
    }

    def _source_color(self, name: str) -> str:
        if name.startswith("uvicorn"):
            return self.SOURCE_COLORS["uvicorn"]
        elif name.startswith("sqlalchemy"):
            return self.SOURCE_COLORS["sqlalchemy"]
        elif name.startswith("app"):
            return self.SOURCE_COLORS["app"]
        else:
            return self.SOURCE_COLORS["other"]

    def format(self, record):
        record_name = "uvicorn" if record.name.startswith("uvicorn") else record.name
        time_str = datetime.now().strftime("%H:%M:%S")
        level_color = self.COLORS.get(record.levelname, "")
        src_color = self._source_color(record_name)
        level = f"{level_color}{record.levelname:<8}{self.RESET}"
        src = f"{src_color}{record_name}{self.RESET}"
        msg = f"{level_color}{record.getMessage()}{self.RESET}"

        # Compose final colored line
        formatted = f"{self.BOLD}{time_str}{self.RESET} | {level} | {src} | {msg}"

        if record.exc_info:
            formatted += f"\n{filter_pretty_traceback(record.exc_info)}"

        return formatted


# --- JSON Formatter for Production ------------------------------------------
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": datetime.now(UTC).isoformat() + "Z",
            "level": record.levelname,
            "logger": "uvicorn" if record.name.startswith("uvicorn") else record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            tb = "".join(traceback.format_exception(*record.exc_info))
            log_record["traceback"] = [
                line
                for line in tb.splitlines()
                if PROJECT_TRACEBACK_PATTERN.search(line)
            ]
        return json.dumps(log_record)


# --- Handler assignment ------------------------------------------------------
stream_handler.setFormatter(DevFormatter() if IS_DEV else JSONFormatter())
logger.addHandler(stream_handler)

# --- Integrate other loggers -------------------------------------------------
for name in [
    "uvicorn",
    "uvicorn.error",
    "uvicorn.access",
    "sqlalchemy.engine",
    "sqlalchemy.pool",
]:
    lgr = logging.getLogger(name)
    lgr.handlers.clear()
    lgr.propagate = True
    lgr.setLevel(logger.level)
    lgr.addHandler(stream_handler)
