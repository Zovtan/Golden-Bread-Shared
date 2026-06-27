import { useState } from "react";
import { useExpandedRows } from "../../../shared/hooks/useExpandedRows";
import SearchBar from "../../../shared/components/SearchBar";
import { useKasirCekStokProduk } from "../hooks/useKasirCekStokProduk";
import RealtimeBadge from "../../../shared/components/RealtimeBadge";
import ProdukBermasalahModal from "../../admin/components/produk/ProdukBermasalahModal";
import DetailProdukModal from "../../admin/components/produk/DetailProdukModal";
import { fmtDate, fmtDateTime, fmtRp } from "../../../shared/utils/format";
import { useSortableTable, ENUM_MAPS } from "../../../shared/hooks/useSortableTable";
import SortableTh from "../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../shared/components/Pagination";
import { rowHl, batchRowHl } from "../../../shared/utils/rowHighlight";
import { STOK_BADGE, KDL_BADGE } from "../../../shared/utils/badgeMaps";





export default function KasirCekStokProdukPage({ search = "" }) {
  const { produkList, stats, loading, error, lastUpdated, laporMasalah } = useKasirCekStokProduk(search);

  const { expanded, toggleExpand } = useExpandedRows();

  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const { sorted: produkListSorted, sortKey, sortDir, toggleSort } = useSortableTable(produkList);
  const { paged: produkListSortedPaged, page: tablePage, setPage: setTablePage, totalPages: tablePages } = usePaginatedTable(produkListSorted, 20);

  return (
    <div>
      {}
      <div className="produk-toolbar">
        <span className={`produk-stat-pill${stats.habis > 0 ? " habis" : ""}`}>
          Habis: {stats.habis}
        </span>
        <span className={`produk-stat-pill${stats.kadaluarsa > 0 ? " mendekati" : ""}`}>
          Kadaluarsa: {stats.kadaluarsa}
        </span>

        <div style={{ flex: 1 }} />

        <RealtimeBadge lastUpdated={lastUpdated} loading={loading && !!lastUpdated} />

        <button className="btn-primary" onClick={() => setModal("masalah")}>
          Produk Bermasalah
        </button>
      </div>

      {error && <p className="db-fetch-error">{error}</p>}
      {loading && !lastUpdated && <p className="db-loading-text">Memuat…</p>}

      {}
      <div className="produk-table-wrap db-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="db-table-wrap"><table className="produk-table">
          <thead>
            <tr>

              <SortableTh label="ID Produk" colKey="id_produk" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Nama Produk" colKey="nama_produk" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Kategori" colKey="kategori_produk" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Harga Satuan" colKey="harga_satuan" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <th>Batch</th>

              <SortableTh label="Tgl Produksi (Terawal)" colKey="tglProduksiTerawal" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Ttl. Stok Valid (Pcs)" colKey="totalStok" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Status Produk" colKey="status" type="enum" enumMap={ENUM_MAPS.status_produk} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Status Jlh. Stok" colKey="statusStok" type="enum" enumMap={ENUM_MAPS.status_stok} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Kadaluarsa (Terawal)" colKey="kadaluarsaTerawal" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Ada Kadaluarsa?" colKey="adaKadaluarsa" type="enum" enumMap={ENUM_MAPS.ada_kadaluarsa} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <th>Aksi</th>

            </tr>
          </thead>
          <tbody>
            {produkListSortedPaged.length === 0 && !loading &&
              <tr>
                <td colSpan={12} style={{ color: "#6b7280", textAlign: "center", padding: "1.5rem" }}>
                  Tidak ada produk.
                </td>
              </tr>
              }

            {produkListSortedPaged.map((p) => {
                const isExpanded = expanded.has(p.id_produk);
                const batchCount = p.batches.length;

                return [
                <tr style={rowHl(p.statusStok, p.adaKadaluarsa)} key={`produk-${p.id_produk}`}>
                  <td>{p.id_produk}</td>
                  <td style={{ fontWeight: 500 }}>{p.nama_produk}</td>
                  <td>{p.kategori_produk ?? "-"}</td>
                  <td>{fmtRp(p.harga_satuan)}</td>
                  <td>
                    {batchCount > 0 ?
                    <button className="batch-toggle-btn" onClick={() => toggleExpand(p.id_produk)}>
                        {batchCount} Batch {isExpanded ? "▲" : "▼"}
                      </button> :

                    <span style={{ color: "#9ca3af" }}>-</span>
                    }
                  </td>
                  <td>{fmtDate(p.tglProduksiTerawal)}</td>
                  <td>{p.totalStok}</td>
                  <td><span className={STOK_BADGE[p.status] ?? ""}>{p.status}</span></td>
                  <td><span className={STOK_BADGE[p.statusStok] ?? "badge-status normal"}>{p.statusStok}</span></td>
                  <td>{fmtDate(p.kadaluarsaTerawal)}</td>
                  <td><span className={KDL_BADGE[p.adaKadaluarsa] ?? "badge-status normal"}>{p.adaKadaluarsa}</span></td>
                  <td>
                    <button className="db-action-link" onClick={() => {setSelected(p);setModal("detail");}}>Detail</button>
                  </td>
                </tr>,

                ...(isExpanded ? p.batches.map((bt) =>
                <tr style={batchRowHl(bt.status_stok, bt.status_kadaluarsa)} key={`batch-${bt.id_batch}`} className="sub-row">
                    <td><span style={{ color: "#9ca3af" }}>↳</span></td>
                    <td /><td /><td />
                    <td style={{ fontWeight: 500 }}>Batch #{bt.id_batch}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(bt.tgl_produksi)}</td>
                    <td>{bt.stok}</td>
                    <td />
                    <td>
                      <span className={STOK_BADGE[bt.status_stok] ?? "badge-status normal"}>{bt.status_stok}</span>
                    </td>
                    <td>{fmtDate(bt.kadaluarsa)}</td>
                    <td>
                      <span className={KDL_BADGE[bt.status_kadaluarsa] ?? "badge-status normal"}>{bt.status_kadaluarsa}</span>
                    </td>
                    <td />
                  </tr>
                ) : [])];

              })}
          </tbody>
        </table>
</div>
      <Pagination page={tablePage} totalPages={tablePages} onPageChange={setTablePage} />
      </div>

      {}
      <ProdukBermasalahModal
        open={modal === "masalah"}
        onClose={() => setModal(null)}
        produkList={produkList}
        onSubmit={laporMasalah} />
      
      <DetailProdukModal
        open={modal === "detail"}
        onClose={() => {setModal(null);setSelected(null);}}
        produk={selected} />
      
    </div>);

}

export function KasirStokSearchBar({ value, onChange }) {
  return (
    <SearchBar value={value} onChange={onChange} placeholder="Cari nama / kategori / stok..." />);

}