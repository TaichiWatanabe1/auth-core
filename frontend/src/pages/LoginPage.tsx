import { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { Loading } from "../components/common/Loading";
import { EmailPasswordForm } from "../components/login/EmailPasswordForm";
import { CodeAuthForm } from "../components/login/CodeAuthForm";
import { OAuthButton } from "../components/login/OAuthButton";
import type { AuthMethod } from "../types/auth";

export const LoginPage = () => {
  const {
    isAuthenticated,
    isLoading,
    authMethods,
    oauthProviders,
    handleOAuthCallback,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeMethod, setActiveMethod] =
    useState<AuthMethod>("email_password");
  const [oauthLoading, setOauthLoading] = useState(false);

  // OAuthコールバック処理
  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const provider = searchParams.get("provider");

    if (code && state && provider) {
      setOauthLoading(true);
      handleOAuthCallback(provider, code, state)
        .then(() => {
          const from =
            (location.state as { from?: { pathname: string } })?.from
              ?.pathname || "/";
          navigate(from, { replace: true });
        })
        .catch((err) => {
          console.error("OAuth callback error:", err);
          setOauthLoading(false);
        });
    }
  }, [searchParams, handleOAuthCallback, navigate, location.state]);

  // 認証済みの場合はリダイレクト
  useEffect(() => {
    if (isAuthenticated) {
      const from =
        (location.state as { from?: { pathname: string } })?.from?.pathname ||
        "/";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  // 利用可能な最初の認証方式を選択
  useEffect(() => {
    if (authMethods.length > 0 && !authMethods.includes(activeMethod)) {
      setActiveMethod(authMethods[0]);
    }
  }, [authMethods, activeMethod]);

  const handleSuccess = () => {
    const from =
      (location.state as { from?: { pathname: string } })?.from?.pathname ||
      "/";
    navigate(from, { replace: true });
  };

  if (isLoading || oauthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading size="lg" />
      </div>
    );
  }

  const hasMultipleMethods =
    authMethods.length > 1 || oauthProviders.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Auth & Audit Platform
          </h1>
          <p className="mt-2 text-gray-600">アカウントにログインしてください</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Method Tabs */}
          {hasMultipleMethods && (
            <div className="flex border-b border-gray-200 mb-6">
              {authMethods.includes("email_password") && (
                <button
                  onClick={() => setActiveMethod("email_password")}
                  className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeMethod === "email_password"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  メール/パスワード
                </button>
              )}
              {authMethods.includes("code") && (
                <button
                  onClick={() => setActiveMethod("code")}
                  className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeMethod === "code"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  認証コード
                </button>
              )}
            </div>
          )}

          {/* Form */}
          {activeMethod === "email_password" && (
            <EmailPasswordForm onSuccess={handleSuccess} />
          )}
          {activeMethod === "code" && (
            <CodeAuthForm onSuccess={handleSuccess} />
          )}

          {/* OAuth Providers */}
          {oauthProviders.length > 0 && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">または</span>
                </div>
              </div>

              <div className="space-y-3">
                {oauthProviders.map((provider) => (
                  <OAuthButton key={provider} provider={provider} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
