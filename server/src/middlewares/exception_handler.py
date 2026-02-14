import json
import sys
import traceback

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from src.schemas.api.response import ApiErrorResponse

from ..core.logger_setup import logger

"""
THROWABLE ERRORS:
RequestValidationError
HTTPException
ConnectionError
RuntimeError
"""


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


def register_exception_handlers(app):
    # Handle Pydantic validation errors (model-level)
    @app.exception_handler(ValidationError)
    async def pydantic_validation_handler(request: Request, exc: ValidationError):
        errors = exc.errors()
        try:
            safe_errors = json.loads(json.dumps(errors, default=str))
        except Exception:
            safe_errors = [str(e) for e in errors]

        first = safe_errors[0] if safe_errors else {}
        field = ".".join(str(x) for x in first.get("loc", []))
        msg = first.get("msg", "Validation error")

        logger.warning(
            f"Pydantic validation error on {request.url}: field='{field}' msg='{msg}' details={safe_errors}"
        )

        return ApiErrorResponse(
            code="MODEL_VALIDATION_ERROR",
            message=f"{field}: {msg}" if field else msg,
            details=safe_errors,
            http_status=status.HTTP_400_BAD_REQUEST,
        )

    # Validation errors (422 / 400)
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        errors = exc.errors()
        try:
            safe_errors = json.loads(json.dumps(errors, default=str))
        except Exception:
            safe_errors = [str(e) for e in errors]

        first = safe_errors[0] if safe_errors else {}
        field = ".".join(str(x) for x in first.get("loc", []))
        msg = first.get("msg", "Validation error")

        logger.warning(
            f"Validation error on {request.url}: field='{field}' msg='{msg}' details={safe_errors}"
        )

        return ApiErrorResponse(
            code="VALIDATION_ERROR",
            message=f"{field}: {msg}" if field else msg,
            details=safe_errors,
            http_status=status.HTTP_400_BAD_REQUEST,
        )

    # Common HTTP errors (401, 403, 404, 409, etc.)
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        logger.warning(f"HTTP {exc.status_code} on {request.url}: {exc.detail}")
        return ApiErrorResponse(
            code=f"HTTP_{exc.status_code}",
            message=str(exc.detail or "HTTP error"),
            http_status=exc.status_code,
        )

    # Internal server errors (programming bugs)
    @app.exception_handler(RuntimeError)
    async def runtime_exception_handler(request: Request, exc: RuntimeError):
        logger.exception(f"Runtime error on {request.url}: {exc}")
        return ApiErrorResponse(
            code="INTERNAL_SERVER_ERROR",
            message=str(exc),
            details=format_trace(exc),
            http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Service-level errors (e.g., DB down, model load failure)
    @app.exception_handler(ConnectionError)
    async def service_unavailable_handler(request: Request, exc: ConnectionError):
        logger.error(f"Service unavailable: {exc}")
        return ApiErrorResponse(
            code="SERVICE_UNAVAILABLE",
            message="A dependent service is unavailable (DB or ML model failure).",
            details=str(exc),
            http_status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    # Fallback: any unhandled exception → 500
    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.exception(f"Unhandled exception on {request.url}: {exc}")
        return ApiErrorResponse(
            code="UNHANDLED_EXCEPTION",
            message="An unexpected error occurred.",
            details=format_trace(exc),
            http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


__all__ = ["register_exception_handlers"]
