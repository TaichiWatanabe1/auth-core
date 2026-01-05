"""Application configuration."""

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/auth_core"

    # JWT
    JWT_SECRET_KEY: str = "your-secret-key-here-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Feature Flags
    AUTH_EMAIL_ENABLED: bool = True
    AUTH_CODE_ENABLED: bool = True
    AUTH_OAUTH_ENABLED: bool = False

    # Code Auth
    CODE_EXPIRE_MINUTES: int = 10
    CODE_LENGTH: int = 6

    # OAuth
    OAUTH_PROVIDER: str = "entra"
    OAUTH_CLIENT_ID: str = ""
    OAUTH_CLIENT_SECRET: str = ""
    OAUTH_TENANT_ID: str = ""
    OAUTH_REDIRECT_URI: str = ""

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Initial Admin (optional - for first time setup)
    INITIAL_ADMIN_EMAIL: str = ""
    INITIAL_ADMIN_PASSWORD: str = ""

    # App
    DEBUG: bool = False


settings = Settings()
