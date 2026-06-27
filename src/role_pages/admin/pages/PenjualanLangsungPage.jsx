import { useState } from "react";
import SearchBar from "../../../shared/components/SearchBar";
import { usePenjualanLangsung } from "../hooks/usePenjualanLangsung";
import TambahPenjualanModal from "../components/penjualan_langsung/TambahPenjualanModal";
import EditPenjualanModal from "../components/penjualan_langsung/EditPenjualanModal";
import DetailPenjualanModal from "../components/penjualan_langsung/DetailPenjualanModal";
import RiwayatEditModal from "../components/penjualan_langsung/RiwayatEditModal";
import RealtimeBadge from "../../../shared/components/RealtimeBadge";
import { fmtRpCompact } from "../../../shared/utils/format";
import { useSortableTable } from "../../../shared/hooks/useSortableTable";
import SortableTh from "../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../shared/components/Pagination";


export default function PenjualanLangsungPage({ search = "" }) {
  const [filterKasir, setFilterKasir] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [filterApplied, setFilterApplied] = useState({ kasir: "", tanggal: "" });

  const {
    list, kasirList, produkList, jenisBayarList,
    stats, loading, error, lastUpdated, editedIds,
    tambahPenjualan, editPenjualan
  } = usePenjualanLangsung({
    search,
    filterKasir: filterApplied.kasir,
    filterTanggal: filterApplied.tanggal
  });

  const { sorted: listSorted, sortKey, sortDir, toggleSort } = useSortableTable(list);
  const { paged: listPaged, page: tablePage, setPage: setTablePage, totalPages: tablePages } = usePaginatedTable(listSorted, 20);

  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const openModal = (name, row = null) => {setSelected(row);setModal(name);};
  const closeModal = () => {setModal(null);setSelected(null);};


  const [riwayatItem, setRiwayatItem] = useState(null);

  const renderItemSummary = (details) => {
    if (!details?.length) return "-";
    const visible = details.slice(0, 2);
    const extra = details.length - 2;
    return (
      <span>
        {visible.map((d, i) =>
        <span key={i} style={{ display: "block", whiteSpace: "nowrap" }}>
            {d.produk?.nama_produk ?? "?"} × {d.qty}
          </span>
        )}
        {extra > 0 && <span style={{ color: "#6b7280", fontSize: ".75rem" }}>+{extra} item</span>}
      </span>);

  };



  return (
    <div>
      {}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {[
        { label: "Omset penjualan hari ini", value: fmtRpCompact(stats.omset), big: true },
        { label: "Transaksi hari ini", value: stats.transaksiHariIni },
        { label: "Produk terjual hari ini", value: stats.produkTerjual }].
        map((s, i) =>
        <div key={i} className="db-card" style={{ flex: "1 1 160px", padding: "1rem 1.25rem", textAlign: "center", marginBottom: 0 }}>
            <div style={{ fontSize: s.big ? "1.5rem" : "2rem", fontWeight: 700, color: "#111827" }}>{s.value}</div>
            <div style={{ fontSize: ".8125rem", color: "#6b7280", marginTop: 4 }}>{s.label}</div>
          </div>
        )}
      </div>

      {}
      <div className="db-card">
        <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: ".875rem", fontWeight: 600, marginBottom: ".875rem" }}>Filter Pesanan:</div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div className="form-field" style={{ minWidth: 200, margin: 0 }}>
                <label>Kasir</label>
                <select value={filterKasir} onChange={(e) => setFilterKasir(e.target.value)}>
                  <option value="">Semua</option>
                  {kasirList.map((k) => <option key={k.id} value={k.id}>{k.nama_lengkap}</option>)}
                </select>
              </div>
              <div className="form-field" style={{ minWidth: 220, margin: 0 }}>
                <label>Tanggal:</label>
                <input type="date" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} />
              </div>
              <button className="btn-primary" onClick={() => setFilterApplied({ kasir: filterKasir, tanggal: filterTanggal })}>Filter</button>
              <button className="btn-secondary" onClick={() => {setFilterKasir("");setFilterTanggal("");setFilterApplied({ kasir: "", tanggal: "" });}}>Reset</button>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
            <RealtimeBadge lastUpdated={lastUpdated} loading={loading && !!lastUpdated} />
            <button className="btn-primary" onClick={() => openModal("tambah")}>Tambah Penjualan</button>
          </div>
        </div>

        {error && <p className="db-fetch-error">{error}</p>}
        {loading && !lastUpdated && <p className="db-loading-text">Memuat…</p>}

        <div style={{ overflowX: "auto" }}>
          <div className="db-table-wrap"><table className="db-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <SortableTh label="No. Pesanan" colKey="no_pesanan" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="Tanggal & Waktu" colKey="waktu" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="Kasir" colKey="kasir_nama" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <th>Item</th>
                <SortableTh label="Qty" colKey="totalQty" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="Total" colKey="total" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="Pembayaran" colKey="pembayaran" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {listPaged.length === 0 && !loading &&
                <tr><td colSpan={8} style={{ color: "#6b7280", textAlign: "center", padding: "1.5rem" }}>Tidak ada data penjualan.</td></tr>
                }
              {listPaged.map((row) => {
                  const isEdited = editedIds.has(row.id_penjualan);
                  return (
                    <tr key={row.id_penjualan} style={{ ...(isEdited ? { background: "#fefce8" } : {}) }}>
                  <td style={{ fontWeight: 500 }}>{row.no_pesanan}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{row.waktu_fmt}</td>
                  <td>{row.kasir_nama}</td>
                  <td>{renderItemSummary(row.details)}</td>
                  <td style={{ textAlign: "center" }}>{row.totalQty}</td>
                  <td style={{ whiteSpace: "nowrap", fontWeight: 500 }}>{row.total_fmt}</td>
                  <td>{row.pembayaran}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="db-action-link" style={{ marginRight: 6 }} onClick={() => openModal("edit", row)}>Edit</button>
                    <span style={{ color: "#d1d5db" }}>/</span>
                    {editedIds.has(row.id_penjualan) &&
                        <>
                        <button className="db-action-link" style={{ marginLeft: 6, marginRight: 6 }} onClick={() => setRiwayatItem(row)}>Riwayat</button>
                        <span style={{ color: "#d1d5db" }}>/</span>
                      </>
                        }
                    <button className="db-action-link" style={{ marginLeft: 6 }} onClick={() => openModal("detail", row)}>Detail</button>
                  </td>
                </tr>);
                })}
            </tbody>
          </table>
          <Pagination page={tablePage} totalPages={tablePages} onPageChange={setTablePage} />
          </div>
        </div>
      </div>

      <TambahPenjualanModal
        open={modal === "tambah"} onClose={closeModal}
        kasirList={kasirList} produkList={produkList}
        jenisBayarList={jenisBayarList} onSubmit={tambahPenjualan} />
      
      <EditPenjualanModal
        open={modal === "edit"} onClose={closeModal}
        penjualan={selected} kasirList={kasirList}
        produkList={produkList} jenisBayarList={jenisBayarList}
        onSubmit={editPenjualan} />
      
      <DetailPenjualanModal
        open={modal === "detail"} onClose={closeModal}
        penjualan={selected} produkList={produkList} />
      
      <RiwayatEditModal
        open={!!riwayatItem}
        onClose={() => setRiwayatItem(null)}
        id_penjualan={riwayatItem?.id_penjualan}
        no_pesanan={riwayatItem?.no_pesanan} />
      
    </div>);

}

export function PenjualanSearchBar({ value, onChange }) {
  return (
    <SearchBar value={value} onChange={onChange} placeholder="Cari no. pesanan / kasir / produk..." />);

}