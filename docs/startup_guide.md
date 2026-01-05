# Auth & Audit Platform - 起動ガイド

このドキュメントでは、Auth & Audit Platform の起動方法について説明します。

## 目次

1. [必要条件](#必要条件)
2. [Docker Compose を使用した起動（推奨）](#docker-compose-を使用した起動推奨)
3. [ローカル環境での起動](#ローカル環境での起動)
4. [初期セットアップ](#初期セットアップ)
5. [動作確認](#動作確認)
6. [トラブルシューティング](#トラブルシューティング)

---

## 必要条件

### Docker を使用する場合

- Docker Desktop 4.0+
- Docker Compose v2.0+

### ローカル環境で起動する場合

- Python 3.11+
- uv (Python パッケージマネージャー)
- Node.js 20+
- PostgreSQL 15+

#### uv のインストール

```bash
# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh
```

---

## Docker Compose を使用した起動（推奨）

### 1. 環境変数の設定

```bash
# プロジェクトルートで実行
cp .env.example .env

# .env を編集して必要な値を設定
# 本番環境では必ず JWT_SECRET_KEY を変更してください
```

### 2. 開発モードで起動（ホットリロード対応）

```bash
# プロジェクトルートで実行
docker-compose -f docker-compose.dev.yml up
```

| サービス    | URL                        |
| ----------- | -------------------------- |
| Frontend    | http://localhost:3000      |
| Backend API | http://localhost:8000      |
| API Docs    | http://localhost:8000/docs |
| PostgreSQL  | localhost:5432             |

### 3. 本番モードで起動

```bash
# ビルドして起動
docker-compose up -d --build

# ログを確認
docker-compose logs -f
```

### 4. データベースマイグレーション

```bash
# 初回起動時、またはモデル変更後に実行
docker-compose exec api alembic upgrade head
```

### 5. 停止

```bash
# 開発モード
docker-compose -f docker-compose.dev.yml down

# 本番モード
docker-compose down

# データベースのボリュームも削除する場合
docker-compose down -v
``依存関係のインストール（仮想環境も自動作成）
uv sync

# 開発用依存関係も含める場合
uv sync --dev

# 環境変数の設定
cp .env.example .env
# .env を編集

# データベースマイグレーション
uv run alembic upgrade head

# 開発サーバー起動
uv run uvicorn app.main:app --reload --port 8000
```

> **Note**: `uv sync` は自動的に `.venv` ディレクトリに仮想環境を作成し、依存関係をインストールします。 install -r requirements.txt

# 環境変数の設定

cp .env.example .env

# .env を編集

# データベースマイグレーション

alembic upgrade head

# 開発サーバー起動

uvicorn app.main:app --reload --port 8000

````

### Frontend

```bash
cd frontend

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:8000 を設定

# 開発サーバー起動
npm run dev
````

### PostgreSQL

ローカルに PostgreSQL をインストールするか、Docker で起動します：

```bash
# Docker で PostgreSQL のみ起動
docker run -d \
  --name auth-core-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=auth_core \
  -p 5432:5432 \
  postgres:15-alpine
```

---

## 初期セットアップ

### 管理者ユーザーの作成

初回起動後、API エンドポイントから登録を行います：

```bash
# ユーザー登録
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}'
```

データベースで管理者権限を付与：

```bash
# Docker Compose 経由
docker-compose exec db psql -U postgres -d auth_core -c \
  "UPDATE users SET is_admin = true WHERE email = 'admin@example.com';"

# ローカル PostgreSQL
psql -U postgres -d auth_core -c \
  "UPDATE users SET is_admin = true WHERE email = 'admin@example.com';"
```

### 認証方式の設定

環境変数で認証方式を切り替えます：

| 環境変数             | 説明                  | デフォルト |
| -------------------- | --------------------- | ---------- |
| `AUTH_EMAIL_ENABLED` | メール/パスワード認証 | `true`     |
| `AUTH_CODE_ENABLED`  | 認証コード方式        | `true`     |
| `AUTH_OAUTH_ENABLED` | OAuth 認証            | `false`    |

OAuth を有効にする場合は、追加で以下を設定：

```env
AUTH_OAUTH_ENABLED=true
OAUTH_GOOGLE_CLIENT_ID=your-client-id
OAUTH_GOOGLE_CLIENT_SECRET=your-client-secret
```

---

## 動作確認

### API ヘルスチェック

```bash
curl http://localhost:8000/api/v1/health
# {"status": "ok"}
```

### 認証方式の確認

```bash
curl http://localhost:8000/api/v1/auth/methods
# {"methods": ["email_password", "code"], "oauth_providers": []}
```

### Swagger UI で API 確認

ブラウザで http://localhost:8000/docs を開くと、API ドキュメントを確認できます。

---

## トラブルシューティング

### ポートが使用中のエラー

```bash
# 使用中のポートを確認
# Windows
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# macOS/Linux
lsof -i :8000
lsof -i :3000
```

### データベース接続エラー

```bash
# PostgreSQL が起動しているか確認
docker-compose ps

# PostgreSQL に接続できるか確認
docker-compose exec db psql -U postgres -d auth_core -c "\dt"
```

### マイグレーションエラー

```bash
# マイグレーション履歴を確認
docker-compose exec api alembic history

# 特定のリビジョンにダウングレード
docker-compose exec api alembic downgrade -1

# マイグレーションをリセット（データが消えます）
docker-compose exec api alembic downgrade base
docker-compose exec api alembic upgrade head
```

### フロントエンドのビルドエラー

```bash
# node_modules を再インストール
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Docker のキャッシュをクリア

```bash
# イメージを再ビルド
docker-compose build --no-cache

# 未使用のリソースを削除
docker system prune -a
```

---

## 開発用コマンド一覧

| コマンド                                               | 説明                 |
| ------------------------------------------------------ | -------------------- |
| `docker-compose -f docker-compose.dev.yml up`          | 開発モード起動       |
| `docker-compose up -d --build`                         | 本番モード起動       |
| `docker-compose down`                                  | 停止                 |
| `docker-compose logs -f api`                           | API ログ確認         |
| `docker-compose exec api alembic upgrade head`         | マイグレーション実行 |
| `docker-compose exec api pytest`                       | テスト実行           |
| `docker-compose exec db psql -U postgres -d auth_core` | DB 接続              |
| uv run pytest`                                         | テスト実行           |
| `docker-compose exec db psql -U postgres -d auth_core` | DB 接続              |
| `uv sync`                                              | 依存関係インストール |
| `uv run uvicorn app.main:app --reload`                 | ローカル開発サーバー |
| `uv add <package>`                                     | パッケージ追加       |
| `uv lock`                                              | ロックファイル更新   |
