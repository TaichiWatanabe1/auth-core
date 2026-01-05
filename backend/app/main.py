"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import router as api_router
from app.core.config import settings
from app.db.session import async_session_maker
from app.middleware.audit import AuditMiddleware
from app.middleware.request_id import RequestIdMiddleware
from app.services.auth_service import auth_service

logger = logging.getLogger(__name__)


async def create_initial_admin():
    """Create initial admin user from environment variables."""
    if not settings.INITIAL_ADMIN_EMAIL or not settings.INITIAL_ADMIN_PASSWORD:
        logger.info("No initial admin credentials provided, skipping admin creation")
        return

    async with async_session_maker() as db:
        try:
            user = await auth_service.create_initial_admin(
                db, settings.INITIAL_ADMIN_EMAIL, settings.INITIAL_ADMIN_PASSWORD
            )
            await db.commit()
            if user:
                logger.info(f"Initial admin user ready: {settings.INITIAL_ADMIN_EMAIL}")
        except Exception as e:
            logger.error(f"Failed to create initial admin: {e}")
            await db.rollback()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    await create_initial_admin()
    yield
    # Shutdown


app = FastAPI(
    title="Auth & Audit Platform",
    description="移植可能な認証＋操作ログ基盤",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Add middlewares (order matters - first added is outermost)
app.add_middleware(AuditMiddleware)
app.add_middleware(RequestIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    request_id = getattr(request.state, "request_id", None)

    if settings.DEBUG:
        return JSONResponse(
            status_code=500,
            content={
                "detail": str(exc),
                "request_id": request_id,
            },
        )

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "request_id": request_id,
        },
    )
