"""User schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr


class UserCreate(UserBase):
    """User creation schema."""

    password: str


class UserResponse(UserBase):
    """User response schema."""

    id: UUID
    is_active: bool
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminUserCreate(BaseModel):
    """Schema for admin to create a new user."""

    email: EmailStr
    password: str
    is_admin: bool = False


class AdminUserUpdate(BaseModel):
    """Schema for admin to update a user."""

    is_active: bool | None = None
    is_admin: bool | None = None


class UserListResponse(BaseModel):
    """User list response with pagination."""

    items: list[UserResponse]
    total: int
    page: int
    limit: int
