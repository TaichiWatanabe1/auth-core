import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

export const Header = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-gray-900">
              Auth & Audit Platform
            </span>
          </Link>

          {/* Navigation */}
          {isAuthenticated && (
            <nav className="flex items-center space-x-4">
              <Link
                to="/"
                className={`
                  px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${
                    isActive("/")
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }
                `}
              >
                トップ
              </Link>

              {isAdmin && (
                <Link
                  to="/admin/audit"
                  className={`
                    px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${
                      isActive("/admin/audit")
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }
                  `}
                >
                  監査ログ
                </Link>
              )}

              {/* User Menu */}
              <div className="flex items-center ml-4 pl-4 border-l border-gray-200">
                <span className="text-sm text-gray-600 mr-4">
                  {user?.email}
                  {isAdmin && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                      Admin
                    </span>
                  )}
                </span>
                <Link
                  to="/settings"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors mr-4"
                >
                  設定
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  ログアウト
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};
