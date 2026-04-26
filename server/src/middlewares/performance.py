# src/middlewares/performance.py
import time


def register_process_time_header(app):
    @app.middleware("http")
    async def add_process_time_header(request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        process_time = time.perf_counter() - start
        response.headers["X-Process-Time"] = str(process_time)
        return response
