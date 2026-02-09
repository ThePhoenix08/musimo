import json
import logging
import os
import sys
from datetime import UTC, datetime

IS_DEV: bool = os.getenv("ENV", "dev") == "dev"

logger = logging.getLogger("app")
logger.setLevel(logging.DEBUG if IS_DEV else logging.INFO)

stream_handler = logging.StreamHandler(sys.stdout)

# --- Merge Uvicorn loggers into app logger ---
uvicorn_loggers = ["uvicorn", "uvicorn.error", "uvicorn.access"]

for name in uvicorn_loggers:
    uvicorn_logger = logging.getLogger(name)
    uvicorn_logger.handlers = []  # clear uvicorn’s default handlers
    uvicorn_logger.propagate = True  # let logs bubble up
    uvicorn_logger.setLevel(logger.level)
    uvicorn_logger.addHandler(stream_handler)

if IS_DEV:
    # Developer-friendly color logs
    from colorama import Fore, Style
    from colorama import init as colorama_init

    colorama_init()

    class DevFormatter(logging.Formatter):
        COLORS = {
            "DEBUG": Fore.BLUE,
            "INFO": Fore.GREEN,
            "WARNING": Fore.YELLOW,
            "ERROR": Fore.RED,
            "CRITICAL": Fore.MAGENTA,
        }

        def format(self, record):
            name = "uvicorn" if record.name.startswith("uvicorn") else record.name
            color = self.COLORS.get(record.levelname, "")
            time_str = datetime.now().strftime("%H:%M:%S")
            msg = f"{color}{time_str} | {record.levelname:<8} | {name} | {record.getMessage()}{Style.RESET_ALL}"
            if record.exc_info:
                msg += f"\n{self.formatException(record.exc_info)}"
            return msg

    stream_handler.setFormatter(DevFormatter())
else:
    # Production JSON logs
    class JSONFormatter(logging.Formatter):
        def format(self, record):
            log_record = {
                "timestamp": datetime.now(UTC).isoformat() + "Z",
                "level": record.levelname,
                "logger": record.name,
                "message": record.getMessage(),
            }
            if record.exc_info:
                log_record["exception"] = self.formatException(record.exc_info)
            return json.dumps(log_record)

    stream_handler.setFormatter(JSONFormatter())

logger.addHandler(stream_handler)
