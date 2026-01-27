# Transaction Schemas
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class TransactionCreate(BaseModel):
    model_type: Literal["emotion_detection", "instrument_classification"]


class TransactionResponse(BaseModel):
    transaction_id: str
    user_id: str
    model_type: str
    audio_path: str
    melspectrogram_path: str
    output: dict
    created_at: datetime


class TransactionList(BaseModel):
    transactions: list[TransactionResponse]
    total: int
    page: int
    page_size: int
