from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Dict, Optional
from src.schemas.schemas import TransactionResponse, TransactionList
from src.services.dependencies import get_current_user
from src.services.database_client import get_supabase_client


router = APIRouter()


@router.get("/", response_model=TransactionList)
async def get_transactions(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    model_type: Optional[str] = Query(None, description="Filter by model type"),
    current_user: Dict = Depends(get_current_user),
):
    """paginated list of user's transactions"""

    supabase = get_supabase_client()

    try:
        offset = (page - 1) * page_size
        query = (
            supabase.table("transactions")
            .select("*", count="exact")
            .eq("user_id", current_user["id"])
            .order("created_at", desc=True)
            .range(offset, offset + page_size - 1)
        )

        if model_type:
            query = query.eq("model_type", model_type)

        result = query.execute()

        transactions = [
            TransactionResponse(
                transaction_id=t["transaction_id"],
                user_id=t["user_id"],
                model_type=t["model_type"],
                audio_path=t["audio_path"],
                melspectrogram_path=t["melspectrogram_path"],
                output=t["output"],
                created_at=t["created_at"],
            )
            for t in result.data
        ]

        return TransactionList(
            transactions=transactions,
            total=result.count or 0,
            page=page,
            page_size=page_size,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching transactions: {str(e)}",
        )


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str, current_user: Dict = Depends(get_current_user)
):
    """Get specific transaction by ID"""

    supabase = get_supabase_client()

    try:
        result = (
            supabase.table("transactions")
            .select("*")
            .eq("transaction_id", transaction_id)
            .eq("user_id", current_user["id"])
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found"
            )

        t = result.data[0]
        return TransactionResponse(
            transaction_id=t["transaction_id"],
            user_id=t["user_id"],
            model_type=t["model_type"],
            audio_path=t["audio_path"],
            melspectrogram_path=t["melspectrogram_path"],
            output=t["output"],
            created_at=t["created_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching transaction: {str(e)}",
        )


@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: str, current_user: Dict = Depends(get_current_user)
):
    """Delete a transaction"""

    supabase = get_supabase_client()

    try:
        existing = (
            supabase.table("transactions")
            .select("transaction_id")
            .eq("transaction_id", transaction_id)
            .eq("user_id", current_user["id"])
            .execute()
        )

        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found"
            )

        result = (
            supabase.table("transactions")
            .delete()
            .eq("transaction_id", transaction_id)
            .execute()
        )

        return {"message": "Transaction deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting transaction: {str(e)}",
        )


@router.get("/stats/summary")
async def get_transaction_summary(current_user: Dict = Depends(get_current_user)):
    """Get summary statistics of transactions"""

    supabase = get_supabase_client()

    try:
        result = (
            supabase.table("transactions")
            .select("model_type, output")
            .eq("user_id", current_user["id"])
            .execute()
        )

        transactions = result.data

        total_count = len(transactions)
        emotion_count = sum(
            1 for t in transactions if t["model_type"] == "emotion_detection"
        )
        instrument_count = sum(
            1 for t in transactions if t["model_type"] == "instrument_classification"
        )

        emotion_predictions = [
            t["output"]["prediction"]
            for t in transactions
            if t["model_type"] == "emotion_detection"
        ]
        instrument_predictions = [
            t["output"]["prediction"]
            for t in transactions
            if t["model_type"] == "instrument_classification"
        ]

        from collections import Counter

        most_common_emotion = (
            Counter(emotion_predictions).most_common(1)[0]
            if emotion_predictions
            else None
        )
        most_common_instrument = (
            Counter(instrument_predictions).most_common(1)[0]
            if instrument_predictions
            else None
        )

        return {
            "total_transactions": total_count,
            "emotion_detection_count": emotion_count,
            "instrument_classification_count": instrument_count,
            "most_common_emotion": (
                most_common_emotion[0] if most_common_emotion else None
            ),
            "most_common_instrument": (
                most_common_instrument[0] if most_common_instrument else None
            ),
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching summary: {str(e)}",
        )
