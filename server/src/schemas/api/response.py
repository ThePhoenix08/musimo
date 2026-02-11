from datetime import UTC, datetime
from typing import Any, Optional, TypedDict

from fastapi import Response, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from src.core.settings import CONSTANTS
from src.schemas.api.error import ApiError


class ApiEnvelope(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    error: Optional[ApiError] = None
    meta: Optional[dict] = None
    timestamp: str


class PaginationMeta(TypedDict):
    page: int
    total: int
    limit: int


def _base_payload(
    success: bool,
    message: str,
    data: dict | None = None,
    error: ApiError | None = None,
    meta: dict | None = None,
) -> dict:
    return {
        "success": success,
        "message": message,
        "data": data or {},
        "error": error.model_dump() if error else None,
        "meta": meta or {},
        "timestamp": datetime.now(UTC).isoformat(),
    }


def ApiResponse(
    message: str,
    response: Response,
    data: dict | None = None,
    *,
    error: ApiError | None = None,
    meta: dict | None = None,
    status_code: int = 200,
) -> JSONResponse:
    payload = _base_payload(
        success=(200 <= status_code < 300),
        message=message,
        data=data,
        error=error,
        meta=meta,
    )

    return JSONResponse(
        content=payload, status_code=status_code, headers=response.headers
    )


def ApiAuthResponse(
    message: str,
    response: Response,
    access_token: str | None,
    refresh_token: str | None,
    data: dict | None = None,
    *,
    meta: dict | None = None,
    status_code: int = 200,
) -> JSONResponse:
    data = data if data else {}

    if access_token:
        response.headers["Authorization"] = f"Bearer {access_token}"

    if refresh_token:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=CONSTANTS.REFRESH_TOKEN_EXPIRE_SECONDS,
            path="/",
        )

    payload = _base_payload(
        success=200 <= status_code < 300,
        message=message,
        data=data,
        error=None,
        meta=meta,
    )

    return JSONResponse(
        content=payload, status_code=status_code, headers=response.headers
    )


def ApiErrorResponse(
    response: Response,
    *,
    code: str,
    message: str,
    details: Optional[Any] = None,
    http_status: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
) -> JSONResponse:
    api_error = ApiError(code=code, message=message, details=details)
    return ApiResponse(
        message=message,
        response=response,
        data=None,
        error=api_error,
        meta=None,
        status_code=http_status,
    )
