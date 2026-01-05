import { Modal } from "../common/Modal";
import type { AuditLog } from "../../types/audit";

interface AuditLogDetailModalProps {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogDetailModal = ({
  log,
  isOpen,
  onClose,
}: AuditLogDetailModalProps) => {
  if (!log) return null;

  const getStatusColor = (status?: number) => {
    if (!status) return "text-gray-500";
    if (status >= 500) return "text-red-600 bg-red-50";
    if (status >= 400) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="監査ログ詳細" size="lg">
      <div className="space-y-4">
        {/* 基本情報 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 uppercase">ID</label>
            <p className="text-sm font-medium">{log.id}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">
              Request ID
            </label>
            <p className="text-sm font-mono">{log.request_id || "-"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">日時</label>
            <p className="text-sm">
              {new Date(log.created_at).toLocaleString("ja-JP")}
            </p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">処理時間</label>
            <p className="text-sm">
              {log.duration_ms ? `${log.duration_ms.toFixed(2)}ms` : "-"}
            </p>
          </div>
        </div>

        {/* リクエスト情報 */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            リクエスト
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase">
                メソッド
              </label>
              <p className="text-sm font-medium">{log.method}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">パス</label>
              <p className="text-sm break-all">{log.path}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">
                ユーザーID
              </label>
              <p className="text-sm">{log.user_id || "-"}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">
                IPアドレス
              </label>
              <p className="text-sm">{log.ip || "-"}</p>
            </div>
          </div>
        </div>

        {/* User Agent */}
        {log.user_agent && (
          <div className="border-t pt-4">
            <label className="text-xs text-gray-500 uppercase">
              User Agent
            </label>
            <p className="text-sm text-gray-600 break-all">{log.user_agent}</p>
          </div>
        )}

        {/* レスポンス情報 */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            レスポンス
          </h4>
          <div>
            <label className="text-xs text-gray-500 uppercase">
              ステータスコード
            </label>
            <p
              className={`text-sm font-medium inline-block px-2 py-0.5 rounded ${getStatusColor(
                log.status_code
              )}`}
            >
              {log.status_code || "-"}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
