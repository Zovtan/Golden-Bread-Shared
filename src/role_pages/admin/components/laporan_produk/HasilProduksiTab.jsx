import { useState, useEffect } from "react";
import { useHasilProduksi } from "../../hooks/useLaporanProduk";
import { todayWIB } from "../../../../shared/utils/format";
import { useSortableTable } from "../../../../shared/hooks/useSortableTable";
import SortableTh from "../../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../../shared/components/Pagination";
import SearchableSelect from "../../../../shared/components/SearchableSelect";




export default function HasilProduksiTab({ search = "" }) {
  const { rows, stats, produkList, staffList, kategoriList, loading, error, fetch, fetchRef } = useHasilProduksi();

  const [idProduk, setIdProduk] = useState("");
  const [idKategori, setIdKategori] = useState("");
  const [userId, setUserId] = useState("");
  const [dari, setDari] = useState(todayWIB());
  const [sampai, setSampai] = useState(todayWIB());

  useEffect(() => {fetchRef();}, []);

  useEffect(() => {fetch({ idProduk, idKategori, userId, dari, sampai, search });}, [search]);

  const handleFilter = () => fetch({ idProduk, idKategori, userId, dari, sampai, search });
  const handleReset = () => {
    const t = todayWIB();
    setIdProduk("");setIdKategori("");setUserId("");setDari(t);setSampai(t);
    fetch({ dari: t, sampai: t, search });
  };

  const { sorted: rowsSorted, sortKey, sortDir, toggleSort } = useSortableTable(rows);
  const { paged: rowsSortedPaged, page: tablePage, setPage: setTablePage, totalPages: tablePages } = usePaginatedTable(rowsSorted, 20);

  return (
    <div>
      {}
      <div className="laporan-filter">
        <div style={{ fontWeight: 600, fontSize: ".875rem", marginBottom: ".75rem" }}>Filter Hasil Produksi:</div>
        <div className="laporan-filter-row">
          <div className="form-field" style={{ margin: 0, minWidth: 200 }}>
            <label>Produk</label>
            <SearchableSelect
              value={idProduk}
              onChange={(v) => setIdProduk(v)}
              placeholder="Semua Produk"
              semua="Semua Produk"
              options={produkList.map((p) => ({ value: String(p.id_produk), label: p.kategori_enum?.nilai ? `${p.nama_produk} (${p.kategori_enum.nilai})` : p.nama_produk }))} />
            
          </div>
          <div className="form-field" style={{ margin: 0, minWidth: 180 }}>
            <label>Kategori</label>
            <SearchableSelect
              value={idKategori}
              onChange={(v) => setIdKategori(v)}
              placeholder="Semua Kategori"
              semua="Semua Kategori"
              options={kategoriList.map((k) => ({ value: String(k.id), label: k.nilai }))} />
            
          </div>
          <div className="form-field" style={{ margin: 0, minWidth: 200 }}>
            <label>Dicatat Oleh</label>
            <SearchableSelect
              value={userId}
              onChange={(v) => setUserId(v)}
              placeholder="Semua Staff"
              semua="Semua Staff"
              options={staffList.map((u) => ({ value: u.id, label: u.role ? `${u.nama_lengkap} (${u.role})` : u.nama_lengkap }))} />
            
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, margin: "1rem 0" }}>
        {[
        { label: "Total Sesi Produksi", value: stats.totalSesi },
        { label: "Total Batch Dibuat", value: stats.totalBatch },
        { label: "Total Qty Diproduksi", value: `${stats.totalQty} pcs` }].
        map((s) =>
        <div key={s.label} className="db-card" style={{ padding: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: 700 }}>
              {s.value}
            </div>
            <div style={{ fontSize: ".75rem", color: "#6b7280", marginTop: 4 }}>{s.label}</div>
          </div>
        )}
      </div>

      {error && <p className="db-fetch-error">{error}</p>}
      {loading && <p className="db-loading-text">Memuat…</p>}

      {}
      <div style={{ overflowX: "auto" }}>
        <table className="db-table" style={{ minWidth: 780 }}>
          <thead>
            <tr>
              <SortableTh label="ID Produksi" colKey="id_produksi" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Waktu Produksi" colKey="waktu_raw" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Produk" colKey="nama_produk" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Kategori" colKey="kategori" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="ID Batch" colKey="id_batch" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Kadaluarsa" colKey="kadaluarsa" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Jumlah Diproduksi" colKey="jumlah" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Dicatat Oleh" colKey="dicatat_oleh" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {rowsSortedPaged.length === 0 && !loading &&
            <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem" }}>
                  Tidak ada data hasil produksi.
                </td>
              </tr>
            }
            {rowsSortedPaged.map((r, i) =>
            <tr key={`${r.id_produksi}-${r.id_batch}-${i}`}>
                <td style={{ fontWeight: 500 }}>#{r.id_produksi}</td>
                <td style={{ whiteSpace: "nowrap", fontSize: ".8125rem" }}>{r.waktu}</td>
                <td style={{ fontWeight: 500 }}>{r.nama_produk}</td>
                <td style={{ fontSize: ".8125rem", color: "#6b7280" }}>{r.kategori}</td>
                <td style={{ fontFamily: "monospace" }}>{r.id_batch}</td>
                <td style={{ whiteSpace: "nowrap", fontSize: ".8125rem" }}>{r.kadaluarsa}</td>
                <td style={{ textAlign: "right", fontWeight: 600, color: "#16a34a" }}>
                  {r.jumlah}
                </td>
                <td style={{ fontSize: ".8125rem" }}>{r.dicatat_oleh}</td>
              </tr>
            )}
          </tbody>
        </table>
      <Pagination page={tablePage} totalPages={tablePages} onPageChange={setTablePage} />
</div>
    </div>);

}