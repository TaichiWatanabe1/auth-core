"""OAuth service for external authentication providers."""

import secrets
from typing import Optional
from urllib.parse import urlencode

import httpx

from app.core.config import settings


class OAuthService:
    """Service for OAuth authentication."""

    def __init__(self):
        self._states: dict[str, bool] = {}

    def get_authorize_url(self, provider: str) -> str:
        """Get the OAuth authorization URL."""
        state = secrets.token_urlsafe(32)
        self._states[state] = True

        if provider == "entra":
            return self._get_entra_authorize_url(state)

        raise ValueError(f"Unknown OAuth provider: {provider}")

    def _get_entra_authorize_url(self, state: str) -> str:
        """Get Microsoft Entra ID authorization URL."""
        base_url = f"https://login.microsoftonline.com/{settings.OAUTH_TENANT_ID}/oauth2/v2.0/authorize"
        params = {
            "client_id": settings.OAUTH_CLIENT_ID,
            "response_type": "code",
            "redirect_uri": settings.OAUTH_REDIRECT_URI,
            "scope": "openid email profile",
            "state": state,
            "response_mode": "query",
        }
        return f"{base_url}?{urlencode(params)}"

    def verify_state(self, state: str) -> bool:
        """Verify and consume OAuth state."""
        if state in self._states:
            del self._states[state]
            return True
        return False

    async def exchange_code(
        self, provider: str, code: str
    ) -> Optional[dict]:
        """Exchange authorization code for tokens."""
        if provider == "entra":
            return await self._exchange_entra_code(code)

        raise ValueError(f"Unknown OAuth provider: {provider}")

    async def _exchange_entra_code(self, code: str) -> Optional[dict]:
        """Exchange Entra ID authorization code for tokens."""
        token_url = f"https://login.microsoftonline.com/{settings.OAUTH_TENANT_ID}/oauth2/v2.0/token"

        data = {
            "client_id": settings.OAUTH_CLIENT_ID,
            "client_secret": settings.OAUTH_CLIENT_SECRET,
            "code": code,
            "redirect_uri": settings.OAUTH_REDIRECT_URI,
            "grant_type": "authorization_code",
            "scope": "openid email profile",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=data)
            if response.status_code != 200:
                return None
            return response.json()

    async def get_user_info(
        self, provider: str, access_token: str
    ) -> Optional[dict]:
        """Get user info from OAuth provider."""
        if provider == "entra":
            return await self._get_entra_user_info(access_token)

        raise ValueError(f"Unknown OAuth provider: {provider}")

    async def _get_entra_user_info(self, access_token: str) -> Optional[dict]:
        """Get user info from Microsoft Graph API."""
        url = "https://graph.microsoft.com/v1.0/me"
        headers = {"Authorization": f"Bearer {access_token}"}

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            if response.status_code != 200:
                return None
            return response.json()


oauth_service = OAuthService()
