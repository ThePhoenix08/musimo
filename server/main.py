# ruff: noqa: I001, E402

from src.core.bootstrap import bootstrap

IS_DEV, NUM_OF_WORKERS = bootstrap()

from src.core.app_factory import create_app

app = create_app()

# if __name__ == "__main__":
#     uvicorn.run(
#         "main:app",
#         host="0.0.0.0",
#         port=8000,
#         # reload=IS_DEV,
#         reload=False,
#         log_config=None,
#         workers=1 if IS_DEV else NUM_OF_WORKERS,
#     )
