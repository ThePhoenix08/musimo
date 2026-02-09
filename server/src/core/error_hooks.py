import asyncio
import sys

from src.core.logger_setup import logger


def setup_global_error_hooks():
    def handle_async_exception(loop, context):
        msg = context.get("exception", context.get("message", ""))
        logger.critical(f"Unhandled async exception: {msg}")

    asyncio.get_event_loop().set_exception_handler(handle_async_exception)

    def handle_unhandled_exception(exc_type, exc_value, exc_traceback):
        if issubclass(exc_type, KeyboardInterrupt):
            sys.__excepthook__(exc_type, exc_value, exc_traceback)
            return
        logger.critical(
            "Unhandled process exception",
            exc_info=(exc_type, exc_value, exc_traceback),
        )

    sys.excepthook = handle_unhandled_exception
