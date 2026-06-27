import { useState, useEffect } from "react";
import { useBahanBermasalah } from "../../hooks/useLaporanBahanBaku";
import { useEnums, sel } from "../../../../shared/hooks/useEnums";
import { todayWIB } from "../../../../shared/utils/format";
import { useSortableTable } from "../../../../shared/hooks/useSortableTable";
import SortableTh from "../../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../../shared/components/Pagination";
import SearchableSelect from "../../../../shared/components/SearchableSelect";


export default function BahanBermasalahTab({ search = "" }) {
  const { rows, userList, merekList, jenisBahanList, loading, error, fetch, fetchRef } = useBahanBermasalah();
  const { enums } = useEnums();
  const jenisMasalahOpts = sel.jenisMasalahBahan(enums);

  const [jenisMasalah, setJenisMasalah] = useState("");
  const [userId, setUserId] = useState("");
  const [merek, setMerek] = useState("");
  const [jenisBahan, setJenisBahan] = useState("");
  const [dari, setDari] = useState(todayWIB());
  const [sampai, setSampai] = useState(todayWIB());
  const [applied] = useState({ jenisMasalah: "", userId: "", merek: "", jenisBahan: "", dari: todayWIB(), sampai: todayWIB() });

  useEffect(() => {fetchRef();}, []);
  useEffect(() => {fetch({ ...applied, search });}, [applied, search]);

  const handleFilter = () => fetch({ jenisMasalah, userId, merek, jenisBahan, dari, sampai, search });
  const handleReset = () => {
    const t = todayWIB();
    setJenisMasalah("");setUserId("");setMerek("");setJenisBahan("");setDari(t);setSampai(t);
    fetch({ search });
  };

  const { sorted: rowsSorted, sortKey, sortDir, toggleSort } = useSortableTable(rows);
  const { paged: rowsSortedPaged, page: tablePage, setPage: setTablePage, totalPages: tablePages } = usePaginatedTable(rowsSorted, 20);

  return (
    <div>
      <div className="laporan-filter">
        <div style={{ fontWeight: 600, fontSize: ".875rem", marginBottom: ".75rem" }}>Filter Bahan Bermasalah:</div>
        <div className="laporan-filter-row" style={{ flexWrap: "wrap" }}>

          <div className="form-field" style={{ margin: 0, minWidth: 180 }}>
            <label>Jenis Masalah</label>
            <SearchableSelect
              value={jenisMasalah}
              onChange={(v) => setJenisMasalah(v)}
              placeholder="Semua Jenis"
              semua="Semua Jenis"
              options={jenisMasalahOpts.map((j) => ({ value: j, label: j }))} />
            
          </div>

          <div className="form-field" style={{ margin: 0, minWidth: 180 }}>
            <label>Dicatat Oleh</label>
            <SearchableSelect
              value={userId}
              onChange={(v) => setUserId(v)}
              placeholder="Semua Staff"
              semua="Semua Staff"
              options={userList.map((u) => ({ value: u.id, label: u.role ? `${u.nama_lengkap} (${u.role})` : u.nama_lengkap }))} />
            
          </div>

          <div className="form-field" style={{ margin: 0, minWidth: 160 }}>
            <label>Jenis Bahan</label>
            <SearchableSelect
              value={jenisBahan}
              onChange={(v) => {setJenisBahan(v);setMerek("");}}
              placeholder="Semua Jenis"
              semua="Semua Jenis"
              options={jenisBahanList.map((j) => ({ value: j, label: j }))} />
            
          </div>

          <div className="form-field" style={{ margin: 0, minWidth: 160 }}>
            <label>Merek Bahan</label>
            <SearchableSelect
              value={merek}
              onChange={(v) => setMerek(v)}
              placeholder="Semua Merek"
              semua="Semua Merek"
              options={(jenisBahan ?
              merekList.filter(() => {
                const found = jenisBahanList.find((j) => j === jenisBahan);
                return found ? true : true;
              }) :
              merekList).
              map((m) => ({ value: m, label: m }))} />
            
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
          style={{ alignSelf: "flex-end", height: 38, padding: "0 1.25rem", borderRadius: 6 }}
          onClick={handleFilter} disabled={loading}>
            {loading ? "…" : "Filter"}
          </button>
          <button className="btn-secondary"
          style={{ alignSelf: "flex-end", height: 38, padding: "0 1rem", borderRadius: 6 }}
          onClick={handleReset} disabled={loading}>
            Reset
          </button>
        </div>
      </div>

      {error && <p className="db-fetch-error">{error}</p>}
      {loading && <p className="db-loading-text">Memuat…</p>}

      <div style={{ overflowX: "auto" }}>
        <table className="db-table" style={{ minWidth: 1100 }}>
          <thead><tr>

            <SortableTh label="Tgl & Waktu" colKey="tanggal" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="ID Bahan" colKey="id_bahan" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Batch" colKey="id_batch" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="No. Pembelian" colKey="no_pembelian" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Merek" colKey="merek" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Jenis" colKey="jenis_bahan" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Tgl Masuk Batch" colKey="tgl_masuk" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Jumlah" colKey="jumlah" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Satuan" colKey="satuan" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Jenis Masalah" colKey="jenis_masalah" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Keterangan" colKey="keterangan" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Dicatat Oleh" colKey="dicatat_oleh" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

          </tr></thead>
          <tbody>
            {rowsSortedPaged.length === 0 && !loading &&
            <tr><td colSpan={12} style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem" }}>Tidak ada data.</td></tr>
            }
            {rowsSortedPaged.map((r, i) =>
            <tr key={i}>
                <td style={{ whiteSpace: "nowrap", fontSize: ".8125rem" }}>{r.tanggal}</td>
                <td style={{ fontFamily: "monospace" }}>{r.id_bahan}</td>
                <td>{r.id_batch}</td>
                <td>{r.no_pembelian}</td>
                <td>{r.merek}</td>
                <td>{r.jenis_bahan}</td>
                <td>{r.tgl_masuk}</td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 500 }}>{r.jumlah}</td>
                <td>{r.satuan}</td>
                <td><span className="db-badge pending">{r.jenis_masalah}</span></td>
                <td style={{ maxWidth: 160, fontSize: ".8125rem" }}>{r.keterangan}</td>
                <td>{r.dicatat_oleh}</td>
              </tr>
            )}
          </tbody>
        </table>
      <Pagination page={tablePage} totalPages={tablePages} onPageChange={setTablePage} />
</div>
    </div>);

}