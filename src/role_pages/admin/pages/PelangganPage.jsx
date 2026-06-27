import { useState } from "react";
import SearchBar from "../../../shared/components/SearchBar";
import { usePelangganManajemen } from "../hooks/usePelangganManajemen";
import TambahPelangganModal from "../components/pelanggan/TambahPelangganModal";
import EditPelangganModal from "../components/pelanggan/EditPelangganModal";
import DetailPelangganModal from "../components/pelanggan/DetailPelangganModal";
import RiwayatPelangganModal from "../components/pelanggan/RiwayatPelangganModal";
import { fmtRp } from "../../../shared/utils/format";
import { useSortableTable, ENUM_MAPS } from "../../../shared/hooks/useSortableTable";
import SortableTh from "../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../shared/components/Pagination";

const JENIS_BADGE = {
  Prioritas: "badge-status aktif",
  Reguler: "badge-status normal",
  Grosir: "badge-status menipis"
};


export default function PelangganPage({ search = "" }) {
  const {
    pelangganList, stats, loading, error, lastUpdated,
    jenisPelangganList,
    tambahPelanggan, editPelanggan, fetchRiwayat
  } = usePelangganManajemen(search);

  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const openModal = (name, p = null) => {setSelected(p);setModal(name);};
  const closeModal = () => {setModal(null);setSelected(null);};

  const { sorted: pelangganListSorted, sortKey, sortDir, toggleSort } = useSortableTable(pelangganList);
  const { paged: pelangganListSortedPaged, page: tablePage, setPage: setTablePage, totalPages: tablePages } = usePaginatedTable(pelangganListSorted, 20);

  return (
    <div>
      {}
      <div className="produk-toolbar">
        <span className="produk-stat-pill">
          Total Pelanggan: {stats.total}
        </span>
        <span className="produk-stat-pill">
          Total Transaksi: {stats.totalTransaksi}
        </span>

        <div style={{ flex: 1 }}></div>

        <button className="btn-primary" onClick={() => openModal("tambah")}>
          Tambah Pelanggan Baru
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

              <SortableTh label="ID" colKey="id" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Nama Pelanggan" colKey="nama_lengkap" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Nama Toko / Fasilitas" colKey="nama_toko" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Jenis Pelanggan" colKey="jenis_pelanggan" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Telepon" colKey="no_telp" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Alamat" colKey="alamat" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Total Transaksi" colKey="totalTrx" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Total Nilai Transaksi" colKey="totalNilai" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Status" colKey="status" type="enum" enumMap={ENUM_MAPS.status_akun} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <th>Aksi</th>

            </tr>
          </thead>
          <tbody>
            {pelangganListSortedPaged.length === 0 && !loading &&
              <tr>
                <td colSpan={9} style={{ color: "#6b7280", textAlign: "center", padding: "1.5rem" }}>
                  Tidak ada pelanggan.
                </td>
              </tr>
              }
            {pelangganListSortedPaged.map((p) =>
              <tr key={p.id}>
                <td style={{ fontFamily: "monospace", fontSize: ".8125rem", color: "#6b7280" }}>{p.displayId}</td>
                <td style={{ fontWeight: 500 }}>{p.nama_lengkap}</td>
                <td>{p.nama_toko || "-"}</td>
                <td>
                  <span className={JENIS_BADGE[p.jenis_pelanggan] ?? "badge-status normal"}>
                    {p.jenis_pelanggan ?? "-"}
                  </span>
                </td>
                <td>{p.no_telp || "-"}</td>
                <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.alamat || "-"}
                </td>
                <td style={{ textAlign: "center" }}>{p.totalTrx}</td>
                <td style={{ whiteSpace: "nowrap" }}>{fmtRp(p.totalNilai)}</td>
                <td>
                  <span className={p.status === "Aktif" ? "badge-status aktif" : "badge-status habis"}>
                    {p.status === "Aktif" ? "Aktif" : "Tidak Aktif"}
                  </span>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="db-action-link" onClick={() => openModal("edit", p)}>Edit</button>
                  <span style={{ color: "#d1d5db", margin: "0 4px" }}>/</span>
                  <button className="db-action-link" onClick={() => openModal("detail", p)}>Detail</button>
                  <span style={{ color: "#d1d5db", margin: "0 4px" }}>/</span>
                  <button className="db-action-link" onClick={() => openModal("riwayat", p)}>Riwayat</button>
                </td>
              </tr>
              )}
          </tbody>
        </table>
</div>
      <Pagination page={tablePage} totalPages={tablePages} onPageChange={setTablePage} />
      </div>

      {}
      <TambahPelangganModal
        open={modal === "tambah"}
        onClose={closeModal}
        jenisPelangganList={jenisPelangganList}
        onSubmit={tambahPelanggan} />
      
      <EditPelangganModal
        open={modal === "edit"}
        onClose={closeModal}
        pelanggan={selected}
        jenisPelangganList={jenisPelangganList}
        onSubmit={editPelanggan} />
      
      <DetailPelangganModal
        open={modal === "detail"}
        onClose={closeModal}
        pelanggan={selected} />
      
      <RiwayatPelangganModal
        open={modal === "riwayat"}
        onClose={closeModal}
        pelanggan={selected}
        fetchRiwayat={fetchRiwayat} />
      
    </div>);

}

export function PelangganSearchBar({ value, onChange }) {
  return (
    <SearchBar value={value} onChange={onChange} placeholder="Cari nama / toko / email..." />);

}