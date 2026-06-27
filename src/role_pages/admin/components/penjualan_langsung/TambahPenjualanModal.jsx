import { useEnums, sel } from "../../../../shared/hooks/useEnums";
import { useState } from "react";
import Modal from "../../../../shared/components/Modal";
import ItemSection from "./ItemSection";
import SearchableSelect from "../../../../shared/components/SearchableSelect";
import { useSubmitLock } from "../../../../shared/hooks/useSubmitLock";



export default function TambahPenjualanModal({ open, onClose, kasirList = [], produkList = [], onSubmit }) {
  const { enums } = useEnums();
  const jenisBayarList = sel.jenisBayar(enums);
  const [id_user, setIdUser] = useState("");
  const [jenis_pembayaran, setJenisBayar] = useState("");
  const [items, setItems] = useState([{ id_produk: "", qty: 1 }]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const guard = useSubmitLock();

  const validate = () => {
    const err = {};
    if (!id_user) err.id_user = "Pilih kasir";
    if (!jenis_pembayaran) err.jenis_pembayaran = "Pilih jenis pembayaran";
    if (!items.filter((i) => i.id_produk && Number(i.qty) > 0).length) err.items = "Tambahkan minimal 1 item";
    return err;
  };
  const handleSubmit = guard(async () => {
    setApiError("");
    const err = validate();if (Object.keys(err).length) {setErrors(err);return;}
    setSaving(true);
    try {
      await onSubmit({ id_user, jenis_pembayaran, items: items.filter((i) => i.id_produk && Number(i.qty) > 0).map((i) => ({ id_produk: Number(i.id_produk), qty: Number(i.qty) })) });
      setId_user("");setJenisBayar("");setItems([{ id_produk: "", qty: 1 }]);setErrors({});onClose();
    } catch (e) {setApiError(e.message);} finally {setSaving(false);}
  });
  const setId_user = (v) => setIdUser(v);
  const reset = () => {setIdUser("");setJenisBayar("");setItems([{ id_produk: "", qty: 1 }]);setErrors({});setApiError("");};
  return (
    <Modal open={open} onClose={() => {reset();onClose();}} title="Tambah Penjualan Langsung Baru" maxWidth="520px"
    footer={<><button className="btn-secondary" onClick={() => {reset();onClose();}} disabled={saving}>Batal</button>
               <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan…" : "Tambah"}</button></>}>
      {apiError && <p style={{ color: "#dc2626", fontSize: ".875rem" }}>{apiError}</p>}
      <div className="form-field">
        <label>Kasir</label>
        <SearchableSelect
          value={id_user}
          onChange={(v) => {setIdUser(v);setErrors((p) => ({ ...p, id_user: undefined }));}}
          placeholder="Pilih kasir..."
          options={kasirList.map((k) => ({ value: k.id, label: k.nama_lengkap }))} />
        
        {errors.id_user && <span className="field-error">{errors.id_user}</span>}
      </div>
      <ItemSection items={items} produkList={produkList} onChange={setItems} />
      {errors.items && <span className="field-error">{errors.items}</span>}
      <div className="form-field">
        <label>Jenis Pembayaran</label>
        <SearchableSelect
          value={jenis_pembayaran}
          onChange={(v) => {setJenisBayar(v);setErrors((p) => ({ ...p, jenis_pembayaran: undefined }));}}
          placeholder="Pilih jenis pembayaran..."
          options={jenisBayarList.map((j) => ({ value: j, label: j }))} />
        
        {errors.jenis_pembayaran && <span className="field-error">{errors.jenis_pembayaran}</span>}
      </div>
    </Modal>);

}