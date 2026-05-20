from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.models import User
from src.database.session import get_db
from src.schemas.user import PasswordChange, UserProfile, UserProfileUpdate
from src.services.auth_service import AuthService
from src.services.dependencies import get_current_user

router = APIRouter()

@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: User = Depends(get_current_user)):
    return UserProfile(
        id=str(current_user.id),
        name=current_user.name,
        username=current_user.username,
        email=current_user.email,
        created_at=current_user.created_at,
        email_verified=current_user.email_verified,
    )


@router.put("/profile")
async def update_profile(
    profile_update: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not profile_update.name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    try:
        current_user.name = profile_update.name

        await db.commit()
        await db.refresh(current_user)

        return {
            "message": "Profile updated successfully",
            "user": {
                "id": str(current_user.id),
                "name": current_user.name,
                "username": current_user.username,
                "email": current_user.email,
            },
        }

    except Exception as e:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating profile: {str(e)}",
        )


@router.post("/change-password")
async def change_password(
    password_change: PasswordChange,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not AuthService.verify_password(
        password_change.current_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect",
        )

    try:
        current_user.password_hash = AuthService.hash_password(
            password_change.new_password
        )

        await db.commit()

        return {"message": "Password changed successfully"}

    except Exception as e:
        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to update password: {str(e)}",
        )


@router.delete("/account")
async def delete_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        await db.delete(current_user)
        await db.commit()

        return {"message": "Account deleted successfully"}

    except Exception as e:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting account: {str(e)}",
        )


