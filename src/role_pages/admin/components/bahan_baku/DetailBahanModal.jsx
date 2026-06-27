import Modal from "../../../../shared/components/Modal";
import { fmtDateLong, fmtRp } from "../../../../shared/utils/format";
import ReadField from "../../../../shared/components/ReadField";


export default function DetailBahanModal({ open, onClose, bahan }) {
  if (!bahan) return null;
  const totalStok = (bahan.batches ?? []).filter((b) => b.status_stok !== "Kadaluarsa" && b.status_kadaluarsa !== "Ya").reduce((s, b) => s + Number(b.stok), 0);

  return (
    <Modal open={open} onClose={onClose} title="Detail Bahan Baku" maxWidth="500px"
    footer={<button className="btn-secondary" onClick={onClose}>Tutup</button>}>

      <ReadField label="ID Bahan" value={bahan.id_bahan} />
      <ReadField label="Merek Bahan Baku" value={bahan.merek} />
      <ReadField label="Jenis Bahan Baku" value={bahan.jenis_bahan} />
      <ReadField label="Satuan" value={bahan.satuan} />
      <ReadField label="Stok Minimal" value={bahan.stok_minimal} />
      <ReadField label="Batas Peringatan Sebelum Kadaluarsa (hari)" value={bahan.batas_peringatan_hari} />

      {(bahan.batches ?? []).map((b) =>
      <div key={b.id_batch_bb} className="batch-section">
          <div className="batch-section-title">Batch #{b.id_batch_bb}</div>
          <ReadField label="Stok" value={b.stok} />
          <ReadField label="No. Pembelian" value={b.no_pembelian} />
          <ReadField label="Supplier" value={b.supplier_nama} />
          <ReadField label="Harga Beli/Sat" value={b.harga_satuan != null ? fmtRp(b.harga_satuan) : "-"} />
          <ReadField label="Tgl. Beli" value={fmtDateLong(b.tgl_beli)} />
          <ReadField label="Kadaluarsa" value={fmtDateLong(b.kadaluarsa)} />
        </div>
      )}

      <ReadField label="Ttl. Stok Valid" value={totalStok} />
      <ReadField label="Status Produk" value={bahan.status} />
      {bahan.deskripsi && <div className="form-field">
        <label>Deskripsi</label>
        <textarea value={bahan.deskripsi} readOnly />
      </div>}
    </Modal>);

}