"""Admin API tests."""

import pytest
from httpx import AsyncClient

from app.models import User


class TestAuditLogs:
    """Tests for admin audit log endpoints."""

    async def test_get_audit_logs_admin(
        self, client: AsyncClient, test_admin: User, admin_auth_headers: dict
    ):
        """Test admin can get audit logs."""
        response = await client.get("/admin/audit-logs", headers=admin_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data

    async def test_get_audit_logs_non_admin(
        self, client: AsyncClient, test_user: User, auth_headers: dict
    ):
        """Test non-admin cannot access audit logs."""
        response = await client.get("/admin/audit-logs", headers=auth_headers)
        assert response.status_code == 403

    async def test_get_audit_logs_unauthorized(self, client: AsyncClient):
        """Test unauthorized access to audit logs."""
        response = await client.get("/admin/audit-logs")
        assert response.status_code == 401

    async def test_get_audit_logs_with_filters(
        self, client: AsyncClient, test_admin: User, admin_auth_headers: dict
    ):
        """Test audit logs with filter parameters."""
        response = await client.get(
            "/admin/audit-logs",
            headers=admin_auth_headers,
            params={"method": "GET", "limit": 10},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["limit"] == 10
