from fastapi import APIRouter, Depends, Form, HTTPException, Request, Response, status
from server.src.database.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import get_password_hasher
from src.core.app_registry import AppRegistry
from src.core.logger_setup import logger
from src.database.enums import OtpType
from src.database.models.otp import Otp
from src.database.session import get_db
from src.schemas.api.response import ApiAuthResponse, ApiEnvelope, ApiResponse
from src.schemas.auth import (
    LoginRequest,
    SignUpRequest,
    UserResponse,
)
from src.schemas.otp import OtpRequest, OtpVerifyRequest
from src.services.auth_service import STORE_REFRESH_TOKEN_METADATA, AuthService
from src.services.dependencies import get_current_user, verify_refresh_token
from src.services.email_service import send_otp_email
from src.services.otp_service import OtpService
from src.utils.auth_utils import construct_return_user

router = APIRouter()


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiEnvelope,
)
async def register(
    name: str = Form(...),
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    """Register a new user"""
    user_data = SignUpRequest(
        name=name, username=username, email=email, password=password
    )

    ph = AppRegistry.get_state("ph")

    user = await AuthService.create_user(
        name=user_data.name,
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,
        db=db,
        ph=ph,
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already exists",
        )

    msg: str = f"New user registered: {user.email}"
    logger.info(msg)

    data = UserResponse(user=construct_return_user(user)).model_dump()

    return ApiResponse(msg, data)


@router.post("/login", response_model=ApiEnvelope)
async def login(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    payload = LoginRequest(email=email, password=password)
    ph = AppRegistry.get_state("ph")
    user = await AuthService.authenticate_user(db, payload.email, payload.password, ph)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email first.",
        )

    await OtpService.invalidate_otp(db, user.id)

    access_token = AuthService.create_access_token(subject_id=user.id)
    refresh_token = AuthService.create_refresh_token(subject_id=user.id)

    refresh_token_metadata = STORE_REFRESH_TOKEN_METADATA(request, user.id)
    await AuthService.store_refresh_token(db, access_token, data=refresh_token_metadata)

    msg: str = f"User logged in: {user.email} | IP={request.client.host}"
    logger.info(msg)
    data = UserResponse(user=construct_return_user(user)).model_dump()

    return ApiAuthResponse(msg, access_token, refresh_token, data)


@router.post("/otp/request-otp", response_model=ApiEnvelope)
async def request_otp(
    request: OtpRequest,
    db: AsyncSession = Depends(get_db),
):
    current_user = await AuthService.get_user_by_email(db, request.email)
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if request.email != current_user.email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Requested email address doesnt match internal user.",
        )

    otp: Otp = await OtpService.create_and_store_otp(
        db, user_id=current_user.id, email=current_user.email, purpose=request.purpose
    )
    if not otp:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occured while generating your otp.",
        )

    isSent: bool = send_otp_email(current_user.email, otp.code)
    if not isSent:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="An error occured while sending otp mail. An email service failure.",
        )

    msg: str = f"OTP sent to {request.email} successfully."
    logger.info(msg)
    return ApiResponse(msg)


@router.post("/otp/verify", response_model=ApiEnvelope)
async def verify_otp(
    payload: OtpVerifyRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    current_user = await AuthService.get_user_by_email(db, payload.email)
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email",
            headers={"WWW-Authenticate": "Bearer"},
        )

    verified = await OtpService.verify_otp(
        db, payload.email, payload.code, payload.purpose
    )
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP"
        )

    if payload.purpose == OtpType.EMAIL_VERIFICATION:
        success: bool = await AuthService.set_email_as_verfied(
            db, user_id=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error occured while marking user as verified.",
            )

    logger.info(f"OTP verified for {payload.email}")

    # LOGIN
    await OtpService.invalidate_otp(db, current_user.id)

    access_token = AuthService.create_access_token(subject_id=current_user.id)
    refresh_token = AuthService.create_refresh_token(subject_id=current_user.id)

    refresh_token_metadata = STORE_REFRESH_TOKEN_METADATA(request, current_user.id)
    await AuthService.store_refresh_token(db, access_token, data=refresh_token_metadata)

    logger.info(f"User logged in: {current_user.email} | IP={request.client.host}")

    data: dict = UserResponse(user=construct_return_user(current_user)).model_dump()

    return ApiAuthResponse(
        f"OTP verified and user logged in: {current_user.email}",
        access_token,
        refresh_token,
        data,
    )


@router.post("/refresh", response_model=ApiEnvelope)
async def refresh_access_token(
    user_id: str = Depends(verify_refresh_token),
):
    access_token = AuthService.create_access_token(subject_id=user_id)
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error occured while generating access token for user.",
        )

    return ApiAuthResponse("New Access token generated.", access_token)


# @router.post("/logout", response_model=ApiEnvelope)
# async def logout(user: User = Depends(get_current_user)):


#     return ApiResponse(msg)


# @router.post("/forgot-password")
# async def forgot_password(
#     request: Request, request_data: ForgotPasswordRequest = Body(...)
# ):
#     user = await AuthService.get_user_by_email(request_data.email)
#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
#         )

#     otp = AuthService.generate_otp()
#     request.session["password_reset"] = {
#         "email": request_data.email,
#         "otp": otp,
#         "expires_at": (datetime.utcnow() + timedelta(minutes=5)).isoformat(),
#     }
#     email_sent = send_otp_email(request_data.email, otp)
#     if not email_sent:
#         raise HTTPException(
#             status_code=500, detail="OTP generated but failed to send email"
#         )
#     return {
#         "message": f"OTP sent successfully to your {request_data.email}",
#     }


# @router.post("/verify-password")
# async def verify_password_reset(
#     request: Request, request_data: ResetPasswordRequest = Body(...)
# ):
#     session_data = request.session.get("password_reset")
#     if not session_data:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="No password reset request found",
#         )
#     if not session_data or session_data["email"] != request_data.email:
#         raise HTTPException(status_code=400, detail="Invalid or expired OTP session")

#     if datetime.utcnow() > datetime.fromisoformat(session_data["expires_at"]):
#         request.session.pop("password_reset", None)
#         raise HTTPException(status_code=400, detail="OTP has expired")

#     if session_data["otp"] != request_data.otp:
#         raise HTTPException(status_code=400, detail="Invalid OTP")

#     if request_data.new_password != request_data.confirm_password:
#         raise HTTPException(status_code=400, detail="Passwords do not match")

#     user = await AuthService.get_user_by_email(request_data.email)
#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
#         )

#     new_password_hash = AuthService.hash_password(request_data.new_password)

#     supabase = request.app.state.supabase

#     update_result = (
#         supabase.table("users")
#         .update({"password": new_password_hash})
#         .eq("id", user["id"])
#         .execute()
#     )

#     if not update_result.data:
#         raise HTTPException(status_code=500, detail="Failed to reset password")

#     request.session.pop("password_reset", None)

#     return {"message": "Password reset successfully"}
