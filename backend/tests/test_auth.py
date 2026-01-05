"""Authentication API tests."""

import pytest
from httpx import AsyncClient

from app.models import User


class TestAuthMethods:
    """Tests for GET /auth/methods endpoint."""

    async def test_get_methods_returns_enabled_methods(self, client: AsyncClient):
        """Test that enabled auth methods are returned."""
        response = await client.get("/auth/methods")
        assert response.status_code == 200
        data = response.json()
        assert "methods" in data
        assert isinstance(data["methods"], list)


class TestRegistration:
    """Tests for POST /auth/register endpoint."""

    async def test_register_new_user(self, client: AsyncClient):
        """Test successful user registration."""
        response = await client.post(
            "/auth/register",
            json={"email": "newuser@example.com", "password": "password123"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert "id" in data

    async def test_register_duplicate_email(self, client: AsyncClient, test_user: User):
        """Test registration with existing email fails."""
        response = await client.post(
            "/auth/register",
            json={"email": test_user.email, "password": "password123"},
        )
        assert response.status_code == 409


class TestLogin:
    """Tests for POST /auth/login endpoint."""

    async def test_login_success(self, client: AsyncClient, test_user: User):
        """Test successful login."""
        response = await client.post(
            "/auth/login",
            json={"email": "test@example.com", "password": "password123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_invalid_password(self, client: AsyncClient, test_user: User):
        """Test login with invalid password."""
        response = await client.post(
            "/auth/login",
            json={"email": "test@example.com", "password": "wrongpassword"},
        )
        assert response.status_code == 401

    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login with non-existent user."""
        response = await client.post(
            "/auth/login",
            json={"email": "nonexistent@example.com", "password": "password123"},
        )
        assert response.status_code == 401


class TestCurrentUser:
    """Tests for GET /auth/me endpoint."""

    async def test_get_current_user(
        self, client: AsyncClient, test_user: User, auth_headers: dict
    ):
        """Test getting current user info."""
        response = await client.get("/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email

    async def test_get_current_user_unauthorized(self, client: AsyncClient):
        """Test getting current user without auth."""
        response = await client.get("/auth/me")
        assert response.status_code == 401
