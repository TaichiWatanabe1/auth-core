# Auth & Audit Platform

移植可能な認証＋操作ログ（監査ログ）基盤システム

## 概要

Auth & Audit Platform は、以下の特徴を持つ認証・監査ログシステムです：

- 🔐 **柔軟な認証方式** - Email/Password、認証コード、OAuth（Google/GitHub）を環境変数で切替
- 📝 **操作ログ（監査ログ）** - すべての API 操作を自動記録、管理画面で閲覧可能
- 🔄 **移植可能** - 必要な認証モジュールのみ本番環境へ移植可能
- 🛡️ **GDPR 対応** - アカウント削除、データエクスポート機能を実装
- 🐳 **Docker 対応** - Docker Compose で簡単に起動

## 技術スタック

### Backend

- **Python 3.11+** / FastAPI
- **SQLAlchemy 2.0** (async)
- **PostgreSQL 15**
- **Alembic** (マイグレーション)
- **uv** (パッケージ管理)

### Frontend

- **React 18** / TypeScript
- **Vite** (ビルドツール)
- **Tailwind CSS**
- **Zustand** (状態管理)
- **React Hook Form** + **Zod** (フォーム・バリデーション)

## クイックスタート

### 必要条件

- Docker Desktop 4.0+
- Docker Compose v2.0+

### 1. 環境変数の設定

```bash
cp .env.example .env
# .env を編集して必要な値を設定
```

### 2. 起動

```bash
# 開発モード（ホットリロード対応）
docker-compose -f docker-compose.dev.yml up

# 本番モード
docker-compose up -d --build
```

### 3. アクセス

| サービス           | URL                        |
| ------------------ | -------------------------- |
| Frontend           | http://localhost:3000      |
| Backend API        | http://localhost:8000      |
| API Docs (Swagger) | http://localhost:8000/docs |

### 4. 初期管理者アカウント

`.env` で設定した以下の認証情報でログインできます：

- Email: `INITIAL_ADMIN_EMAIL` (デフォルト: admin@example.com)
- Password: `INITIAL_ADMIN_PASSWORD` (デフォルト: admin123)

## 画面構成

| 画面                 | URL            | 説明                                     |
| -------------------- | -------------- | ---------------------------------------- |
| ログイン             | `/login`       | 認証方式に応じたログイン画面             |
| トップ               | `/`            | ダッシュボード、CRUD 操作デモ            |
| 監査ログ             | `/admin/audit` | 操作ログ閲覧（管理者のみ）               |
| 設定                 | `/settings`    | アカウント設定、データエクスポート、削除 |
| プライバシーポリシー | `/privacy`     | プライバシーポリシー                     |
| 利用規約             | `/terms`       | 利用規約                                 |

## 認証方式

環境変数で有効化/無効化を切り替えられます：

| 環境変数             | 説明                    | デフォルト |
| -------------------- | ----------------------- | ---------- |
| `AUTH_EMAIL_ENABLED` | Email/Password ログイン | `true`     |
| `AUTH_CODE_ENABLED`  | 認証コードログイン      | `true`     |
| `AUTH_OAUTH_ENABLED` | OAuth ログイン          | `false`    |

### OAuth 設定（オプション）

```env
AUTH_OAUTH_ENABLED=true
OAUTH_GOOGLE_CLIENT_ID=your-client-id
OAUTH_GOOGLE_CLIENT_SECRET=your-client-secret
OAUTH_GITHUB_CLIENT_ID=your-client-id
OAUTH_GITHUB_CLIENT_SECRET=your-client-secret
```

## API エンドポイント

### 認証 (`/api/v1/auth`)

- `GET /methods` - 利用可能な認証方式を取得
- `POST /register` - ユーザー登録
- `POST /login` - ログイン
- `POST /logout` - ログアウト
- `POST /refresh` - トークンリフレッシュ
- `GET /me` - 現在のユーザー情報
- `DELETE /me` - アカウント削除
- `GET /me/export` - データエクスポート

### 監査ログ (`/api/v1/admin`)

- `GET /audit` - 監査ログ一覧（管理者のみ）
- `GET /audit/{id}` - 監査ログ詳細
- `GET /users` - ユーザー一覧（管理者のみ）

### デモ (`/api/v1/demo`)

- `GET /items` - アイテム一覧
- `POST /items` - アイテム作成
- `PUT /items/{id}` - アイテム更新
- `DELETE /items/{id}` - アイテム削除

## プロジェクト構成

```
auth-core/
├── backend/
│   ├── app/
│   │   ├── api/          # APIエンドポイント
│   │   ├── core/         # 設定、セキュリティ
│   │   ├── db/           # データベース接続
│   │   ├── middleware/   # ミドルウェア（監査ログ等）
│   │   ├── models/       # SQLAlchemyモデル
│   │   ├── schemas/      # Pydanticスキーマ
│   │   └── services/     # ビジネスロジック
│   ├── alembic/          # マイグレーション
│   ├── tests/            # テスト
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── api/          # APIクライアント
│   │   ├── auth/         # 認証ストア・フック
│   │   ├── components/   # UIコンポーネント
│   │   ├── pages/        # ページコンポーネント
│   │   └── types/        # 型定義
│   ├── Dockerfile
│   └── package.json
├── docs/                 # ドキュメント
├── docker-compose.yml    # 本番用
├── docker-compose.dev.yml # 開発用
└── .env.example
```

## ローカル開発

### Backend

```bash
cd backend
uv sync --dev
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## テスト

```bash
cd backend
uv run pytest
```

## ドキュメント

- [設計書](docs/auth_audit_platform_design_v2.md)
- [起動ガイド](docs/startup_guide.md)
- [バックエンド設計](docs/backend_design.md)
- [フロントエンド設計](docs/frontend_design.md)

## ライセンス

MIT License
