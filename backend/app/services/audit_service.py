"""Audit log service."""

from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogFilter, AuditLogListResponse, AuditLogResponse


class AuditService:
    """Service for audit log operations."""

    async def log(
        self,
        db: AsyncSession,
        request_id: str,
        user_id: Optional[UUID],
        method: str,
        path: str,
        status_code: int,
        duration_ms: int,
        ip: Optional[str],
        user_agent: Optional[str],
        request_body: Optional[str] = None,
    ) -> AuditLog:
        """Record an audit log entry."""
        audit_log = AuditLog(
            request_id=request_id,
            user_id=user_id,
            method=method,
            path=path,
            status_code=status_code,
            duration_ms=duration_ms,
            ip=ip,
            user_agent=user_agent,
            request_body=request_body,
        )
        db.add(audit_log)
        await db.flush()
        return audit_log

    async def get_audit_logs(
        self, db: AsyncSession, filter_params: AuditLogFilter
    ) -> AuditLogListResponse:
        """Get audit logs with filtering and pagination."""
        # Build base query with user join for email
        query = select(AuditLog, User.email.label("user_email")).outerjoin(
            User, AuditLog.user_id == User.id
        )
        count_query = select(func.count(AuditLog.id))

        # Apply filters
        if filter_params.user_email:
            query = query.where(User.email.ilike(f"%{filter_params.user_email}%"))
            count_query = count_query.join(User, AuditLog.user_id == User.id).where(
                User.email.ilike(f"%{filter_params.user_email}%")
            )

        if filter_params.method:
            query = query.where(AuditLog.method == filter_params.method)
            count_query = count_query.where(AuditLog.method == filter_params.method)

        if filter_params.path:
            query = query.where(AuditLog.path.ilike(f"%{filter_params.path}%"))
            count_query = count_query.where(
                AuditLog.path.ilike(f"%{filter_params.path}%")
            )

        if filter_params.from_date:
            query = query.where(AuditLog.created_at >= filter_params.from_date)
            count_query = count_query.where(
                AuditLog.created_at >= filter_params.from_date
            )

        if filter_params.to_date:
            query = query.where(AuditLog.created_at <= filter_params.to_date)
            count_query = count_query.where(
                AuditLog.created_at <= filter_params.to_date
            )

        # Get total count
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply pagination and ordering
        offset = (filter_params.page - 1) * filter_params.limit
        query = (
            query.order_by(AuditLog.created_at.desc())
            .offset(offset)
            .limit(filter_params.limit)
        )

        # Execute query
        result = await db.execute(query)
        rows = result.all()

        # Convert to response
        items = []
        for row in rows:
            audit_log = row[0]
            user_email = row[1]
            items.append(
                AuditLogResponse(
                    id=audit_log.id,
                    request_id=audit_log.request_id,
                    user_id=audit_log.user_id,
                    user_email=user_email,
                    method=audit_log.method,
                    path=audit_log.path,
                    status_code=audit_log.status_code,
                    duration_ms=audit_log.duration_ms,
                    ip=audit_log.ip,
                    user_agent=audit_log.user_agent,
                    created_at=audit_log.created_at,
                )
            )

        return AuditLogListResponse(
            items=items,
            total=total,
            page=filter_params.page,
            limit=filter_params.limit,
        )


audit_service = AuditService()
