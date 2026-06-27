import { useState, useEffect } from "react";
import SearchBar from "../../../shared/components/SearchBar";
import { useKasirRiwayatPenjualan } from "../hooks/useKasirRiwayatPenjualan";
import RealtimeBadge from "../../../shared/components/RealtimeBadge";
import DetailPenjualanKasirModal from "../components/DetailPenjualanKasirModal";
import EditPenjualanModal from "../../admin/components/penjualan_langsung/EditPenjualanModal";
import RiwayatEditModal from "../../admin/components/penjualan_langsung/RiwayatEditModal";
import { useSortableTable, ENUM_MAPS } from "../../../shared/hooks/useSortableTable";
import SortableTh from "../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../shared/components/Pagination";
import { PESANAN_BADGE, PESANAN_LABEL } from "../../../shared/utils/badgeMaps";


const JENIS_OPTS = [
{ value: "semua", label: "Semua" },
{ value: "langsung", label: "Penjualan Langsung" },
{ value: "segera_antar", label: "Segera Antar" },
{ value: "preorder", label: "Pre-Order" }];


const JENIS_BADGE = {
  Langsung: "badge-status normal",
  "Segera Antar": "badge-status aktif",
  "Pre-Order": "badge-status menipis"
};


export default function KasirRiwayatPenjualanPage({ search = "" }) {
  const {
    list, loading, error, lastUpdated,
    filterJenis, setFilterJenis,
    filterStatus, setFilterStatus,
    filterTanggalMulai, setFilterTanggalMulai,
    filterTanggalAkhir, setFilterTanggalAkhir,
    applyFilter, resetFilter,
    detail, loadingDetail, fetchDetail, clearDetail,
    editPenjualan, editLoading, editError, fetchEditData,
    editedIds, produkList, loadProduk,
    statusOpt
  } = useKasirRiwayatPenjualan(search);

  const [selectedItem, setSelectedItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editOpenLoading, setEditOpenLoading] = useState(false);
  const [riwayatItem, setRiwayatItem] = useState(null);

  const handleOpenEdit = async (item) => {
    setEditOpenLoading(true);
    try {
      await loadProduk();
      const rawData = await fetchEditData(item.no_pesanan);
      setEditItem(rawData);
    } catch {

    } finally {
      setEditOpenLoading(false);
    }
  };
  const handleCloseEdit = () => {setEditItem(null);setEditSuccess(false);};

  const handleEditSubmit = async (payload) => {
    await editPenjualan(payload);
    setEditSuccess(true);
    setTimeout(() => setEditSuccess(false), 3000);

    if (selectedItem && String(selectedItem.no_pesanan) === String(payload.id_penjualan)) {
      fetchDetail(selectedItem);
    }
  };


  useEffect(() => {
    const saved = localStorage.getItem("gb_open_pesanan");
    if (saved && list.length > 0) {
      const match = list.find((r) => r.no_pesanan === saved);
      if (match) {setSelectedItem(match);localStorage.removeItem("gb_open_pesanan");}
    }
  }, [list]);

  const { sorted: listSorted, sortKey, sortDir, toggleSort } = useSortableTable(list);
  const { paged: listPaged, page: tablePage, setPage: setTablePage, totalPages: tablePages } = usePaginatedTable(listSorted, 20);

  return (
    <div>
      {}
      <div className="db-card !p-4 !mb-4">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="text-[0.9375rem] font-semibold self-center min-w-[120px]">
            Filter Penjualan:
          </div>

          <div className="form-field !m-0 w-[200px]">
            <label>Jenis Penjualan</label>
            <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)}>
              {JENIS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="form-field !m-0 w-[160px]">
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              {statusOpt.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-field !m-0 w-[160px]">
            <label>Dari</label>
            <input type="date" value={filterTanggalMulai} onChange={(e) => setFilterTanggalMulai(e.target.value)} />
          </div>

          <div className="form-field !m-0 w-[160px]">
            <label>Sampai</label>
            <input type="date" value={filterTanggalAkhir} onChange={(e) => setFilterTanggalAkhir(e.target.value)} />
          </div>

          <button className="btn-primary self-end" onClick={applyFilter} disabled={loading}>
            {loading ? "…" : "Filter"}
          </button>

          <button className="btn-secondary self-end" onClick={resetFilter} disabled={loading}>
            Reset
          </button>

          <div className="flex-1" />
          <RealtimeBadge lastUpdated={lastUpdated} loading={loading && !!lastUpdated} />
        </div>
      </div>

      {error && <p className="db-fetch-error">{error}</p>}
      {loading && !lastUpdated && <p className="db-loading-text">Memuat…</p>}

      <div className="produk-table-wrap db-card !p-0 overflow-hidden">
        <div className="db-table-wrap"><table className="produk-table">
          <thead>
            <tr>

              <SortableTh label="No. Pesanan" colKey="no_pesanan" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Tanggal & Waktu" colKey="tanggal_raw" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Jenis" colKey="jenis" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Pelanggan / Kasir" colKey="pelanggan" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <th>Item</th>

              <SortableTh label="Qty" colKey="totalQty" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Total" colKey="total" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Pembayaran" colKey="pembayaran" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Status" colKey="status" type="enum" enumMap={ENUM_MAPS.status_pesanan} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <th>Aksi</th>

            </tr>
          </thead>
          <tbody>
            {listPaged.length === 0 && !loading &&
              <tr>
                <td colSpan={10} className="text-gray-500 text-center py-6">
                  Tidak ada data penjualan.
                </td>
              </tr>
              }
            {listPaged.map((r) =>
              <tr key={r.id} style={r.jenis === "Langsung" && editedIds.has(Number(r.no_pesanan)) ? { background: "#fefce8" } : undefined}>
                <td className="font-medium">{r.no_pesanan}</td>
                <td className="whitespace-nowrap text-[0.8125rem]">{r.tanggal}</td>
                <td>
                  <span className={JENIS_BADGE[r.jenisSub ?? r.jenis] ?? "badge-status normal"}>
                    {r.jenisSub ?? r.jenis}
                  </span>
                </td>
                <td>{r.pelanggan}</td>
                <td className="text-[0.8125rem]">
                  {r.items.map((item, i) => <div key={i}>{item}</div>)}
                  {r.itemsExtra > 0 && <div className="text-gray-500">+{r.itemsExtra} item</div>}
                </td>
                <td className="text-center">{r.totalQty}</td>
                <td className="whitespace-nowrap">{r.total_fmt}</td>
                <td className="whitespace-nowrap">{r.pembayaran}</td>
                <td>
                  <span className={PESANAN_BADGE[r.status] ?? "badge-status normal"}>{PESANAN_LABEL[r.status] ?? r.status}</span>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {r.jenis === "Langsung" &&
                  <>
                      <button className="db-action-link" style={{ marginRight: 6 }} onClick={() => handleOpenEdit(r)} disabled={editOpenLoading}>Edit</button>
                      <span style={{ color: "#d1d5db" }}>/</span>
                    </>
                  }
                  {r.jenis === "Langsung" && editedIds.has(Number(r.no_pesanan)) &&
                  <>
                      <button className="db-action-link" style={{ marginLeft: 6, marginRight: 6 }} onClick={() => setRiwayatItem(r)}>Riwayat</button>
                      <span style={{ color: "#d1d5db" }}>/</span>
                    </>
                  }
                  <button className="db-action-link" style={{ marginLeft: 6 }} onClick={() => {setSelectedItem(r);fetchDetail(r);}}>Detail</button>
                </td>
              </tr>
              )}
          </tbody>
        </table>
</div>
      <Pagination page={tablePage} totalPages={tablePages} onPageChange={setTablePage} />
      </div>

      {editSuccess && <p style={{ color: "#16a34a", fontSize: ".875rem", margin: ".5rem 0" }}>✓ Penjualan berhasil diubah.</p>}
      {editError && <p className="db-fetch-error">{editError}</p>}

      {editItem &&
      <EditPenjualanModal
        open={!!editItem}
        onClose={handleCloseEdit}
        penjualan={editItem}
        kasirList={[]}
        produkList={produkList}
        onSubmit={handleEditSubmit}
        loading={editLoading}
        hideKasirField />

      }

      <RiwayatEditModal
        open={!!riwayatItem}
        onClose={() => setRiwayatItem(null)}
        id_penjualan={riwayatItem ? Number(riwayatItem.no_pesanan) : null}
        no_pesanan={riwayatItem?.no_pesanan} />
      

      <DetailPenjualanKasirModal
        open={!!selectedItem}
        onClose={() => {setSelectedItem(null);clearDetail();}}
        item={selectedItem}
        detail={detail}
        loadingDetail={loadingDetail} />
      
    </div>);

}

export function KasirRiwayatSearchBar({ value, onChange }) {
  return (
    <SearchBar value={value} onChange={onChange} placeholder="Cari no. pesanan / nama / produk..." />);

}