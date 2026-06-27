import Modal from "../../../../shared/components/Modal";
import ReadField from "../../../../shared/components/ReadField";
import MapView from "../../../../shared/components/MapView";
import ContactButtons from "../../../../shared/components/ContactButtons";
import { fmtRp } from "../../../../shared/utils/format";


export default function DetailPesananModal({ open, onClose, pesanan }) {
  if (!pesanan) return null;

  const telp = pesanan.no_telp_penerima ?? pesanan.pelanggan?.no_telp;
  const details = pesanan.details ?? [];
  const totalItem = details.reduce((s, d) => s + Number(d.qty), 0);
  const subtotal = details.reduce((s, d) => s + Number(d.qty) * Number(d.harga_satuan), 0);
  const ongkir = Number(pesanan.ongkir ?? 0);
  const total = pesanan.total ?? subtotal + ongkir;

  return (
    <Modal open={open} onClose={onClose} title="Detail Penjualan Online" maxWidth="520px"
    footer={<button className="btn-secondary" onClick={onClose}>Tutup</button>}>

      <ReadField label="No. Pesanan" value={pesanan.id_pesanan} />
      <ReadField label="Waktu Penjualan" value={pesanan.tanggalFmt} />
      <ReadField label="Waktu Antar" value={pesanan.waktuAntarFmt} />
      <ReadField label="Nama Penerima" value={pesanan.nama_penerima ?? pesanan.pelanggan?.nama_lengkap} />
      {pesanan.pelanggan?.nama_toko && <ReadField label="Nama Toko" value={pesanan.pelanggan.nama_toko} />}
      <ReadField label="No. Telepon" value={telp} />
      <ContactButtons phone={telp} />
      <ReadField label="Alamat" value={pesanan.alamat_pengiriman ?? pesanan.pelanggan?.alamat} />
      {pesanan.lat && pesanan.lng &&
      <div style={{ marginTop: ".25rem", marginBottom: ".75rem" }}>
          <MapView lat={pesanan.lat} lng={pesanan.lng} height={180} />
          <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${pesanan.lat},${pesanan.lng}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-1.5 text-xs text-blue-600 hover:text-blue-800 underline">
          
            🗺 Buka di Google Maps
          </a>
        </div>
      }
      {pesanan.catatan && <div className="form-field">
        <label>Catatan</label>
        <textarea value={pesanan.catatan} readOnly />
      </div>}

      <div style={{ marginTop: ".5rem", borderTop: "1px solid #e5e7eb", paddingTop: ".75rem" }}>
        <div style={{ fontWeight: 600, fontSize: ".875rem", marginBottom: ".5rem", color: "#374151" }}>
          Daftar Produk ({details.length} item - total {totalItem} qty)
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
                <td style={{ padding: "4px 6px" }}>{d.produk?.nama_produk ?? "-"}</td>
                <td style={{ padding: "4px 6px", textAlign: "center" }}>{d.qty}</td>
                <td style={{ padding: "4px 6px", textAlign: "right", color: "#6b7280" }}>{fmtRp(d.harga_satuan)}</td>
                <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 500 }}>{fmtRp(Number(d.qty) * Number(d.harga_satuan))}</td>
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


      <ReadField label="Jenis Pembayaran" value={pesanan.jenis_pembayaran} />
      {pesanan.midtrans_order_id && <ReadField label="Midtrans Order ID" value={pesanan.midtrans_order_id} />}

      <ReadField label="Status" value={pesanan.status} />

      {}
      {pesanan.refund_status && <ReadField label="Status Refund" value={pesanan.refund_status} />}
      {pesanan.refund_alasan && <div className="form-field">
        <label>Alasan Refund</label>
        <textarea value={pesanan.refund_alasan} readOnly />
      </div>}
      {pesanan.pesan_pembatalan && <div className="form-field">
        <label>Alasan Pembatalan</label>
        <textarea value={pesanan.pesan_pembatalan} readOnly />
      </div>}

    </Modal>);

}