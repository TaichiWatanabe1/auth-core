/** 認証方式 */
export type AuthMethod = "email_password" | "email" | "code" | "oauth";

/** 認証方式レスポンス */
export interface AuthMethodsResponse {
  methods: AuthMethod[];
  oauth_providers?: string[];
}

/** ログインリクエスト */
export interface LoginRequest {
  email: string;
  password: string;
}

/** トークンレスポンス */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/** コード認証リクエスト */
export interface CodeRequestPayload {
  email: string;
}

export interface CodeRequestResponse {
  message: string;
  debug_code?: string; // DEBUGモード時のみ
  is_new_user?: boolean;
}

export interface CodeVerifyPayload {
  email: string;
  code: string;
}

/** ユーザー登録 */
export interface RegisterRequest {
  email: string;
  password: string;
}

/** OAuth認可URLレスポンス */
export interface OAuthAuthorizeResponse {
  authorize_url: string;
}

/** OAuthコールバックリクエスト */
export interface OAuthCallbackRequest {
  code: string;
  state: string;
}
