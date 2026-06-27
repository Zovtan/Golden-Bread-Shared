import { useState, useEffect } from "react";

import { useOverviewBahan } from "../../hooks/useLaporanBahanBaku";
import { useEnums, sel } from "../../../../shared/hooks/useEnums";
import { fmtDate, fmtRp } from "../../../../shared/utils/format";
import { useSortableTable, ENUM_MAPS } from "../../../../shared/hooks/useSortableTable";
import { useExpandedRows } from "../../../../shared/hooks/useExpandedRows";
import SortableTh from "../../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../../shared/components/Pagination";
import { rowHl, batchRowHl } from "../../../../shared/utils/rowHighlight";
import { STOK_BADGE_SM, KDL_BADGE } from "../../../../shared/utils/badgeMaps";
import SearchableSelect from "../../../../shared/components/SearchableSelect";

const STOK_OPTS = ["Semua", "Normal", "Menipis", "Habis"];


export default function OverviewBahanTab({ search = "" }) {
  const { rows, stats, loading, error, fetch } = useOverviewBahan();
  const { enums } = useEnums();
  const KDL_OPTS = ["Semua", ...sel.statusKadaluarsa(enums)];
  const jenisList = ["Semua", ...sel.bahanJenis(enums)];
  const [statusStok, setStatusStok] = useState("Semua");
  const [kadaluarsa, setKadaluarsa] = useState("Semua");
  const [jenisBahan, setJenisBahan] = useState("Semua");

  const handleFilter = () => fetch({ statusStok, kadaluarsa, jenisBahan, search });
  const handleReset = () => {setStatusStok("Semua");setKadaluarsa("Semua");setJenisBahan("Semua");fetch({ statusStok: "Semua", kadaluarsa: "Semua", jenisBahan: "Semua", search });};


  useEffect(() => {fetch({ statusStok, kadaluarsa, jenisBahan, search });}, [search]);

  const { expanded, toggleExpand } = useExpandedRows();

  const { sorted: rowsSorted, sortKey, sortDir, toggleSort } = useSortableTable(rows);
  const { paged: rowsSortedPaged, page: tablePage, setPage: setTablePage, totalPages: tablePages } = usePaginatedTable(rowsSorted, 20);

  return (
    <div>
      <div className="laporan-filter">
        <div style={{ fontWeight: 600, fontSize: ".875rem", marginBottom: ".75rem" }}>Filter bahan Baku:</div>
        <div className="laporan-filter-row">
          <div className="form-field" style={{ margin: 0, minWidth: 150 }}>
            <label>Status Jlh. Stok</label>
            <select value={statusStok} onChange={(e) => setStatusStok(e.target.value)}>
              {STOK_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="form-field" style={{ margin: 0, minWidth: 150 }}>
            <label>Kadaluarsa</label>
            <select value={kadaluarsa} onChange={(e) => setKadaluarsa(e.target.value)}>
              {KDL_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="form-field" style={{ margin: 0, minWidth: 180 }}>
            <label>Jenis Barang</label>
            <SearchableSelect
              value={jenisBahan === "Semua" ? "" : jenisBahan}
              onChange={(v) => setJenisBahan(v || "Semua")}
              placeholder="Semua Jenis"
              options={jenisList.filter((j) => j !== "Semua").map((j) => ({ value: j, label: j }))} />
            
          </div>
          <button className="btn-primary" style={{ alignSelf: "flex-end", height: 38, padding: "0 1.25rem", borderRadius: 6 }}
          onClick={handleFilter} disabled={loading}>
            {loading ? "…" : "Filter"}
          </button>
          <button className="btn-secondary" style={{ alignSelf: "flex-end", height: 38, padding: "0 1.25rem", borderRadius: 6 }} onClick={handleReset} disabled={loading}>
            Reset
          </button>
        </div>
      </div>

      {}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, margin: "1rem 0" }}>
        {[
        { label: "Habis", list: stats.habis, cls: "habis" },
        { label: "Menipis", list: stats.menipis, cls: "mendekati" },
        { label: "Kadaluarsa", list: stats.kadaluarsa, cls: "habis" },
        { label: "Mendekati Kdl.", list: stats.mendekati, cls: "mendekati" }].
        map((s) =>
        <div key={s.label} className="db-card" style={{ padding: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: 700 }}>{s.list.length} {s.label}</div>
            <div style={{ fontSize: ".75rem", color: "#6b7280", marginTop: 4 }}>
              {s.list.slice(0, 2).map((b) => b.merek ?? b.jenis_bahan).join(", ")}
              {s.list.length > 2 && `, +${s.list.length - 2} lainnya`}
              {s.list.length === 0 && "Semua Normal"}
            </div>
          </div>
        )}
      </div>

      {error && <p className="db-fetch-error">{error}</p>}
      {loading && <p className="db-loading-text">Memuat…</p>}

      <div className="produk-table-wrap db-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="db-table-wrap"><table className="produk-table">
          <thead><tr>

            <SortableTh label="ID Bahan" colKey="id_bahan" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Merek" colKey="merek" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Jenis Barang" colKey="jenis_bahan" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Satuan" colKey="satuan" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <th>Batch</th>

            <SortableTh label="Harga Beli (Avg)" colKey="hargaAvg" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Tgl Masuk (Terawal)" colKey="tglMasukTerawal" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Ttl. Stok Valid" colKey="totalStok" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Status Bahan" colKey="status" type="enum" enumMap={ENUM_MAPS.status_bahan} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Status Jlh. Stok" colKey="statusStokAgg" type="enum" enumMap={ENUM_MAPS.status_stok} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Kadaluarsa (Terawal)" colKey="kdlTerawal" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Ada Kadaluarsa?" colKey="adaKdl" type="enum" enumMap={ENUM_MAPS.ada_kadaluarsa} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

          </tr></thead>
          <tbody>
            {rows.length === 0 && !loading &&
              <tr><td colSpan={12} style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem" }}>Tidak ada data.</td></tr>
              }
            {rowsSortedPaged.map((b) => [
              <tr style={rowHl(b.statusStokAgg, b.adaKdl)} key={`b-${b.id_bahan}`}>
                <td style={{ fontFamily: "monospace" }}>{b.id_bahan}</td>
                <td style={{ fontWeight: 500 }}>{b.merek ?? "-"}</td>
                <td>{b.jenis_bahan}</td>
                <td>{b.satuan}</td>
                <td>
                  {b.batches.length > 0 ?
                  <button className="batch-toggle-btn" onClick={() => toggleExpand(b.id_bahan)}>
                        {b.batches.length} Batch {expanded.has(b.id_bahan) ? "▲" : "▼"}
                      </button> :
                  <span style={{ color: "#9ca3af" }}>-</span>}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>{fmtRp(b.hargaAvg)}</td>
                <td>{fmtDate(b.tglMasukTerawal)}</td>
                <td style={{ textAlign: "center" }}>{b.totalStok}</td>
                <td><span className={STOK_BADGE_SM[b.status] ?? ""}>{b.status}</span></td>
                <td><span className={STOK_BADGE_SM[b.statusStokAgg] ?? "badge-status normal"}>{b.statusStokAgg}</span></td>
                <td>{fmtDate(b.kdlTerawal)}</td>
                <td><span className={KDL_BADGE[b.adaKdl] ?? "badge-status normal"}>{b.adaKdl}</span></td>
              </tr>,
              ...(expanded.has(b.id_bahan) ? b.batches.map((bt) =>
              <tr style={batchRowHl(bt.status_stok, bt.status_kadaluarsa)} key={`bt-${bt.id_batch_bb}`} className="sub-row">
                  <td><span style={{ color: "#9ca3af" }}>↳</span></td>
                  <td /><td /><td />
                  <td style={{ fontWeight: 500 }}>{bt.id_batch_bb}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{fmtRp(bt.harga_satuan)}</td>
                  <td>{fmtDate(bt.tgl_beli)}</td>
                  <td style={{ textAlign: "center" }}>{bt.stok}</td>
                  <td />
                  <td><span className={STOK_BADGE_SM[bt.status_stok] ?? "badge-status normal"}>{bt.status_stok}</span></td>
                  <td>{fmtDate(bt.kadaluarsa)}</td>
                  <td><span className={KDL_BADGE[bt.status_kadaluarsa] ?? "badge-status normal"}>{bt.status_kadaluarsa}</span></td>
                </tr>
              ) : [])]
              )}
          </tbody>
        </table>
        </div>
        <Pagination page={tablePage} totalPages={tablePages} onPageChange={setTablePage} />
      </div>
    </div>);

}