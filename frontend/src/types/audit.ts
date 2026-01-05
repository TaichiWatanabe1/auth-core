/** 監査ログ */
export interface AuditLog {
  id: string;
  request_id: string;
  user_id?: string | null;
  user_email?: string | null;
  method: string;
  path: string;
  status_code: number;
  duration_ms: number;
  ip?: string | null;
  user_agent?: string | null;
  created_at: string;
}

/** 監査ログフィルタ */
export interface AuditLogFilter {
  user_email?: string;
  method?: string;
  path?: string;
  from?: string; // ISO date string
  to?: string; // ISO date string
  page?: number;
  limit?: number;
}

/** 監査ログ一覧レスポンス */
export interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
}
