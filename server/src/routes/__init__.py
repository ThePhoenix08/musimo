from src.routes import audio_file, project
from . import auth, predict, separate_audio, transaction, user


def register_routes(app):
    app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
    app.include_router(user.router, prefix="/user", tags=["User"])
    app.include_router(transaction.router, prefix="/transaction", tags=["Transaction"])
    app.include_router(predict.router, prefix="/model", tags=["Model"])
    app.include_router(
        separate_audio.router, prefix="/separate-audio", tags=["AudioSeparate"]
    )
    app.include_router(project.router)      # prefix="/projects" already set on router
    app.include_router(audio_file.router)   # prefix="/projects/{project_id}/audio-files" already set on router