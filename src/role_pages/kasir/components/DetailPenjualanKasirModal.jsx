import Modal from "../../../shared/components/Modal";
import ReadField from "../../../shared/components/ReadField";
import MapView from "../../../shared/components/MapView";



export default function DetailPenjualanKasirModal({ open, onClose, item, detail, loadingDetail }) {
  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose}
    title={`Detail ${item?.jenis === "Langsung" ? "Penjualan Langsung" : "Pesanan Online"} #${item?.no_pesanan}`}
    maxWidth="500px"
    footer={<button className="btn-secondary" onClick={onClose}>Tutup</button>}>
      
      {loadingDetail && <p className="db-loading-text">Memuat…</p>}
      {!loadingDetail && detail &&
      <>
          <ReadField label="No. Pesanan" value={detail.no} />
          <ReadField label="Waktu Penjualan" value={detail.tanggal} />
          <ReadField label="Jenis" value={detail.jenis} />
          {detail.kasir && <ReadField label="Kasir" value={detail.kasir} />}
          {detail.pelanggan && <ReadField label="Nama Penerima" value={detail.pelanggan} />}
          {detail.nama_toko && <ReadField label="Nama Toko" value={detail.nama_toko} />}
          {detail.telp && <ReadField label="No. Telepon" value={detail.telp} />}
          {detail.alamat && <ReadField label="Alamat" value={detail.alamat} />}
          {detail.lat != null && detail.lng != null &&
        <div style={{ marginTop: ".25rem", marginBottom: ".75rem" }}>
              <MapView lat={detail.lat} lng={detail.lng} height={180} />
              <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${detail.lat},${detail.lng}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1.5 text-xs text-blue-600 hover:text-blue-800 underline">
            
                🗺 Buka di Google Maps
              </a>
            </div>
        }

          {detail.catatan && <div className="form-field">
            <label>Catatan</label>
            <textarea value={detail.catatan} readOnly />
          </div>}

          {detail.waktu_antar && <ReadField label="Waktu Antar" value={detail.waktu_antar} />}
          
          <div style={{ marginTop: ".5rem", borderTop: "1px solid #e5e7eb", paddingTop: ".75rem" }}>
            <div style={{ fontWeight: 600, fontSize: ".875rem", marginBottom: ".5rem", color: "#374151" }}>
              Daftar Produk ({detail.details.length} item - total {detail.totalQty} qty)
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
                {detail.details.map((d, i) =>
              <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "4px 6px" }}>{d.nama}</td>
                    <td style={{ padding: "4px 6px", textAlign: "center" }}>{d.qty}</td>
                    <td style={{ padding: "4px 6px", textAlign: "right", color: "#6b7280" }}>{d.harga}</td>
                    <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 500 }}>{d.subtotal}</td>
                  </tr>
              )}
              </tbody>
              <tfoot>
                {detail.ongkir &&
              <tr style={{ borderTop: "1px solid #e5e7eb" }}>
                    <td colSpan={3} style={{ padding: "4px 6px", color: "#6b7280", fontSize: ".8125rem" }}>Ongkos Kirim</td>
                    <td style={{ padding: "4px 6px", textAlign: "right", color: "#6b7280" }}>{detail.ongkir}</td>
                  </tr>
              }
                <tr style={{ borderTop: "1px solid #e5e7eb" }}>
                  <td colSpan={3} style={{ padding: "4px 6px", fontWeight: 700 }}>Total</td>
                  <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 700 }}>{detail.total}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <ReadField label="Jenis Pembayaran" value={detail.pembayaran} />
          {detail.status && <ReadField label="Status" value={detail.status} />}

          {}
          {}
          {detail.refund_status && <ReadField label="Status Refund" value={detail.refund_status} />}
          {detail.refund_alasan && <div className="form-field">
            <label>Alasan Refund</label>
            <textarea value={detail.refund_alasan} readOnly />
          </div>}
          {detail.pesan_pembatalan && <div className="form-field">
            <label>Alasan Pembatalan</label>
            <textarea value={detail.pesan_pembatalan} readOnly />
          </div>}

          {detail.editHistory?.length > 0 &&
        <div style={{ marginTop: ".75rem", borderTop: "1px solid #e5e7eb", paddingTop: ".75rem" }}>
              <div style={{ fontWeight: 600, fontSize: ".875rem", marginBottom: ".5rem", color: "#374151" }}>Riwayat Perubahan Item</div>
              {detail.editHistory.map((h, i) =>
          <div key={i} style={{ fontSize: ".8125rem", padding: ".375rem 0", borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280", marginBottom: ".2rem" }}>
                    <span>{h.waktu}</span>
                    <span>oleh {h.oleh}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: ".125rem" }}>
                    <span style={{ color: "#dc2626" }}>− {h.sebelum}</span>
                    <span style={{ color: "#16a34a" }}>+ {h.sesudah}</span>
                  </div>
                  <div style={{ textAlign: "right", fontWeight: 600, color: "#374151", marginTop: ".2rem" }}>
                    Total: {h.total_sesudah}
                  </div>
                </div>
          )}
            </div>
        }
        </>
      }
    </Modal>);

}