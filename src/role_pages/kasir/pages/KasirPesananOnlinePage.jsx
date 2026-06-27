import { useState, useEffect } from "react";
import { useKasirPesananOnline } from "../hooks/useKasirPesananOnline";
import SearchBar from "../../../shared/components/SearchBar";
import DetailPesananModal from "../../admin/components/pesanan_online/DetailPesananModal";
import KonfirmasiStatusModal from "../../admin/components/pesanan_online/KonfirmasiStatusModal";
import BatalkanModal from "../../admin/components/pesanan_online/BatalkanModal";
import RejectRefundModal from "../../admin/components/pesanan_online/RejectRefundModal";
import ActionErrorModal from "../../admin/components/pesanan_online/ActionErrorModal";
import RealtimeBadge from "../../../shared/components/RealtimeBadge";
import { fmtRp, fmtRpCompact } from "../../../shared/utils/format";
import { useSortableTable, ENUM_MAPS } from "../../../shared/hooks/useSortableTable";
import SortableTh from "../../../shared/components/SortableTh";
import { usePaginatedTable } from "../../../shared/hooks/usePaginatedTable";
import Pagination from "../../../shared/components/Pagination";
import { PESANAN_BADGE, PESANAN_LABEL } from "../../../shared/utils/badgeMaps";
import { useSubmitLock } from "../../../shared/hooks/useSubmitLock";



export default function KasirPesananOnlinePage({ search = "" }) {
  const {
    pesananList, stats, loading, error, lastUpdated,
    statusList, waktuList,
    filterStatus, setFilterStatus,
    filterWaktu, setFilterWaktu,
    filterTanggal, setFilterTanggal,
    applyFilter, resetFilter,
    updateStatus, rejectRefund
  } = useKasirPesananOnline(search);

  const { sorted: pesananListSorted, sortKey, sortDir, toggleSort } = useSortableTable(pesananList);
  const { paged: pesananListSortedPaged, page: tablePage, setPage: setTablePage, totalPages: tablePages } = usePaginatedTable(pesananListSorted, 20);


  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [batalModal, setBatalModal] = useState(null);
  const [batalLoading, setBatalLoading] = useState(false);
  const [konfirmasiModal, setKonfirmasiModal] = useState(null);
  const [konfirmasiLoading, setKonfirmasiLoading] = useState(false);


  const guard = useSubmitLock();

  const openModal = (name, p = null) => {setSelected(p);setModal(name);};
  const closeModal = () => {setModal(null);setSelected(null);};

  useEffect(() => {
    const pending = localStorage.getItem("gb_open_pesanan");
    if (!pending || loading || pesananListSortedPaged.length === 0) return;
    localStorage.removeItem("gb_open_pesanan");
    const target = pesananList.find((p) => String(p.id_pesanan) === pending);
    if (target) openModal("detail", target);
  }, [pesananList, loading]);

  const handleStatus = (pesanan, newStatus) => {
    setKonfirmasiModal({ pesanan, newStatus });
  };

  const confirmStatus = guard(async () => {
    if (!konfirmasiModal) return;
    const { pesanan, newStatus } = konfirmasiModal;
    setKonfirmasiLoading(true);
    try {await updateStatus(pesanan.id_pesanan, newStatus, pesanan.status);}
    catch (e) {setActionError(e.message);} finally
    {setKonfirmasiLoading(false);setKonfirmasiModal(null);}
  });

  const confirmBatal = guard(async (alasan) => {
    if (!batalModal) return;
    setBatalLoading(true);
    try {
      await updateStatus(batalModal.id_pesanan, "Dibatalkan", batalModal.status, alasan || null);
      setBatalModal(null);
    } catch (e) {setActionError(e.message);
    } finally {setBatalLoading(false);}
  });

  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const handleReject = (pesanan) => {setRejectReason("");setRejectModal(pesanan);};

  const confirmReject = guard(async () => {
    if (!rejectModal) return;
    setRejectLoading(true);
    try {
      await rejectRefund(rejectModal.id_pesanan, rejectReason.trim() || null);
      setRejectModal(null);
    } catch (e) {setActionError(e.message);
    } finally {setRejectLoading(false);}
  });

  return (
    <div>
      {}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {[
        { label: "Omset penjualan online hari ini", value: fmtRpCompact(stats.omsetHariIni), big: true },
        { label: "Pesanan pending", value: stats.pending },
        { label: "Pesanan di proses", value: stats.diproses },
        { label: "Selesai hari ini", value: stats.selesaiHariIni }].
        map((s, i) =>
        <div key={i} className="db-card" style={{ flex: "1 1 160px", padding: "1rem 1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: s.big ? "1.5rem" : "2rem", fontWeight: 700, color: "#111827" }}>{s.value}</div>
            <div style={{ fontSize: ".8125rem", color: "#6b7280", marginTop: 4 }}>{s.label}</div>
          </div>
        )}
      </div>

      {}
      <div className="db-card" style={{ padding: "1rem 1.25rem", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 600, fontSize: ".9375rem", alignSelf: "center", minWidth: 120 }}>Filter Pesanan:</div>
          <div className="form-field" style={{ margin: 0, flex: "0 0 180px" }}>
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              {statusList.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-field" style={{ margin: 0, flex: "0 0 180px" }}>
            <label>Waktu Antar</label>
            <select value={filterWaktu} onChange={(e) => setFilterWaktu(e.target.value)}>
              {waktuList.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-field" style={{ margin: 0, flex: "0 0 220px" }}>
            <label>Tanggal</label>
            <input type="date" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} />
          </div>
          <button className="btn-primary"
          style={{ alignSelf: "flex-end", borderRadius: 6, height: 38, padding: "0 1.25rem" }}
          onClick={applyFilter} disabled={loading}>
            {loading ? "…" : "Filter"}
          </button>
          <button className="btn-secondary"
          style={{ alignSelf: "flex-end", borderRadius: 6, height: 38, padding: "0 1rem" }}
          onClick={resetFilter} disabled={loading}>
            Reset
          </button>
          <div style={{ flex: 1 }} />
          <RealtimeBadge lastUpdated={lastUpdated} loading={loading && !!lastUpdated} />
        </div>
      </div>

      {error && <p className="db-fetch-error">{error}</p>}
      {loading && !lastUpdated && <p className="db-loading-text">Memuat…</p>}

      {}
      <div className="produk-table-wrap db-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="db-table-wrap"><table className="produk-table">
          <thead>
            <tr>

              <SortableTh label="No. Pesanan" colKey="id_pesanan" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Tanggal & Waktu" colKey="tanggal" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Waktu Antar" colKey="waktu_antar" type="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Pelanggan" colKey="pelanggan.nama_lengkap" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="No. Telepon" colKey="pelanggan.no_telp" type="string" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <th>Item</th>

              <SortableTh label="Qty" colKey="totalQty" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Total Bayar" colKey="total" type="number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <SortableTh label="Status" colKey="status" type="enum" enumMap={ENUM_MAPS.status_pesanan} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

              <th>Aksi</th>

            </tr>
          </thead>
          <tbody>
            {pesananListSortedPaged.length === 0 && !loading &&
              <tr><td colSpan={10} style={{ color: "#6b7280", textAlign: "center", padding: "1.5rem" }}>Tidak ada pesanan.</td></tr>
              }
            {pesananListSortedPaged.map((p) => {
                const isUpdating = konfirmasiLoading && konfirmasiModal?.pesanan?.id_pesanan === p.id_pesanan;
                const hl = p.highlight ?? {};
                return (
                  <tr key={p.id_pesanan} style={hl.rowBg ? { background: hl.rowBg } : undefined}>
                  <td style={{ fontWeight: 500 }}>{p.id_pesanan}</td>
                  <td style={{ whiteSpace: "nowrap", fontSize: ".8125rem" }}>{p.tanggalFmt}</td>
                  <td style={{ whiteSpace: "nowrap", fontSize: ".8125rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {p.waktuAntarFmt}
                      {hl.badgeText &&
                        <span style={{
                          background: hl.badgeColor, color: "#fff",
                          borderRadius: 4, padding: "1px 6px", fontSize: ".7rem", fontWeight: 600,
                          whiteSpace: "nowrap"
                        }}>{hl.badgeText}</span>
                        }
                    </span>
                  </td>
                  <td>{p.pelanggan?.nama_lengkap ?? "-"}</td>
                  <td style={{ fontSize: ".8125rem" }}>{p.pelanggan?.no_telp ?? "-"}</td>
                  <td style={{ fontSize: ".8125rem" }}>
                    {(p.details ?? []).slice(0, 2).map((d, i) =>
                      <div key={i}>{d.produk?.nama_produk ?? "?"} × {d.qty}</div>
                      )}
                    {p.details?.length > 2 && <div style={{ color: "#6b7280" }}>+{p.details.length - 2} lainnya</div>}
                  </td>
                  <td style={{ textAlign: "center" }}>{p.totalQty}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{fmtRp(p.total)}</td>
                  <td>
                    <span className={PESANAN_BADGE[p.status] ?? "badge-status normal"}>{PESANAN_LABEL[p.status] ?? p.status}</span>
                    {p.status === "Dibatalkan" && p.pesan_pembatalan &&
                      <div style={{ fontSize: ".7rem", color: "#6b7280", marginTop: 2, maxWidth: 120,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      title={p.pesan_pembatalan}>
                        {p.pesan_pembatalan}
                      </div>
                      }
                    {p.refund_status &&
                      <div style={{ fontSize: ".7rem", fontWeight: 600, marginTop: 2,
                        color: p.refund_status === "Ditolak" ? "#b91c1c" : p.refund_status === "Disetujui" ? "#15803d" : "#b45309" }}>
                        ↩ Refund: {p.refund_status}
                      </div>
                      }
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {p.status === "Pending" && p.refund_status === "Diminta" &&
                      <>
                        <button className="db-action-link" style={{ color: "#15803d" }} disabled={isUpdating}
                        onClick={() => setBatalModal(p)}>Setujui Refund</button>
                        <span style={{ color: "#d1d5db", margin: "0 4px" }}>/</span>
                        <button className="db-action-link" onClick={() => openModal("detail", p)}>Detail</button>
                        <span style={{ color: "#d1d5db", margin: "0 4px" }}>/</span>
                        <button className="db-action-link" style={{ color: "#ef4444" }} disabled={isUpdating}
                        onClick={() => handleReject(p)}>Tolak</button>
                      </>
                      }
                    {p.status === "Pending" && p.refund_status !== "Diminta" &&
                      <>
                        <button className="db-action-link" disabled={isUpdating}
                        onClick={() => handleStatus(p, "Diproses")}>Proses</button>
                        <span style={{ color: "#d1d5db", margin: "0 4px" }}>/</span>
                        <button className="db-action-link" onClick={() => openModal("detail", p)}>Detail</button>
                        <span style={{ color: "#d1d5db", margin: "0 4px" }}>/</span>
                        <button className="db-action-link" style={{ color: "#ef4444" }} disabled={isUpdating}
                        onClick={() => setBatalModal(p)}>Batalkan</button>
                      </>
                      }
                    {p.status === "Diproses" &&
                      <>
                        <button className="db-action-link" disabled={isUpdating}
                        onClick={() => handleStatus(p, "Selesai")}>Selesai</button>
                        <span style={{ color: "#d1d5db", margin: "0 4px" }}>/</span>
                        <button className="db-action-link" onClick={() => openModal("detail", p)}>Detail</button>
                        <span style={{ color: "#d1d5db", margin: "0 4px" }}>/</span>
                        <button className="db-action-link" style={{ color: "#ef4444" }} disabled={isUpdating}
                        onClick={() => setBatalModal(p)}>Batalkan</button>
                      </>
                      }
                    {(p.status === "Selesai" || p.status === "Dibatalkan") &&
                      <button className="db-action-link" onClick={() => openModal("detail", p)}>Detail</button>
                      }
                  </td>
                </tr>);

              })}
          </tbody>
        </table>
</div>
      <Pagination page={tablePage} totalPages={tablePages} onPageChange={setTablePage} />
      </div>

      <DetailPesananModal open={modal === "detail"} onClose={closeModal} pesanan={selected} />
      <KonfirmasiStatusModal
        open={!!konfirmasiModal}
        pesanan={konfirmasiModal?.pesanan}
        newStatus={konfirmasiModal?.newStatus}
        loading={konfirmasiLoading}
        onConfirm={confirmStatus}
        onClose={() => setKonfirmasiModal(null)} />
      
      <BatalkanModal
        open={!!batalModal}
        pesanan={batalModal}
        loading={batalLoading}
        onConfirm={confirmBatal}
        onClose={() => setBatalModal(null)} />
      
      <RejectRefundModal
        open={!!rejectModal}
        pesanan={rejectModal}
        value={rejectReason}
        onChange={setRejectReason}
        loading={rejectLoading}
        onConfirm={confirmReject}
        onClose={() => setRejectModal(null)} />
      
      <ActionErrorModal open={!!actionError} message={actionError} onClose={() => setActionError(null)} />
    </div>);

}

export function KasirPesananSearchBar({ value, onChange }) {
  return (
    <SearchBar value={value} onChange={onChange} placeholder="Cari no. pesanan / pelanggan..." />);

}