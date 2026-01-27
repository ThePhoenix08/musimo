import sys
import traceback

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from src.schemas import ApiError, ApiResponse

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


def register_exception_handlers(app):
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        logger.warning(f"Validation error on {request.url}: {exc.errors()}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=ApiResponse(
                success=False,
                error=ApiError(
                    code="VALIDATION_ERROR",
                    message="Invalid input.",
                    details=exc.errors(),
                ),
            ).model_dump(),
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        logger.warning(
            f"HTTPException {exc.status_code} on {request.url}: {exc.detail}"
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=ApiResponse(
                success=False,
                error=ApiError(code=str(exc.status_code), message=exc.detail),
            ).model_dump(),
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.exception(f"Unhandled exception on {request.url}: {exc}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ApiResponse(
                success=False,
                error=ApiError(code="INTERNAL_SERVER_ERROR", message=str(exc)),
            ).model_dump(),
        )


__all__ = ["register_exception_handlers"]
