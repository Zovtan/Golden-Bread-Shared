import Modal from "../../../../shared/components/Modal";
import ReadField from "../../../../shared/components/ReadField";
import { fmtRp } from "../../../../shared/utils/format";


export default function DetailPenjualanModal({ open, onClose, penjualan }) {
  if (!penjualan) return null;

  const details = penjualan.details ?? [];
  const totalQty = details.reduce((s, d) => s + Number(d.qty), 0);
  const total = penjualan.total ?? details.reduce((s, d) => s + Number(d.qty) * Number(d.harga_satuan), 0);

  return (
    <Modal
      open={open} onClose={onClose}
      title="Detail Penjualan Langsung"
      maxWidth="520px"
      footer={<button className="btn-secondary" onClick={onClose}>Tutup</button>}>
      
      <ReadField label="No. Penjualan" value={penjualan.no_pesanan} />
      <ReadField label="Waktu Penjualan" value={penjualan.waktu_fmt} />
      <ReadField label="Kasir" value={penjualan.kasir_nama} />

      <div style={{ marginTop: ".5rem", borderTop: "1px solid #e5e7eb", paddingTop: ".75rem" }}>
        <div style={{ fontWeight: 600, fontSize: ".875rem", marginBottom: ".5rem", color: "#374151" }}>
          Daftar Produk ({totalQty} item)
        </div>
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
                <td style={{ padding: "4px 6px" }}>{d.produk?.nama_produk ?? d.nama_produk ?? "-"}</td>
                <td style={{ padding: "4px 6px", textAlign: "center" }}>{d.qty}</td>
                <td style={{ padding: "4px 6px", textAlign: "right", color: "#6b7280" }}>{fmtRp(d.harga_satuan)}</td>
                <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 500 }}>{fmtRp(Number(d.qty) * Number(d.harga_satuan))}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "1px solid #e5e7eb" }}>
              <td colSpan={3} style={{ padding: "4px 6px", fontWeight: 700 }}>Total</td>
              <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 700 }}>{fmtRp(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <ReadField label="Jenis Pembayaran" value={penjualan.pembayaran} />
    </Modal>);

}