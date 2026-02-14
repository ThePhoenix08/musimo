from src.database.models.user import User


def construct_return_user(user: User) -> dict:
    return {
        "user_id": user.id,
        "name": user.name,
        "username": user.username,
        "email": user.email,
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat(),
        "email_verified": user.email_verified,
    }
