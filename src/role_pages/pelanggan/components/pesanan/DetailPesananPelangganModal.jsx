import ReadField from "../../../../shared/components/ReadField";
import { fmtRp } from "../../../../shared/utils/format";



const STEPS = ["Dipesan", "Dikonfirmasi", "Diproses", "Selesai"];
const STATUS_STEP = { Pending: 0, Diproses: 2, Selesai: 3, Dibatalkan: -1 };

function StepBar({ status }) {
  const activeStep = STATUS_STEP[status] ?? 0;
  const cancelled = status === "Dibatalkan";
  const items = [];
  STEPS.forEach((label, i) => {
    const done = !cancelled && i < activeStep;
    const active = !cancelled && i === activeStep;
    items.push(
      <div key={`s${i}`} className="detail-step">
        <div className={`detail-step-circle${done ? " done" : active ? " active" : ""}`}>
          {done ? "✓" : cancelled && i === 0 ? "✕" : i + 1}
        </div>
        <div className={`detail-step-label${done || active ? " active" : ""}`}>{label}</div>
      </div>
    );
    if (i < STEPS.length - 1) {
      items.push(<div key={`l${i}`} className={`detail-step-line${done ? " done" : ""}`} />);
    }
  });
  return <div className="detail-stepbar">{items}</div>;
}


export default function DetailPesananPelangganModal({ open, onClose, pesanan }) {
  if (!open || !pesanan) return null;

  const details = pesanan.details ?? [];
  const subtotal = details.reduce((s, d) => s + d.qty * Number(d.harga_satuan), 0);
  const ongkir = Number(pesanan.ongkir ?? 0);
  const total = pesanan.total ?? subtotal + ongkir;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="detail-pesanan-box" onClick={(e) => e.stopPropagation()}>
        {}
        <div className="detail-pesanan-header">
          <div>
            <div className="detail-pesanan-nomor">#{pesanan.id_pesanan}</div>
            <div className="detail-pesanan-nama">{pesanan.penerimaNama ?? "-"}</div>
            <div className="detail-pesanan-tgl">{pesanan.tanggalFmt}</div>
          </div>
          <span className={`db-badge ${pesanan.status?.toLowerCase()}`}>{pesanan.label}</span>
        </div>

        {}
        <StepBar status={pesanan.status} />

        {}
        <div className="detail-section">
          <div className="detail-section-title">PRODUK PESANAN</div>
          <div style={{ padding: "0 1.125rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb", color: "#6b7280" }}>
                <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: 500 }}>Produk</th>
                <th style={{ textAlign: "center", padding: "4px 6px" }}>Qty</th>
                <th style={{ textAlign: "right", padding: "4px 6px" }}>Harga/sat</th>
                <th style={{ textAlign: "right", padding: "4px 6px" }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {details.map((d, i) =>
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "4px 6px" }}>
                    <div style={{ fontWeight: 500 }}>{d.produk?.nama_produk ?? "-"}</div>
                    <div style={{ fontSize: ".75rem", color: "#6b7280" }}>{d.produk?.kategori_enum?.nilai ?? "-"}</div>
                  </td>
                  <td style={{ padding: "4px 6px", textAlign: "center" }}>{d.qty}</td>
                  <td style={{ padding: "4px 6px", textAlign: "right", color: "#6b7280" }}>{fmtRp(d.harga_satuan)}</td>
                  <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 500 }}>{fmtRp(d.qty * Number(d.harga_satuan))}</td>
                </tr>
                )}
            </tbody>
            <tfoot>
              {ongkir > 0 &&
                <tr style={{ borderTop: "1px solid #e5e7eb" }}>
                  <td colSpan={3} style={{ padding: "4px 6px", color: "#6b7280", fontSize: ".8125rem" }}>Ongkos Kirim</td>
                  <td style={{ padding: "4px 6px", textAlign: "right", color: "#6b7280" }}>{fmtRp(ongkir)}</td>
                </tr>
                }
              <tr style={{ borderTop: "1px solid #e5e7eb" }}>
                <td colSpan={3} style={{ padding: "4px 6px", fontWeight: 700 }}>Total</td>
                <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 700 }}>{fmtRp(total)}</td>
              </tr>
            </tfoot>
          </table>
          </div>
        </div>

        {}
        <div className="detail-section">
          <div className="detail-section-title">PENGIRIMAN</div>
          <ReadField label="Layanan" value={pesanan.jenis} />
          <ReadField label="Alamat" value={pesanan.alamatPenerima ?? "-"} />
          <ReadField label="Penerima" value={pesanan.penerimaNama ?? "-"} />
          <ReadField label="Nomor Telepon" value={pesanan.telp ?? "-"} />
        </div>

        {}
        <div className="detail-section">
          <div className="detail-section-title">PEMBAYARAN</div>
          <ReadField label="Metode" value={pesanan.jenis_pembayaran ?? "-"} />
        </div>

        {}
        {pesanan.refund_status &&
        <div className="detail-section">
            <div className="detail-section-title">REFUND</div>
            <ReadField label="Status Refund" value={pesanan.refund_status} />
            {pesanan.refund_alasan &&
          <div className="form-field">
                <label>Alasan Refund</label>
                <textarea value={pesanan.refund_alasan} readOnly rows={3} className="bg-gray-50 cursor-default" />
              </div>
          }
          </div>
        }

        {}
        {pesanan.pesan_pembatalan &&
        <div className="detail-section">
            <div className="detail-section-title">PEMBATALAN</div>
            <div className="form-field">
              <label>Alasan Pembatalan</label>
              <textarea value={pesanan.pesan_pembatalan} readOnly rows={3} className="bg-gray-50 cursor-default" />
            </div>
          </div>
        }

        <div style={{ padding: "0 1rem 1rem" }}>
          <button className="btn-primary" style={{ display: 'flex', width: "100%", justifyContent: "center", marginTop: "1rem" }} onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>);

}