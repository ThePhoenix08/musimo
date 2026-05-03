import logging
import uuid
from typing import Annotated, Optional

from fastapi import (
    Depends,
    HTTPException,
    Request,
    WebSocket,
    WebSocketException,
    status,
)
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.models.user import User
from src.database.session import get_db, get_sessionmaker
from src.services.auth_service import AuthService

logger = logging.getLogger(__name__)


security = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing credentials (access token)",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = AuthService.decode_token(token, "access").model_dump()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"JWT Error {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    user = await AuthService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if hasattr(user, "email_verified") and not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email before proceeding.",
        )

    return user


async def verify_refresh_token(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> str:
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        logger.warning("Missing refresh token cookie")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token",
        )

    user_id: str = await AuthService.verify_refresh_token(db, refresh_token)

    return user_id


async def get_current_ws_user(
    websocket: WebSocket,
    db: Optional[AsyncSession] = None,
) -> User:
    """
    Authenticate WebSocket user using JWT token from query params.

    Client example:
        ws://localhost:8000/api/ws/analyze-emotion/{project_id}?token=JWT_HERE

    Returns:
        Authenticated User object

    Raises:
        WebSocketException(code=1008) on auth failure
    """

    token = websocket.query_params.get("token")

    if not token:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="Missing access token",
        )

    # Decode JWT
    try:
        payload = AuthService.decode_token(token, "access").model_dump()
    except Exception as e:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION,
            reason=f"Invalid token: {str(e)}",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="Invalid token payload",
        )

    try:
        user_uuid = uuid.UUID(str(user_id))
    except Exception:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="Invalid user id in token",
        )

    # If DB session passed externally, use it
    # Otherwise create one internally
    if db is not None:
        user = await AuthService.get_user_by_id(db, user_uuid)
    else:
        SessionLocal = get_sessionmaker()

        async with SessionLocal() as session:
            user = await AuthService.get_user_by_id(session, user_uuid)

    # Validate user
    if not user:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="User not found",
        )

    if hasattr(user, "is_active") and not user.is_active:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="Inactive account",
        )

    if hasattr(user, "email_verified") and not user.email_verified:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="Email not verified",
        )

    return user_id