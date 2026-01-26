from src.models.audio_separation.app.routes.audio import router as audio_router
from . import auth, predict, transaction, user, ws_router


def register_routes(app):
    app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
    app.include_router(user.router, prefix="/user", tags=["User"])
    app.include_router(transaction.router, prefix="/transaction", tags=["Transaction"])
    app.include_router(predict.router, prefix="/model", tags=["Model"])
    app.include_router(audio_router)
