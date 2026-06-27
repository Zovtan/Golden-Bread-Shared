import { useState } from "react";
import SearchBar from "../../../shared/components/SearchBar";
import { useExpandedRows } from "../../../shared/hooks/useExpandedRows";
import { useBahanBakuManajemen } from "../hooks/useBahanBakuManajemen";
import TambahBahanModal from "../components/bahan_baku/TambahBahanModal";
import EditBahanModal from "../components/bahan_baku/EditBahanModal";
import DetailBahanModal from "../components/bahan_baku/DetailBahanModal";
import BahanBermasalahModal from "../components/bahan_baku/BahanBermasalahModal";
import PemakaianBahanModal from "../components/bahan_baku/PemakaianBahanModal";
import EditEnumModal from "../components/settings/EditEnumModal";
import RealtimeBadge from "../../../shared/components/RealtimeBadge";
import { fmtDate, fmtRp } from "../../../shared/utils/format";
import { useSortableTable, ENUM_MAPS } from "../../../shared/hooks/useSortableTable";
import SortableTh from "../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../shared/components/Pagination";
import { rowHl, batchRowHl } from "../../../shared/utils/rowHighlight";
import { STOK_BADGE, KDL_BADGE } from "../../../shared/utils/badgeMaps";






export default function BahanBakuPage({ search = "" }) {
  const {
    bahanList,
    jenisBahanList, satuanList, statusBahanList,
    stats, loading, error, lastUpdated,
    tambahBahan, editBahan, laporMasalah, addEnumValue, editEnumValue, refetch
  } = useBahanBakuManajemen(search);


  const { expanded, toggleExpand } = useExpandedRows();


  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const openModal = (name, b = null) => {setSelected(b);setModal(name);};
  const closeModal = () => {setModal(null);setSelected(null);};

  const { sorted: bahanListSorted, sortKey, sortDir, toggleSort } = useSortableTable(bahanList);
  const { paged: bahanListSortedPaged, page: tablePage, setPage: setTablePage, totalPages: tablePages } = usePaginatedTable(bahanListSorted, 20);

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

        <button className="btn-secondary" onClick={() => openModal("edit-jenis-bahan")}>
          Kelola Jenis Bahan
        </button>
        <button className="btn-secondary" onClick={() => openModal("edit-satuan")}>
          Kelola Satuan
        </button>
        <button className="btn-primary" onClick={() => openModal("pemakaian")}>
          Input Pemakaian
        </button>
        <button className="btn-primary" onClick={() => openModal("tambah")}>
          Tambah Bahan Baru
        </button>
        <button className="btn-primary" onClick={() => openModal("masalah")}>
          Bahan Bermasalah
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

              <SortableTh label="ID Bahan" colKey="id_bahan" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Merek" colKey="merek" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Jenis Barang" colKey="jenis_bahan" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Satuan" colKey="satuan" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <th>Batch</th>

              <SortableTh label="Harga Beli (Avg)" colKey="hargaAvg" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Tgl Masuk (Terawal)" colKey="tglMasukTerawal" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Ttl. Stok Valid" colKey="totalStok" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Status Bahan" colKey="status" type="enum" enumMap={ENUM_MAPS.status_bahan} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Status Jlh. Stok" colKey="statusStok" type="enum" enumMap={ENUM_MAPS.status_stok} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Kadaluarsa (Terawal)" colKey="kadaluarsaTerawal" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Ada Kadaluarsa?" colKey="adaKadaluarsa" type="enum" enumMap={ENUM_MAPS.ada_kadaluarsa} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <th>Aksi</th>

            </tr>
          </thead>
          <tbody>
            {bahanListSortedPaged.length === 0 && !loading &&
              <tr>
                <td colSpan={13} style={{ color: "#6b7280", textAlign: "center", padding: "1.5rem" }}>
                  Tidak ada bahan baku.
                </td>
              </tr>
              }

            {bahanListSortedPaged.map((b) => {
                const isExpanded = expanded.has(b.id_bahan);
                const batchCount = b.batches.length;

                return [

                <tr style={rowHl(b.statusStok, b.adaKadaluarsa)} key={`bahan-${b.id_bahan}`}>
                  <td>{String(b.id_bahan)}</td>
                  <td style={{ fontWeight: 500 }}>{b.merek ?? "-"}</td>
                  <td>{b.jenis_bahan ?? "-"}</td>
                  <td>{b.satuan ?? "-"}</td>
                  <td>
                    {batchCount > 0 ?
                    <button className="batch-toggle-btn" onClick={() => toggleExpand(b.id_bahan)}>
                        {batchCount} Batch {isExpanded ? "▲" : "▼"}
                      </button> :

                    <span style={{ color: "#9ca3af" }}>-</span>
                    }
                  </td>
                  <td>{fmtRp(b.hargaAvg)}</td>
                  <td>{fmtDate(b.tglMasukTerawal)}</td>
                  <td>{b.totalStok}</td>
                  <td><span className={STOK_BADGE[b.status] ?? ""}>{b.status}</span></td>
                  <td><span className={STOK_BADGE[b.statusStok] ?? "badge-status normal"}>{b.statusStok}</span></td>
                  <td>{fmtDate(b.kadaluarsaTerawal)}</td>
                  <td><span className={KDL_BADGE[b.adaKadaluarsa] ?? "badge-status normal"}>{b.adaKadaluarsa}</span></td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="db-action-link" style={{ marginRight: 6 }} onClick={() => openModal("edit", b)}>Edit</button>
                    <span style={{ color: "#d1d5db" }}>/</span>
                    <button className="db-action-link" style={{ marginLeft: 6 }} onClick={() => openModal("detail", b)}>Detail</button>
                  </td>
                </tr>,


                ...(isExpanded ? b.batches.map((bt) =>
                <tr style={batchRowHl(bt.status_stok, bt.status_kadaluarsa)} key={`batch-${bt.id_batch_bb}`} className="sub-row">
                    <td><span style={{ color: "#9ca3af" }}>↳</span></td>
                    <td /><td /><td />
                    <td style={{ fontWeight: 500 }}>
                      Batch #{bt.id_batch_bb}
                    </td>
                    <td>{bt.harga_satuan != null ? fmtRp(bt.harga_satuan) : "-"}</td>
                    <td>{fmtDate(bt.tgl_beli)}</td>
                    <td>{bt.stok}</td>
                    <td />
                    <td>
                      <span className={STOK_BADGE[bt.status_stok] ?? "badge-status normal"}>
                        {bt.status_stok}
                      </span>
                    </td>
                    <td>{fmtDate(bt.kadaluarsa)}</td>
                    <td>
                      <span className={KDL_BADGE[bt.status_kadaluarsa] ?? "badge-status normal"}>{bt.status_kadaluarsa}</span>
                    </td>
                  </tr>
                ) : [])];

              })}
          </tbody>
        </table>
</div>
      <Pagination page={tablePage} totalPages={tablePages} onPageChange={setTablePage} />
      </div>

      {}
      <TambahBahanModal
        open={modal === "tambah"}
        onClose={closeModal}
        jenisBahanList={jenisBahanList}
        satuanList={satuanList}
        onSubmit={tambahBahan} />
      

      <EditBahanModal
        open={modal === "edit"}
        onClose={closeModal}
        bahan={selected}
        jenisBahanList={jenisBahanList}
        satuanList={satuanList}
        statusBahanList={statusBahanList}
        onSubmit={editBahan} />
      

      <DetailBahanModal
        open={modal === "detail"}
        onClose={closeModal}
        bahan={selected} />
      

      <BahanBermasalahModal
        open={modal === "masalah"}
        onClose={closeModal}
        bahanList={bahanList}
        onSubmit={laporMasalah} />
      

      <PemakaianBahanModal
        open={modal === "pemakaian"}
        onClose={closeModal}
        fetchBahan={refetch} />
      
      <EditEnumModal open={modal === "edit-jenis-bahan"} onClose={closeModal} enumType="jenis_bahan" addEnumValue={addEnumValue} editEnumValue={editEnumValue} />
      <EditEnumModal open={modal === "edit-satuan"} onClose={closeModal} enumType="satuan" addEnumValue={addEnumValue} editEnumValue={editEnumValue} />
    </div>);

}

export function BahanBakuSearchBar({ value, onChange }) {
  return (
    <SearchBar value={value} onChange={onChange} placeholder="Cari nama / jenis / stok..." />);

}