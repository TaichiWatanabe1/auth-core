import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "./auth/useAuth";
import { AuthGuard } from "./auth/AuthGuard";
import {
  LoginPage,
  TopPage,
  AdminAuditPage,
  NotFoundPage,
  PrivacyPolicyPage,
  TermsOfServicePage,
  SettingsPage,
} from "./pages";
import { Loading } from "./components/common/Loading";

const AppRoutes = () => {
  const { isLoading, initialize } = useAuth();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />

      {/* Protected */}
      <Route
        path="/"
        element={
          <AuthGuard>
            <TopPage />
          </AuthGuard>
        }
      />
      <Route
        path="/settings"
        element={
          <AuthGuard>
            <SettingsPage />
          </AuthGuard>
        }
      />

      {/* Admin Only */}
      <Route
        path="/admin/audit"
        element={
          <AuthGuard requireAdmin>
            <AdminAuditPage />
          </AuthGuard>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
