# Backend 設計書

作成日: 2026-01-04  
対象: Python FastAPI + PostgreSQL

---

## 1. 技術スタック

| カテゴリ           | 技術                    |
| ------------------ | ----------------------- |
| フレームワーク     | FastAPI                 |
| 言語               | Python 3.11+            |
| ORM                | SQLAlchemy 2.0          |
| マイグレーション   | Alembic                 |
| バリデーション     | Pydantic v2             |
| 認証               | PyJWT / python-jose     |
| パスワードハッシュ | passlib (bcrypt)        |
| DB                 | PostgreSQL 15           |
| テスト             | pytest + pytest-asyncio |
| タスク実行         | asyncio                 |

---

## 2. ディレクトリ構成

```
backend/
├── alembic/
│   ├── versions/
│   │   └── 001_initial.py
│   ├── env.py
│   └── script.py.mako
├── app/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py              # 依存性注入
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py        # ルーター集約
│   │       ├── auth.py          # 認証エンドポイント
│   │       ├── demo.py          # Demo CRUD
│   │       └── admin.py         # 管理者エンドポイント
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py            # 設定
│   │   ├── security.py          # JWT / パスワード
│   │   └── exceptions.py        # カスタム例外
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py              # Base モデル
│   │   └── session.py           # セッション管理
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── audit.py             # 監査ログミドルウェア
│   │   └── request_id.py        # Request ID ミドルウェア
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── refresh_token.py
│   │   ├── auth_code.py
│   │   ├── demo_item.py
│   │   └── audit_log.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── demo.py
│   │   └── audit.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── code_auth_service.py
│   │   ├── oauth_service.py
│   │   ├── demo_service.py
│   │   └── audit_service.py
│   └── main.py                  # アプリケーションエントリ
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_demo.py
│   └── test_admin.py
├── .env.example
├── alembic.ini
├── pyproject.toml
├── requirements.txt
└── Dockerfile
```

---

## 3. 設定管理

### 3.1 環境変数 (`.env.example`)

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/auth_core

# JWT
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Feature Flags (認証方式)
AUTH_EMAIL_ENABLED=true
AUTH_CODE_ENABLED=true
AUTH_OAUTH_ENABLED=true

# Code Auth
CODE_EXPIRE_MINUTES=10
CODE_LENGTH=6

# OAuth / Entra ID
OAUTH_PROVIDER=entra
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret
OAUTH_TENANT_ID=your-tenant-id
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

# CORS
CORS_ORIGINS=["http://localhost:3000"]

# App
DEBUG=true
```

### 3.2 設定クラス (`core/config.py`)

```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # JWT
    JWT_SECRET_KEY: str
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
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # App
    DEBUG: bool = False

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 4. データベースモデル設計

### 4.1 ER 図

```
┌─────────────────┐       ┌─────────────────────┐
│     users       │       │   refresh_tokens    │
├─────────────────┤       ├─────────────────────┤
│ id (PK)         │──────<│ id (PK)             │
│ email           │       │ user_id (FK)        │
│ password_hash   │       │ token               │
│ is_active       │       │ expires_at          │
│ is_admin        │       │ created_at          │
│ created_at      │       └─────────────────────┘
│ updated_at      │
└─────────────────┘
        │
        │       ┌─────────────────────┐
        └──────<│    auth_codes       │
        │       ├─────────────────────┤
        │       │ id (PK)             │
        │       │ user_id (FK)        │
        │       │ code                │
        │       │ expires_at          │
        │       │ is_used             │
        │       │ created_at          │
        │       └─────────────────────┘
        │
        │       ┌─────────────────────┐
        └──────<│    audit_logs       │
                ├─────────────────────┤
                │ id (PK)             │
                │ request_id          │
                │ user_id (FK, NULL)  │
                │ method              │
                │ path                │
                │ status_code         │
                │ duration_ms         │
                │ ip                  │
                │ user_agent          │
                │ request_body        │
                │ created_at          │
                └─────────────────────┘

┌─────────────────────┐
│    demo_items       │
├─────────────────────┤
│ id (PK)             │
│ title               │
│ description         │
│ user_id (FK)        │
│ created_at          │
│ updated_at          │
└─────────────────────┘
```

### 4.2 SQLAlchemy モデル

#### `models/user.py`

```python
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # OAuth時はNULL
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

#### `models/refresh_token.py`

```python
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.db.base import Base

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    token = Column(String(512), unique=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

#### `models/auth_code.py`

```python
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.db.base import Base

class AuthCode(Base):
    __tablename__ = "auth_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    code = Column(String(10), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

#### `models/audit_log.py`

```python
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.db.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(String(36), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    method = Column(String(10), nullable=False)
    path = Column(String(2048), nullable=False)
    status_code = Column(Integer, nullable=False)
    duration_ms = Column(Integer, nullable=False)
    ip = Column(String(45), nullable=True)
    user_agent = Column(String(512), nullable=True)
    request_body = Column(Text, nullable=True)  # センシティブ情報はマスク
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
```

#### `models/demo_item.py`

```python
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.db.base import Base

class DemoItem(Base):
    __tablename__ = "demo_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

---

## 5. Pydantic スキーマ設計

### 5.1 認証スキーマ (`schemas/auth.py`)

```python
from pydantic import BaseModel, EmailStr
from typing import List, Optional

class AuthMethodsResponse(BaseModel):
    methods: List[str]
    oauth_providers: Optional[List[str]] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

class CodeRequestPayload(BaseModel):
    email: EmailStr

class CodeVerifyPayload(BaseModel):
    email: EmailStr
    code: str

class OAuthCallbackRequest(BaseModel):
    code: str
    state: str

class OAuthAuthorizeResponse(BaseModel):
    authorize_url: str
```

### 5.2 ユーザースキーマ (`schemas/user.py`)

```python
from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: UUID
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True
```

### 5.3 Demo スキーマ (`schemas/demo.py`)

```python
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional

class DemoItemBase(BaseModel):
    title: str
    description: Optional[str] = None

class DemoItemCreate(DemoItemBase):
    pass

class DemoItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class DemoItemResponse(DemoItemBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
```

### 5.4 監査ログスキーマ (`schemas/audit.py`)

```python
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional, List

class AuditLogResponse(BaseModel):
    id: UUID
    request_id: str
    user_id: Optional[UUID] = None
    method: str
    path: str
    status_code: int
    duration_ms: int
    ip: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLogListResponse(BaseModel):
    items: List[AuditLogResponse]
    total: int
    page: int
    limit: int

class AuditLogFilter(BaseModel):
    user_email: Optional[str] = None
    method: Optional[str] = None
    path: Optional[str] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    page: int = 1
    limit: int = 50
```

---

## 6. API エンドポイント設計

### 6.1 認証 API (`api/v1/auth.py`)

| Method | Path                              | 説明                    | 認証   |
| ------ | --------------------------------- | ----------------------- | ------ |
| GET    | `/auth/methods`                   | 有効な認証方式取得      | 不要   |
| POST   | `/auth/register`                  | ユーザー登録            | 不要   |
| POST   | `/auth/login`                     | Email/Password ログイン | 不要   |
| POST   | `/auth/logout`                    | ログアウト              | 必要   |
| POST   | `/auth/refresh`                   | トークンリフレッシュ    | Cookie |
| GET    | `/auth/me`                        | 現在のユーザー取得      | 必要   |
| POST   | `/auth/code/request`              | 認証コード送信          | 不要   |
| POST   | `/auth/code/verify`               | 認証コード検証          | 不要   |
| GET    | `/auth/oidc/{provider}/authorize` | OAuth 認可 URL 取得     | 不要   |
| POST   | `/auth/oidc/{provider}/callback`  | OAuth コールバック      | 不要   |

#### 詳細仕様

```python
# GET /auth/methods
@router.get("/methods", response_model=AuthMethodsResponse)
async def get_auth_methods():
    """有効な認証方式を返す"""
    methods = []
    if settings.AUTH_EMAIL_ENABLED:
        methods.append("email")
    if settings.AUTH_CODE_ENABLED:
        methods.append("code")
    if settings.AUTH_OAUTH_ENABLED:
        methods.append("oauth")

    oauth_providers = []
    if settings.AUTH_OAUTH_ENABLED:
        oauth_providers.append(settings.OAUTH_PROVIDER)

    return AuthMethodsResponse(
        methods=methods,
        oauth_providers=oauth_providers if oauth_providers else None
    )
```

```python
# POST /auth/login
@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Email/Password でログイン"""
    if not settings.AUTH_EMAIL_ENABLED:
        raise HTTPException(status_code=400, detail="Email auth is disabled")

    user = await auth_service.authenticate(db, request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = security.create_access_token(user.id)
    refresh_token = await auth_service.create_refresh_token(db, user.id)

    # Refresh Token を HttpOnly Cookie に設定
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
```

### 6.2 Demo API (`api/v1/demo.py`)

| Method | Path               | 説明             | 認証 |
| ------ | ------------------ | ---------------- | ---- |
| GET    | `/demo/items`      | アイテム一覧取得 | 必要 |
| POST   | `/demo/items`      | アイテム作成     | 必要 |
| PUT    | `/demo/items/{id}` | アイテム更新     | 必要 |
| DELETE | `/demo/items/{id}` | アイテム削除     | 必要 |

```python
@router.get("/items", response_model=List[DemoItemResponse])
async def list_items(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """自分のアイテム一覧を取得"""
    return await demo_service.get_items_by_user(db, current_user.id)

@router.post("/items", response_model=DemoItemResponse, status_code=201)
async def create_item(
    request: DemoItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """アイテムを作成"""
    return await demo_service.create_item(db, request, current_user.id)
```

### 6.3 管理者 API (`api/v1/admin.py`)

| Method | Path                | 説明         | 認証       |
| ------ | ------------------- | ------------ | ---------- |
| GET    | `/admin/audit-logs` | 監査ログ取得 | 管理者のみ |

```python
@router.get("/audit-logs", response_model=AuditLogListResponse)
async def list_audit_logs(
    user_email: Optional[str] = None,
    method: Optional[str] = None,
    path: Optional[str] = None,
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """監査ログを検索・取得"""
    filter_params = AuditLogFilter(
        user_email=user_email,
        method=method,
        path=path,
        from_date=from_date,
        to_date=to_date,
        page=page,
        limit=limit
    )
    return await audit_service.get_audit_logs(db, filter_params)
```

---

## 7. ミドルウェア設計

### 7.1 Request ID ミドルウェア (`middleware/request_id.py`)

```python
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-Id"] = request_id

        return response
```

### 7.2 監査ログミドルウェア (`middleware/audit.py`)

```python
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from app.services.audit_service import audit_service

class AuditMiddleware(BaseHTTPMiddleware):
    # 監査対象外パス
    EXCLUDE_PATHS = ["/health", "/docs", "/openapi.json"]

    async def dispatch(self, request: Request, call_next):
        # 除外パスはスキップ
        if any(request.url.path.startswith(p) for p in self.EXCLUDE_PATHS):
            return await call_next(request)

        start_time = time.time()

        # ユーザーID取得（認証済みの場合）
        user_id = getattr(request.state, "user_id", None)

        response = await call_next(request)

        duration_ms = int((time.time() - start_time) * 1000)

        # 監査ログ記録
        await audit_service.log(
            request_id=request.state.request_id,
            user_id=user_id,
            method=request.method,
            path=str(request.url.path),
            status_code=response.status_code,
            duration_ms=duration_ms,
            ip=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )

        return response
```

---

## 8. セキュリティ設計

### 8.1 JWT 処理 (`core/security.py`)

```python
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(user_id: UUID, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "access"
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except jwt.JWTError:
        return None
```

### 8.2 依存性注入 (`api/deps.py`)

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import decode_access_token
from app.models.user import User

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user_id = payload.get("sub")
    user = await db.get(User, user_id)

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    return user

async def get_current_admin(
    user: User = Depends(get_current_user)
) -> User:
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return user
```

---

## 9. サービス層設計

### 9.1 認証サービス (`services/auth_service.py`)

```python
class AuthService:
    async def authenticate(
        self, db: AsyncSession, email: str, password: str
    ) -> Optional[User]:
        """Email/Password で認証"""
        pass

    async def create_user(
        self, db: AsyncSession, email: str, password: str
    ) -> User:
        """ユーザー作成"""
        pass

    async def create_refresh_token(
        self, db: AsyncSession, user_id: UUID
    ) -> str:
        """Refresh Token 作成"""
        pass

    async def verify_refresh_token(
        self, db: AsyncSession, token: str
    ) -> Optional[User]:
        """Refresh Token 検証"""
        pass

    async def revoke_refresh_token(
        self, db: AsyncSession, token: str
    ) -> None:
        """Refresh Token 無効化"""
        pass

auth_service = AuthService()
```

### 9.2 コード認証サービス (`services/code_auth_service.py`)

```python
class CodeAuthService:
    async def request_code(
        self, db: AsyncSession, email: str
    ) -> str:
        """認証コードを生成してメール送信"""
        pass

    async def verify_code(
        self, db: AsyncSession, email: str, code: str
    ) -> Optional[User]:
        """認証コードを検証"""
        pass

code_auth_service = CodeAuthService()
```

### 9.3 監査サービス (`services/audit_service.py`)

```python
class AuditService:
    async def log(
        self,
        request_id: str,
        user_id: Optional[UUID],
        method: str,
        path: str,
        status_code: int,
        duration_ms: int,
        ip: Optional[str],
        user_agent: Optional[str],
        request_body: Optional[str] = None
    ) -> None:
        """監査ログを記録"""
        pass

    async def get_audit_logs(
        self, db: AsyncSession, filter: AuditLogFilter
    ) -> AuditLogListResponse:
        """監査ログを検索"""
        pass

audit_service = AuditService()
```

---

## 10. エラーハンドリング

### 10.1 カスタム例外 (`core/exceptions.py`)

```python
from fastapi import HTTPException

class AuthException(HTTPException):
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(status_code=401, detail=detail)

class PermissionDeniedException(HTTPException):
    def __init__(self, detail: str = "Permission denied"):
        super().__init__(status_code=403, detail=detail)

class NotFoundException(HTTPException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=404, detail=detail)

class ValidationException(HTTPException):
    def __init__(self, detail: str = "Validation error"):
        super().__init__(status_code=400, detail=detail)
```

### 10.2 グローバル例外ハンドラ

```python
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "request_id": getattr(request.state, "request_id", None)
        }
    )
```

---

## 11. マイグレーション

### 11.1 初期マイグレーション (`alembic/versions/001_initial.py`)

```python
def upgrade():
    # users テーブル
    op.create_table(
        'users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=True),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('is_admin', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
    )
    op.create_index('ix_users_email', 'users', ['email'])

    # refresh_tokens テーブル
    # auth_codes テーブル
    # audit_logs テーブル
    # demo_items テーブル
    ...

def downgrade():
    op.drop_table('demo_items')
    op.drop_table('audit_logs')
    op.drop_table('auth_codes')
    op.drop_table('refresh_tokens')
    op.drop_table('users')
```

---

## 12. テスト設計

### 12.1 テスト構成

```python
# tests/conftest.py
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

@pytest.fixture
async def db_session():
    """テスト用DBセッション"""
    pass

@pytest.fixture
async def client(db_session):
    """テスト用HTTPクライアント"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def auth_headers(client):
    """認証済みヘッダー"""
    pass
```

### 12.2 テストケース例

```python
# tests/test_auth.py
class TestAuth:
    async def test_get_methods(self, client):
        """認証方式取得"""
        response = await client.get("/auth/methods")
        assert response.status_code == 200
        assert "methods" in response.json()

    async def test_register(self, client):
        """ユーザー登録"""
        response = await client.post("/auth/register", json={
            "email": "test@example.com",
            "password": "password123"
        })
        assert response.status_code == 201

    async def test_login(self, client):
        """ログイン"""
        response = await client.post("/auth/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        assert response.status_code == 200
        assert "access_token" in response.json()
```

---

## 13. デプロイ設定

### 13.1 Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 13.2 docker-compose.yml

```yaml
version: "3.8"

services:
  api:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/auth_core
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=auth_core
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 14. 起動コマンド

### 開発

```bash
# マイグレーション実行
alembic upgrade head

# 開発サーバー起動
uvicorn app.main:app --reload --port 8000
```

### 本番

```bash
# Gunicorn + Uvicorn Worker
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

---

以上。
