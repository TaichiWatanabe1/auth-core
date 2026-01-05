"""Demo CRUD API tests."""

import pytest
from httpx import AsyncClient

from app.models import User


class TestDemoItems:
    """Tests for Demo CRUD endpoints."""

    async def test_create_item(
        self, client: AsyncClient, test_user: User, auth_headers: dict
    ):
        """Test creating a new item."""
        response = await client.post(
            "/demo/items",
            headers=auth_headers,
            json={"title": "Test Item", "description": "Test Description"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Item"
        assert data["description"] == "Test Description"
        assert "id" in data

    async def test_create_item_unauthorized(self, client: AsyncClient):
        """Test creating item without auth."""
        response = await client.post(
            "/demo/items",
            json={"title": "Test Item"},
        )
        assert response.status_code == 401

    async def test_list_items(
        self, client: AsyncClient, test_user: User, auth_headers: dict
    ):
        """Test listing items."""
        # Create an item first
        await client.post(
            "/demo/items",
            headers=auth_headers,
            json={"title": "Test Item"},
        )

        response = await client.get("/demo/items", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    async def test_update_item(
        self, client: AsyncClient, test_user: User, auth_headers: dict
    ):
        """Test updating an item."""
        # Create an item
        create_response = await client.post(
            "/demo/items",
            headers=auth_headers,
            json={"title": "Original Title"},
        )
        item_id = create_response.json()["id"]

        # Update the item
        response = await client.put(
            f"/demo/items/{item_id}",
            headers=auth_headers,
            json={"title": "Updated Title"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"

    async def test_delete_item(
        self, client: AsyncClient, test_user: User, auth_headers: dict
    ):
        """Test deleting an item."""
        # Create an item
        create_response = await client.post(
            "/demo/items",
            headers=auth_headers,
            json={"title": "To Delete"},
        )
        item_id = create_response.json()["id"]

        # Delete the item
        response = await client.delete(f"/demo/items/{item_id}", headers=auth_headers)
        assert response.status_code == 204

        # Verify it's deleted
        get_response = await client.get(f"/demo/items/{item_id}", headers=auth_headers)
        assert get_response.status_code == 404
