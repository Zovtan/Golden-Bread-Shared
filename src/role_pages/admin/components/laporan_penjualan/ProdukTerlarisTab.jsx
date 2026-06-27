import { useState, useEffect } from "react";
import { useLaporanProdukTerlaris } from "../../hooks/useLaporanPenjualan";
import { todayWIB, fmtRp } from "../../../../shared/utils/format";
import { useSortableTable } from "../../../../shared/hooks/useSortableTable";
import SortableTh from "../../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../../shared/components/Pagination";
import SearchableSelect from "../../../../shared/components/SearchableSelect";

const PERINGKAT_OPTS = [5, 10, 20, 50];
const JENIS_OPTS = [
{ value: "semua", label: "Semua" },
{ value: "langsung", label: "Penjualan Langsung" },
{ value: "segera_antar", label: "Segera Antar" },
{ value: "preorder", label: "Pre-Order" }];




export default function ProdukTerlariTab() {
  const { rows, kategoriList, loading, error, fetch, fetchKategori } = useLaporanProdukTerlaris();

  const [peringkat, setPeringkat] = useState(5);
  const [idKategori, setIdKategori] = useState("");
  const [dari, setDari] = useState(todayWIB());
  const [sampai, setSampai] = useState(todayWIB());
  const [jenis, setJenis] = useState("semua");
  const [applied, setApplied] = useState({
    peringkat: 5, namaKategori: "", dari: todayWIB(), sampai: todayWIB(), jenis: "semua"
  });

  useEffect(() => {
    fetchKategori();
    fetch(applied);
  }, [applied]);

  const handleFilter = () => setApplied({ peringkat: Number(peringkat), namaKategori: idKategori, dari, sampai, jenis });
  const handleReset = () => {
    const t = todayWIB();
    setPeringkat(5);setIdKategori("");setDari(t);setSampai(t);setJenis("semua");
    setApplied({ peringkat: 5, namaKategori: "", dari: t, sampai: t, jenis: "semua" });
  };

  const { sorted: rowsSorted, sortKey, sortDir, toggleSort } = useSortableTable(rows);
  const { paged: rowsSortedPaged, page: tablePage, setPage: setTablePage, totalPages: tablePages } = usePaginatedTable(rowsSorted, 20);

  return (
    <div>
      <div className="laporan-filter">
        <div style={{ fontWeight: 600, fontSize: ".875rem", marginBottom: ".75rem" }}>Filter Penjualan:</div>
        <div className="laporan-filter-row" style={{ flexWrap: "wrap" }}>
          <div className="form-field" style={{ margin: 0, minWidth: 140 }}>
            <label>Peringkat</label>
            <select value={peringkat} onChange={(e) => setPeringkat(e.target.value)}>
              {PERINGKAT_OPTS.map((n) => <option key={n} value={n}>{n} Terlaris</option>)}
            </select>
          </div>
          <div className="form-field" style={{ margin: 0, minWidth: 180 }}>
            <label>Kategori</label>
            <SearchableSelect
              value={idKategori}
              onChange={(v) => setIdKategori(v)}
              placeholder="Semua Kategori"
              semua="Semua Kategori"
              options={kategoriList.map((k) => ({ value: k.nama, label: k.nama }))} />
            
          </div>
          <div className="form-field" style={{ margin: 0, minWidth: 220 }}>
            <label>Jenis Penjualan</label>
            <select value={jenis} onChange={(e) => setJenis(e.target.value)}>
              {JENIS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
        <table className="db-table" style={{ minWidth: 800 }}>
          <thead>
            <tr>

              <SortableTh label="Peringkat" colKey="peringkat" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="ID Produk" colKey="id_produk" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Nama Produk" colKey="nama_produk" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Kategori" colKey="kategori" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Terjual (Online)" colKey="terjual_online" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Terjual (Toko)" colKey="terjual_toko" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Total Terjual (pcs)" colKey="total_terjual" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Total Omset" colKey="total_omset" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            </tr>
          </thead>
          <tbody>
            {rowsSortedPaged.length === 0 && !loading &&
            <tr><td colSpan={8} style={{ color: "#6b7280", textAlign: "center", padding: "1.5rem" }}>Tidak ada data.</td></tr>
            }
            {rowsSortedPaged.map((r) =>
            <tr key={r.id_produk}>
                <td style={{ fontWeight: 600, textAlign: "center" }}>{r.peringkat}</td>
                <td>{r.id_produk}</td>
                <td style={{ fontWeight: 500 }}>{r.nama_produk}</td>
                <td>{r.kategori}</td>
                <td>{r.terjual_online}</td>
                <td>{r.terjual_toko}</td>
                <td style={{ fontWeight: 600 }}>{r.total_terjual}</td>
                <td style={{ whiteSpace: "nowrap" }}>{fmtRp(r.total_omset)}</td>
              </tr>
            )}
          </tbody>
        </table>
      <Pagination page={tablePage} totalPages={tablePages} onPageChange={setTablePage} />
</div>
    </div>);

}