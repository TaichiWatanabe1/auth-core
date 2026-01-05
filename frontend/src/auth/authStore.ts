import { create } from "zustand";
import type { User } from "../types/user";
import type { AuthMethod } from "../types/auth";
import { authApi } from "../api/auth";
import { setAccessToken } from "../api/client";

interface AuthState {
  // 状態
  accessToken: string | null;
  user: User | null;
  authMethods: AuthMethod[];
  oauthProviders: string[];
  isAuthenticated: boolean;
  isLoading: boolean;

  // アクション
  setAccessTokenState: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setAuthMethods: (methods: AuthMethod[], providers?: string[]) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;

  // 非同期アクション
  fetchAuthMethods: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  fetchCurrentUser: () => Promise<void>;
  loginWithCode: (email: string, code: string) => Promise<void>;
  initialize: () => Promise<void>;
}

const initialState = {
  accessToken: null,
  user: null,
  authMethods: [] as AuthMethod[],
  oauthProviders: [] as string[],
  isAuthenticated: false,
  isLoading: true,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialState,

  setAccessTokenState: (token) => {
    setAccessToken(token);
    set({
      accessToken: token,
      isAuthenticated: !!token,
    });
  },

  setUser: (user) => set({ user }),

  setAuthMethods: (methods, providers = []) =>
    set({ authMethods: methods, oauthProviders: providers }),

  setLoading: (loading) => set({ isLoading: loading }),

  reset: () => {
    setAccessToken(null);
    set(initialState);
  },

  fetchAuthMethods: async () => {
    try {
      const response = await authApi.getMethods();
      set({
        authMethods: response.data.methods,
        oauthProviders: response.data.oauth_providers || [],
      });
    } catch (error) {
      console.error("Failed to fetch auth methods:", error);
    }
  },

  login: async (email, password) => {
    const response = await authApi.login({ email, password });
    const token = response.data.access_token;
    get().setAccessTokenState(token);
    await get().fetchCurrentUser();
  },

  register: async (email, password) => {
    const response = await authApi.register({ email, password });
    return response.data;
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      get().reset();
      set({ isLoading: false });
    }
  },

  refresh: async () => {
    try {
      const response = await authApi.refresh();
      const token = response.data.access_token;
      get().setAccessTokenState(token);
      return true;
    } catch (error) {
      get().reset();
      set({ isLoading: false });
      return false;
    }
  },

  fetchCurrentUser: async () => {
    try {
      const response = await authApi.me();
      set({ user: response.data, isLoading: false });
    } catch (error) {
      set({ user: null, isLoading: false });
    }
  },

  loginWithCode: async (email, code) => {
    const response = await authApi.verifyCode({ email, code });
    const token = response.data.access_token;
    get().setAccessTokenState(token);
    await get().fetchCurrentUser();
  },

  initialize: async () => {
    set({ isLoading: true });

    // 認証方式を取得
    await get().fetchAuthMethods();

    // トークンリフレッシュを試行
    const success = await get().refresh();
    if (success) {
      await get().fetchCurrentUser();
    } else {
      set({ isLoading: false });
    }
  },
}));
