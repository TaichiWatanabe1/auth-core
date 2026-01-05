import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { authApi } from "../api/auth";
import { Button } from "../components/common/Button";

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleExportData = async () => {
    setError(null);
    setExportLoading(true);
    try {
      const response = await authApi.exportData();
      const data = response.data;

      // JSONファイルとしてダウンロード
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess("データのエクスポートが完了しました");
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { detail?: string } } };
      setError(
        errorData.response?.data?.detail || "データのエクスポートに失敗しました"
      );
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "削除する") {
      setError("確認テキストが正しくありません");
      return;
    }

    setError(null);
    setDeleteLoading(true);
    try {
      await authApi.deleteAccount();
      await logout();
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { detail?: string } } };
      setError(
        errorData.response?.data?.detail || "アカウントの削除に失敗しました"
      );
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/")}
            className="text-blue-600 hover:underline text-sm mb-4 inline-block"
          >
            ← トップに戻る
          </button>
          <h1 className="text-2xl font-bold text-gray-900">設定</h1>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
            {success}
          </div>
        )}

        {/* Account Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            アカウント情報
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-500 text-sm">メールアドレス</span>
              <p className="text-gray-900">{user?.email}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">アカウント種別</span>
              <p className="text-gray-900">
                {user?.is_admin ? "管理者" : "一般ユーザー"}
              </p>
            </div>
          </div>
        </div>

        {/* Data Export */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            データエクスポート
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            あなたのアカウントに関連するすべてのデータをJSON形式でダウンロードできます。
            これには、プロフィール情報、監査ログなどが含まれます。
          </p>
          <Button
            onClick={handleExportData}
            loading={exportLoading}
            variant="secondary"
          >
            データをエクスポート
          </Button>
        </div>

        {/* Legal Links */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">法的情報</h2>
          <div className="space-y-2">
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 hover:underline"
            >
              プライバシーポリシー
            </a>
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 hover:underline"
            >
              利用規約
            </a>
          </div>
        </div>

        {/* Account Deletion */}
        <div className="bg-white rounded-lg shadow p-6 border-2 border-red-100">
          <h2 className="text-lg font-semibold text-red-600 mb-2">
            アカウント削除
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            アカウントを削除すると、すべてのデータが完全に削除されます。
            この操作は取り消すことができません。
          </p>

          {!showDeleteConfirm ? (
            <Button onClick={() => setShowDeleteConfirm(true)} variant="danger">
              アカウントを削除
            </Button>
          ) : (
            <div className="space-y-4 p-4 bg-red-50 rounded-lg">
              <p className="text-red-700 text-sm font-medium">
                本当にアカウントを削除しますか？
                確認のため、下のテキストボックスに「削除する」と入力してください。
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="削除する"
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteAccount}
                  variant="danger"
                  loading={deleteLoading}
                  disabled={deleteConfirmText !== "削除する"}
                >
                  削除を実行
                </Button>
                <Button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }}
                  variant="secondary"
                >
                  キャンセル
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
