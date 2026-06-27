
import { useState, lazy, Suspense } from "react";
import DashboardLayout from "../../../shared/layouts/DashboardLayout";
import StatCard from "../../../shared/components/StatCard";
import AlertGrid from "../../../shared/components/AlertGrid";
import RealtimeBadge from "../../../shared/components/RealtimeBadge";
import { useProduksiDashboard } from "../hooks/useProduksiDashboard";
import { useImportantAlerts } from "../../../shared/hooks/useImportantAlerts";
import ImportantAlertsPopUp from "../../../shared/components/ImportantAlertsPopUp";
import { ProduksiStokSearchBar } from "./ProduksiStokBahanBakuPage";
import { useSortableTable } from "../../../shared/hooks/useSortableTable";
import SortableTh from "../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../shared/components/Pagination";

const ProduksiInputPemakaianPage = lazy(() => import("./ProduksiInputPemakaianPage"));
const ProduksiInputHasilPage = lazy(() => import("./ProduksiInputHasilPage"));
const ProduksiInputPembelianPage = lazy(() => import("./ProduksiInputPembelianPage"));
const ProduksiStokBahanBakuPage = lazy(() => import("./ProduksiStokBahanBakuPage").then((m) => ({ default: m.default })));

const PageFallback = () => <p className="db-loading-text">Memuat…</p>;


const NAV = [
{ key: "dashboard", label: "Dashboard", icon: "dashboard" },
{ key: "pemakaian-bahan", label: "Input Pemakaian Bahan", icon: "pemakaian" },
{ key: "hasil-produksi", label: "Input Hasil Produksi", icon: "hasilProduksi" },
{ key: "pembelian-bahan", label: "Input Pembelian Bahan", icon: "pembelian" },
{ key: "stok-bahan-baku", label: "Stok Bahan Baku", icon: "stok" }];


const TITLE = {
  "dashboard": "Dashboard",
  "pemakaian-bahan": "Input Pemakaian Bahan",
  "hasil-produksi": "Input Hasil Produksi",
  "pembelian-bahan": "Input Pembelian Bahan",
  "stok-bahan-baku": "Stok Bahan Baku"
};

const PAGES = new Set(Object.keys(TITLE));


export default function ProduksiDashboard({ profile }) {
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem("gb_produksi_page");
    return saved && PAGES.has(saved) ? saved : "dashboard";
  });
  const [search, setSearch] = useState("");

  const navigate = (key) => {
    setPage(key);
    setSearch("");
    localStorage.setItem("gb_produksi_page", key);
  };

  const handleAlertClick = (item) => {if (item.navKey) navigate(item.navKey);};


  const handleNotifAction = (notif) => {
    if (notif.id_bahan) {
      localStorage.setItem("gb_highlight_bahan", String(notif.id_bahan));
      navigate("stok-bahan-baku");
    }
  };

  const { stats, alertBB, aktivitasHariIni, loading, error, lastUpdated } = useProduksiDashboard();
  const { sorted: aktivitasSorted, sortKey, sortDir, toggleSort } = useSortableTable(aktivitasHariIni);
  const { paged: aktivitasPaged, page: aktPage, setPage: setAktPage, totalPages: aktPages } = usePaginatedTable(aktivitasSorted, 10);
  const { alerts: importantAlerts, loading: alertsLoading } = useImportantAlerts("Produksi");


  const headerRight =
  <>
      {page === "stok-bahan-baku" && <ProduksiStokSearchBar value={search} onChange={setSearch} />}
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
        onNotifAction={handleNotifAction}>
        
      {}
      {page === "dashboard" &&
        <>
          {error && <p className="db-fetch-error">{error}</p>}

          <div className="db-stats">
            <StatCard value={loading ? "…" : stats?.batchDiproduksi} label="Batch Diproduksi Hari ini" />
            <StatCard value={loading ? "…" : stats?.bahanHabis} label="Bahan Habis" />
            <StatCard value={loading ? "…" : stats?.bahanKadaluarsa} label="Bahan Kadaluarsa" />
            <StatCard value={loading ? "…" : stats?.bahanBermasalah} label="Bahan Bermasalah Hari Ini" />
          </div>

          <div className="db-card">
            <h2>Alert Persediaan Bahan Baku</h2>
            {loading && !lastUpdated ?
            <p className="db-loading-text">Memuat…</p> :
            <AlertGrid items={alertBB} onItemClick={handleAlertClick} />
            }
          </div>

          <div className="db-card">
            <div className="db-card-header">
              <h2>Aktivitas Produksi Hari Ini</h2>
              <RealtimeBadge lastUpdated={lastUpdated} loading={loading && !!lastUpdated} />
            </div>
            {loading && !lastUpdated ?
            <p className="db-loading-text">Memuat…</p> :

            <div className="overflow-x-auto">
<div className="db-table-wrap"><div className="db-table-wrap"><table className="db-table">
                  <thead>
                    <tr>
                      <SortableTh label="Waktu" colKey="waktuRaw" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                      <SortableTh label="Kegiatan" colKey="kegiatan" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                      <SortableTh label="Produk/Bahan" colKey="item" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                      <SortableTh label="Batch" colKey="batch" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                      <th>Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aktivitasPaged.length === 0 ?
                      <tr><td colSpan={5} className="text-sm text-gray-500">Belum ada aktivitas hari ini.</td></tr> :
                      aktivitasPaged.map((a, i) =>
                      <tr key={i}>
                            <td>{a.waktu}</td>
                            <td>{a.kegiatan}</td>
                            <td>{a.item}</td>
                            <td>{a.batch}</td>
                            <td>{a.jumlah}</td>
                          </tr>
                      )
                      }
                  </tbody>
                </table>
        </div>
</div>
        <Pagination page={aktPage} totalPages={aktPages} onPageChange={setAktPage} />
</div>

            }
          </div>
        </>
        }

      {}
      <Suspense fallback={<PageFallback />}>
        {page === "pemakaian-bahan" && <ProduksiInputPemakaianPage onNavigate={navigate} />}
        {page === "hasil-produksi" && <ProduksiInputHasilPage onNavigate={navigate} />}
        {page === "pembelian-bahan" && <ProduksiInputPembelianPage onNavigate={navigate} />}
        {page === "stok-bahan-baku" && <ProduksiStokBahanBakuPage search={search} />}
      </Suspense>
    </DashboardLayout>
    </div>);

}