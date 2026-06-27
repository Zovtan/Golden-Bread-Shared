import Modal from "../../../../shared/components/Modal";
import ReadField from "../../../../shared/components/ReadField";
import ContactButtons from "../../../../shared/components/ContactButtons";
import { fmtRp } from "../../../../shared/utils/format";


export default function DetailPembelianModal({ open, onClose, pembelian }) {
  if (!pembelian) return null;
  const details = pembelian.details ?? [];
  return (
    <Modal open={open} onClose={onClose} title="Detail Pembelian" maxWidth="480px"
    footer={<button className="btn-secondary" onClick={onClose}>Tutup</button>}>
      <ReadField label="No. Pembelian" value={pembelian.id_pembelian} />
      <ReadField label="No. Faktur" value={pembelian.no_faktur ?? "-"} />
      <ReadField label="Tanggal" value={pembelian.tanggal} />
      <ReadField label="Status Pembayaran" value={pembelian.status_pembayaran} />

      <div className="batch-section">
        <div className="batch-section-title">Supplier</div>
        <div className="detail-field-value">
          <ReadField label="Nama" value={pembelian.supplier} />
          <ReadField label="No. Telepon" value={pembelian.supplier_telp} />
          <ContactButtons phone={pembelian.supplier_telp} />
          <ReadField label="Alamat" value={pembelian.supplier_alamat} />
        </div>
      </div>

      <div className="batch-section">
        <div className="batch-section-title">Daftar Bahan ({details.length} item - total {pembelian.total_qty} qty)</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".875rem", marginTop: ".375rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontSize: ".8rem" }}>
              <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: 500 }}>Bahan</th>
              <th style={{ textAlign: "center", padding: "4px 6px", fontWeight: 500 }}>Qty</th>
              <th style={{ textAlign: "center", padding: "4px 6px", fontWeight: 500 }}>Satuan</th>
              <th style={{ textAlign: "right", padding: "4px 6px", fontWeight: 500 }}>Harga/sat</th>
              <th style={{ textAlign: "right", padding: "4px 6px", fontWeight: 500 }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {details.map((d, i) =>
            <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "5px 6px" }}>
                  {d.merek ? <><strong>{d.merek}</strong><br /><span style={{ color: "#6b7280", fontSize: ".8rem" }}>{d.jenis_bahan}</span></> : d.jenis_bahan}
                  {d.kadaluarsa && <div style={{ color: "#9ca3af", fontSize: ".75rem" }}>Exp: {d.kadaluarsa}</div>}
                </td>
                <td style={{ textAlign: "center", padding: "5px 6px" }}>{d.qty}</td>
                <td style={{ textAlign: "center", padding: "5px 6px", color: "#6b7280" }}>{d.satuan}</td>
                <td style={{ textAlign: "right", padding: "5px 6px" }}>{fmtRp(d.harga_satuan)}</td>
                <td style={{ textAlign: "right", padding: "5px 6px", fontWeight: 500 }}>{fmtRp(d.qty * d.harga_satuan)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid #e5e7eb" }}>
              <td colSpan={3} />
              <td style={{ textAlign: "right", padding: "6px 6px", fontWeight: 600, color: "#374151" }}>Total</td>
              <td style={{ textAlign: "right", padding: "6px 6px", fontWeight: 700 }}>{fmtRp(pembelian.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Modal>);

}