
import { lazy, Suspense } from "react";
import { useAuthContext } from "./auth/hooks/AuthContext";
import { logout } from "./shared/utils/logout";
import "./shared/layouts/dashboard.css";

const AdminDashboard = lazy(() => import("./role_pages/admin/pages/AdminDashboard"));
const KasirDashboard = lazy(() => import("./role_pages/kasir/pages/KasirDashboard"));
const ProduksiDashboard = lazy(() => import("./role_pages/produksi/pages/ProduksiDashboard"));
const PelangganBeranda = lazy(() => import("./role_pages/pelanggan/pages/PelangganBeranda"));

const handleLogout = () => logout().catch(() => {});

const Centered = ({ children }) =>
<div className="min-h-screen flex items-center justify-center text-sm text-gray-400">
    {children}
  </div>;


export default function MainPage() {
  const { session, profile, loading } = useAuthContext();

  if (loading) return <Centered>Memuat…</Centered>;
  if (!session) return null;
  if (!profile) return <Centered>Memuat profil…</Centered>;

  const props = { profile, onLogout: handleLogout };

  const dashboard = (() => {
    switch (profile.role) {
      case "Admin":return <AdminDashboard {...props} />;
      case "Kasir":return <KasirDashboard {...props} />;
      case "Produksi":return <ProduksiDashboard {...props} />;
      case "Pelanggan":return <PelangganBeranda {...props} />;
      default:return <Centered>Role tidak dikenal: {profile.role}</Centered>;
    }
  })();

  return (
    <Suspense fallback={<Centered>Memuat…</Centered>}>
      {dashboard}
    </Suspense>);

}