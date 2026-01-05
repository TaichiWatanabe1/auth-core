import apiClient from "./client";
import type {
  AuthMethodsResponse,
  LoginRequest,
  TokenResponse,
  RegisterRequest,
  CodeRequestPayload,
  CodeRequestResponse,
  CodeVerifyPayload,
  OAuthAuthorizeResponse,
  OAuthCallbackRequest,
} from "../types/auth";
import type { User } from "../types/user";

export const authApi = {
  /** 認証方式取得 */
  getMethods: () => apiClient.get<AuthMethodsResponse>("/auth/methods"),

  /** Email/Password ログイン */
  login: (data: LoginRequest) =>
    apiClient.post<TokenResponse>("/auth/login", data),

  /** ユーザー登録 */
  register: (data: RegisterRequest) =>
    apiClient.post<User>("/auth/register", data),

  /** ログアウト */
  logout: () => apiClient.post("/auth/logout"),

  /** トークンリフレッシュ */
  refresh: () => apiClient.post<TokenResponse>("/auth/refresh"),

  /** 現在のユーザー取得 */
  me: () => apiClient.get<User>("/auth/me"),

  /** コード認証: コード送信 */
  requestCode: (data: CodeRequestPayload) =>
    apiClient.post<CodeRequestResponse>("/auth/code/request", data),

  /** コード認証: 検証 */
  verifyCode: (data: CodeVerifyPayload) =>
    apiClient.post<TokenResponse>("/auth/code/verify", data),

  /** OAuth: 認可URL取得 */
  getOAuthAuthorizeUrl: (provider: string) =>
    apiClient.get<OAuthAuthorizeResponse>(`/auth/oidc/${provider}/authorize`),

  /** OAuth: コールバック */
  oauthCallback: (provider: string, data: OAuthCallbackRequest) =>
    apiClient.post<TokenResponse>(`/auth/oidc/${provider}/callback`, data),

  /** アカウント削除 (GDPR対応) */
  deleteAccount: () => apiClient.delete("/auth/me"),

  /** データエクスポート (GDPR対応) */
  exportData: () => apiClient.get("/auth/me/export"),
};
