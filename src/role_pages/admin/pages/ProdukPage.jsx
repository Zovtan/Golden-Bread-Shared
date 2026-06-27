import { useState } from "react";
import SearchBar from "../../../shared/components/SearchBar";
import { useExpandedRows } from "../../../shared/hooks/useExpandedRows";
import { useProdukManajemen } from "../hooks/useProdukManajemen";
import TambahProdukModal from "../components/produk/TambahProdukModal";
import EditProdukModal from "../components/produk/EditProdukModal";
import DetailProdukModal from "../components/produk/DetailProdukModal";
import TambahProduksiModal from "../components/produk/TambahProduksiModal";
import ProdukBermasalahModal from "../components/produk/ProdukBermasalahModal";
import EditEnumModal from "../components/settings/EditEnumModal";
import RealtimeBadge from "../../../shared/components/RealtimeBadge";
import { fmtDate, fmtDateTime, fmtRp } from "../../../shared/utils/format";
import { useSortableTable, ENUM_MAPS } from "../../../shared/hooks/useSortableTable";
import SortableTh from "../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../shared/components/Pagination";
import { rowHl, batchRowHl } from "../../../shared/utils/rowHighlight";
import { STOK_BADGE, KDL_BADGE } from "../../../shared/utils/badgeMaps";










export default function ProdukPage({ search = "" }) {

  const {
    produkList, kategoriList, jenisMasalahList,
    stats, loading, error, lastUpdated,
    tambahProduk, editProduk, tambahProduksi, laporMasalah,
    addEnumValue, editEnumValue
  } = useProdukManajemen(search);


  const { expanded, toggleExpand } = useExpandedRows();


  const [modal, setModal] = useState(null);
  const [selectedProduk, setSelP] = useState(null);

  const openModal = (name, p = null) => {setSelP(p);setModal(name);};
  const closeModal = () => {setModal(null);setSelP(null);};


  const handleTambahProduk = (payload) => tambahProduk(payload);
  const handleEditProduk = (payload) => editProduk(payload);
  const handleTambahProduksi = (payload) => tambahProduksi(payload);
  const handleLaporMasalah = (payload) => laporMasalah(payload);

  const { sorted: produkListSorted, sortKey, sortDir, toggleSort } = useSortableTable(produkList);
  const { paged: produkListSortedPaged, page: tablePage, setPage: setTablePage, totalPages: tablePages } = usePaginatedTable(produkListSorted, 20);

  return (
    <div>
      {}
      <div className="produk-toolbar">
        {}
        <span className={`produk-stat-pill${stats.habis > 0 ? " habis" : ""}`}>
          Habis: {stats.habis}
        </span>
        <span className={`produk-stat-pill${stats.kadaluarsa > 0 ? " mendekati" : ""}`}>
          Kadaluarsa: {stats.kadaluarsa}
        </span>

        {}
        <div style={{ flex: 1 }} />

        <RealtimeBadge lastUpdated={lastUpdated} loading={loading && !!lastUpdated} />

        <button className="btn-secondary" onClick={() => openModal("edit-kategori")}>
          Kelola Kategori
        </button>      
        <button className="btn-primary" onClick={() => openModal("produksi")}>
          Tambah Produksi Baru
        </button>
        <button className="btn-primary" onClick={() => openModal("tambah")}>
          Tambah Produk Baru
        </button>
        <button className="btn-primary" onClick={() => openModal("masalah")}>
          Produk Bermasalah
        </button>
      </div>

      {}
      {error && <p className="db-fetch-error">{error}</p>}
      {loading && !lastUpdated && <p className="db-loading-text">Memuat…</p>}

      {}
      <div className="produk-table-wrap db-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="db-table-wrap"><table className="produk-table">
          <thead>
            <tr>

              <SortableTh label="ID Produk" colKey="id_produk" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Nama Produk" colKey="nama_produk" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Kategori" colKey="kategori" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

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

                <tr style={rowHl(p.statusStok, p.adaKadaluarsa)} key={`prod-${p.id_produk}`}>
                  <td>{String(p.id_produk)}</td>
                  <td style={{ fontWeight: 500 }}>{p.nama_produk}</td>
                  <td>{p.kategori}</td>
                  <td>{fmtRp(p.harga_satuan)}</td>
                  <td>
                    {batchCount > 0 ?
                    <button
                      className="batch-toggle-btn"
                      onClick={() => toggleExpand(p.id_produk)}>
                      
                        {batchCount} Batch {isExpanded ? "▲" : "▼"}
                      </button> :

                    <span style={{ color: "#9ca3af" }}>-</span>
                    }
                  </td>
                  <td>{fmtDate(p.tglProduksiTerawal)}</td>
                  <td>{p.totalStok}</td>
                  <td><span className={STOK_BADGE[p.status] ?? "badge-status normal"}>{p.status}</span></td>
                  <td><span className={STOK_BADGE[p.statusStok] ?? "badge-status normal"}>{p.statusStok}</span></td>
                  <td>{fmtDate(p.kadaluarsaTerawal)}</td>
                  <td><span className={KDL_BADGE[p.adaKadaluarsa] ?? "badge-status normal"}>{p.adaKadaluarsa}</span></td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="db-action-link" style={{ marginRight: 6 }} onClick={() => openModal("edit", p)}>Edit</button>
                    <span style={{ color: "#d1d5db" }}>/</span>
                    <button className="db-action-link" style={{ marginLeft: 6 }} onClick={() => openModal("detail", p)}>Detail</button>
                  </td>
                </tr>,


                ...(isExpanded ? p.batches.map((b) =>
                <tr style={batchRowHl(b.status_stok, b.status_kadaluarsa)} key={`batch-${b.id_batch}`} className="sub-row">
                    <td>
                      <span style={{ color: "#9ca3af" }}>↳</span>
                    </td>
                    <td />
                    <td />
                    <td />
                    <td style={{ fontWeight: 500 }}>
                      Batch #{b.id_batch}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(b.tgl_produksi)}</td>
                    <td>{b.stok}</td>
                    <td />
                    <td>
                      <span className={STOK_BADGE[b.status_stok] ?? "badge-status normal"}>
                        {b.status_stok}
                      </span>
                    </td>
                    <td>{fmtDate(b.kadaluarsa)}</td>
                    <td>
                      <span className={KDL_BADGE[b.status_kadaluarsa] ?? "badge-status normal"}>{b.status_kadaluarsa}</span>
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
      <TambahProdukModal
        open={modal === "tambah"}
        onClose={closeModal}
        kategoriList={kategoriList}
        onSubmit={handleTambahProduk} />
      

      <EditProdukModal
        open={modal === "edit"}
        onClose={closeModal}
        produk={selectedProduk}
        kategoriList={kategoriList}
        onSubmit={handleEditProduk} />
      

      <DetailProdukModal
        open={modal === "detail"}
        onClose={closeModal}
        produk={selectedProduk} />
      

      <TambahProduksiModal
        open={modal === "produksi"}
        onClose={closeModal}
        produkList={produkList}
        onSubmit={handleTambahProduksi} />
      

      <ProdukBermasalahModal
        open={modal === "masalah"}
        onClose={closeModal}
        produkList={produkList}
        jenisMasalahList={jenisMasalahList}
        onSubmit={handleLaporMasalah} />
      
      <EditEnumModal open={modal === "edit-kategori"} onClose={closeModal} enumType="kategori_produk" addEnumValue={addEnumValue} editEnumValue={editEnumValue} />
    </div>);

}








export function ProdukSearchBar({ value, onChange }) {
  return (
    <SearchBar value={value} onChange={onChange} placeholder="Cari nama / kategori / stok..." />);

}