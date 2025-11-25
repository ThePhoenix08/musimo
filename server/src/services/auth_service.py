# // security and authentication service
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict
from passlib.context import CryptContext
from src.services.config import settings
from src.services.database_client import get_supabase_client
from datetime import datetime, timedelta
from jose import JWTError, jwt
import secrets
import string

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
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        to_encode.update({"exp": expire, "type": "access"})
        return jwt.encode(
            to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
        )

    @staticmethod
    def create_refresh_token(data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        return jwt.encode(
            to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
        )

    @staticmethod
    def decode_token(token: str) -> Optional[Dict]:
        try:
            payload = jwt.decode(
                token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
            )
            return payload
        except JWTError:
            return None

    @staticmethod
    def generate_otp() -> str:
        return "".join(
            secrets.choice(string.digits) for _ in range(settings.OTP_LENGTH)
        )

    @staticmethod
    async def store_otp(email: str, otp: str) -> bool:
        supabase = get_supabase_client()
        try:
            expire_at = datetime.utcnow() + timedelta(
                minutes=settings.OTP_EXPIRE_MINUTES
            )

            supabase.table("otp_verification").delete().eq("email", email).execute()

            supabase.table("otp_verification").insert(
                {
                    "email": email,
                    "otp": otp,
                    "expire_at": expire_at.isoformat(),
                    "verified": False,
                }
            ).execute()

            return True
        except Exception as e:
            print(f"Error storing OTP: {e}")
            return False

    @staticmethod
    async def verify_otp(email: str, otp: str) -> bool:
        supabase = get_supabase_client()
        try:
            result = (
                supabase.table("otp_verification")
                .select("*")
                .eq("email", email)
                .eq("otp", otp)
                .eq("verified", False)
                .execute()
            )

            if not result.data:
                return False

            otp_record = result.data[0]
            expire_at = otp_record["expire_at"]
            if isinstance(expire_at, str):
                expire_at = datetime.fromisoformat(expire_at.replace("Z", "+00:00"))

            now = datetime.now(timezone.utc)

            if now > expire_at:
                return False

            supabase.table("otp_verification").update({"verified": True}).eq(
                "id", otp_record["id"]
            ).execute()

            return True
        except Exception as e:
            print(f"Error verifying OTP: {e}")
            return False

    @staticmethod
    async def create_user(
        name: str, username: str, email: str, password: str
    ) -> Optional[Dict]:
        supabase = get_supabase_client()
        try:
            existing = (
                supabase.table("users")
                .select("email, username")
                .or_(f"email.eq.{email},username.eq.{username}")
                .execute()
            )

            if existing.data:
                return None

            user_id = AuthService.generate_user_id()
            hashed_password = AuthService.hash_password(password)

            result = (
                supabase.table("users")
                .insert(
                    {
                        "id": user_id,
                        "name": name,
                        "username": username,
                        "email": email,
                        "password": hashed_password,
                    }
                )
                .execute()
            )

            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error creating user: {e}")
            return None

    @staticmethod
    async def get_user_by_email(email: str) -> Optional[Dict]:
        supabase = get_supabase_client()
        try:
            result = supabase.table("users").select("*").eq("email", email).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error getting user: {e}")
            return None

    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[Dict]:
        supabase = get_supabase_client()
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
