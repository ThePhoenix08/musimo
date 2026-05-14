from src.routes import (
    audio_features,
    audio_file,
    auth,
    project,
    separate_audio,
    system,
    user,
    analysis
)

def register_routes(app):
    app.include_router(system.router, prefix="/api", tags=["System"])
    app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
    app.include_router(user.router, prefix="/api/user", tags=["User"])
    app.include_router(separate_audio.router, tags=["AudioSeparate"])  # ← remove prefix
    app.include_router(audio_features.router, prefix="/api/audio/audio-feature", tags=["Audio Feature"])
    app.include_router(project.router, prefix="/api/projects", tags=["Projects"])
    app.include_router(audio_file.router, prefix="/api/projects/{project_id}/audio-files", tags=["Audio Files"])
    app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])