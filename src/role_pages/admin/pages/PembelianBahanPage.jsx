import { useState } from "react";
import SearchBar from "../../../shared/components/SearchBar";
import { usePembelianBahan } from "../hooks/usePembelianBahan";
import TambahPembelianModal from "../components/pembelian_bahan/TambahPembelianModal";
import EditPembelianModal from "../components/pembelian_bahan/EditPembelianModal";
import DetailPembelianModal from "../components/pembelian_bahan/DetailPembelianModal";
import EditSupplierModal from "../components/pembelian_bahan/EditSupplierModal";
import RealtimeBadge from "../../../shared/components/RealtimeBadge";
import { fmtRp, fmtRpCompact } from "../../../shared/utils/format";
import { useSortableTable, ENUM_MAPS } from "../../../shared/hooks/useSortableTable";
import { useExpandedRows } from "../../../shared/hooks/useExpandedRows";
import SortableTh from "../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../shared/components/Pagination";
import { PEMBAYARAN_BADGE } from "../../../shared/utils/badgeMaps";
import { useSubmitLock } from "../../../shared/hooks/useSubmitLock";


const STATUS_LABEL = { Lunas: "Lunas", Tempo: "Tempo", Belum: "Belum Bayar" };




export default function PembelianBahanPage({ search = "" }) {
  const {
    list, supplierList, bahanList,
    stats, loading, error, lastUpdated,
    statusOpt,
    filterStatus, setFilterStatus,
    filterTanggal, setFilterTanggal,
    applyFilter, resetFilter,
    tambahPembelian, editPembelian, tandaiLunas, editSupplier
  } = usePembelianBahan(search);

  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const { expanded, toggleExpand } = useExpandedRows();
  const guard = useSubmitLock();

  const openModal = (name, p = null) => {setSelected(p);setModal(name);};
  const closeModal = () => {setModal(null);setSelected(null);};

  const handleLunas = guard(async (p) => {
    setUpdatingId(p.id_pembelian);
    try {await tandaiLunas(p.id_pembelian);} finally
    {setUpdatingId(null);}
  });

  const { sorted: listSorted, sortKey, sortDir, toggleSort } = useSortableTable(list);
  const { paged: listSortedPaged, page: tablePage, setPage: setTablePage, totalPages: tablePages } = usePaginatedTable(listSorted, 20);

  return (
    <div>
      {}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {[
        { label: "Pembelian Hari Ini", value: fmtRpCompact(stats.nilaiHariIni) },
        { label: "Tagihan", value: stats.tagihan },
        { label: "Pembelian Hari ini", value: stats.jumlahHariIni }].
        map((s, i) =>
        <div key={i} className="db-card" style={{ flex: "1 1 160px", padding: "1rem 1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: i === 0 ? "1.5rem" : "2rem", fontWeight: 700, color: "#111827" }}>{s.value}</div>
            <div style={{ fontSize: ".8125rem", color: "#6b7280", marginTop: 4 }}>{s.label}</div>
          </div>
        )}
      </div>

      {}
      <div className="db-card" style={{ padding: "1rem 1.25rem", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 600, fontSize: ".9375rem", alignSelf: "center", minWidth: 130 }}>Filter Pembelian:</div>

          <div className="form-field" style={{ margin: 0, flex: "0 0 180px" }}>
            <label>Status:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              {statusOpt.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-field" style={{ margin: 0, flex: "0 0 220px" }}>
            <label>Tanggal & Waktu:</label>
            <input type="date" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} />
          </div>

          <button className="btn-primary" style={{ alignSelf: "flex-end" }}
          onClick={applyFilter}>
            Filter
          </button>
          <button className="btn-secondary" style={{ alignSelf: "flex-end" }}
          onClick={resetFilter}>
            Reset
          </button>

          <div style={{ flex: 1 }} />
          <RealtimeBadge lastUpdated={lastUpdated} loading={loading && !!lastUpdated} />
          {

          }
          <button className="btn-primary" style={{ alignSelf: "flex-end" }} onClick={() => openModal("edit-supplier")}>
            Edit Supplier
          </button>
          <button className="btn-primary" style={{ alignSelf: "flex-end" }} onClick={() => openModal("tambah")}>
            Tambah Pembelian
          </button>
        </div>
      </div>

      {error && <p className="db-fetch-error">{error}</p>}
      {loading && !lastUpdated && <p className="db-loading-text">Memuat…</p>}

      {}
      <div className="produk-table-wrap db-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="db-table-wrap"><table className="produk-table">
          <thead>
            <tr>

              <SortableTh label="No." colKey="id_pembelian" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="No. Faktur" colKey="no_faktur" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Tanggal & Waktu" colKey="tanggal_raw" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Bahan" colKey="nama_bahan" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Supplier" colKey="supplier" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Total Qty" colKey="total_qty" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Total" colKey="total" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Status" colKey="status_pembayaran" type="enum" enumMap={ENUM_MAPS.status_pembayaran} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Jatuh Tempo" colKey="jatuh_tempo" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <th>Aksi</th>

            </tr>
          </thead>
          <tbody>
            {listSortedPaged.length === 0 && !loading &&
              <tr><td colSpan={10} style={{ color: "#6b7280", textAlign: "center", padding: "1.5rem" }}>Tidak ada data pembelian.</td></tr>
              }
            {listSortedPaged.map((r) => {
                const isUpdating = updatingId === r.id_pembelian;
                const tempoUrgent = r.jatuh_tempo_status != null;
                const belumBayar = r.status_pembayaran === "Belum";
                const isExpanded = expanded.has(r.id_pembelian);
                const rowBg = belumBayar ? "#fff1f2" : tempoUrgent ? "#fef9ec" : undefined;
                return (
                  <>
                  <tr key={r.id_pembelian} style={rowBg ? { background: rowBg } : undefined}>
                    <td style={{ fontWeight: 500 }}>{r.id_pembelian}</td>
                    <td style={{ fontSize: ".8125rem", color: r.no_faktur ? "#111827" : "#9ca3af" }}>{r.no_faktur ?? "-"}</td>
                    <td style={{ whiteSpace: "nowrap", fontSize: ".8125rem" }}>{r.tanggal}</td>
                    <td>
                      <button type="button" onClick={() => toggleExpand(r.id_pembelian)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0,
                          display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit",
                          fontSize: ".875rem", color: "#111827", textAlign: "left" }}>
                        <span style={{ fontSize: ".7rem", color: "#6b7280" }}>{isExpanded ? "▾" : "▸"}</span>
                        <span>{r.nama_bahan.length > 40 ? r.nama_bahan.slice(0, 38) + "…" : r.nama_bahan}</span>
                        {r.details.length > 1 &&
                          <span style={{ fontSize: ".7rem", background: "#f3f4f6", color: "#6b7280",
                            borderRadius: 99, padding: "1px 6px", marginLeft: 2 }}>
                            {r.details.length}
                          </span>
                          }
                      </button>
                    </td>
                    <td>{r.supplier}</td>
                    <td style={{ textAlign: "center", fontWeight: 500 }}>{r.total_qty}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtRp(r.total)}</td>
                    <td>
                      <span className={PEMBAYARAN_BADGE[r.status_pembayaran] ?? ""}>
                        {STATUS_LABEL[r.status_pembayaran] ?? r.status_pembayaran}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap", fontSize: ".8125rem" }}>
                      {r.jatuh_tempo_fmt ?
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {r.jatuh_tempo_fmt}
                          {r.jatuh_tempo_status &&
                          <span style={{
                            background: r.jatuh_tempo_status.includes("!") ? "#dc2626" : "#d97706",
                            color: "#fff", borderRadius: 4, padding: "1px 6px", fontSize: ".75rem", fontWeight: 600
                          }}>
                              {r.jatuh_tempo_status}
                            </span>
                          }
                        </span> :
                        "-"}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {r.status_pembayaran !== "Lunas" &&
                        <>
                          <button className="db-action-link" style={{ color: "#16a34a" }}
                          disabled={isUpdating} onClick={() => handleLunas(r)}>
                            {isUpdating ? "…" : "Lunas"}
                          </button>
                          <span style={{ color: "#d1d5db", margin: "0 4px" }}>/</span>
                        </>
                        }
                      <button className="db-action-link" onClick={() => openModal("edit", r)}>Edit</button>
                      <span style={{ color: "#d1d5db", margin: "0 4px" }}>/</span>
                      <button className="db-action-link" onClick={() => openModal("detail", r)}>Detail</button>
                    </td>
                  </tr>
                  {isExpanded && r.details.map((d, di) =>
                    <tr key={`${r.id_pembelian}-d-${di}`}
                    style={{ background: rowBg ? rowBg : "#f9fafb", fontSize: ".8125rem" }}>
                      <td style={{ color: "#9ca3af", textAlign: "center" }}>↳</td>
                      <td colSpan={2} />
                      <td style={{ paddingLeft: ".5rem", color: "#374151" }}>
                        {d.merek ? `${d.merek} (${d.jenis_bahan})` : d.jenis_bahan}
                        <span style={{ color: "#9ca3af", marginLeft: 6 }}>{d.satuan}</span>
                      </td>
                      <td />
                      <td style={{ textAlign: "center", color: "#374151" }}>{d.qty}</td>
                      <td style={{ whiteSpace: "nowrap", color: "#6b7280" }}>{fmtRp(d.harga_satuan)}/sat</td>
                      <td colSpan={3} />
                    </tr>
                    )}
                </>);

              })}
          </tbody>
        </table>
</div>
      <Pagination page={tablePage} totalPages={tablePages} onPageChange={setTablePage} />
      </div>

      {}
      <TambahPembelianModal
        open={modal === "tambah"} onClose={closeModal}
        bahanList={bahanList} supplierList={supplierList}
        onSubmit={tambahPembelian} />
      
      <EditPembelianModal
        open={modal === "edit"} onClose={closeModal}
        pembelian={selected} bahanList={bahanList} supplierList={supplierList}
        onSubmit={editPembelian} />
      
      <DetailPembelianModal
        open={modal === "detail"} onClose={closeModal} pembelian={selected} />
      
      <EditSupplierModal
        open={modal === "edit-supplier"} onClose={closeModal}
        supplierList={supplierList} onSubmit={editSupplier} />
      
      {


      }
    </div>);

}

export function PembelianSearchBar({ value, onChange }) {
  return (
    <SearchBar value={value} onChange={onChange} placeholder="Cari no. pembelian / merek / supplier..." />);

}