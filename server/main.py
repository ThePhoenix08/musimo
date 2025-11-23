from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from src.routes import auth, user, transaction, predict
from src.services.database_client import get_supabase_client

import uvicorn

@asynccontextmanager
async def lifespan(app: FastAPI):

    print("🎵 Musimo API Starting...")
    try:
        supabase = get_supabase_client()
        print("✅ Supabase connected successfully")
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
    yield

    print("🎵 Musimo API Shutting down...")

app = FastAPI(
    title="Musimo API",
    description="AI-powered music emotion detection and instrument classification",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(user.router, prefix="/user", tags=["User"])
app.include_router(transaction.router, prefix="/transaction", tags=["Transaction"])
app.include_router(predict.router, prefix="/model", tags=["Model"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to Musimo ",
        "version": "1.0.0",
        "status": "active"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )