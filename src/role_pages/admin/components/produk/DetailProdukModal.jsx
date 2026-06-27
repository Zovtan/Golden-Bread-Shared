import Modal from "../../../../shared/components/Modal";
import ReadField from "../../../../shared/components/ReadField";
import { fmtRp, fmtDate, fmtDateTime } from "../../../../shared/utils/format";


export default function DetailProdukModal({ open, onClose, produk }) {
  if (!produk) return null;

  const totalStok = (produk.batches ?? []).
  filter((b) => b.status_stok !== "Kadaluarsa" && b.status_kadaluarsa !== "Ya").
  reduce((s, b) => s + b.stok, 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detail Produk"
      maxWidth="500px"
      footer={
      <button className="btn-secondary" onClick={onClose}>Tutup</button>
      }>
      
      {}
      <div className="detail-field">
        <label>Foto Produk</label>
        <div style={{ width: "100%", aspectRatio: "16/9", border: "1px solid #d1d5db", borderRadius: 8, overflow: "hidden", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {produk.gambar ?
          <img src={produk.gambar} alt={produk.nama_produk} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> :
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
          }
        </div>
      </div>

      <ReadField label="ID Produk" value={String(produk.id_produk)} />
      <ReadField label="Nama Produk" value={produk.nama_produk} />
      <ReadField label="Kategori" value={produk.kategori_produk ?? produk.kategori} />
      <ReadField label="Stok Minimal (Pcs)" value={produk.stok_minimal} />
      <ReadField label="Estimasi Kadaluarsa (Hari)" value={produk.estimasi_kadaluarsa_hari} />
      <ReadField label="Batas Peringatan Sebelum Kadaluarsa (Hari)" value={produk.batas_peringatan_hari} />

      {}
      {(produk.batches ?? []).map((b) =>
      <div key={b.id_batch} className="batch-section">
          <div className="batch-section-title">Batch #{b.id_batch}</div>
          <ReadField label="Stok" value={b.stok} />
          <ReadField label="Waktu Produksi" value={fmtDateTime(b.tgl_produksi)} />
          <ReadField label="Kadaluarsa" value={fmtDate(b.kadaluarsa)} />
        </div>
      )}

      <ReadField label="Ttl. Stok Valid (Pcs)" value={totalStok} />
      <ReadField label="Harga Satuan (Rp)" value={fmtRp(produk.harga_satuan)} />
      <ReadField label="Status Produk" value={produk.status} />

      {produk.deskripsi && <div className="form-field">
        <label>Deskripsi</label>
        <textarea value={produk.deskripsi} readOnly />
      </div>}

      {produk.resep && <div className="form-field">
        <label>Resep</label>
        <textarea value={produk.resep} readOnly />
      </div>}
    </Modal>);

}