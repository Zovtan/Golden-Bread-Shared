import { useState, useEffect } from "react";
import { usePemakaianBahan } from "../../hooks/useLaporanBahanBaku";
import { useEnums, sel } from "../../../../shared/hooks/useEnums";
import { todayWIB } from "../../../../shared/utils/format";
import { labelBahan } from "../../../../shared/utils/bahanLabel";
import { useSortableTable, ENUM_MAPS } from "../../../../shared/hooks/useSortableTable";
import SortableTh from "../../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../../shared/components/Pagination";
import SearchableSelect from "../../../../shared/components/SearchableSelect";


export default function PemakaianBahanTab({ search = "" }) {
  const { rows, userList, bahanList, stats, loading, error, fetch, fetchRef } = usePemakaianBahan();
  const { enums } = useEnums();

  const [userId, setUserId] = useState("");
  const [idBahan, setIdBahan] = useState("");
  const [jenisBahan, setJenisBahan] = useState("");
  const [dari, setDari] = useState(todayWIB());
  const [sampai, setSampai] = useState(todayWIB());

  useEffect(() => {fetchRef();}, []);

  useEffect(() => {fetch({ userId, idBahan, jenisBahan, dari, sampai, search });}, [search]);

  const handleFilter = () => fetch({ userId, idBahan, jenisBahan, dari, sampai, search });
  const handleReset = () => {
    const t = todayWIB();
    setUserId("");setIdBahan("");setJenisBahan("");setDari(t);setSampai(t);
    fetch({ dari: t, sampai: t, search });
  };


  const filteredBahanList = jenisBahan ?
  bahanList.filter((b) => b.jenis_bahan === jenisBahan) :
  bahanList;

  const { sorted: rowsSorted, sortKey, sortDir, toggleSort } = useSortableTable(rows);
  const { paged: rowsSortedPaged, page: tablePage, setPage: setTablePage, totalPages: tablePages } = usePaginatedTable(rowsSorted, 20);

  return (
    <div>
      {}
      <div className="laporan-filter">
        <div style={{ fontWeight: 600, fontSize: ".875rem", marginBottom: ".75rem" }}>Filter Pemakaian Bahan Baku:</div>
        <div className="laporan-filter-row">
          <div className="form-field" style={{ margin: 0, minWidth: 170 }}>
            <label>Jenis Bahan</label>
            <SearchableSelect
              value={jenisBahan}
              onChange={(v) => {setJenisBahan(v);setIdBahan("");}}
              placeholder="Semua Jenis"
              semua="Semua Jenis"
              options={sel.bahanJenis(enums).map((j) => ({ value: j, label: j }))} />
            
          </div>
          <div className="form-field" style={{ margin: 0, minWidth: 200 }}>
            <label>Bahan Baku</label>
            <SearchableSelect
              value={idBahan}
              onChange={(v) => setIdBahan(v)}
              placeholder="Semua Bahan"
              semua="Semua Bahan"
              options={filteredBahanList.map((b) => ({
                value: String(b.id_bahan),
                label: labelBahan(b)
              }))} />
            
          </div>
          <div className="form-field" style={{ margin: 0, minWidth: 200 }}>
            <label>Dicatat Oleh</label>
            <SearchableSelect
              value={userId}
              onChange={(v) => setUserId(v)}
              placeholder="Semua User"
              semua="Semua User"
              options={userList.map((u) => ({ value: u.id, label: `${u.nama_lengkap} (${u.role})` }))} />
            
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
          style={{ alignSelf: "flex-end", height: 38, padding: "0 1.25rem", borderRadius: 6 }}
          onClick={handleReset} disabled={loading}>
            Reset
          </button>
        </div>
      </div>

      {}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, margin: "1rem 0" }}>
        {[
        { label: "Total Entri Pemakaian", value: stats.totalPemakaian },
        { label: "Total Jumlah Terpakai", value: stats.totalItem }].
        map((s) =>
        <div key={s.label} className="db-card" style={{ padding: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: ".75rem", color: "#6b7280", marginTop: 4 }}>{s.label}</div>
          </div>
        )}
      </div>

      {error && <p className="db-fetch-error">{error}</p>}
      {loading && <p className="db-loading-text">Memuat…</p>}

      {}
      <div className="db-table-wrap">
        <table className="db-table" style={{ minWidth: 780 }}>
          <thead>
            <tr>
              <SortableTh label="ID Pemakaian" colKey="id_pemakaian" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Tanggal" colKey="waktu" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Nama Bahan" colKey="nama_bahan" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Satuan" colKey="satuan" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Jumlah Terpakai" colKey="jumlah" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Batch" colKey="id_batch_bb" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Dicatat Oleh" colKey="pencatat" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Role" colKey="role" type="enum" enumMap={ENUM_MAPS.role} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {rowsSortedPaged.length === 0 && !loading &&
            <tr>
                <td colSpan={8} style={{ color: "#6b7280", textAlign: "center", padding: "1.5rem" }}>
                  Tidak ada data pemakaian.
                </td>
              </tr>
            }
            {rowsSortedPaged.map((r, i) =>
            <tr key={`${r.id_pemakaian}-${r.id_batch_bb}-${i}`}>
                <td style={{ fontWeight: 500 }}>#{r.id_pemakaian}</td>
                <td style={{ whiteSpace: "nowrap", fontSize: ".8125rem" }}>{r.waktu}</td>
                <td>{r.nama_bahan}</td>
                <td>{r.satuan}</td>
                <td style={{ textAlign: "center", fontWeight: 600 }}>{r.jumlah}</td>
                <td style={{ color: "#6b7280", fontSize: ".8125rem" }}>#{r.id_batch_bb}</td>
                <td>{r.pencatat}</td>
                <td>
                  <span className={
                r.role === "Admin" ? "badge-status aktif" :
                r.role === "Produksi" ? "badge-status normal" : ""
                }>
                    {r.role}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      <Pagination page={tablePage} totalPages={tablePages} onPageChange={setTablePage} />
</div>
    </div>);

}