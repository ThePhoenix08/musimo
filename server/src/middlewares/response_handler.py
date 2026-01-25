from typing import Any

from fastapi import status
from fastapi.responses import JSONResponse

from src.core.logger_setup import logger
from src.schemas import ApiResponse


def success(data: Any = None, meta: dict | None = None, status_code: int = status.HTTP_200_OK) -> JSONResponse:
    """Standard success response with logging."""
    logger.info("Success response generated.")
    return JSONResponse(
        status_code=status_code,
        content=ApiResponse(success=True, data=data, meta=meta).model_dump()
    )

def failure(error_code: str, message: str, details: Any | None = None, status_code: int = status.HTTP_400_BAD_REQUEST) -> JSONResponse:
    """Manual error builder for business logic failures."""
    from src.schemas import ApiError
    logger.warning(f"API failure [{error_code}]: {message}")
    return JSONResponse(
        status_code=status_code,
        content=ApiResponse(
            success=False,
            error=ApiError(code=error_code, message=message, details=details)
        ).model_dump()
    )
