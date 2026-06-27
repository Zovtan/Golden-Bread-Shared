import { useState, useEffect } from "react";

import { usePembelianTerbanyak } from "../../hooks/useLaporanPembelian";
import { todayWIB, fmtRp } from "../../../../shared/utils/format";
import { useSortableTable } from "../../../../shared/hooks/useSortableTable";
import SortableTh from "../../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../../shared/components/Pagination";
import SearchableSelect from "../../../../shared/components/SearchableSelect";

const PERINGKAT_OPTS = [5, 10, 20, 50];


export default function TerbanyakTab() {
  const { rows, jenisBahanList, supplierList, loading, error, fetch, fetchRef } = usePembelianTerbanyak();

  const [peringkat, setPeringkat] = useState(5);
  const [idJenisBahan, setIdJenisBahan] = useState("");
  const [idSupplier, setIdSupplier] = useState("");
  const [dari, setDari] = useState(todayWIB());
  const [sampai, setSampai] = useState(todayWIB());
  const [applied, setApplied] = useState({ peringkat: 5, namaJenisBahan: "", idSupplier: "", dari: todayWIB(), sampai: todayWIB() });

  useEffect(() => {
    fetchRef();
    fetch(applied);
  }, [applied]);

  const handleFilter = () => setApplied({ peringkat: Number(peringkat), namaJenisBahan: idJenisBahan, idSupplier, dari, sampai });
  const handleReset = () => {
    const t = todayWIB();

    setPeringkat(5);setIdJenisBahan("");setIdSupplier("");setDari(t);setSampai(t);
    setApplied({ peringkat: 5, namaJenisBahan: "", idSupplier: "", dari: t, sampai: t });
  };

  const { sorted: rowsSorted, sortKey, sortDir, toggleSort } = useSortableTable(rows);
  const { paged: rowsSortedPaged, page: tablePage, setPage: setTablePage, totalPages: tablePages } = usePaginatedTable(rowsSorted, 20);

  return (
    <div>
      <div className="laporan-filter">
        <div style={{ fontWeight: 600, fontSize: ".875rem", marginBottom: ".75rem" }}>Filter Pembelian:</div>
        <div className="laporan-filter-row" style={{ flexWrap: "wrap" }}>
          <div className="form-field" style={{ margin: 0, minWidth: 150 }}>
            <label>Peringkat</label>
            <select value={peringkat} onChange={(e) => setPeringkat(e.target.value)}>
              {PERINGKAT_OPTS.map((n) => <option key={n} value={n}>{n} Terbanyak</option>)}
            </select>
          </div>
          <div className="form-field" style={{ margin: 0, minWidth: 190 }}>
            <label>Jenis Bahan</label>
            <SearchableSelect
              value={idJenisBahan}
              onChange={(v) => setIdJenisBahan(v)}
              placeholder="Semua Jenis"
              semua="Semua Jenis"
              options={jenisBahanList.map((j) => ({ value: j.nama_jenis, label: j.nama_jenis }))} />
            
          </div>
          <div className="form-field" style={{ margin: 0, minWidth: 210 }}>
            <label>Supplier</label>
            <SearchableSelect
              value={idSupplier}
              onChange={(v) => setIdSupplier(v)}
              placeholder="Semua Supplier"
              semua="Semua Supplier"
              options={supplierList.map((s) => ({ value: String(s.id_supplier), label: s.nama_supplier }))} />
            
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
        <table className="db-table" style={{ minWidth: 1050 }}>
          <thead>
            <tr>

              <SortableTh label="Peringkat" colKey="peringkat" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="ID Bahan" colKey="id_bahan" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Merek" colKey="merek" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Jenis Bahan" colKey="jenis_bahan" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Satuan" colKey="satuan" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Supplier" colKey="supplier" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Jumlah Transaksi" colKey="jmlTx" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Total Qty Dibeli" colKey="totalQty" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Rata-rata Qty Transaksi" colKey="avgQty" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Harga Beli Terakhir" colKey="hargaTerakhir" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Total Nilai Pembelian" colKey="totalNilai" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="% dari Total" colKey="persen" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            </tr>
          </thead>
          <tbody>
            {rowsSortedPaged.length === 0 && !loading &&
            <tr><td colSpan={12} style={{ color: "#6b7280", textAlign: "center", padding: "1.5rem" }}>Tidak ada data.</td></tr>
            }
            {rowsSortedPaged.map((r) =>
            <tr key={`${r.id_bahan}-${r.merek}`}>
                <td style={{ fontWeight: 600, textAlign: "center" }}>{r.peringkat}</td>
                <td>{r.id_bahan_fmt}</td>
                <td>{r.merek}</td>
                <td>{r.jenis_bahan}</td>
                <td>{r.satuan}</td>
                <td>{r.supplier}</td>
                <td>{r.jmlTx}</td>
                <td style={{ fontWeight: 600 }}>{r.totalQty}</td>
                <td>{r.rataRata}</td>
                <td style={{ whiteSpace: "nowrap" }}>{fmtRp(r.hargaTerakhir)}</td>
                <td style={{ whiteSpace: "nowrap", fontWeight: 500 }}>{fmtRp(r.totalNilai)}</td>
                <td>{r.persen}</td>
              </tr>
            )}
          </tbody>
        </table>
      <Pagination page={tablePage} totalPages={tablePages} onPageChange={setTablePage} />
</div>
    </div>);

}