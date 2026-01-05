"""Admin API endpoints."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin
from app.db.session import get_db
from app.models.user import User
from app.schemas.audit import AuditLogFilter, AuditLogListResponse
from app.schemas.user import AdminUserCreate, AdminUserUpdate, UserListResponse, UserResponse
from app.services.audit_service import audit_service
from app.services.auth_service import auth_service

router = APIRouter(prefix="/admin", tags=["admin"])


# ============== User Management ==============

@router.get("/users", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get all users with pagination. Admin only."""
    users, total = await auth_service.get_all_users(db, page, limit)
    return UserListResponse(
        items=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        limit=limit,
    )


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: AdminUserCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new user (optionally as admin). Admin only."""
    existing = await auth_service.get_user_by_email(db, request.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )

    user = await auth_service.create_user(
        db, request.email, request.password, request.is_admin
    )
    await db.commit()
    return user


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    request: AdminUserUpdate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update user attributes. Admin only."""
    # Prevent self-demotion
    if user_id == current_user.id and request.is_admin is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove your own admin privileges",
        )

    user = await auth_service.update_user(
        db, user_id, is_active=request.is_active, is_admin=request.is_admin
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    await db.commit()
    return user


# ============== Audit Logs ==============


@router.get("/audit-logs", response_model=AuditLogListResponse)
async def list_audit_logs(
    user_email: Optional[str] = Query(None, description="Filter by user email"),
    method: Optional[str] = Query(None, description="Filter by HTTP method"),
    path: Optional[str] = Query(None, description="Filter by path"),
    from_date: Optional[datetime] = Query(None, alias="from", description="Filter from date"),
    to_date: Optional[datetime] = Query(None, alias="to", description="Filter to date"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get audit logs with filtering and pagination. Admin only."""
    filter_params = AuditLogFilter(
        user_email=user_email,
        method=method,
        path=path,
        from_date=from_date,
        to_date=to_date,
        page=page,
        limit=limit,
    )

    return await audit_service.get_audit_logs(db, filter_params)
