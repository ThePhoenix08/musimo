import asyncio
import os
import sys
import warnings
from typing import Literal


def bootstrap() -> tuple[bool, int]:
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

    warnings.filterwarnings("ignore", category=FutureWarning)

    os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
    sys.dont_write_bytecode = True

    ENV: Literal["dev", "prod"] = os.getenv("ENV", "dev").lower()
    IS_DEV: bool = ENV == "dev"

    from src.core.pretty_errors import setup_error_beautifier

    setup_error_beautifier(IS_DEV=IS_DEV, enable=True)

    from src.core.logger_setup import logger

    logger.info("Logger initialized")

    from src.core.error_hooks import setup_global_error_hooks

    setup_global_error_hooks()

    NUM_OF_WORKERS: int = os.cpu_count()
    return (IS_DEV, NUM_OF_WORKERS)
