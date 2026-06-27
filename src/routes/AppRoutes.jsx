
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider } from "../auth/hooks/AuthContext";
import { useAuthContext } from "../auth/hooks/AuthContext";
import AuthPage from "../auth/pages/AuthPage.jsx";
import ResetPasswordPage from "../auth/pages/ResetPasswordPage.jsx";
import AuthCallbackPage from "../auth/pages/AuthCallbackPage.jsx";
import MainPage from "../MainPage.jsx";
import LandingPage from "../role_pages/public/LandingPage.jsx";
import PaymentResultPage from "../role_pages/pelanggan/pages/PaymentResultPage.jsx";


function ResetPasswordPageWrapper() {
  const navigate = useNavigate();
  return <ResetPasswordPage onSuccess={() => navigate("/", { replace: true })} />;
}


function RootRoute() {
  const { session, loading } = useAuthContext();
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".875rem", color: "#6b7280" }}>
      Memuat…
    </div>);


  if (!session) return <LandingPage />;

  return <MainPage />;
}


function AuthGate() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPageWrapper />} />
      <Route path="/payment/finish" element={<PaymentResultPage variant="finish" />} />
      <Route path="/payment/error" element={<PaymentResultPage variant="error" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>);

}


export default function AppRoutes() {
  return (



    <AuthProvider>
      <BrowserRouter>
        <AuthGate />
      </BrowserRouter>
    </AuthProvider>);

}