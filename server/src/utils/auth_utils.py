def construct_return_user(user: dict) -> dict:
    return {
        "user_id": user["id"],
        "name": user["name"],
        "username": user["username"],
        "email": user["email"],
        "created_at": user.get("created_at"),
        "updated_at": user.get("updated_at"),
        "email_verified": user["email_verified"],
    }
