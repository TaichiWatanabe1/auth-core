"""Demo item schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class DemoItemBase(BaseModel):
    """Base demo item schema."""

    title: str
    description: Optional[str] = None


class DemoItemCreate(DemoItemBase):
    """Demo item creation schema."""

    pass


class DemoItemUpdate(BaseModel):
    """Demo item update schema."""

    title: Optional[str] = None
    description: Optional[str] = None


class DemoItemResponse(DemoItemBase):
    """Demo item response schema."""

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
