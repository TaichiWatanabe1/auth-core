import apiClient from "./client";
import type { AuditLogFilter, AuditLogListResponse } from "../types/audit";

export const adminApi = {
  /** 監査ログ取得 */
  getAuditLogs: (filter: AuditLogFilter = {}) =>
    apiClient.get<AuditLogListResponse>("/admin/audit-logs", {
      params: filter,
    }),
};
