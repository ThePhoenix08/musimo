from src.core.settings import CONSTANTS

CORS_POLICY: dict = {
    "allow_origins": CONSTANTS.ALLOWED_ORIGINS,
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
    "expose_headers": ["authorization"],
}