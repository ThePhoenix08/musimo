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

# Regex to detect only your own source files
PROJECT_TRACEBACK_PATTERN = re.compile(
    r"[\\/](server[\\/](src|tests))[\\/].+\.py", re.IGNORECASE
)


def filter_pretty_traceback(exc_info):
    """Pretty print but include only lines from server/src or server/tests"""
    type_, value, tb = exc_info
    full_tb = "".join(traceback.format_exception(type_, value, tb))

    filtered_lines = [
        line
        for line in full_tb.splitlines()
        if PROJECT_TRACEBACK_PATTERN.search(line)
        or line.strip().startswith(type_.__name__)
        or line.strip().startswith(str(value))
    ]

    # If nothing matched, fall back to the full pretty output
    if not filtered_lines:
        return "".join(pretty_errors.excepthook(type_, value, tb))

    return "\n".join(filtered_lines)


class DevFormatter(logging.Formatter):
    """Colorful formatter with filtered pretty tracebacks."""

    COLORS = {
        "DEBUG": "\033[94m",  # blue
        "INFO": "\033[92m",  # green
        "WARNING": "\033[93m",  # yellow
        "ERROR": "\033[91m",  # red
        "CRITICAL": "\033[95m",  # magenta
    }
    RESET = "\033[0m"

    def format(self, record):
        color = self.COLORS.get(record.levelname, "")
        time_str = datetime.now().strftime("%H:%M:%S")
        name = "uvicorn" if record.name.startswith("uvicorn") else record.name
        msg = f"{color}{time_str} | {record.levelname:<8} | {name} | {record.getMessage()}{self.RESET}"

        if record.exc_info:
            msg += f"\n{filter_pretty_traceback(record.exc_info)}"

        return msg


if IS_DEV:
    stream_handler.setFormatter(DevFormatter())
else:

    class JSONFormatter(logging.Formatter):
        def format(self, record):
            log_record = {
                "timestamp": datetime.now(UTC).isoformat() + "Z",
                "level": record.levelname,
                "logger": record.name,
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

    stream_handler.setFormatter(JSONFormatter())

logger.addHandler(stream_handler)

# Merge uvicorn loggers
for name in ["uvicorn", "uvicorn.error", "uvicorn.access"]:
    uvicorn_logger = logging.getLogger(name)
    uvicorn_logger.handlers.clear()
    uvicorn_logger.propagate = True
    uvicorn_logger.setLevel(logger.level)
    uvicorn_logger.addHandler(stream_handler)
