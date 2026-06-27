import { useState, useEffect, Fragment } from "react";
import { useRiwayatPembelian } from "../../hooks/useLaporanPembelian";
import { useEnums, sel } from "../../../../shared/hooks/useEnums";
import { todayWIB, fmtRp } from "../../../../shared/utils/format";
import { useSortableTable, ENUM_MAPS } from "../../../../shared/hooks/useSortableTable";
import { useExpandedRows } from "../../../../shared/hooks/useExpandedRows";
import SortableTh from "../../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../../shared/components/Pagination";
import SearchableSelect from "../../../../shared/components/SearchableSelect";
import { PEMBAYARAN_BADGE } from "../../../../shared/utils/badgeMaps";
const STATUS_LABEL = { semua: "Semua", Lunas: "Lunas", Tempo: "Tempo", Belum: "Belum Bayar" };

export default function RiwayatPembelianTab({ search }) {
  const { rows, supplierList, loading, error, fetch, fetchSupplier } = useRiwayatPembelian();
  const { enums } = useEnums();
  const STATUS_OPTS = ["semua", ...sel.statusPembayaran(enums)];
  const JENIS_OPTS = ["", ...sel.bahanJenis(enums)];
  const [status, setStatus] = useState("semua");
  const [idSupplier, setIdSupplier] = useState("");
  const [jenisBarang, setJenisBarang] = useState("");
  const [dari, setDari] = useState(todayWIB());
  const [sampai, setSampai] = useState(todayWIB());
  const [applied, setApplied] = useState({ status: "semua", idSupplier: "", jenisBarang: "", dari: todayWIB(), sampai: todayWIB() });
  useEffect(() => {fetchSupplier();}, []);
  useEffect(() => {fetch({ ...applied, search });}, [applied, search]);

  const handleFilter = () => setApplied({ status, idSupplier, jenisBarang, dari, sampai });
  const handleReset = () => {
    const t = todayWIB();
    setStatus("semua");setIdSupplier("");setJenisBarang("");setDari(t);setSampai(t);
    setApplied({ status: "semua", idSupplier: "", jenisBarang: "", dari: t, sampai: t });
  };

  const { sorted: rowsSorted, sortKey, sortDir, toggleSort } = useSortableTable(rows);
  const { paged: rowsSortedPaged, page: tablePage, setPage: setTablePage, totalPages: tablePages } = usePaginatedTable(rowsSorted, 20);
  const { expanded, toggleExpand } = useExpandedRows();
  return (
    <div>
      <div className="laporan-filter">
        <div style={{ fontWeight: 600, fontSize: ".875rem", marginBottom: ".75rem" }}>Filter Pembelian:</div>
        <div className="laporan-filter-row">
          <div className="form-field" style={{ margin: 0, minWidth: 160 }}>
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <div className="form-field" style={{ margin: 0, minWidth: 200 }}>
            <label>Supplier</label>
            <SearchableSelect
              value={idSupplier}
              onChange={(v) => setIdSupplier(v)}
              placeholder="Semua Supplier"
              semua="Semua Supplier"
              options={supplierList.map((s) => ({ value: String(s.id_supplier), label: s.nama_supplier }))} />
            
          </div>
          <div className="form-field" style={{ margin: 0, minWidth: 180 }}>
            <label>Jenis Barang</label>
            <SearchableSelect
              value={jenisBarang}
              onChange={(v) => setJenisBarang(v)}
              placeholder="Semua Jenis"
              semua="Semua Jenis"
              options={JENIS_OPTS.filter(Boolean).map((j) => ({ value: j, label: j }))} />
            
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
              <SortableTh label="Status Pembayaran" colKey="status_pembayaran" type="enum" enumMap={ENUM_MAPS.status_pembayaran} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Jatuh Tempo" colKey="jatuh_tempo" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {rowsSortedPaged.length === 0 && !loading &&
              <tr><td colSpan={9} style={{ color: "#6b7280", textAlign: "center", padding: "1.5rem" }}>Tidak ada data.</td></tr>
              }
            {rowsSortedPaged.map((r) => {
                const isExpanded = expanded.has(r.id_pembelian);
                const belumBayar = r.status_pembayaran === "Belum";
                const tempoUrgent = r.jatuh_tempo_status != null;
                const rowBg = belumBayar ? "#fff1f2" : tempoUrgent ? "#fef9ec" : undefined;
                return (
                  <Fragment key={r.id_pembelian}>
                  <tr style={rowBg ? { background: rowBg } : undefined}>
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
                      {r.jatuh_tempo_fmt && r.jatuh_tempo_fmt !== "-" ?
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
                  </tr>
                  {isExpanded && r.details.map((d, di) =>
                    <tr key={`${r.id_pembelian}-d-${di}`}
                    style={{ background: rowBg ? rowBg : "#f9fafb", fontSize: ".8125rem" }}>
                      <td style={{ color: "#9ca3af", textAlign: "center" }}>↳</td>
                      <td colSpan={2} />
                      <td style={{ paddingLeft: ".5rem", color: "#374151" }}>
                        {d.merek && d.merek !== "-" ? `${d.merek} (${d.jenis_bahan})` : d.jenis_bahan}
                        <span style={{ color: "#9ca3af", marginLeft: 6 }}>{d.satuan}</span>
                      </td>
                      <td />
                      <td style={{ textAlign: "center", color: "#374151" }}>{d.qty}</td>
                      <td style={{ whiteSpace: "nowrap", color: "#6b7280" }}>{fmtRp(d.harga_satuan)}/sat</td>
                      <td colSpan={2} />
                    </tr>
                    )}
                </Fragment>);

              })}
          </tbody>
        </table>
        </div>
        <Pagination page={tablePage} totalPages={tablePages} onPageChange={setTablePage} />
      </div>
    </div>);

}