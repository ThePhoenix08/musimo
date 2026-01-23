from datetime import datetime, timedelta

from fastapi import APIRouter, Body, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession


from src.core.jwt import create_access_token, create_refresh_token
from src.schemas.otp import OTPRequest, OTPRequiredResponse, OTPVerify
from src.database.session import get_db
from src.schemas.auth import AuthResponse, LoginResponse, UserLogin, UserRegistration

from src.services.auth_service import AuthService
from src.services.dependencies import verify_refresh_token
from src.services.email_service import send_otp_email

router = APIRouter()


@router.post("/register", 
             status_code=status.HTTP_201_CREATED,
             response_model=AuthResponse)
async def register(user_data: UserRegistration, db:AsyncSession=Depends(get_db)):
    """Register a new user"""
    user, tokens = await AuthService.create_user(
        name=user_data.name,
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,
        db=db
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already exists"
        )

    # Return AuthResponse with tokens and user info
    return AuthResponse(
        user_id=user.id,
        username=user.username,
        email=user.email,
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type="bearer"
    )


@router.post("/otp/send")
async def send_otp(request: OTPRequest):
    user = await AuthService.get_user_by_email(request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    otp = AuthService.generate_otp()
    success = await AuthService.store_otp(request.email, otp)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate OTP",
        )

    # send OTP via email
    email_sent = send_otp_email(request.email, otp)

    if not email_sent:
        raise HTTPException(
            status_code=500, detail="OTP generated but failed to send email"
        )

    # print(f"OTP for {request.email}: {otp}")

    return {
        "message": f"OTP sent successfully to your {request.email}",
    }


@router.post("/otp/verify", response_model=LoginResponse)
async def verify_otp_and_login(request: OTPVerify):
    """Verify OTP and login user"""
    is_valid = await AuthService.verify_otp(request.email, request.otp)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP"
        )

    # Get user
    user = await AuthService.get_user_by_email(request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Generate tokens
    token_data = {"sub": user["id"], "email": user["email"]}
    access_token = AuthService.create_access_token(token_data)
    refresh_token = AuthService.create_refresh_token(token_data)

    return LoginResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=LoginResponse)
async def login(
    loginRequest:UserLogin, 
    db:AsyncSession=Depends(get_db)
):
    
    user = await AuthService.authenticate_user(db, loginRequest.email, loginRequest.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Directly generate and return JWT tokens
    return {
        "access_token": create_access_token(user_id=str(user.id)),
        "refresh_token": create_refresh_token(user_id=str(user.id)),
        "token_type": "bearer",
    }



@router.post("/refresh", response_model=LoginResponse)
async def refresh_access_token(user_id: str = Depends(verify_refresh_token)):

    user = await AuthService.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Generate new tokens
    token_data = {"sub": user["id"], "email": user["email"]}
    access_token = AuthService.create_access_token(token_data)
    refresh_token = AuthService.create_refresh_token(token_data)

    return LoginResponse(access_token=access_token, refresh_token=refresh_token)


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


@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}


# @router.post("/logout")
# async def logout(token: str = Depends(get_current_token)):
#     await AuthService.blacklist_token(token)
#     return {"message": "Logged out successfully"}
