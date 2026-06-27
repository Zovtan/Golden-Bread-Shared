import { useState, useEffect } from "react";

import { useProdukBermasalah } from "../../hooks/useLaporanProduk";
import { useEnums, sel } from "../../../../shared/hooks/useEnums";
import { todayWIB } from "../../../../shared/utils/format";
import { useSortableTable } from "../../../../shared/hooks/useSortableTable";
import SortableTh from "../../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../../shared/components/Pagination";
import SearchableSelect from "../../../../shared/components/SearchableSelect";


export default function ProdukBermasalahTab({ search = "" }) {
  const { rows, produkList, staffList, loading, error, fetch, fetchRef } = useProdukBermasalah();
  const { enums } = useEnums();
  const jenisMasalahOpts = sel.jenisMasalahProduk(enums);

  const [jenisMasalah, setJenisMasalah] = useState("");
  const [idProduk, setIdProduk] = useState("");
  const [userId, setUserId] = useState("");
  const [dari, setDari] = useState(todayWIB());
  const [sampai, setSampai] = useState(todayWIB());
  const [applied, setApplied] = useState({ idProduk: "", jenisMasalah: "", userId: "", dari: todayWIB(), sampai: todayWIB() });

  useEffect(() => {fetchRef();}, []);
  useEffect(() => {fetch({ ...applied, search });}, [applied, search]);

  const handleFilter = () => setApplied({ idProduk, jenisMasalah, userId, dari, sampai });
  const handleReset = () => {
    const t = todayWIB();
    setJenisMasalah("");setIdProduk("");setUserId("");setDari(t);setSampai(t);
    setApplied({ idProduk: "", jenisMasalah: "", userId: "", dari: t, sampai: t });
  };

  const { sorted: rowsSorted, sortKey, sortDir, toggleSort } = useSortableTable(rows);
  const { paged: rowsSortedPaged, page: tablePage, setPage: setTablePage, totalPages: tablePages } = usePaginatedTable(rowsSorted, 20);

  return (
    <div>
      <div className="laporan-filter">
        <div style={{ fontWeight: 600, fontSize: ".875rem", marginBottom: ".75rem" }}>Filter Produk:</div>
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
            <label>Dicatat Oleh</label>
            <SearchableSelect
              value={userId}
              onChange={(v) => setUserId(v)}
              placeholder="Semua Staff"
              semua="Semua Staff"
              options={(staffList ?? []).map((u) => ({ value: u.id, label: u.role ? `${u.nama_lengkap} (${u.role})` : u.nama_lengkap }))} />
            
          </div>
          <div className="form-field" style={{ margin: 0 }}>
            <label>Dari</label>
            <input type="date" value={dari} onChange={(e) => setDari(e.target.value)} />
          </div>
          <div className="form-field" style={{ margin: 0 }}>
            <label>Sampai</label>
            <input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} />
          </div>
          <button className="btn-primary" style={{ alignSelf: "flex-end", height: 38, padding: "0 1.25rem", borderRadius: 6 }}
          onClick={handleFilter} disabled={loading}>
            {loading ? "…" : "Filter"}
          </button>
          <button className="btn-secondary" style={{ alignSelf: "flex-end", height: 38, padding: "0 1rem", borderRadius: 6 }}
          onClick={handleReset} disabled={loading}>
            Reset
          </button>
        </div>
      </div>

      {error && <p className="db-fetch-error">{error}</p>}
      {loading && <p className="db-loading-text">Memuat…</p>}

      <div style={{ overflowX: "auto" }}>
        <table className="db-table" style={{ minWidth: 1000 }}>
          <thead><tr>

            <SortableTh label="Tgl & Waktu" colKey="tanggal" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="ID Produk" colKey="id_produk" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Batch" colKey="id_batch" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Nama Produk" colKey="nama_produk" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Tgl Produksi Batch" colKey="tgl_produksi" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Jumlah Bermasalah" colKey="jumlah" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Jenis Masalah" colKey="jenis_masalah" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Keterangan" colKey="keterangan" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

            <SortableTh label="Dicatat Oleh" colKey="dicatat_oleh" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

          </tr></thead>
          <tbody>
            {rows.length === 0 && !loading &&
            <tr><td colSpan={9} style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem" }}>Tidak ada data.</td></tr>
            }
            {rowsSortedPaged.map((r, i) =>
            <tr key={i}>
                <td style={{ whiteSpace: "nowrap", fontSize: ".8125rem" }}>{r.tanggal}</td>
                <td style={{ fontFamily: "monospace" }}>{r.id_produk}</td>
                <td>{r.id_batch}</td>
                <td style={{ fontWeight: 500 }}>{r.nama_produk}</td>
                <td>{r.tgl_produksi}</td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 500 }}>{r.jumlah}</td>
                <td><span className="db-badge pending">{r.jenis_masalah}</span></td>
                <td style={{ maxWidth: 180, fontSize: ".8125rem" }}>{r.keterangan}</td>
                <td>{r.dicatat_oleh}</td>
              </tr>
            )}
          </tbody>
        </table>
      <Pagination page={tablePage} totalPages={tablePages} onPageChange={setTablePage} />
</div>
    </div>);

}