# Frontend 設計書

作成日: 2026-01-04  
対象: TypeScript SPA (React + Vite)

---

## 1. 技術スタック

| カテゴリ          | 技術            |
| ----------------- | --------------- |
| フレームワーク    | React 18        |
| ビルドツール      | Vite            |
| 言語              | TypeScript      |
| ルーティング      | React Router v6 |
| 状態管理          | Zustand         |
| HTTP クライアント | Axios           |
| UI ライブラリ     | Tailwind CSS    |
| フォーム          | React Hook Form |
| バリデーション    | Zod             |

---

## 2. ディレクトリ構成

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/
│   │   ├── client.ts          # Axios インスタンス
│   │   ├── auth.ts            # 認証 API
│   │   ├── demo.ts            # Demo CRUD API
│   │   └── admin.ts           # 管理者 API
│   ├── auth/
│   │   ├── authStore.ts       # 認証状態管理 (Zustand)
│   │   ├── useAuth.ts         # 認証フック
│   │   └── AuthGuard.tsx      # 認証ガード
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Loading.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Layout.tsx
│   │   ├── login/
│   │   │   ├── EmailPasswordForm.tsx
│   │   │   ├── CodeAuthForm.tsx
│   │   │   └── OAuthButton.tsx
│   │   ├── top/
│   │   │   └── CrudPanel.tsx
│   │   └── admin/
│   │       ├── AuditLogTable.tsx
│   │       ├── AuditLogFilter.tsx
│   │       └── AuditLogDetailModal.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── TopPage.tsx
│   │   ├── AdminAuditPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── types/
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── demo.ts
│   │   └── audit.ts
│   ├── utils/
│   │   ├── token.ts
│   │   └── format.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── .env.local
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 3. 型定義

### 3.1 認証関連 (`types/auth.ts`)

```typescript
// 認証方式
export type AuthMethod = "email" | "code" | "oauth";

// 認証方式レスポンス
export interface AuthMethodsResponse {
  methods: AuthMethod[];
  oauth_providers?: string[];
}

// ログインリクエスト
export interface LoginRequest {
  email: string;
  password: string;
}

// トークンレスポンス
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// コード認証リクエスト
export interface CodeRequestPayload {
  email: string;
}

export interface CodeVerifyPayload {
  email: string;
  code: string;
}

// ユーザー登録
export interface RegisterRequest {
  email: string;
  password: string;
}
```

### 3.2 ユーザー関連 (`types/user.ts`)

```typescript
export interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface CurrentUser {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

### 3.3 Demo CRUD (`types/demo.ts`)

```typescript
export interface DemoItem {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDemoItemRequest {
  title: string;
  description: string;
}

export interface UpdateDemoItemRequest {
  title?: string;
  description?: string;
}
```

### 3.4 監査ログ (`types/audit.ts`)

```typescript
export interface AuditLog {
  id: string;
  request_id: string;
  user_id: string | null;
  user_email: string | null;
  method: string;
  path: string;
  status_code: number;
  duration_ms: number;
  ip: string;
  user_agent: string;
  created_at: string;
}

export interface AuditLogFilter {
  user_email?: string;
  method?: string;
  path?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
}
```

---

## 4. API クライアント設計

### 4.1 Axios インスタンス (`api/client.ts`)

```typescript
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// リクエストインターセプター
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// レスポンスインターセプター
apiClient.interceptors.response.use(
  (response) => {
    // request_id をログ出力（開発用）
    const requestId = response.headers["x-request-id"];
    if (requestId) {
      console.debug(`[Request ID] ${requestId}`);
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // トークンリフレッシュ or ログアウト
      await useAuthStore.getState().refresh();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 4.2 認証 API (`api/auth.ts`)

```typescript
import apiClient from "./client";
import type {
  AuthMethodsResponse,
  LoginRequest,
  TokenResponse,
  RegisterRequest,
  CodeRequestPayload,
  CodeVerifyPayload,
} from "../types/auth";
import type { User } from "../types/user";

export const authApi = {
  // 認証方式取得
  getMethods: () => apiClient.get<AuthMethodsResponse>("/auth/methods"),

  // Email/Password ログイン
  login: (data: LoginRequest) =>
    apiClient.post<TokenResponse>("/auth/login", data),

  // ユーザー登録
  register: (data: RegisterRequest) =>
    apiClient.post<User>("/auth/register", data),

  // ログアウト
  logout: () => apiClient.post("/auth/logout"),

  // トークンリフレッシュ
  refresh: () => apiClient.post<TokenResponse>("/auth/refresh"),

  // 現在のユーザー取得
  me: () => apiClient.get<User>("/auth/me"),

  // コード認証: コード送信
  requestCode: (data: CodeRequestPayload) =>
    apiClient.post("/auth/code/request", data),

  // コード認証: 検証
  verifyCode: (data: CodeVerifyPayload) =>
    apiClient.post<TokenResponse>("/auth/code/verify", data),

  // OAuth: 認可URL取得
  getOAuthAuthorizeUrl: (provider: string) =>
    apiClient.get<{ authorize_url: string }>(
      `/auth/oidc/${provider}/authorize`
    ),

  // OAuth: コールバック
  oauthCallback: (provider: string, code: string, state: string) =>
    apiClient.post<TokenResponse>(`/auth/oidc/${provider}/callback`, {
      code,
      state,
    }),
};
```

### 4.3 Demo API (`api/demo.ts`)

```typescript
import apiClient from "./client";
import type {
  DemoItem,
  CreateDemoItemRequest,
  UpdateDemoItemRequest,
} from "../types/demo";

export const demoApi = {
  // 一覧取得
  getItems: () => apiClient.get<DemoItem[]>("/demo/items"),

  // 作成
  createItem: (data: CreateDemoItemRequest) =>
    apiClient.post<DemoItem>("/demo/items", data),

  // 更新
  updateItem: (id: string, data: UpdateDemoItemRequest) =>
    apiClient.put<DemoItem>(`/demo/items/${id}`, data),

  // 削除
  deleteItem: (id: string) => apiClient.delete(`/demo/items/${id}`),
};
```

### 4.4 管理者 API (`api/admin.ts`)

```typescript
import apiClient from "./client";
import type { AuditLogFilter, AuditLogListResponse } from "../types/audit";

export const adminApi = {
  // 監査ログ取得
  getAuditLogs: (filter: AuditLogFilter) =>
    apiClient.get<AuditLogListResponse>("/admin/audit-logs", {
      params: filter,
    }),
};
```

---

## 5. 状態管理設計

### 5.1 認証ストア (`auth/authStore.ts`)

```typescript
import { create } from "zustand";
import type { User } from "../types/user";
import type { AuthMethod } from "../types/auth";
import { authApi } from "../api/auth";

interface AuthState {
  // 状態
  accessToken: string | null;
  user: User | null;
  authMethods: AuthMethod[];
  isAuthenticated: boolean;
  isLoading: boolean;

  // アクション
  setAccessToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setAuthMethods: (methods: AuthMethod[]) => void;

  // 非同期アクション
  fetchAuthMethods: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  authMethods: [],
  isAuthenticated: false,
  isLoading: true,

  setAccessToken: (token) =>
    set({
      accessToken: token,
      isAuthenticated: !!token,
    }),

  setUser: (user) => set({ user }),

  setAuthMethods: (methods) => set({ authMethods: methods }),

  fetchAuthMethods: async () => {
    const response = await authApi.getMethods();
    set({ authMethods: response.data.methods });
  },

  login: async (email, password) => {
    const response = await authApi.login({ email, password });
    set({
      accessToken: response.data.access_token,
      isAuthenticated: true,
    });
    await get().fetchCurrentUser();
  },

  logout: async () => {
    await authApi.logout();
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
    });
  },

  refresh: async () => {
    try {
      const response = await authApi.refresh();
      set({
        accessToken: response.data.access_token,
        isAuthenticated: true,
      });
    } catch {
      set({
        accessToken: null,
        user: null,
        isAuthenticated: false,
      });
    }
  },

  fetchCurrentUser: async () => {
    set({ isLoading: true });
    try {
      const response = await authApi.me();
      set({ user: response.data, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));
```

---

## 6. 画面コンポーネント設計

### 6.1 ログイン画面 (`pages/LoginPage.tsx`)

#### 機能要件

- 起動時に `GET /auth/methods` で有効な認証方式を取得
- 認証方式に応じてタブを表示
- Email/Password、Code 認証、OAuth の各フォームを切替

#### UI 構成

```
┌─────────────────────────────────┐
│         ログイン画面             │
├─────────────────────────────────┤
│  [Email] [Code] [OAuth]  ← タブ  │
├─────────────────────────────────┤
│  ┌─────────────────────────┐   │
│  │ Email: [___________]    │   │
│  │ Password: [___________] │   │
│  │                         │   │
│  │ [ログイン]              │   │
│  │                         │   │
│  │ 新規登録はこちら        │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

#### Props / State

```typescript
interface LoginPageState {
  activeTab: AuthMethod;
  isLoading: boolean;
  error: string | null;
}
```

---

### 6.2 トップ画面 (`pages/TopPage.tsx`)

#### 機能要件

- ログインユーザー情報表示
- Demo CRUD 操作パネル
- 各操作で監査ログが記録されることを確認

#### UI 構成

```
┌─────────────────────────────────┐
│ [Logo]  user@example.com [Logout]│
├─────────────────────────────────┤
│  ようこそ、user@example.com さん │
├─────────────────────────────────┤
│  Demo Items                      │
│  ┌───────────────────────────┐  │
│  │ [+ 新規作成]              │  │
│  ├───────────────────────────┤  │
│  │ ID   | Title  | Actions   │  │
│  │ 001  | Item1  | [編集][削除]│  │
│  │ 002  | Item2  | [編集][削除]│  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

---

### 6.3 管理者画面 (`pages/AdminAuditPage.tsx`)

#### 機能要件

- 管理者のみアクセス可能
- 監査ログの検索・フィルタ
- 詳細モーダル表示

#### UI 構成

```
┌─────────────────────────────────────────────┐
│ [Logo]  admin@example.com [Logout]          │
├─────────────────────────────────────────────┤
│  監査ログ                                    │
├─────────────────────────────────────────────┤
│  フィルター                                  │
│  Email: [________] Method: [▼] Path: [____] │
│  From: [____] To: [____] [検索]             │
├─────────────────────────────────────────────┤
│  時刻       | ユーザー | Method | Path | ... │
│  2026-01-04 | user@... | POST   | /auth| ... │
│  2026-01-04 | user@... | GET    | /demo| ... │
├─────────────────────────────────────────────┤
│  [< 前へ] [1] [2] [3] [次へ >]              │
└─────────────────────────────────────────────┘
```

---

## 7. 認証ガード設計

### 7.1 AuthGuard (`auth/AuthGuard.tsx`)

```typescript
interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

// 未認証 → /login へリダイレクト
// requireAdmin=true かつ非管理者 → 403 表示
```

### 7.2 ルーティング設計

```typescript
const routes = [
  { path: "/login", element: <LoginPage />, public: true },
  {
    path: "/",
    element: (
      <AuthGuard>
        <TopPage />
      </AuthGuard>
    ),
  },
  {
    path: "/admin/audit",
    element: (
      <AuthGuard requireAdmin>
        <AdminAuditPage />
      </AuthGuard>
    ),
  },
  { path: "*", element: <NotFoundPage /> },
];
```

---

## 8. 環境変数

### `.env.example`

```env
# API Base URL
VITE_API_URL=http://localhost:8000

# Feature Flags
VITE_ENABLE_EMAIL_AUTH=true
VITE_ENABLE_CODE_AUTH=true
VITE_ENABLE_OAUTH_AUTH=true
```

---

## 9. エラーハンドリング

### 9.1 API エラー

| HTTP Status | 処理                                            |
| ----------- | ----------------------------------------------- |
| 400         | バリデーションエラー表示                        |
| 401         | トークンリフレッシュ試行 → 失敗時ログイン画面へ |
| 403         | アクセス権限なしメッセージ表示                  |
| 404         | リソースなしメッセージ表示                      |
| 500         | サーバーエラーメッセージ表示                    |

### 9.2 エラー表示コンポーネント

```typescript
interface ErrorMessage {
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

---

## 10. レスポンシブ対応

| ブレークポイント | 対応         |
| ---------------- | ------------ |
| sm (640px)       | モバイル     |
| md (768px)       | タブレット   |
| lg (1024px)      | デスクトップ |

- ログイン画面: 中央寄せカード
- トップ画面: サイドバーなし単一カラム
- 管理者画面: テーブル横スクロール対応

---

## 11. テスト方針

### 11.1 単体テスト

- Vitest + React Testing Library
- 認証ストアのアクション
- フォームバリデーション

### 11.2 E2E テスト

- Playwright
- ログインフロー
- CRUD 操作フロー
- 管理者画面アクセス制御

---

## 12. ビルド・デプロイ

### 12.1 開発

```bash
npm run dev
```

### 12.2 ビルド

```bash
npm run build
```

### 12.3 プレビュー

```bash
npm run preview
```

---

以上。
