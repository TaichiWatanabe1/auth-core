"""Authentication service."""

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.models.refresh_token import RefreshToken
from app.models.user import User


class AuthService:
    """Service for authentication operations."""

    async def authenticate(
        self, db: AsyncSession, email: str, password: str
    ) -> Optional[User]:
        """Authenticate user with email and password."""
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            return None
        if not user.password_hash:
            return None
        if not verify_password(password, user.password_hash):
            return None
        if not user.is_active:
            return None

        return user

    async def get_user_by_email(
        self, db: AsyncSession, email: str
    ) -> Optional[User]:
        """Get user by email."""
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_user_by_id(
        self, db: AsyncSession, user_id: UUID
    ) -> Optional[User]:
        """Get user by ID."""
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def create_user(
        self, db: AsyncSession, email: str, password: str, is_admin: bool = False
    ) -> User:
        """Create a new user."""
        user = User(
            email=email,
            password_hash=get_password_hash(password),
            is_admin=is_admin,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user

    async def create_initial_admin(
        self, db: AsyncSession, email: str, password: str
    ) -> Optional[User]:
        """Create initial admin user if it doesn't exist."""
        existing = await self.get_user_by_email(db, email)
        if existing:
            # Update to admin if not already
            if not existing.is_admin:
                existing.is_admin = True
                await db.flush()
            return existing

        user = User(
            email=email,
            password_hash=get_password_hash(password),
            is_admin=True,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user

    async def update_user(
        self, db: AsyncSession, user_id: UUID, is_active: Optional[bool] = None, is_admin: Optional[bool] = None
    ) -> Optional[User]:
        """Update user attributes."""
        user = await self.get_user_by_id(db, user_id)
        if not user:
            return None

        if is_active is not None:
            user.is_active = is_active
        if is_admin is not None:
            user.is_admin = is_admin

        await db.flush()
        await db.refresh(user)
        return user

    async def get_all_users(
        self, db: AsyncSession, page: int = 1, limit: int = 50
    ) -> tuple[list[User], int]:
        """Get all users with pagination."""
        from sqlalchemy import func

        # Count total
        count_result = await db.execute(select(func.count(User.id)))
        total = count_result.scalar() or 0

        # Get users
        offset = (page - 1) * limit
        result = await db.execute(
            select(User).order_by(User.created_at.desc()).offset(offset).limit(limit)
        )
        users = list(result.scalars().all())

        return users, total

    async def create_user_oauth(
        self, db: AsyncSession, email: str
    ) -> User:
        """Create a new user via OAuth (no password)."""
        user = User(
            email=email,
            password_hash=None,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user

    async def create_refresh_token(
        self, db: AsyncSession, user_id: UUID, token: str
    ) -> RefreshToken:
        """Create a new refresh token."""
        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
        refresh_token = RefreshToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at,
        )
        db.add(refresh_token)
        await db.flush()
        return refresh_token

    async def get_refresh_token(
        self, db: AsyncSession, token: str
    ) -> Optional[RefreshToken]:
        """Get refresh token by token string."""
        result = await db.execute(
            select(RefreshToken).where(RefreshToken.token == token)
        )
        return result.scalar_one_or_none()

    async def verify_refresh_token(
        self, db: AsyncSession, token: str
    ) -> Optional[User]:
        """Verify refresh token and return user."""
        refresh_token = await self.get_refresh_token(db, token)

        if not refresh_token:
            return None
        if refresh_token.expires_at < datetime.now(timezone.utc):
            return None

        user = await self.get_user_by_id(db, refresh_token.user_id)
        if not user or not user.is_active:
            return None

        return user

    async def revoke_refresh_token(
        self, db: AsyncSession, token: str
    ) -> None:
        """Revoke (delete) a refresh token."""
        result = await db.execute(
            select(RefreshToken).where(RefreshToken.token == token)
        )
        refresh_token = result.scalar_one_or_none()
        if refresh_token:
            await db.delete(refresh_token)
            await db.flush()

    async def revoke_all_user_tokens(
        self, db: AsyncSession, user_id: UUID
    ) -> None:
        """Revoke all refresh tokens for a user."""
        result = await db.execute(
            select(RefreshToken).where(RefreshToken.user_id == user_id)
        )
        tokens = result.scalars().all()
        for token in tokens:
            await db.delete(token)
        await db.flush()

    async def delete_user(self, db: AsyncSession, user_id: UUID) -> None:
        """Delete a user and all associated data (GDPR compliance)."""
        from app.models.audit_log import AuditLog
        from app.models.auth_code import AuthCode
        from app.models.demo_item import DemoItem

        # Delete audit logs (anonymize instead of delete if needed for compliance)
        await db.execute(
            select(AuditLog).where(AuditLog.user_id == user_id)
        )
        # Option: anonymize instead of delete
        # For now, we set user_id to NULL to anonymize
        from sqlalchemy import update
        await db.execute(
            update(AuditLog).where(AuditLog.user_id == user_id).values(user_id=None)
        )

        # Delete auth codes
        result = await db.execute(
            select(AuthCode).where(AuthCode.email == (
                select(User.email).where(User.id == user_id).scalar_subquery()
            ))
        )
        codes = result.scalars().all()
        for code in codes:
            await db.delete(code)

        # Delete demo items
        result = await db.execute(
            select(DemoItem).where(DemoItem.user_id == user_id)
        )
        items = result.scalars().all()
        for item in items:
            await db.delete(item)

        # Delete user
        user = await self.get_user_by_id(db, user_id)
        if user:
            await db.delete(user)
            await db.flush()

    async def export_user_data(self, db: AsyncSession, user_id: UUID) -> dict:
        """Export all user data (GDPR data portability)."""
        from app.models.audit_log import AuditLog
        from app.models.demo_item import DemoItem

        user = await self.get_user_by_id(db, user_id)
        if not user:
            return {}

        # Get user's demo items
        result = await db.execute(
            select(DemoItem).where(DemoItem.user_id == user_id)
        )
        items = result.scalars().all()

        # Get user's audit logs
        result = await db.execute(
            select(AuditLog).where(AuditLog.user_id == user_id).order_by(AuditLog.created_at.desc()).limit(1000)
        )
        logs = result.scalars().all()

        return {
            "user": {
                "id": str(user.id),
                "email": user.email,
                "is_active": user.is_active,
                "is_admin": user.is_admin,
                "created_at": user.created_at.isoformat(),
                "updated_at": user.updated_at.isoformat() if user.updated_at else None,
            },
            "demo_items": [
                {
                    "id": str(item.id),
                    "title": item.title,
                    "description": item.description,
                    "created_at": item.created_at.isoformat(),
                    "updated_at": item.updated_at.isoformat() if item.updated_at else None,
                }
                for item in items
            ],
            "activity_logs": [
                {
                    "method": log.method,
                    "path": log.path,
                    "status_code": log.status_code,
                    "created_at": log.created_at.isoformat(),
                }
                for log in logs
            ],
            "exported_at": datetime.now(timezone.utc).isoformat(),
        }


auth_service = AuthService()
