import argon2


def hash_password(password: str) -> str:
    return argon2.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        argon2.verify_password(password, hashed)
    except Exception:
        return False
