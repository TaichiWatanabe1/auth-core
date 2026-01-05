"""Code authentication service."""

import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.auth_code import AuthCode
from app.models.user import User
from app.services.auth_service import auth_service


class CodeAuthService:
    """Service for code-based authentication."""

    def _generate_code(self) -> str:
        """Generate a random authentication code."""
        return "".join(
            random.choices(string.digits, k=settings.CODE_LENGTH)
        )

    async def request_code(
        self, db: AsyncSession, email: str
    ) -> tuple[str, bool]:
        """
        Generate and store an authentication code.
        Returns (code, is_new_user).
        In production, this would send an email.
        """
        # Get or create user
        user = await auth_service.get_user_by_email(db, email)
        is_new_user = False

        if not user:
            # Create user without password for code auth
            user = User(email=email, password_hash=None)
            db.add(user)
            await db.flush()
            await db.refresh(user)
            is_new_user = True

        # Invalidate previous codes
        result = await db.execute(
            select(AuthCode).where(
                AuthCode.user_id == user.id,
                AuthCode.is_used == False,  # noqa: E712
            )
        )
        old_codes = result.scalars().all()
        for old_code in old_codes:
            old_code.is_used = True

        # Generate new code
        code = self._generate_code()
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.CODE_EXPIRE_MINUTES
        )

        auth_code = AuthCode(
            user_id=user.id,
            code=code,
            expires_at=expires_at,
        )
        db.add(auth_code)
        await db.flush()

        # In production, send email here
        # await send_email(email, code)

        return code, is_new_user

    async def verify_code(
        self, db: AsyncSession, email: str, code: str
    ) -> Optional[User]:
        """Verify the authentication code and return user."""
        user = await auth_service.get_user_by_email(db, email)
        if not user:
            return None

        result = await db.execute(
            select(AuthCode).where(
                AuthCode.user_id == user.id,
                AuthCode.code == code,
                AuthCode.is_used == False,  # noqa: E712
            )
        )
        auth_code = result.scalar_one_or_none()

        if not auth_code:
            return None
        if auth_code.expires_at < datetime.now(timezone.utc):
            return None

        # Mark code as used
        auth_code.is_used = True
        await db.flush()

        return user


code_auth_service = CodeAuthService()
