/** ユーザー */
export interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

/** 現在のユーザー状態 */
export interface CurrentUser {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
