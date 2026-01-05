# Auth Core Backend

認証・監査ログ基盤のバックエンド実装

## 技術スタック

- FastAPI
- SQLAlchemy 2.0 (async)
- PostgreSQL
- Alembic (マイグレーション)
- Pydantic v2

## セットアップ

### 1. 環境変数の設定

```bash
cp .env.example .env
# .env ファイルを編集して適切な値を設定
```

### 2. Docker Compose で起動

```bash
docker-compose up -d
```

### 3. マイグレーション実行

```bash
# Docker内で実行
docker-compose exec api alembic upgrade head
```

### ローカル開発 (Docker なし)

```bash
# 仮想環境作成
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 依存関係インストール
pip install -r requirements.txt

# マイグレーション実行
alembic upgrade head

# 開発サーバー起動
uvicorn app.main:app --reload --port 8000
```

## API ドキュメント

開発モード (`DEBUG=true`) で起動すると以下で確認可能:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 主要エンドポイント

### 認証

| Method | Path             | 説明                 |
| ------ | ---------------- | -------------------- |
| GET    | `/auth/methods`  | 有効な認証方式取得   |
| POST   | `/auth/register` | ユーザー登録         |
| POST   | `/auth/login`    | ログイン             |
| POST   | `/auth/logout`   | ログアウト           |
| POST   | `/auth/refresh`  | トークンリフレッシュ |
| GET    | `/auth/me`       | 現在のユーザー取得   |

### Code 認証

| Method | Path                 | 説明       |
| ------ | -------------------- | ---------- |
| POST   | `/auth/code/request` | コード送信 |
| POST   | `/auth/code/verify`  | コード検証 |

### Demo CRUD

| Method | Path               | 説明         |
| ------ | ------------------ | ------------ |
| GET    | `/demo/items`      | アイテム一覧 |
| POST   | `/demo/items`      | アイテム作成 |
| PUT    | `/demo/items/{id}` | アイテム更新 |
| DELETE | `/demo/items/{id}` | アイテム削除 |

### 管理者

| Method | Path                | 説明         |
| ------ | ------------------- | ------------ |
| GET    | `/admin/audit-logs` | 監査ログ取得 |

## テスト

```bash
# テスト用パッケージインストール
pip install pytest pytest-asyncio httpx aiosqlite

# テスト実行
pytest
```

## ディレクトリ構成

```
backend/
├── alembic/              # マイグレーション
├── app/
│   ├── api/              # APIエンドポイント
│   │   ├── deps.py       # 依存性注入
│   │   └── v1/           # v1 API
│   ├── core/             # 設定・セキュリティ
│   ├── db/               # データベース設定
│   ├── middleware/       # ミドルウェア
│   ├── models/           # SQLAlchemyモデル
│   ├── schemas/          # Pydanticスキーマ
│   ├── services/         # ビジネスロジック
│   └── main.py           # アプリケーションエントリ
├── tests/                # テスト
├── .env.example          # 環境変数サンプル
├── docker-compose.yml    # Docker Compose設定
├── Dockerfile            # Dockerfile
└── requirements.txt      # 依存関係
```
