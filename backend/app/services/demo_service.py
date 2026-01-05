"""Demo item service."""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.demo_item import DemoItem
from app.schemas.demo import DemoItemCreate, DemoItemUpdate


class DemoService:
    """Service for demo item CRUD operations."""

    async def get_items_by_user(
        self, db: AsyncSession, user_id: UUID
    ) -> List[DemoItem]:
        """Get all items for a user."""
        result = await db.execute(
            select(DemoItem)
            .where(DemoItem.user_id == user_id)
            .order_by(DemoItem.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_item_by_id(
        self, db: AsyncSession, item_id: UUID
    ) -> Optional[DemoItem]:
        """Get an item by ID."""
        result = await db.execute(
            select(DemoItem).where(DemoItem.id == item_id)
        )
        return result.scalar_one_or_none()

    async def create_item(
        self, db: AsyncSession, data: DemoItemCreate, user_id: UUID
    ) -> DemoItem:
        """Create a new item."""
        item = DemoItem(
            title=data.title,
            description=data.description,
            user_id=user_id,
        )
        db.add(item)
        await db.flush()
        await db.refresh(item)
        return item

    async def update_item(
        self, db: AsyncSession, item: DemoItem, data: DemoItemUpdate
    ) -> DemoItem:
        """Update an existing item."""
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(item, field, value)
        await db.flush()
        await db.refresh(item)
        return item

    async def delete_item(
        self, db: AsyncSession, item: DemoItem
    ) -> None:
        """Delete an item."""
        await db.delete(item)
        await db.flush()


demo_service = DemoService()
