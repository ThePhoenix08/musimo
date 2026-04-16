import asyncio
import logging
import sys

logger = logging.getLogger(__name__)
_initialized = False


def setup_global_error_hooks():
    global _initialized
    if _initialized:
        return
    _initialized = True

    def handle_async_exception(loop, context):
        exc = context.get("exception")
        if exc:
            logger.critical("Unhandled async exception", exc_info=exc)
        else:
            logger.critical(f"Unhandled async exception: {context}")

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    loop.set_exception_handler(handle_async_exception)

    def handle_unhandled_exception(exc_type, exc_value, exc_traceback):
        if issubclass(exc_type, KeyboardInterrupt):
            sys.__excepthook__(exc_type, exc_value, exc_traceback)
            return
        logger.critical(
            "Unhandled process exception",
            exc_info=(exc_type, exc_value, exc_traceback),
        )

    sys.excepthook = handle_unhandled_exception
