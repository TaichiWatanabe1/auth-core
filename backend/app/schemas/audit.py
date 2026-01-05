"""Audit log schemas."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    """Audit log response schema."""

    id: UUID
    request_id: str
    user_id: Optional[UUID] = None
    user_email: Optional[str] = None
    method: str
    path: str
    status_code: int
    duration_ms: int
    ip: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    """Audit log list response with pagination."""

    items: List[AuditLogResponse]
    total: int
    page: int
    limit: int


class AuditLogFilter(BaseModel):
    """Audit log filter parameters."""

    user_email: Optional[str] = None
    method: Optional[str] = None
    path: Optional[str] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    page: int = 1
    limit: int = 50
