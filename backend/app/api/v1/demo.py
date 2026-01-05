"""Demo CRUD API endpoints."""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import NotFoundException
from app.db.session import get_db
from app.models.user import User
from app.schemas.demo import DemoItemCreate, DemoItemResponse, DemoItemUpdate
from app.services.demo_service import demo_service

router = APIRouter(prefix="/demo", tags=["demo"])


@router.get("/items", response_model=List[DemoItemResponse])
async def list_items(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all items for the current user."""
    items = await demo_service.get_items_by_user(db, current_user.id)
    return items


@router.post("/items", response_model=DemoItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    request: DemoItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new item."""
    item = await demo_service.create_item(db, request, current_user.id)
    return item


@router.get("/items/{item_id}", response_model=DemoItemResponse)
async def get_item(
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific item by ID."""
    item = await demo_service.get_item_by_id(db, item_id)
    if not item:
        raise NotFoundException(detail="Item not found")
    if item.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this item",
        )
    return item


@router.put("/items/{item_id}", response_model=DemoItemResponse)
async def update_item(
    item_id: UUID,
    request: DemoItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing item."""
    item = await demo_service.get_item_by_id(db, item_id)
    if not item:
        raise NotFoundException(detail="Item not found")
    if item.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this item",
        )

    updated_item = await demo_service.update_item(db, item, request)
    return updated_item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an item."""
    item = await demo_service.get_item_by_id(db, item_id)
    if not item:
        raise NotFoundException(detail="Item not found")
    if item.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this item",
        )

    await demo_service.delete_item(db, item)
    return None
