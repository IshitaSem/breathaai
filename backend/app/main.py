from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import init_db
from .api import (
    aqi_router,
    chat_router,
    planner_router,
    community_router,
    settings_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database tables on startup
    init_db()
    print("[Startup] BreatheWise AI SQLite Database initialized.")
    yield
    print("[Shutdown] BreatheWise AI backend shutting down.")


app = FastAPI(
    title="BreatheWise AI – Backend API",
    description="Production-grade API for BreatheWise AI supporting Open-Meteo live AQI telemetry, Google Gemini 2.5 Flash GenAI Assistant, and SQLite persistence.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api
app.include_router(aqi_router.router, prefix="/api")
app.include_router(chat_router.router, prefix="/api")
app.include_router(planner_router.router, prefix="/api")
app.include_router(community_router.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")


@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "BreatheWise AI Backend",
        "environment": settings.ENVIRONMENT,
        "database": "SQLite (Active)",
        "gemini_configured": bool(settings.GEMINI_API_KEY),
    }
