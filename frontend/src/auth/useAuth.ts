import { useCallback } from "react";
import { useAuthStore } from "./authStore";
import { authApi } from "../api/auth";

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    authMethods,
    oauthProviders,
    login,
    logout,
    register,
    loginWithCode,
    initialize,
  } = useAuthStore();

  const requestCode = useCallback(async (email: string) => {
    const response = await authApi.requestCode({ email });
    return response.data;
  }, []);

  const startOAuth = useCallback(async (provider: string) => {
    const response = await authApi.getOAuthAuthorizeUrl(provider);
    window.location.href = response.data.authorize_url;
  }, []);

  const handleOAuthCallback = useCallback(
    async (provider: string, code: string, state: string) => {
      const response = await authApi.oauthCallback(provider, { code, state });
      useAuthStore.getState().setAccessTokenState(response.data.access_token);
      await useAuthStore.getState().fetchCurrentUser();
    },
    []
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin: user?.is_admin ?? false,
    authMethods,
    oauthProviders,
    login,
    logout,
    register,
    loginWithCode,
    requestCode,
    startOAuth,
    handleOAuthCallback,
    initialize,
  };
};
