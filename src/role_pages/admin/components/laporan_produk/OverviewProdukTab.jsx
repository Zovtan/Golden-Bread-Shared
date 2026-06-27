import { useState, useEffect } from "react";

import { useOverviewProduk } from "../../hooks/useLaporanProduk";
import { useEnums, sel } from "../../../../shared/hooks/useEnums";
import { fmtDate, fmtDateTime, fmtRp } from "../../../../shared/utils/format";
import { useSortableTable, ENUM_MAPS } from "../../../../shared/hooks/useSortableTable";
import { useExpandedRows } from "../../../../shared/hooks/useExpandedRows";
import SortableTh from "../../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../../shared/components/Pagination";
import { rowHl, batchRowHl } from "../../../../shared/utils/rowHighlight";
import { STOK_BADGE_SM, KDL_BADGE } from "../../../../shared/utils/badgeMaps";
import SearchableSelect from "../../../../shared/components/SearchableSelect";

const STATUS_OPTS = ["Semua", "Normal", "Menipis", "Habis"];


export default function OverviewProdukTab({ search = "" }) {
  const { rows, stats, loading, error, fetch } = useOverviewProduk();
  const { enums } = useEnums();
  const KDL_OPTS = ["Semua", ...sel.statusKadaluarsa(enums)];
  const [statusStok, setStatusStok] = useState("Semua");
  const [kadaluarsa, setKadaluarsa] = useState("Semua");
  const [kategori, setKategori] = useState("Semua");

  const handleFilter = () => fetch({ statusStok, kadaluarsa, kategori, search });
  const handleReset = () => {setStatusStok("Semua");setKadaluarsa("Semua");setKategori("Semua");fetch({ statusStok: "Semua", kadaluarsa: "Semua", kategori: "Semua", search });};

  useEffect(() => {fetch({ statusStok, kadaluarsa, kategori, search });}, [search]);

  const { expanded, toggleExpand } = useExpandedRows();

  const { sorted: rowsSorted, sortKey, sortDir, toggleSort } = useSortableTable(rows);
  const { paged: rowsSortedPaged, page: tablePage, setPage: setTablePage, totalPages: tablePages } = usePaginatedTable(rowsSorted, 20);

  return (
    <div>
      {}
      <div className="laporan-filter">
        <div style={{ fontWeight: 600, fontSize: ".875rem", marginBottom: ".75rem" }}>Filter Produk:</div>
        <div className="laporan-filter-row">
          <div className="form-field" style={{ margin: 0, minWidth: 150 }}>
            <label>Status Jlh. Stok</label>
            <select value={statusStok} onChange={(e) => setStatusStok(e.target.value)}>
              {STATUS_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="form-field" style={{ margin: 0, minWidth: 150 }}>
            <label>Kadaluarsa</label>
            <select value={kadaluarsa} onChange={(e) => setKadaluarsa(e.target.value)}>
              {KDL_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="form-field" style={{ margin: 0, minWidth: 180 }}>
            <label>Kategori</label>
            <SearchableSelect
              value={kategori === "Semua" ? "" : kategori}
              onChange={(v) => setKategori(v || "Semua")}
              placeholder="Semua Kategori"
              options={sel.produkKategori(enums).map((o) => ({ value: o, label: o }))} />
            
          </div>
          <button className="btn-primary" style={{ alignSelf: "flex-end", height: 38, padding: "0 1.25rem", borderRadius: 6 }} onClick={handleFilter} disabled={loading}>
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
              {s.list.slice(0, 2).map((p) => p.nama_produk).join(", ")}
              {s.list.length > 2 ? `, +${s.list.length - 2} lainnya` : ""}
              {s.list.length === 0 && "Semua Produk Normal"}
            </div>
          </div>
        )}
      </div>

      {error && <p className="db-fetch-error">{error}</p>}
      {loading && <p className="db-loading-text">Memuat…</p>}

      <div className="produk-table-wrap db-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="db-table-wrap"><table className="produk-table">
          <thead><tr>

            <SortableTh label="ID Produk" colKey="id_produk" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Nama Produk" colKey="nama_produk" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Kategori" colKey="kategori_produk" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Harga Satuan" colKey="harga_satuan" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <th>Batch</th>

            <SortableTh label="Tgl Produksi (Terawal)" colKey="tglProdTerawal" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Ttl. Stok Valid (Pcs)" colKey="totalStok" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Status Produk" colKey="status" type="enum" enumMap={ENUM_MAPS.status_produk} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Status Jlh. Stok" colKey="statusStokAgg" type="enum" enumMap={ENUM_MAPS.status_stok} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Kadaluarsa (Terawal)" colKey="kdlTerawal" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Ada Kadaluarsa?" colKey="adaKdl" type="enum" enumMap={ENUM_MAPS.ada_kadaluarsa} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

          </tr></thead>
          <tbody>
            {rowsSortedPaged.length === 0 && !loading &&
              <tr><td colSpan={11} style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem" }}>Tidak ada data.</td></tr>
              }
            {rowsSortedPaged.map((p) => [
              <tr style={rowHl(p.statusStokAgg, p.adaKdl)} key={`p-${p.id_produk}`}>
                <td style={{ fontFamily: "monospace" }}>{p.id_produk}</td>
                <td style={{ fontWeight: 500 }}>{p.nama_produk}</td>
                <td>{p.kategori_produk ?? "-"}</td>
                <td style={{ whiteSpace: "nowrap" }}>{fmtRp(p.harga_satuan)}</td>
                <td>
                  {p.batches.length > 0 ?
                  <button className="batch-toggle-btn" onClick={() => toggleExpand(p.id_produk)}>
                        {p.batches.length} Batch {expanded.has(p.id_produk) ? "▲" : "▼"}
                      </button> :
                  <span style={{ color: "#9ca3af" }}>-</span>}
                </td>
                <td>{fmtDate(p.tglProdTerawal)}</td>
                <td style={{ textAlign: "center" }}>{p.totalStok}</td>
                <td><span className={STOK_BADGE_SM[p.status] ?? ""}>{p.status}</span></td>
                <td><span className={STOK_BADGE_SM[p.statusStokAgg] ?? "badge-status normal"}>{p.statusStokAgg}</span></td>
                <td>{fmtDate(p.kdlTerawal)}</td>
                <td><span className={KDL_BADGE[p.adaKdl] ?? "badge-status normal"}>{p.adaKdl}</span></td>
              </tr>,
              ...(expanded.has(p.id_produk) ? p.batches.map((b) =>
              <tr style={batchRowHl(b.status_stok, b.status_kadaluarsa)} key={`b-${b.id_batch}`} className="sub-row">
                  <td><span style={{ color: "#9ca3af" }}>↳</span></td>
                  <td /><td /><td /><td />
                  <td style={{ fontWeight: 500 }}>{b.id_batch}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(b.tgl_produksi)}</td>
                  <td style={{ textAlign: "center" }}>{b.stok}</td>
                  <td />
                  <td><span className={STOK_BADGE_SM[b.status_stok] ?? "badge-status normal"}>{b.status_stok}</span></td>
                  <td>{fmtDate(b.kadaluarsa)}</td>
                  <td><span className={KDL_BADGE[b.status_kadaluarsa] ?? "badge-status normal"}>{b.status_kadaluarsa}</span></td>
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