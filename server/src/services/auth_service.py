# // security and authentication service
import secrets
from sqlalchemy import select
import string
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, Tuple
from uuid import uuid4

import bcrypt
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.jwt import create_access_token, create_refresh_token
from src.database.models.user import User
from ..core.app_registry import AppRegistry
from ..core.settings import CONSTANTS

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:

    @staticmethod
    def generate_user_id() -> str:
        letters = "".join(secrets.choice(string.ascii_letters) for _ in range(6))
        numbers = "".join(secrets.choice(string.digits) for _ in range(6))
        combined = list(letters + numbers)
        secrets.SystemRandom().shuffle(combined)
        return "".join(combined)

    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def create_access_token(data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(
            minutes=CONSTANTS.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        to_encode.update({"exp": expire, "type": "access"})
        return jwt.encode(
            to_encode, CONSTANTS.JWT_SECRET_KEY, algorithm=CONSTANTS.JWT_ALGORITHM
        )

    

    @staticmethod
    def decode_token(token: str) -> Optional[Dict]:
        try:
            payload = jwt.decode(
                token, CONSTANTS.JWT_SECRET_KEY, algorithms=[CONSTANTS.JWT_ALGORITHM]
            )
            return payload
        except JWTError:
            return None

    # @staticmethod
    # def generate_otp() -> str:
    #     return "".join(
    #         secrets.choice(string.digits) for _ in range(CONSTANTS.OTP_LENGTH)
    #     )

    # @staticmethod
    # async def store_otp(email: str, otp: str) -> bool:
    #     supabase = AppRegistry.get_state("supabase")
    #     try:
    #         expire_at = datetime.utcnow() + timedelta(
    #             minutes=CONSTANTS.OTP_EXPIRE_MINUTES
    #         )

    #         supabase.table("otp_verification").delete().eq("email", email).execute()

    #         supabase.table("otp_verification").insert(
    #             {
    #                 "email": email,
    #                 "otp": otp,
    #                 "expire_at": expire_at.isoformat(),
    #                 "verified": False,
    #             }
    #         ).execute()

    #         return True
    #     except Exception as e:
    #         print(f"Error storing OTP: {e}")
    #         return False

    # @staticmethod
    # async def verify_otp(email: str, otp: str) -> bool:
    #     supabase = AppRegistry.get_state("supabase")
    #     try:
    #         result = (
    #             supabase.table("otp_verification")
    #             .select("*")
    #             .eq("email", email)
    #             .eq("otp", otp)
    #             .eq("verified", False)
    #             .execute()
    #         )

    #         if not result.data:
    #             return False

    #         otp_record = result.data[0]
    #         expire_at = otp_record["expire_at"]
    #         if isinstance(expire_at, str):
    #             expire_at = datetime.fromisoformat(expire_at.replace("Z", "+00:00"))

    #         now = datetime.now(timezone.utc)

    #         if now > expire_at:
    #             return False

    #         supabase.table("otp_verification").update({"verified": True}).eq(
    #             "id", otp_record["id"]
    #         ).execute()

    #         return True
    #     except Exception as e:
    #         print(f"Error verifying OTP: {e}")
    #         return False

    @staticmethod
    async def create_user(
        name: str,
        username: str,
        email: str,
        password: str,
        db: AsyncSession
    ) -> Optional[Tuple[User, dict]]:
        """
        Create a new user in the database and return the user and JWT tokens.
        Returns None if email or username already exists.
        """
        # Check for existing user by email or username
        result = await db.execute(
            select(User).where((User.email == email) | (User.username == username))
        )
        existing_user = result.scalar_one_or_none()
        if existing_user:
            return None

        # Hash the password securely
        pwd_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')


        # Create new user instance
        user = User(
            id=uuid4(),
            name=name,
            username=username,
            email=email,
            password=hashed_password
        )

        db.add(user)
        await db.commit()
        await db.refresh(user)  # refresh to get generated fields like ID

        # Generate JWT tokens
        tokens = {
            "access_token": create_access_token(user_id=str(user.id)),
            "refresh_token": create_refresh_token(user_id=str(user.id))
        }

        return user, tokens
    

    @staticmethod
    async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
        # Fetch user from DB
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            return None
            
        # Verify bcrypt hash (expects bytes)
        if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
            return None
            
        return user

    @staticmethod
    async def get_user_by_email(email: str) -> Optional[Dict]:
        supabase = AppRegistry.get_state("supabase")
        try:
            result = supabase.table("users").select("*").eq("email", email).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error getting user: {e}")
            return None

    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[Dict]:
        supabase = AppRegistry.get_state("supabase")
        try:
            result = (
                supabase.table("users")
                .select("id, name, username, email, created_at")
                .eq("id", user_id)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error getting user: {e}")
            return None
