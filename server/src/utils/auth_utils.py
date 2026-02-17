from src.database.models.user import User


def construct_return_user(user: User) -> dict:
    return {
        "user_id": user.id,
        "name": user.name,
        "username": user.username,
        "email": user.email,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        "email_verified": user.email_verified,
    }

