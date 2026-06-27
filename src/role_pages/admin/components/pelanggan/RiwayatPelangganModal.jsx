import { useState, useEffect } from "react";
import Modal from "../../../../shared/components/Modal";
import { fmtRpDecimal } from "../../../../shared/utils/format";
import { PESANAN_BADGE } from "../../../../shared/utils/badgeMaps";
import { useSortableTable } from "../../../../shared/hooks/useSortableTable";
import SortableTh from "../../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../../shared/components/Pagination";



function RiwayatTable({ rows }) {
  const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(rows);
  const { paged, page, setPage, totalPages } = usePaginatedTable(sorted, 10);
  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <div className="db-table-wrap"><table className="produk-table" style={{ minWidth: 600 }}>
          <thead>
            <tr>
              <SortableTh label="No. Pesanan" colKey="id_pesanan" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Tanggal & Waktu" colKey="tanggal_raw" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <th>Waktu Antar</th>
              <th>Item</th>
              <SortableTh label="Total" colKey="total" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Status" colKey="status" type="enum" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 &&
              <tr><td colSpan={6} style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem" }}>Belum ada transaksi.</td></tr>
              }
            {paged.map((r) =>
              <tr key={r.id_pesanan}>
                <td style={{ fontWeight: 500 }}>{r.id_pesanan}</td>
                <td style={{ whiteSpace: "nowrap" }}>{r.tanggal}</td>
                <td style={{ whiteSpace: "nowrap" }}>{r.waktu_antar}</td>
                <td>
                  {r.items.map((item, i) =>
                  <div key={i} style={{ fontSize: ".8125rem", lineHeight: 1.6 }}>{item}</div>
                  )}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>{fmtRpDecimal(r.total)}</td>
                <td>
                  <span className={PESANAN_BADGE[r.status] ?? "badge-status normal"}>
                    {r.status}
                  </span>
                </td>
              </tr>
              )}
          </tbody>
        </table>
        </div>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </>);

}


export default function RiwayatPelangganModal({ open, onClose, pelanggan, fetchRiwayat }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !pelanggan) return;
    setLoading(true);setError(null);
    fetchRiwayat(pelanggan.id).
    then(setRows).
    catch((e) => setError(e.message)).
    finally(() => setLoading(false));

  }, [open, pelanggan]);

  if (!pelanggan) return null;
  return (
    <Modal open={open} onClose={onClose}
    title={`Riwayat Transaksi Pelanggan`}
    maxWidth="780px"
    footer={<button className="btn-secondary" onClick={onClose}>Tutup</button>}>

      {loading && <p className="db-loading-text">Memuat riwayat…</p>}
      {error && <p style={{ color: "#dc2626", fontSize: ".875rem" }}>{error}</p>}

      {!loading &&
      <RiwayatTable rows={rows} />
      }
    </Modal>);

}