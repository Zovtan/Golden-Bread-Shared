import { useState, useEffect } from "react";
import { useLaporanPerubahan } from "../../hooks/useLaporanPenjualan";
import { todayWIB } from "../../../../shared/utils/format";
import { useSortableTable } from "../../../../shared/hooks/useSortableTable";
import SortableTh from "../../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../../shared/components/Pagination";
import SearchableSelect from "../../../../shared/components/SearchableSelect";

const JENIS_OPTS = [
{ value: "semua", label: "Semua" },
{ value: "langsung", label: "Penjualan Langsung" },
{ value: "segera_antar", label: "Segera Antar" },
{ value: "preorder", label: "Pre-Order" }];


const FIELD_OPTS = ["Semua", "Status", "Jenis Pembayaran", "Total", "Item Pesanan"];



export default function PerubahanTab({ search }) {
  const { rows, userList, loading, error, fetch, fetchUsers } = useLaporanPerubahan();

  const [jenis, setJenis] = useState("semua");
  const [field, setField] = useState("Semua");
  const [userId, setUserId] = useState("");
  const [dari, setDari] = useState(todayWIB());
  const [sampai, setSampai] = useState(todayWIB());
  const [applied, setApplied] = useState({ jenis: "semua", field: "Semua", userId: "", dari: todayWIB(), sampai: todayWIB() });

  useEffect(() => {fetchUsers();}, []);
  useEffect(() => {fetch({ ...applied, search });}, [applied, search]);

  const handleFilter = () => setApplied({ jenis, field, userId, dari, sampai });
  const handleReset = () => {
    const t = todayWIB();
    setJenis("semua");setField("Semua");setUserId("");setDari(t);setSampai(t);
    setApplied({ jenis: "semua", field: "Semua", userId: "", dari: t, sampai: t });
  };

  const { sorted: rowsSorted, sortKey, sortDir, toggleSort } = useSortableTable(rows);
  const { paged: rowsSortedPaged, page: tablePage, setPage: setTablePage, totalPages: tablePages } = usePaginatedTable(rowsSorted, 20);

  return (
    <div>
      <div className="laporan-filter">
        <div style={{ fontWeight: 600, fontSize: ".875rem", marginBottom: ".75rem" }}>Filter Penjualan:</div>
        <div className="laporan-filter-row">
          <div className="form-field" style={{ margin: 0, minWidth: 220 }}>
            <label>Jenis Penjualan</label>
            <select value={jenis} onChange={(e) => setJenis(e.target.value)}>
              {JENIS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="form-field" style={{ margin: 0, minWidth: 160 }}>
            <label>Field Diubah</label>
            <select value={field} onChange={(e) => setField(e.target.value)}>
              {FIELD_OPTS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="form-field" style={{ margin: 0, minWidth: 180 }}>
            <label>Diubah Oleh</label>
            <SearchableSelect
              value={userId}
              onChange={(v) => setUserId(v)}
              placeholder="Semua Staff"
              semua="Semua Staff"
              options={userList.map((u) => ({ value: u.id, label: u.role ? `${u.nama_lengkap} (${u.role})` : u.nama_lengkap }))} />
            
          </div>
          <div className="form-field" style={{ margin: 0 }}>
            <label>Dari</label>
            <input type="date" value={dari} onChange={(e) => setDari(e.target.value)} />
          </div>
          <div className="form-field" style={{ margin: 0 }}>
            <label>Sampai</label>
            <input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} />
          </div>
          <button
            className="btn-primary"
            style={{ borderRadius: 6, alignSelf: "flex-end", height: 38, padding: "0 1.25rem" }}
            onClick={handleFilter}
            disabled={loading}>
            
            {loading ? "…" : "Filter"}
          </button>
          <button
            className="btn-secondary"
            style={{ borderRadius: 6, alignSelf: "flex-end", height: 38, padding: "0 1rem" }}
            onClick={handleReset}
            disabled={loading}>
            
            Reset
          </button>
        </div>
      </div>

      {error && <p className="db-fetch-error">{error}</p>}
      {loading && <p className="db-loading-text">Memuat…</p>}

      <div style={{ overflowX: "auto" }}>
        <table className="db-table" style={{ minWidth: 860 }}>
          <thead>
            <tr>

              <SortableTh label="Tanggal & Waktu" colKey="tanggal_raw" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="No. Pesanan" colKey="no_pesanan" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Jenis" colKey="jenis" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Field Diubah" colKey="field" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Nilai Sebelum" colKey="sebelum" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Nilai Sesudah" colKey="sesudah" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Diubah Oleh" colKey="diubah_oleh" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            </tr>
          </thead>
          <tbody>
            {rowsSortedPaged.length === 0 && !loading &&
            <tr><td colSpan={7} style={{ color: "#6b7280", textAlign: "center", padding: "1.5rem" }}>Tidak ada data perubahan.</td></tr>
            }
            {rowsSortedPaged.map((r, i) => {
              const prevRow = rowsSortedPaged[i - 1];
              const isSub = i > 0 && prevRow?.no_pesanan === r.no_pesanan;
              return (
                <tr key={r.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{r.tanggal}</td>
                  <td style={{ fontWeight: isSub ? 400 : 500, color: isSub ? "#9ca3af" : undefined }}>
                    {isSub ? <span style={{ marginRight: 4, color: "#9ca3af" }}>↳</span> : null}{r.no_pesanan}
                  </td>
                  <td>{r.jenis}</td>
                  <td>{r.field}</td>
                  <td style={{ color: "#dc2626" }}>{r.sebelum}</td>
                  <td style={{ color: "#166534" }}>{r.sesudah}</td>
                  <td>{r.diubah_oleh}</td>
                </tr>);

            })}
          </tbody>
        </table>
      <Pagination page={tablePage} totalPages={tablePages} onPageChange={setTablePage} />
</div>
    </div>);

}