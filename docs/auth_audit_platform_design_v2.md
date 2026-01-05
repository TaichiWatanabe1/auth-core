# Auth & Audit Platform 設計書（ブラッシュアップ版）

作成日: 2026-01-04  
更新内容: **フロントエンド画面設計（ログイン / トップ / 管理者）を追加**  
対象: Frontend(TypeScript SPA) / API(Python FastAPI) / DB(PostgreSQL)

---

## 0. 本設計書の目的（再確認）

本設計書は以下を満たす **「移植可能な認証＋操作ログ基盤」** の完成形を定義する。

- 認証方式を環境変数で切替（Email / Code / OAuth・Entra ID）
- 必要な認証モジュールのみ本番環境へ移植可能
- 操作ログ（Audit Log）を UI から **実際に確認できる**
- **PoC〜本番前検証まで一貫して使える**
- VS Code Codex にそのまま渡して実装可能

---

## 1. フロントエンド全体設計

### 1.1 フロントエンドの役割

- 認証方式に応じたログイン UI の提供
- 認証後ユーザーのセッション管理（Access Token）
- **ユーザー操作を発生させ、操作ログが記録されることを確認**
- 管理者による操作ログ閲覧（監査確認）

---

### 1.2 画面一覧

| 画面名       | URL 例         | 目的                               |
| ------------ | -------------- | ---------------------------------- |
| ログイン画面 | `/login`       | 認証方式に応じたログイン           |
| トップ画面   | `/`            | ログインユーザー表示・操作ログ発生 |
| 管理者画面   | `/admin/audit` | 操作ログ閲覧                       |

---

## 2. ログイン画面設計

### 2.1 共通仕様

- 起動時に `GET /auth/methods` を呼び出す
- 有効な認証方式のみ UI に表示
- 複数方式が有効な場合は **タブ or セクション切替**

---

### 2.2 Email / Password ログイン

#### UI 要素

- Email 入力
- Password 入力
- Login ボタン
- （任意）Register リンク

#### API

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/verify-email`

---

### 2.3 Code 認証ログイン

#### UI 要素

- Email 入力
- Code 入力
- 「コード送信」ボタン（otp 時）
- 「ログイン」ボタン

#### API

- `POST /auth/code/request`
- `POST /auth/code/verify`

---

### 2.4 OAuth / Entra ID ログイン

#### UI 要素

- 「Sign in with Microsoft」ボタン

#### 動作

1. `/auth/oidc/authorize` から認可 URL 取得
2. ブラウザリダイレクト
3. callback 画面 → `/auth/oidc/callback`

---

## 3. トップ画面設計（ログイン後）

### 3.1 目的

- ログイン成功の確認
- **ユーザー操作 → 操作ログ記録** の確認
- 開発・検証用途の簡易 CRUD

---

### 3.2 UI 構成

#### ヘッダー

- ログインユーザー Email 表示
- ログアウトボタン

#### メインエリア

- 簡易 CRUD 操作パネル
  - Create ボタン
  - Read 一覧
  - Update ボタン
  - Delete ボタン

> CRUD 対象は **検証用ダミーリソース**（例: notes / items）

---

### 3.3 CRUD 用 API（検証用）

```text
POST   /demo/items
GET    /demo/items
PUT    /demo/items/{id}
DELETE /demo/items/{id}
```

- 各 API 呼び出し時に audit log が必ず記録される
- 認証必須（Access Token）

---

### 3.4 操作ログ確認ポイント（開発者向け）

- request_id がレスポンスヘッダに含まれる
- CRUD 操作ごとに audit_logs に 1 件ずつ追加される
- user_id / method / path / status_code を確認

---

## 4. 管理者画面設計（操作ログ閲覧）

### 4.1 前提

- 管理者ユーザーのみアクセス可能
- 初期段階では `users.is_admin = true` のような簡易判定で可

---

### 4.2 UI 構成

#### 検索・フィルタ

- ユーザー Email
- HTTP Method
- Path
- 日付範囲

#### 一覧テーブル

| 時刻 | ユーザー | Method | Path | Status | Duration(ms) |
| ---- | -------- | ------ | ---- | ------ | ------------ |

#### 詳細モーダル（任意）

- request_id
- ip
- user_agent

---

### 4.3 管理者用 API

```text
GET /admin/audit-logs
```

#### Query 例

- `?user_email=xxx`
- `?method=POST`
- `?from=2026-01-01&to=2026-01-04`

---

## 5. 権限制御（最小構成）

### 5.1 User モデル拡張

```text
users
- id
- email
- password_hash
- is_active
- is_admin   ← 追加
```

### 5.2 アクセス制御

- `/admin/*` は `is_admin == true` のみ許可
- 通常ユーザーは 403

---

## 6. フロントエンド状態管理

### 6.1 認証状態

- Access Token: メモリ
- Refresh Token: Cookie

### 6.2 グローバル状態

- currentUser
- authMethods
- isAuthenticated

---

## 7. 操作ログ（Audit Log）との対応関係

| 画面操作     | 記録されるログ                  |
| ------------ | ------------------------------- |
| ログイン     | POST /auth/login                |
| ログアウト   | POST /auth/logout               |
| CRUD 操作    | POST/GET/PUT/DELETE /demo/items |
| 管理画面閲覧 | GET /admin/audit-logs           |

---

## 8. フロントエンド ディレクトリ構成（例）

```
src/
  pages/
    LoginPage.tsx
    TopPage.tsx
    AdminAuditPage.tsx
  components/
    Header.tsx
    CrudPanel.tsx
    AuditLogTable.tsx
  auth/
    authStore.ts
    useAuth.ts
  api/
    client.ts
    auth.ts
    demo.ts
    admin.ts
```

---

## 9. PoC〜本番移植時の使い分け

### PoC / 検証

- 全認証方式 ON
- demo CRUD 有効
- 管理画面 有効

### 本番

- 必要な認証方式のみ ON
- demo CRUD 無効 or 削除
- 管理画面は社内用途のみ

---

## 10. VS Code Codex への最終指示（更新）

```
この設計書に基づいて、
FastAPI + PostgreSQL + TypeScript SPA の
共通認証・操作ログ基盤を実装してください。

追加要件:
- ログイン画面 / トップ画面 / 管理者画面を実装
- トップ画面に簡易CRUDを実装し、操作ログ確認が可能なこと
- 管理者画面で操作ログを検索・閲覧できること
- 認証方式は Feature Flags で切替
```

---

以上。
