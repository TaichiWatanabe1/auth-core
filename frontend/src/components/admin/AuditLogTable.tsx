import type { AuditLog } from "../../types/audit";
import { Loading } from "../common/Loading";

interface AuditLogTableProps {
  logs: AuditLog[];
  loading: boolean;
  onRowClick?: (log: AuditLog) => void;
}

export const AuditLogTable = ({
  logs,
  loading,
  onRowClick,
}: AuditLogTableProps) => {
  const getStatusColor = (status?: number) => {
    if (!status) return "text-gray-500";
    if (status >= 500) return "text-red-600";
    if (status >= 400) return "text-yellow-600";
    return "text-green-600";
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: "bg-blue-100 text-blue-700",
      POST: "bg-green-100 text-green-700",
      PUT: "bg-yellow-100 text-yellow-700",
      PATCH: "bg-orange-100 text-orange-700",
      DELETE: "bg-red-100 text-red-700",
    };
    return colors[method] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                日時
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Request ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ユーザー
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                メソッド
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                パス
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                処理時間
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  ログがありません
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => onRowClick?.(log)}
                  className={`hover:bg-gray-50 ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {new Date(log.created_at).toLocaleString("ja-JP")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-gray-500">
                    {log.request_id?.substring(0, 8) || "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {log.user_email || "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${getMethodColor(
                        log.method
                      )}`}
                    >
                      {log.method}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {log.path}
                  </td>
                  <td
                    className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${getStatusColor(
                      log.status_code
                    )}`}
                  >
                    {log.status_code || "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {log.duration_ms ? `${log.duration_ms.toFixed(2)}ms` : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
