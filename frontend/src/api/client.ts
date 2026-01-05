import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Cookie送信のため
});

// アクセストークンを保持
let accessToken: string | null = null;

// リフレッシュ中フラグ（無限ループ防止）
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

// リフレッシュ完了時に待機中のリクエストを再実行
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// リフレッシュ待機キューに追加
const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// リクエストインターセプター
apiClient.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
    const originalRequest = error.config;

    // リフレッシュエンドポイント自体の401はリトライしない
    if (originalRequest.url?.includes("/auth/refresh")) {
      setAccessToken(null);
      return Promise.reject(error);
    }

    // 401エラーでリフレッシュ未試行の場合
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 既にリフレッシュ中の場合は待機
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // トークンリフレッシュを試行
        const response = await apiClient.post("/auth/refresh");
        const newToken = response.data.access_token;
        setAccessToken(newToken);
        isRefreshing = false;
        onRefreshed(newToken);

        // 元のリクエストを再試行
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // リフレッシュ失敗時はトークンをクリア
        isRefreshing = false;
        setAccessToken(null);
        refreshSubscribers = [];
        // ログインページへリダイレクト（現在のパスがログインページでない場合のみ）
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
