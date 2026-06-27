import { useState } from "react";
import { usePelangganHistoriPesanan } from "../hooks/usePelangganHistoriPesanan";
import DetailPesananPelangganModal from "../components/pesanan/DetailPesananPelangganModal";
import BatalkanPesananModal from "../components/pesanan/BatalkanPesananModal";
import PesananErrorModal from "../components/pesanan/PesananErrorModal";
import BatalSuksesModal from "../components/pesanan/BatalSuksesModal";
import AjukanRefundModal from "../components/pesanan/AjukanRefundModal";
import RefundSuksesModal from "../components/pesanan/RefundSuksesModal";
import KelolaPesananModal from "../components/pesanan/KelolaPesananModal";
import { fmtRp } from "../../../shared/utils/format";
import Pagination from "../../../shared/components/Pagination";
import { PESANAN_BADGE } from "../../../shared/utils/badgeMaps";
import { useSubmitLock } from "../../../shared/hooks/useSubmitLock";

export default function PelangganHistoriPesanan({ profile, search = "" }) {
  const {
    pesananList, allPesanan, loading, error,
    filterStatus, setFilterStatus,
    page, setPage, totalPages,
    STATUS_TABS, STATUS_LABEL,
    batalkanPesanan, requestRefund, resumePayment
  } = usePelangganHistoriPesanan(profile?.id, search);

  const [detail, setDetail] = useState(null);
  const [batalModal, setBatalModal] = useState(null);
  const [batalReason, setBatalReason] = useState("");
  const [batalLoading, setBatalLoading] = useState(false);
  const [batalSukses, setBatalSukses] = useState(false);
  const [batalGagal, setBatalGagal] = useState(null);
  const [gagalTitle, setGagalTitle] = useState("Terjadi Kesalahan");

  const [refundModal, setRefundModal] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundSukses, setRefundSukses] = useState(false);

  const [kelolaModal, setKelolaModal] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [unpaidDismissed, setUnpaidDismissed] = useState(false);


  const guard = useSubmitLock();

  const handleBatalkan = (id) => {setBatalReason("");setBatalModal(id);};

  const confirmBatal = guard(async () => {
    if (!batalModal) return;
    setBatalLoading(true);
    try {
      await batalkanPesanan(batalModal, batalReason.trim() || null);
      setBatalModal(null);setBatalReason("");
      setBatalSukses(true);
    } catch (e) {
      setBatalModal(null);setBatalReason("");
      setGagalTitle("Gagal Membatalkan");
      setBatalGagal(e.message);
    } finally {
      setBatalLoading(false);
    }
  });

  const confirmRefund = guard(async () => {
    if (!refundModal) return;
    setRefundLoading(true);
    try {
      await requestRefund(refundModal, refundReason.trim() || null);
      setRefundModal(null);setRefundReason("");
      setRefundSukses(true);
    } catch (e) {
      setRefundModal(null);
      setGagalTitle("Gagal Mengajukan Refund");
      setBatalGagal(e.message);
    } finally {
      setRefundLoading(false);
    }
  });

  const confirmResume = guard(async () => {
    if (!kelolaModal) return;
    setResumeLoading(true);
    try {
      await resumePayment(kelolaModal.id_pesanan);
      setKelolaModal(null);
    } catch (e) {
      setKelolaModal(null);
      setGagalTitle("Gagal Melanjutkan Pembayaran");
      setBatalGagal(e.message);
    } finally {
      setResumeLoading(false);
    }
  });


  const batalFromKelola = () => {
    const id = kelolaModal?.id_pesanan;
    setKelolaModal(null);
    if (id) {setBatalReason("");setBatalModal(id);}
  };


  const isUnpaid = (p) => p.status === "Pending_Payment";

  const isMidtransPaid = (p) => p.jenis_pembayaran === "Midtrans" && p.status === "Pending";

  const canBatal = (p) => p.status === "Pending" && !isMidtransPaid(p);

  const canRequestRefund = (p) => isMidtransPaid(p) && !p.refund_status;

  const REFUND_LABEL = { Diminta: "Refund diajukan", Disetujui: "Refund disetujui", Ditolak: "Refund ditolak" };

  const unpaidCount = (allPesanan ?? []).filter((p) => p.status === "Pending_Payment").length;

  return (
    <>
      <div className="db-card">
        {}
        {unpaidCount > 0 && !unpaidDismissed &&
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: ".75rem 1rem", marginBottom: 12 }}>
            <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>⏳</span>
            <div style={{ flex: 1, fontSize: ".8125rem", color: "#92400e" }}>
              Kamu punya <strong>{unpaidCount}</strong> pesanan yang belum dibayar. Selesaikan pembayaran agar pesanan diproses.
            </div>
            <button className="btn-secondary pesanan-action-btn" style={{ flexShrink: 0 }} onClick={() => setFilterStatus("Pending_Payment")}>Lihat</button>
            <button onClick={() => setUnpaidDismissed(true)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#92400e", fontSize: "1rem", flexShrink: 0 }}>✕</button>
          </div>
        }

        {}
        <div className="db-tabs">
          {STATUS_TABS.map((s) =>
          <button
            key={s}
            className={`db-tab${filterStatus === s ? " active" : ""}`}
            onClick={() => setFilterStatus(s)}>
            
              {s === "Semua" ? "Semua Pesanan" : STATUS_LABEL[s] ?? s}
            </button>
          )}
        </div>

        {error && <p className="db-fetch-error">{error}</p>}
        {loading ? <p className="db-loading-text">Memuat pesanan…</p> :

        pesananList.length === 0 ?
        <p style={{ color: "#6b7280", fontSize: ".875rem", padding: ".5rem 0" }}>Belum ada pesanan.</p> :



        <div className="pesanan-grid">
            {pesananList.map((p) => {
            const shown = p.details.slice(0, 2);
            const more = p.details.length - 2;
            return (
              <div key={p.id_pesanan} className="pesanan-card">
                  {}
                  <div className="pesanan-card-header">
                    <div>
                      <div className="pesanan-card-nomor">#{p.id_pesanan}</div>
                      <div className="pesanan-card-nama">{profile?.nama_lengkap}</div>
                      <div className="pesanan-card-tgl">{p.tanggalFmt}</div>
                    </div>
                    <span className={PESANAN_BADGE[p.status] ?? "badge-status normal"}>{p.label}</span>
                  </div>

                  {}
                  {shown.map((d, i) =>
                <div key={i} className="pesanan-card-item">
                      <div className="pesanan-card-item-info">
                        <div className="pesanan-card-item-name">{d.produk?.nama_produk ?? "-"}</div>
                        <div className="pesanan-card-item-cat">{d.produk?.kategori_enum?.nilai ?? "-"}</div>
                      </div>
                      <div className="pesanan-card-item-qty">×{d.qty}</div>
                      <div className="pesanan-card-item-price">{fmtRp(d.qty * Number(d.harga_satuan))}</div>
                    </div>
                )}
                  {more > 0 &&
                <div className="pesanan-card-more">+{more} Produk Lainnya</div>
                }

                  {}
                  <div className="pesanan-card-tags">
                    <span className="pesanan-tag">{p.jenis}</span>
                    {profile?.alamat && <span className="pesanan-tag">{profile.alamat.split(",")[0]}</span>}
                  </div>

                  {}
                  {p.refund_status &&
                <div style={{
                  fontSize: ".75rem", fontWeight: 600, marginTop: ".25rem",
                  color: p.refund_status === "Ditolak" ? "#b91c1c" :
                  p.refund_status === "Disetujui" ? "#15803d" : "#b45309"
                }}>
                      ↩ {REFUND_LABEL[p.refund_status] ?? p.refund_status}
                    </div>
                }

                  {}
                  <div className="pesanan-card-footer">
                    <div>
                      <div className="pesanan-card-total-label">Total</div>
                      <div className="pesanan-card-total">{fmtRp(p.total)}</div>
                    </div>
                    <div style={{ display: "flex", gap: ".625rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {isUnpaid(p) &&
                    <button className="btn-secondary pesanan-action-btn" onClick={() => setKelolaModal(p)}>
                          Kelola Pesanan
                        </button>
                    }
                      {canBatal(p) &&
                    <button className="btn-secondary pesanan-action-btn" onClick={() => handleBatalkan(p.id_pesanan)}>
                          Batalkan
                        </button>
                    }
                      {canRequestRefund(p) &&
                    <button className="btn-secondary pesanan-action-btn" onClick={() => {setRefundReason("");setRefundModal(p.id_pesanan);}}>
                          Ajukan Refund
                        </button>
                    }
                      <button className="btn-primary pesanan-action-btn" onClick={() => setDetail(p)}>
                        Detail
                      </button>
                    </div>
                  </div>
                </div>);

          })}
          </div>
        }

        {}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} variant="amber" />
      </div>

      <DetailPesananPelangganModal
        open={!!detail}
        onClose={() => setDetail(null)}
        pesanan={detail ? {
          ...detail,
          penerimaNama: profile?.nama_lengkap,
          alamatPenerima: profile?.alamat,
          telp: profile?.no_telp
        } : null} />
      

      <BatalkanPesananModal
        open={!!batalModal}
        pesananId={batalModal}
        value={batalReason}
        onChange={setBatalReason}
        loading={batalLoading}
        onConfirm={confirmBatal}
        onClose={() => !batalLoading && (setBatalModal(null), setBatalReason(""))} />
      

      <BatalSuksesModal
        open={batalSukses}
        onClose={() => setBatalSukses(false)} />
      

      <PesananErrorModal
        open={!!batalGagal}
        title={gagalTitle}
        pesan={batalGagal}
        onClose={() => setBatalGagal(null)} />
      

      <AjukanRefundModal
        open={!!refundModal}
        pesananId={refundModal}
        value={refundReason}
        onChange={setRefundReason}
        loading={refundLoading}
        onConfirm={confirmRefund}
        onClose={() => !refundLoading && setRefundModal(null)} />
      

      <RefundSuksesModal open={refundSukses} onClose={() => setRefundSukses(false)} />

      <KelolaPesananModal
        open={!!kelolaModal}
        pesanan={kelolaModal}
        loading={resumeLoading}
        onResume={confirmResume}
        onBatal={batalFromKelola}
        onClose={() => !resumeLoading && setKelolaModal(null)} />
      
    </>);

}