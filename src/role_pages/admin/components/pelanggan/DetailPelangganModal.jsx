import Modal from "../../../../shared/components/Modal";
import { fmtRpDecimal } from "../../../../shared/utils/format";
import ReadField from "../../../../shared/components/ReadField";
import ContactButtons from "../../../../shared/components/ContactButtons";


export default function DetailPelangganModal({ open, onClose, pelanggan }) {
  if (!pelanggan) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detail Pelanggan"
      maxWidth="480px"
      footer={<button className="btn-secondary" onClick={onClose}>Tutup</button>}>
      
      <ReadField label="ID Pelanggan" value={pelanggan.displayId} />
      <ReadField label="Nama Pelanggan" value={pelanggan.nama_lengkap} />
      <ReadField label="Nama Toko" value={pelanggan.nama_toko} />
      <ReadField label="Jenis Pelanggan" value={pelanggan.jenis_pelanggan} />
      <ReadField label="Nomor Telepon" value={pelanggan.no_telp} />
      <ContactButtons phone={pelanggan.no_telp} />
      <ReadField label="Email" value={pelanggan.email} />
      <ReadField label="Alamat" value={pelanggan.alamat} />
      <ReadField label="Total Transaksi" value={pelanggan.totalTrx} />
      <ReadField label="Total Nilai Transaksi" value={fmtRpDecimal(pelanggan.totalNilai)} />
    </Modal>);

}