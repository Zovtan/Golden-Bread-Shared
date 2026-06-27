
import { useState, lazy, Suspense } from "react";
import DashboardLayout from "../../../shared/layouts/DashboardLayout";
import StatCard from "../../../shared/components/StatCard";
import AlertGrid from "../../../shared/components/AlertGrid";
import RealtimeBadge from "../../../shared/components/RealtimeBadge";
import { useAdminDashboard } from "../hooks/useAdminDashboard";
import { useImportantAlerts } from "../../../shared/hooks/useImportantAlerts";
import ImportantAlertsPopUp from "../../../shared/components/ImportantAlertsPopUp";
import { useSortableTable, ENUM_MAPS } from "../../../shared/hooks/useSortableTable";
import SortableTh from "../../../shared/components/SortableTh";



const named = (factory, name) => lazy(() => factory().then((m) => ({ default: m[name] })));


const PesananOnlinePage = lazy(() => import("./PesananOnlinePage"));
const PenjualanLangsungPage = lazy(() => import("./PenjualanLangsungPage"));

const PembelianBahanPage = lazy(() => import("./PembelianBahanPage"));
const ProdukPage = lazy(() => import("./ProdukPage"));
const BahanBakuPage = lazy(() => import("./BahanBakuPage"));
const UserPage = lazy(() => import("./UserPage"));
const PelangganPage = lazy(() => import("./PelangganPage"));

const LaporanPenjualanPage = lazy(() => import("./LaporanPenjualanPage"));
const LaporanPembelianPage = lazy(() => import("./LaporanPembelianPage"));
const LaporanProdukPage = lazy(() => import("./LaporanProdukPage"));
const LaporanBahanBakuPage = lazy(() => import("./LaporanBahanBakuPage"));
const LogAktivitasPage = lazy(() => import("./LogAktivitasPage"));

const PesananSearchBar = named(() => import("./PesananOnlinePage"), "PesananSearchBar");
const PenjualanSearchBar = named(() => import("./PenjualanLangsungPage"), "PenjualanSearchBar");
const PembelianSearchBar = named(() => import("./PembelianBahanPage"), "PembelianSearchBar");
const ProdukSearchBar = named(() => import("./ProdukPage"), "ProdukSearchBar");
const BahanBakuSearchBar = named(() => import("./BahanBakuPage"), "BahanBakuSearchBar");
const UserSearchBar = named(() => import("./UserPage"), "UserSearchBar");
const PelangganSearchBar = named(() => import("./PelangganPage"), "PelangganSearchBar");
const LaporanSearchBar = named(() => import("./LaporanPenjualanPage"), "LaporanSearchBar");
const LaporanPembelianSearchBar = named(() => import("./LaporanPembelianPage"), "LaporanPembelianSearchBar");
const LaporanProdukSearchBar = named(() => import("./LaporanProdukPage"), "LaporanProdukSearchBar");
const LaporanBahanBakuSearchBar = named(() => import("./LaporanBahanBakuPage"), "LaporanBahanBakuSearchBar");
const LogSearchBar = named(() => import("./LogAktivitasPage"), "LogSearchBar");


const NAV = [
{ key: "dashboard", label: "Dashboard", icon: "dashboard" },
{
  key: "transaksi", label: "Transaksi", icon: "transaksi",
  children: [
  { key: "pesanan-online", label: "Pesanan Online", icon: "pesanan" },
  { key: "penjualan-langsung", label: "Penjualan Langsung", icon: "penjualan" },
  { key: "pembelian-bahan", label: "Pembelian Bahan", icon: "pembelian" }]

},
{
  key: "manajemen", label: "Manajemen", icon: "manajemen",
  children: [
  { key: "produk", label: "Produk", icon: "produk" },
  { key: "bahan-baku", label: "Bahan Baku", icon: "bahan" },
  { key: "user-karyawan", label: "User & Karyawan", icon: "users" },
  { key: "pelanggan-mgmt", label: "Pelanggan", icon: "pelanggan" }]

},
{
  key: "laporan", label: "Laporan", icon: "laporan2",
  children: [
  { key: "lap-penjualan", label: "Laporan Penjualan", icon: "laporan" },
  { key: "lap-pembelian", label: "Laporan Pembelian", icon: "lapPembelian" },
  { key: "lap-produk", label: "Laporan Produk", icon: "lapProduk" },
  { key: "lap-bahan-baku", label: "Laporan Bahan Baku", icon: "laporan" },
  { key: "log-aktivitas", label: "Log Aktivitas", icon: "logAktivitas" }]

}];



const TITLE = {
  "dashboard": "Dashboard",
  "pesanan-online": "Pesanan Online",
  "penjualan-langsung": "Penjualan Langsung",
  "pembelian-bahan": "Pembelian Bahan",
  "produk": "Produk",
  "bahan-baku": "Bahan Baku",
  "user-karyawan": "User & Karyawan",
  "pelanggan-mgmt": "Pelanggan",
  "lap-penjualan": "Laporan Penjualan",
  "lap-pembelian": "Laporan Pembelian",
  "lap-produk": "Laporan Produk",
  "lap-bahan-baku": "Laporan Bahan Baku",
  "log-aktivitas": "Log Aktivitas Sistem"
};

const STATUS_CLS = {
  Pending: "pending", Diproses: "diproses", Selesai: "selesai", Dibatalkan: "dibatalkan"
};


const IMPLEMENTED = new Set([
"dashboard", "pembelian-bahan", "pesanan-online", "penjualan-langsung",
"bahan-baku", "user-karyawan", "pelanggan-mgmt",
"lap-penjualan", "lap-pembelian", "lap-produk", "lap-bahan-baku",
"log-aktivitas", "produk"]
);


export default function AdminDashboard({ profile }) {
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem("gb_admin_page");
    return saved && IMPLEMENTED.has(saved) ? saved : "dashboard";
  });
  const [search, setSearch] = useState("");

  const navigate = (key) => {
    setPage(key);
    setSearch("");
    localStorage.setItem("gb_admin_page", key);
  };

  const handleNotifAction = (notif) => {
    if (notif.id_pesanan) {localStorage.setItem("gb_open_pesanan", String(notif.id_pesanan));navigate("pesanan-online");} else
    if (notif.id_produk) navigate("produk");else
    if (notif.id_bahan) navigate("bahan-baku");
  };

  const handleAlertClick = (item) => {if (item.navKey) navigate(item.navKey);};

  const { stats, pesananTerbaru, alertBB, alertProduk, loading, error, lastUpdated } = useAdminDashboard();
  const { sorted: pesananSorted, sortKey, sortDir, toggleSort } = useSortableTable(pesananTerbaru);
  const { alerts: importantAlerts, loading: alertsLoading } = useImportantAlerts("Admin");

  const headerRight =
  <Suspense fallback={null}>
      {page === "pesanan-online" && <PesananSearchBar value={search} onChange={setSearch} />}
      {page === "penjualan-langsung" && <PenjualanSearchBar value={search} onChange={setSearch} />}
      {page === "pembelian-bahan" && <PembelianSearchBar value={search} onChange={setSearch} />}
      {page === "produk" && <ProdukSearchBar value={search} onChange={setSearch} />}
      {page === "bahan-baku" && <BahanBakuSearchBar value={search} onChange={setSearch} />}
      {page === "user-karyawan" && <UserSearchBar value={search} onChange={setSearch} />}
      {page === "pelanggan-mgmt" && <PelangganSearchBar value={search} onChange={setSearch} />}
      {page === "lap-penjualan" && <LaporanSearchBar value={search} onChange={setSearch} />}
      {page === "lap-pembelian" && <LaporanPembelianSearchBar value={search} onChange={setSearch} />}
      {page === "lap-produk" && <LaporanProdukSearchBar value={search} onChange={setSearch} />}
      {page === "lap-bahan-baku" && <LaporanBahanBakuSearchBar value={search} onChange={setSearch} />}
      {page === "log-aktivitas" && <LogSearchBar value={search} onChange={setSearch} />}
    </Suspense>;


  return (
    <div>
    <ImportantAlertsPopUp alerts={importantAlerts} loading={alertsLoading} />
    <DashboardLayout
        profile={profile}
        title={TITLE[page] ?? "Dashboard"}
        navItems={NAV}
        activePage={page}
        onNavigate={navigate}
        headerRight={headerRight}
        onNotifAction={handleNotifAction}>
        
      {}
      {page === "dashboard" &&
        <>
          {error && <p className="db-fetch-error">{error}</p>}
          <div className="db-stats">
            <StatCard value={loading ? "…" : stats?.omset} label="Omset Hari Ini" />
            <StatCard value={loading ? "…" : stats?.transaksi} label="Transaksi Hari Ini" />
            <StatCard value={loading ? "…" : stats?.pesananPending} label="Pesanan Online Pending" />
            <StatCard value={loading ? "…" : stats?.produkTerjual} label="Produk Terjual" />
          </div>
          <div className="db-card">
            <div className="db-card-header">
              <h2>Pesanan Online Terbaru</h2>
              <RealtimeBadge lastUpdated={lastUpdated} loading={loading && !!lastUpdated} />
            </div>
            {loading && !lastUpdated ?
            <p className="db-loading-text">Memuat…</p> :

            <div className="overflow-x-auto">
<div className="db-table-wrap"><div className="db-table-wrap"><table className="db-table">
                <thead>
                  <tr>
                    <SortableTh label="No. Pesanan" colKey="id" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="Pelanggan" colKey="pelanggan" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="Tanggal" colKey="tanggalRaw" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="Total" colKey="totalRaw" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="Status" colKey="status" type="enum" enumMap={ENUM_MAPS.status_pesanan} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pesananSorted.length === 0 ?
                      <tr><td colSpan={6} className="text-sm text-gray-500">Tidak ada data.</td></tr> :
                      pesananSorted.map((p) => {
                        const hl = p.highlight ?? {};
                        return (
                          <tr key={p.id} style={hl.rowBg ? { background: hl.rowBg } : undefined}>
                          <td>{p.id}</td><td>{p.pelanggan}</td><td>{p.tanggal}</td><td>{p.total}</td>
                          <td>
                            <span className={`db-badge ${STATUS_CLS[p.status]}`}>{p.status}</span>
                            {hl.badgeText &&
                              <span style={{ marginLeft: 6, background: hl.badgeColor, color: "#fff",
                                borderRadius: 4, padding: "1px 6px", fontSize: ".7rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                                {hl.badgeText}
                              </span>
                              }
                          </td>
                          <td><button className="db-action-link" onClick={() => {
                                localStorage.setItem("gb_open_pesanan", String(p.id));
                                navigate("pesanan-online");
                              }}>Detail</button></td>
                        </tr>);

                      })
                      }
                </tbody>
              </table>
        </div>
</div>
</div>
            }
          </div>
          <div className="db-col2">
            <div className="db-card">
              <h2>Alert Persediaan Bahan Baku</h2>
              {loading && !lastUpdated ? <p className="db-loading-text">Memuat…</p> : <AlertGrid items={alertBB} onItemClick={handleAlertClick} />}
            </div>
            <div className="db-card">
              <h2>Alert Persediaan Produk</h2>
              {loading && !lastUpdated ? <p className="db-loading-text">Memuat…</p> : <AlertGrid items={alertProduk} onItemClick={handleAlertClick} />}
            </div>
          </div>
        </>
        }

      <Suspense fallback={<p className="db-loading-text">Memuat…</p>}>
        {page === "pesanan-online" && <PesananOnlinePage search={search} />}
        {page === "penjualan-langsung" && <PenjualanLangsungPage search={search} />}
        {page === "pembelian-bahan" && <PembelianBahanPage search={search} />}
        {page === "produk" && <ProdukPage search={search} />}
        {page === "bahan-baku" && <BahanBakuPage search={search} />}
        {page === "user-karyawan" && <UserPage search={search} />}
        {page === "pelanggan-mgmt" && <PelangganPage search={search} />}
        {page === "lap-penjualan" && <LaporanPenjualanPage search={search} onSearchChange={setSearch} />}
        {page === "lap-pembelian" && <LaporanPembelianPage search={search} onSearchChange={setSearch} />}
        {page === "lap-produk" && <LaporanProdukPage search={search} />}
        {page === "lap-bahan-baku" && <LaporanBahanBakuPage search={search} />}
        {page === "log-aktivitas" && <LogAktivitasPage search={search} />}
      </Suspense>

      {!IMPLEMENTED.has(page) &&
        <div className="db-card">
          <p className="text-sm text-gray-500">
            Halaman <strong>{TITLE[page]}</strong> belum diimplementasi.
          </p>
        </div>
        }
    </DashboardLayout>
    </div>);

}