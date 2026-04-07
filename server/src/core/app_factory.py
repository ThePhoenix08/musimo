from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.lifespan import lifespan
from src.core.settings import CONSTANTS
from src.middlewares.cors import CORS_POLICY
from src.middlewares.exception_handler import register_exception_handlers
from src.middlewares.performance import register_process_time_header
from src.routes import debug, register_routes, ws_router


def create_app() -> FastAPI:
    app = FastAPI(
        title=CONSTANTS.APP_NAME,
        description="AI-powered music emotion detection and instrument classification",
        version=CONSTANTS.APP_VERSION,
        lifespan=lifespan,
    )

    register_exception_handlers(app)
    app.add_middleware(
        CORSMiddleware,
        CORS_POLICY
    )
    register_process_time_header(app)

    register_routes(app)
    app.include_router(ws_router.router)

    if CONSTANTS.ENV == "dev":
        app.include_router(debug.router)

    return app