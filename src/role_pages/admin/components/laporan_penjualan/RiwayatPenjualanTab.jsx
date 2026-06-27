import { useState, useEffect } from "react";
import { useLaporanRiwayat } from "../../hooks/useLaporanPenjualan";
import { useEnums, sel } from "../../../../shared/hooks/useEnums";
import { todayWIB, fmtRp } from "../../../../shared/utils/format";
import { useSortableTable, ENUM_MAPS } from "../../../../shared/hooks/useSortableTable";
import SortableTh from "../../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../../shared/components/Pagination";
import { PESANAN_BADGE, PESANAN_LABEL } from "../../../../shared/utils/badgeMaps";

const JENIS_OPTS = [
{ value: "semua", label: "Semua" },
{ value: "langsung", label: "Penjualan Langsung" },
{ value: "segera_antar", label: "Segera Antar" },
{ value: "preorder", label: "Pre-Order" }];


const SUB_JENIS_OPTS = [
{ value: "", label: "Semua Online" },
{ value: "preorder", label: "Pre-Order" },
{ value: "segera_antar", label: "Segera Antar" }];



function renderItems(details) {
  if (!details?.length) return "-";
  const vis = details.slice(0, 2);
  const extra = details.length - 2;

  return (
    <span>
      {vis.map((d, i) =>
      <span key={i} style={{ display: "block", whiteSpace: "nowrap" }}>
          {d.produk?.nama_produk ?? "?"} ×{d.qty}
        </span>
      )}
      {extra > 0 && <span style={{ color: "#6b7280", fontSize: ".75rem" }}>+{extra} item</span>}
    </span>);

}


export default function RiwayatTab({ search }) {
  const { rows, loading, error, fetch } = useLaporanRiwayat();
  const { sorted: rowsSorted, sortKey, sortDir, toggleSort } = useSortableTable(rows);
  const { paged: rowsSortedPaged, page: tablePage, setPage: setTablePage, totalPages: tablePages } = usePaginatedTable(rowsSorted, 20);
  const { enums } = useEnums();
  const STATUS_OPTS = ["Semua", ...sel.statusPesanan(enums)];

  const [jenis, setJenis] = useState("semua");
  const [subJenis, setSubJenis] = useState("");
  const [status, setStatus] = useState("Semua");
  const [dari, setDari] = useState(todayWIB());
  const [sampai, setSampai] = useState(todayWIB());
  const [applied, setApplied] = useState({
    jenis: "semua", subJenis: "", status: "Semua", dari: todayWIB(), sampai: todayWIB()
  });

  useEffect(() => {fetch({ ...applied, search });}, [applied, search]);

  const handleFilter = () => setApplied({ jenis, subJenis, status, dari, sampai });
  const handleReset = () => {
    const t = todayWIB();
    setJenis("semua");setSubJenis("");setStatus("Semua");setDari(t);setSampai(t);
    setApplied({ jenis: "semua", subJenis: "", status: "Semua", dari: t, sampai: t });
  };

  return (
    <div>
      <div className="laporan-filter">
        <div style={{ fontWeight: 600, fontSize: ".875rem", marginBottom: ".75rem" }}>Filter Penjualan:</div>
        <div className="laporan-filter-row">
          <div className="form-field" style={{ margin: 0, minWidth: 220 }}>
            <label>Jenis Penjualan</label>
            <select value={jenis} onChange={(e) => {setJenis(e.target.value);setSubJenis("");}}>
              {JENIS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {jenis === "online" &&
          <div className="form-field" style={{ margin: 0, minWidth: 190 }}>
              <label>Tipe Online</label>
              <select value={subJenis} onChange={(e) => setSubJenis(e.target.value)}>
                {SUB_JENIS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          }
          <div className="form-field" style={{ margin: 0, minWidth: 160 }}>
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-field" style={{ margin: 0 }}>
            <label>Dari</label>
            <input type="date" value={dari} onChange={(e) => setDari(e.target.value)} />
          </div>
          <div className="form-field" style={{ margin: 0 }}>
            <label>Sampai</label>
            <input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} />
          </div>
          <button className="btn-primary"
          style={{ borderRadius: 6, alignSelf: "flex-end", height: 38, padding: "0 1.25rem" }}
          onClick={handleFilter} disabled={loading}>
            {loading ? "…" : "Filter"}
          </button>
          <button className="btn-secondary"
          style={{ borderRadius: 6, alignSelf: "flex-end", height: 38, padding: "0 1rem" }}
          onClick={handleReset} disabled={loading}>
            Reset
          </button>
        </div>
      </div>

      {error && <p className="db-fetch-error">{error}</p>}
      {loading && <p className="db-loading-text">Memuat…</p>}

      <div style={{ overflowX: "auto" }}>
        <div className="db-table-wrap"><div className="db-table-wrap"><table className="db-table" style={{ minWidth: 900 }}>
          <thead>
            <tr>

              <SortableTh label="No. Pesanan" colKey="no_pesanan" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Tanggal & Waktu" colKey="tanggal_raw" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Jenis" colKey="jenis" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Pelanggan / Kasir" colKey="pelanggan" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <th>Item</th>

              <SortableTh label="Qty" colKey="totalQty" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Total" colKey="total" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Pembayaran" colKey="pembayaran" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Status" colKey="status" type="enum" enumMap={ENUM_MAPS.status_pesanan} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            </tr>
          </thead>
          <tbody>
            {rowsSortedPaged.length === 0 && !loading &&
                <tr><td colSpan={9} style={{ color: "#6b7280", textAlign: "center", padding: "1.5rem" }}>Tidak ada data.</td></tr>
                }
            {rowsSortedPaged.map((r, i) =>
                <tr key={i}>
                <td style={{ fontWeight: 500 }}>{r.no_pesanan}</td>
                <td style={{ whiteSpace: "nowrap" }}>{r.tanggal}</td>
                <td>{r.jenis}</td>
                <td>{r.pelanggan}</td>
                <td>{renderItems(r.details)}</td>
                <td>{r.totalQty}</td>
                <td style={{ whiteSpace: "nowrap" }}>{fmtRp(r.total)}</td>
                <td>{r.pembayaran}</td>
                <td>
                  <span className={PESANAN_BADGE[r.status] ?? "badge-status normal"}>{PESANAN_LABEL[r.status] ?? r.status}</span>
                </td>
              </tr>
                )}
          </tbody>
        </table>
      <Pagination page={tablePage} totalPages={tablePages} onPageChange={setTablePage} />
</div>
</div>
      </div>
    </div>);

}