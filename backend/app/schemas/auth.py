"""Authentication schemas."""

from typing import List, Optional

from pydantic import BaseModel, EmailStr


class AuthMethodsResponse(BaseModel):
    """Response for available authentication methods."""

    methods: List[str]
    oauth_providers: Optional[List[str]] = None


class LoginRequest(BaseModel):
    """Request for email/password login."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Response containing access token."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int


class RegisterRequest(BaseModel):
    """Request for user registration."""

    email: EmailStr
    password: str


class CodeRequestPayload(BaseModel):
    """Request for code authentication - request code."""

    email: EmailStr


class CodeVerifyPayload(BaseModel):
    """Request for code authentication - verify code."""

    email: EmailStr
    code: str


class OAuthCallbackRequest(BaseModel):
    """Request for OAuth callback."""

    code: str
    state: str


class OAuthAuthorizeResponse(BaseModel):
    """Response containing OAuth authorize URL."""

    authorize_url: str
