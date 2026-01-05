"""Authentication API endpoints."""

from typing import Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_refresh_token_user
from app.core.config import settings
from app.core.exceptions import ConflictException, ValidationException
from app.core.security import create_access_token, create_refresh_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthMethodsResponse,
    CodeRequestPayload,
    CodeVerifyPayload,
    LoginRequest,
    OAuthAuthorizeResponse,
    OAuthCallbackRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.user import UserResponse
from app.services.auth_service import auth_service
from app.services.code_auth_service import code_auth_service
from app.services.oauth_service import oauth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/methods", response_model=AuthMethodsResponse)
async def get_auth_methods():
    """Get available authentication methods."""
    methods = []
    if settings.AUTH_EMAIL_ENABLED:
        methods.append("email")
    if settings.AUTH_CODE_ENABLED:
        methods.append("code")
    if settings.AUTH_OAUTH_ENABLED:
        methods.append("oauth")

    oauth_providers = []
    if settings.AUTH_OAUTH_ENABLED:
        oauth_providers.append(settings.OAUTH_PROVIDER)

    return AuthMethodsResponse(
        methods=methods,
        oauth_providers=oauth_providers if oauth_providers else None,
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user with email and password."""
    if not settings.AUTH_EMAIL_ENABLED:
        raise ValidationException(detail="Email authentication is disabled")

    # Check if user already exists
    existing_user = await auth_service.get_user_by_email(db, request.email)
    if existing_user:
        raise ConflictException(detail="User with this email already exists")

    user = await auth_service.create_user(db, request.email, request.password)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Login with email and password."""
    if not settings.AUTH_EMAIL_ENABLED:
        raise ValidationException(detail="Email authentication is disabled")

    user = await auth_service.authenticate(db, request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # Create tokens
    access_token = create_access_token(user.id)
    refresh_token_str = create_refresh_token(user.id)

    # Store refresh token in database
    await auth_service.create_refresh_token(db, user.id, refresh_token_str)

    # Set refresh token as HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token_str,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/logout")
async def logout(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Logout the current user."""
    # Revoke refresh token if present
    if refresh_token:
        await auth_service.revoke_refresh_token(db, refresh_token)

    # Clear refresh token cookie
    response.delete_cookie(key="refresh_token")

    return {"message": "Logged out successfully"}


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    user: User = Depends(get_refresh_token_user),
    refresh_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db),
):
    """Refresh the access token using the refresh token."""
    # Revoke old refresh token
    if refresh_token:
        await auth_service.revoke_refresh_token(db, refresh_token)

    # Create new tokens
    access_token = create_access_token(user.id)
    new_refresh_token = create_refresh_token(user.id)

    # Store new refresh token
    await auth_service.create_refresh_token(db, user.id, new_refresh_token)

    # Set new refresh token cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    """Get the current user's information."""
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete the current user's account and all associated data (GDPR right to erasure)."""
    # Revoke all refresh tokens
    await auth_service.revoke_all_user_tokens(db, current_user.id)

    # Delete user (cascade will handle related data)
    await auth_service.delete_user(db, current_user.id)

    # Clear refresh token cookie
    response.delete_cookie(key="refresh_token")

    return None


@router.get("/me/export")
async def export_user_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export all user data (GDPR right to data portability)."""
    data = await auth_service.export_user_data(db, current_user.id)
    return data


# Code Authentication Endpoints


@router.post("/code/request")
async def request_code(
    request: CodeRequestPayload,
    db: AsyncSession = Depends(get_db),
):
    """Request an authentication code to be sent to the email."""
    if not settings.AUTH_CODE_ENABLED:
        raise ValidationException(detail="Code authentication is disabled")

    code, is_new_user = await code_auth_service.request_code(db, request.email)

    # In production, the code would be sent via email
    # For development/testing, we return it in the response
    if settings.DEBUG:
        return {
            "message": "Code sent successfully",
            "debug_code": code,
            "is_new_user": is_new_user,
        }

    return {"message": "Code sent successfully"}


@router.post("/code/verify", response_model=TokenResponse)
async def verify_code(
    request: CodeVerifyPayload,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Verify the authentication code and login."""
    if not settings.AUTH_CODE_ENABLED:
        raise ValidationException(detail="Code authentication is disabled")

    user = await code_auth_service.verify_code(db, request.email, request.code)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired code",
        )

    # Create tokens
    access_token = create_access_token(user.id)
    refresh_token_str = create_refresh_token(user.id)

    # Store refresh token
    await auth_service.create_refresh_token(db, user.id, refresh_token_str)

    # Set refresh token cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token_str,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


# OAuth Endpoints


@router.get("/oidc/{provider}/authorize", response_model=OAuthAuthorizeResponse)
async def oauth_authorize(provider: str):
    """Get the OAuth authorization URL."""
    if not settings.AUTH_OAUTH_ENABLED:
        raise ValidationException(detail="OAuth authentication is disabled")

    if provider != settings.OAUTH_PROVIDER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown OAuth provider: {provider}",
        )

    authorize_url = oauth_service.get_authorize_url(provider)
    return OAuthAuthorizeResponse(authorize_url=authorize_url)


@router.post("/oidc/{provider}/callback", response_model=TokenResponse)
async def oauth_callback(
    provider: str,
    request: OAuthCallbackRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Handle OAuth callback and create user session."""
    if not settings.AUTH_OAUTH_ENABLED:
        raise ValidationException(detail="OAuth authentication is disabled")

    if provider != settings.OAUTH_PROVIDER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown OAuth provider: {provider}",
        )

    # Verify state
    if not oauth_service.verify_state(request.state):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OAuth state",
        )

    # Exchange code for tokens
    token_data = await oauth_service.exchange_code(provider, request.code)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to exchange code for tokens",
        )

    # Get user info
    oauth_access_token = token_data.get("access_token")
    user_info = await oauth_service.get_user_info(provider, oauth_access_token)
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get user info",
        )

    # Get or create user
    email = user_info.get("mail") or user_info.get("userPrincipalName")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not get email from OAuth provider",
        )

    user = await auth_service.get_user_by_email(db, email)
    if not user:
        user = await auth_service.create_user_oauth(db, email)

    # Create tokens
    access_token = create_access_token(user.id)
    refresh_token_str = create_refresh_token(user.id)

    # Store refresh token
    await auth_service.create_refresh_token(db, user.id, refresh_token_str)

    # Set refresh token cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token_str,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
