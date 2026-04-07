from src.routes import audio_features, audio_file, project

from . import auth, separate_audio, user


def register_routes(app):
    app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
    app.include_router(user.router, prefix="/api/user", tags=["User"])
    app.include_router(
        separate_audio.router, prefix="/api/separate-audio", tags=["AudioSeparate"]
    )
    app.include_router(audio_features.router, prefix="/api/audio/audio-feature")
    app.include_router(project.router, prefix="/api/projects")
    app.include_router(
        audio_file.router, prefix="/api/projects/{project_id}/audio-files"
    )
