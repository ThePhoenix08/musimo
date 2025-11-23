from fastapi import APIRouter, HTTPException, status, Depends
from ..services.email_service import send_otp_email
from ..schemas.schemas import (OTPRequiredResponse, UserRegistration, UserLogin, OTPRequest, OTPVerify,TokenResponse, RefreshTokenRequest )
from ..services.auth_service import AuthService
from src.services.dependencies import verify_refresh_token

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegistration):
    """Register a new user"""
    user = await AuthService.create_user(
        name=user_data.name,
        username=user_data.username,
        email=user_data.email,
        password=user_data.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already exists"
        )
    
    return {
        "message": "User registered successfully",
        "user_id": user["id"]
    }

@router.post("/otp/send")
async def send_otp(request: OTPRequest):
    user = await AuthService.get_user_by_email(request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    otp = AuthService.generate_otp()
    success = await AuthService.store_otp(request.email, otp)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate OTP"
        )
    
    # send OTP via email
    email_sent = send_otp_email(request.email, otp)

    if not email_sent:
        raise HTTPException(
            status_code=500,
            detail="OTP generated but failed to send email"
        )

    # print(f"OTP for {request.email}: {otp}")
    
    return {
        "message": f"OTP sent successfully to your {request.email}",
    }


@router.post("/otp/verify", response_model=TokenResponse)
async def verify_otp_and_login(request: OTPVerify):
    """Verify OTP and login user"""
    is_valid = await AuthService.verify_otp(request.email, request.otp)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )
    
    # Get user
    user = await AuthService.get_user_by_email(request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Generate tokens
    token_data = {"sub": user["id"], "email": user["email"]}
    access_token = AuthService.create_access_token(token_data)
    refresh_token = AuthService.create_refresh_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )

@router.post("/login", response_model=OTPRequiredResponse)
async def login(credentials: UserLogin):
   
    user = await AuthService.get_user_by_email(credentials.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please check your email."
        )
    
    if not AuthService.verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please check your password."
        )
    
    otp = AuthService.generate_otp()
    await AuthService.store_otp(credentials.email, otp)
    
    send_otp_email(credentials.email, otp)
    
    return {
        "message": "OTP successfully sent. Please check your email.",
        "requires_otp": True,
    }

@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(user_id: str = Depends(verify_refresh_token)):
    """Refresh access token using refresh token"""
    
    user = await AuthService.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Generate new tokens
    token_data = {"sub": user["id"], "email": user["email"]}
    access_token = AuthService.create_access_token(token_data)
    refresh_token = AuthService.create_refresh_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )

@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}

# @router.post("/logout")
# async def logout(token: str = Depends(get_current_token)):
#     await AuthService.blacklist_token(token)
#     return {"message": "Logged out successfully"}