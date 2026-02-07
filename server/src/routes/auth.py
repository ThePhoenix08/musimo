from fastapi import APIRouter, Depends, HTTPException, Request, status
from server.src.database.models.otp import Otp
from server.src.database.models.user import User
from server.src.services.email_service import send_otp_email
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger_setup import logger
from src.database.enums import OtpType
from src.database.session import get_db
from src.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RegisterUserResponse,
    SignUpRequest,
)
from src.schemas.otp import OtpRequest, OtpVerifyRequest, OtpVerifyResponse
from src.services.auth_service import STORE_REFRESH_TOKEN_METADATA, AuthService
from src.services.dependencies import get_current_user, verify_refresh_token
from src.services.otp_service import OtpService

router = APIRouter()


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=RegisterUserResponse,
)
async def register(
    request: Request, user_data: SignUpRequest, db: AsyncSession = Depends(get_db)
):
    """Register a new user"""
    user = await AuthService.create_user(
        name=user_data.name,
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,
        db=db,
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already exists",
        )

    tokens = {
        "access_token": AuthService.create_access_token(subject_id=str(user.id)),
        "refresh_token": AuthService.create_refresh_token(subject_id=str(user.id)),
    }

    refresh_token_metadata = STORE_REFRESH_TOKEN_METADATA(request, user.id)

    await AuthService.store_refresh_token(
        db, tokens["refresh_token"], data=refresh_token_metadata
    )

    logger.info(f"New user registered: {user.email}")

    return RegisterUserResponse(
        user_id=user.id,
        username=user.username,
        email=user.email,
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type="bearer",
    )


@router.post("/login", response_model=LoginResponse)
async def login(
    request: Request, payload: LoginRequest, db: AsyncSession = Depends(get_db)
):
    user = await AuthService.authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = AuthService.create_access_token(subject_id=user.id)
    refresh_token = AuthService.create_refresh_token(subject_id=user.id)

    refresh_token_metadata = STORE_REFRESH_TOKEN_METADATA(request, user.id)
    await AuthService.store_refresh_token(db, access_token, data=refresh_token_metadata)

    logger.info(f"User logged in: {user.email} | IP={request.client.host}")

    return LoginResponse(access_token, refresh_token, token_type="bearer")


@router.post("/otp/request-otp")
async def request_otp(
    request: OtpRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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

    isSent: bool = await send_otp_email(current_user.email, otp.code)
    if not isSent:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="An error occured while sending otp mail. An email service failure.",
        )

    logger.info(f"OTP sent to {request.email} successfully.")
    return {"message": "OTP sent successfully."}


@router.post("/otp/verify", response_model=OtpVerifyResponse)
async def verify_otp(
    request: OtpVerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if request.email != current_user.email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Requested email address doesnt match internal user.",
        )

    verified = await OtpService.verify_otp(
        db, request.email, request.code, request.purpose
    )
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP"
        )

    if request.purpose == OtpType.EMAIL_VERIFICATION:
        success: bool = await AuthService.set_email_as_verfied(
            db, user_id=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error occured while marking user as verified.",
            )

    logger.info(f"OTP verified for {request.email}")
    return OtpVerifyResponse(verified=True)


# @router.post("/refresh", response_model=RefreshAccessTokenRequest)
# async def refresh_access_token(
#     user_id: str = Depends(verify_refresh_token),
#     current_user: User = Depends(get_current_user),
# ):
#     access_token = AuthService.create_access_token(subject_id=user_id)
#     if not access_token:
#         raise HTTPException()

#     return RefreshAccessTokenResponse(access_token=access_token)


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
