from typing import Dict

from fastapi import APIRouter, Depends, HTTPException, status

from src.core.app_registry import AppRegistry
from src.schemas.user import PasswordChange, UserProfile, UserProfileUpdate
from src.services.auth_service import AuthService
from src.services.dependencies import get_current_user

router = APIRouter()


@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: Dict = Depends(get_current_user)):
    return UserProfile(
        id=current_user["id"],
        name=current_user["name"],
        username=current_user["username"],
        email=current_user["email"],
        created_at=current_user["created_at"],
    )


@router.put("/profile")
async def update_profile(
    profile_update: UserProfileUpdate, current_user: Dict = Depends(get_current_user)
):
    if not profile_update.name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update"
        )

    supabase = AppRegistry.get_state("supabase")

    try:
        result = (
            supabase.table("users")
            .update({"name": profile_update.name})
            .eq("id", current_user["id"])
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update profile",
            )

        return {"message": "Profile updated successfully", "user": result.data[0]}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating profile: {str(e)}",
        )


@router.post("/change-password")
async def change_password(
    password_change: PasswordChange, current_user: Dict = Depends(get_current_user)
):
    supabase = AppRegistry.get_state("supabase")

    user_result = (
        supabase.table("users")
        .select("id, password")
        .eq("id", current_user["id"])
        .single()
        .execute()
    )

    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")

    db_user = user_result.data
    if not AuthService.verify_password(
        password_change.current_password, db_user["password"]
    ):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    ph = AppRegistry.get_state("ph")
    new_password_hash = AuthService.hash_password(ph, password_change.new_password)

    update_result = (
        supabase.table("users")
        .update({"password": new_password_hash})
        .eq("id", current_user["id"])
        .execute()
    )

    if not update_result.data:
        raise HTTPException(status_code=500, detail="Failed to update password")

    return {"message": "Password changed successfully"}


@router.delete("/account")
async def delete_account(current_user: Dict = Depends(get_current_user)):
    supabase = AppRegistry.get_state("supabase")

    try:
        # 1: Soft delete (mark as deleted)
        # result = supabase.table('users')\
        #     .update({"is_deleted": True})\
        #     .eq('id', current_user["id"])\
        #     .execute()

        # 2: Hard delete (remove from database)
        _result = (
            supabase.table("users").delete().eq("id", current_user["id"]).execute()
        )

        return {"message": "Account deleted successfully"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting account: {str(e)}",
        )


@router.get("/stats")
async def get_user_stats(current_user: Dict = Depends(get_current_user)):
    supabase = AppRegistry.get_state("supabase")

    try:
        transactions = (
            supabase.table("transactions")
            .select("id", count="exact")
            .eq("user_id", current_user["id"])
            .execute()
        )

        emotion_count = (
            supabase.table("transactions")
            .select("id", count="exact")
            .eq("user_id", current_user["id"])
            .eq("model_type", "emotion_detection")
            .execute()
        )

        instrument_count = (
            supabase.table("transactions")
            .select("id", count="exact")
            .eq("user_id", current_user["id"])
            .eq("model_type", "instrument_classification")
            .execute()
        )

        return {
            "total_transactions": transactions.count,
            "emotion_detection_count": emotion_count.count,
            "instrument_classification_count": instrument_count.count,
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching stats: {str(e)}",
        )
