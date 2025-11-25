import sys
import traceback

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from ..core.logger_setup import logger


def format_trace(exc: Exception) -> str:
    """Compact one-line traceback with relative path"""
    tb = traceback.extract_tb(sys.exc_info()[2])
    formatted = []
    for f in tb:
        path = f.filename.replace("\\", "/")
        if "site-packages" in path:
            continue  # skip internals
        formatted.append(f"{path}:{f.lineno} in {f.name}()")
    return " → ".join(formatted) or str(exc)


async def general_exception_handler(request: Request, exc: Exception):
    tb_summary = format_trace(exc)
    error_message = f"{exc.__class__.__name__}: {str(exc)}"
    logger.error(f"{tb_summary} | {error_message}")

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "description": str(exc),
            "trace": tb_summary,
        },
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handles FastAPI HTTPExceptions (401, 404, 409, etc.)"""
    logger.warning(f"HTTPException {exc.status_code} on {request.url}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.status_code, "message": exc.detail},
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"ValidationError on {request.url}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": "Validation Error", "details": exc.errors()},
    )


def register_exception_handlers(app):
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
