import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";
import { Loading } from "../components/common/Loading";

interface AuthGuardProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export const AuthGuard = ({
  children,
  requireAdmin = false,
}: AuthGuardProps) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
          <p className="text-gray-600 mb-4">アクセス権限がありません</p>
          <a href="/" className="text-blue-600 hover:underline">
            トップページへ戻る
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
