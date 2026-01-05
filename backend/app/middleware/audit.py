"""Audit logging middleware."""

import time
from typing import Callable, Optional
from uuid import UUID

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.db.session import async_session_maker
from app.services.audit_service import audit_service


class AuditMiddleware(BaseHTTPMiddleware):
    """Middleware to log all API requests for auditing."""

    # Paths to exclude from audit logging
    EXCLUDE_PATHS = [
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/favicon.ico",
    ]

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Skip excluded paths
        if any(request.url.path.startswith(p) for p in self.EXCLUDE_PATHS):
            return await call_next(request)

        start_time = time.time()

        # Execute the request
        response = await call_next(request)

        duration_ms = int((time.time() - start_time) * 1000)

        # Get user_id from request state (set by auth dependency)
        user_id: Optional[UUID] = getattr(request.state, "user_id", None)

        # Get request ID
        request_id = getattr(request.state, "request_id", "unknown")

        # Get client info
        client_host = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")

        # Log asynchronously (don't block the response)
        try:
            async with async_session_maker() as db:
                await audit_service.log(
                    db=db,
                    request_id=request_id,
                    user_id=user_id,
                    method=request.method,
                    path=str(request.url.path),
                    status_code=response.status_code,
                    duration_ms=duration_ms,
                    ip=client_host,
                    user_agent=user_agent,
                )
                await db.commit()
        except Exception:
            # Don't fail the request if audit logging fails
            pass

        return response
