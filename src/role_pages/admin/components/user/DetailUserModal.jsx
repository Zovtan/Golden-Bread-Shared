import Modal from "../../../../shared/components/Modal";
import ReadField from "../../../../shared/components/ReadField";
import ContactButtons from "../../../../shared/components/ContactButtons";


export default function DetailUserModal({ open, onClose, user }) {
  if (!user) return null;

  return (
    <Modal open={open} onClose={onClose} title="Detail User" maxWidth="480px"
    footer={<button className="btn-secondary" onClick={onClose}>Tutup</button>}>

      <ReadField label="ID User" value={user.displayId} />
      <ReadField label="Nama Lengkap" value={user.nama_lengkap} />
      <ReadField label="Nomor Telepon" value={user.no_telp} />
      <ContactButtons phone={user.no_telp} />
      <ReadField label="Email" value={user.email} />
      <ReadField label="Role" value={user.role} />
      <ReadField label="Status" value={user.statusLabel} />
      <ReadField label="Terakhir Login" value={user.lastLogin} />
    </Modal>);

}