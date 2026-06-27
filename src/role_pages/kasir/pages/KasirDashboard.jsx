
import { useState, lazy, Suspense } from "react";
import DashboardLayout from "../../../shared/layouts/DashboardLayout";
import StatCard from "../../../shared/components/StatCard";
import AlertGrid from "../../../shared/components/AlertGrid";
import RealtimeBadge from "../../../shared/components/RealtimeBadge";
import { useKasirDashboard } from "../hooks/useKasirDashboard";
import { useImportantAlerts } from "../../../shared/hooks/useImportantAlerts";
import ImportantAlertsPopUp from "../../../shared/components/ImportantAlertsPopUp";
import { KasirPesananSearchBar } from "./KasirPesananOnlinePage";
import { KasirRiwayatSearchBar } from "./KasirRiwayatPenjualanPage";
import { KasirStokSearchBar } from "./KasirCekStokProdukPage";
import { PESANAN_BADGE } from "../../../shared/utils/badgeMaps";
import { useSortableTable, ENUM_MAPS } from "../../../shared/hooks/useSortableTable";
import SortableTh from "../../../shared/components/SortableTh";

const KasirPesananOnlinePage = lazy(() => import("./KasirPesananOnlinePage").then((m) => ({ default: m.default })));
const KasirInputPenjualanPage = lazy(() => import("./KasirInputPenjualanPage"));
const KasirRiwayatPenjualanPage = lazy(() => import("./KasirRiwayatPenjualanPage").then((m) => ({ default: m.default })));
const KasirCekStokProdukPage = lazy(() => import("./KasirCekStokProdukPage").then((m) => ({ default: m.default })));

const PageFallback = () => <p className="db-loading-text">Memuat…</p>;


const NAV = [
{ key: "dashboard", label: "Dashboard", icon: "dashboard" },
{ key: "pesanan-online", label: "Pesanan Online", icon: "pesanan" },
{ key: "penjualan-langsung", label: "Input Penjualan Langsung", icon: "penjualan" },
{ key: "riwayat-penjualan", label: "Riwayat Penjualan", icon: "riwayat" },
{ key: "cek-stok-produk", label: "Cek Stok Produk", icon: "cekStok" }];


const TITLE = {
  "dashboard": "Dashboard",
  "pesanan-online": "Pesanan Online",
  "penjualan-langsung": "Input Penjualan Langsung",
  "riwayat-penjualan": "Riwayat Penjualan",
  "cek-stok-produk": "Stok Produk"
};

const KASIR_PAGES = new Set(Object.keys(TITLE));


export default function KasirDashboard({ profile }) {
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem("gb_kasir_page");
    return saved && KASIR_PAGES.has(saved) ? saved : "dashboard";
  });
  const [search, setSearch] = useState("");

  const navigate = (key) => {
    setPage(key);
    setSearch("");
    localStorage.setItem("gb_kasir_page", key);
  };

  const handleAlertClick = (item) => {if (item.navKey) navigate(item.navKey);};


  const handleNotifAction = (notif) => {
    if (notif.id_pesanan) {

      localStorage.setItem("gb_open_pesanan", String(notif.id_pesanan));
      navigate("riwayat-penjualan");
    } else if (notif.id_produk) {
      navigate("cek-stok-produk");
    }
  };

  const { stats, pesananTerbaru, alertProduk, loading, error, lastUpdated } = useKasirDashboard();
  const { sorted: pesananSorted, sortKey, sortDir, toggleSort } = useSortableTable(pesananTerbaru);
  const { alerts: importantAlerts, loading: alertsLoading } = useImportantAlerts("Kasir");


  const headerRight =
  <>
      {page === "pesanan-online" && <KasirPesananSearchBar value={search} onChange={setSearch} />}
      {page === "riwayat-penjualan" && <KasirRiwayatSearchBar value={search} onChange={setSearch} />}
      {page === "cek-stok-produk" && <KasirStokSearchBar value={search} onChange={setSearch} />}
    </>;


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
        onNotifAction={handleNotifAction}
        notifCount={alertProduk.length}>
        
      {}
      {page === "dashboard" &&
        <>
          {error && <p className="db-fetch-error">{error}</p>}

          <div className="db-stats">
            <StatCard value={loading ? "…" : stats?.omset} label="Omset Hari ini" />
            <StatCard value={loading ? "…" : stats?.transaksi} label="Transaksi Hari Ini" />
            <StatCard value={loading ? "…" : stats?.pesananPending} label="Pesanan Online Pending" />
            <StatCard value={loading ? "…" : stats?.produkTerjual} label="Produk Terjual Hari ini" />
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
                      <tr>
                      <td colSpan={6} className="text-sm text-gray-500">
                        Tidak ada pesanan terbaru.
                      </td>
                    </tr> :

                      pesananSorted.map((p) => {
                        const hl = p.highlight ?? {};
                        return (
                          <tr key={p.id} style={hl.rowBg ? { background: hl.rowBg } : undefined}>
                        <td className="font-medium">{p.id}</td>
                        <td>{p.pelanggan}</td>
                        <td>{p.tanggal}</td>
                        <td>{p.total}</td>
                        <td>
                          <span className={PESANAN_BADGE[p.status] ?? "badge-status normal"}>
                            {p.status}
                          </span>
                          {hl.badgeText &&
                              <span style={{ marginLeft: 6, background: hl.badgeColor, color: "#fff",
                                borderRadius: 4, padding: "1px 6px", fontSize: ".7rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                              {hl.badgeText}
                            </span>
                              }
                        </td>
                        <td>
                          <button
                                className="db-action-link"
                                onClick={() => {
                                  localStorage.setItem("gb_open_pesanan", String(p.id));
                                  navigate("pesanan-online");
                                }}>
                                
                            Detail
                          </button>
                        </td>
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

          <div className="db-card">
            <h2>Alert Persediaan Produk</h2>
            {loading && !lastUpdated ?
            <p className="db-loading-text">Memuat…</p> :

            <AlertGrid items={alertProduk} onItemClick={handleAlertClick} />
            }
          </div>
        </>
        }

      {}
      <Suspense fallback={<PageFallback />}>
        {page === "pesanan-online" && <KasirPesananOnlinePage search={search} />}
        {page === "penjualan-langsung" && <KasirInputPenjualanPage onNavigate={navigate} />}
        {page === "riwayat-penjualan" && <KasirRiwayatPenjualanPage search={search} />}
        {page === "cek-stok-produk" && <KasirCekStokProdukPage search={search} />}
      </Suspense>
    </DashboardLayout>
    </div>);

}