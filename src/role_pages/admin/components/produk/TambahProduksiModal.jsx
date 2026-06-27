import { useState } from "react";
import Modal from "../../../../shared/components/Modal";
import SearchableSelect from "../../../../shared/components/SearchableSelect";
import { useSubmitLock } from "../../../../shared/hooks/useSubmitLock";






export default function TambahProduksiModal({ open, onClose, produkList, onSubmit }) {
  const [id_produk, setIdProduk] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const guard = useSubmitLock();

  const validate = () => {
    const err = {};
    if (!id_produk) err.id_produk = "Pilih produk";
    if (!jumlah || Number(jumlah) <= 0) err.jumlah = "Masukkan jumlah yang valid";
    return err;
  };

  const handleSubmit = guard(async () => {
    setApiError("");
    const err = validate();
    if (Object.keys(err).length) {setErrors(err);return;}
    setSaving(true);
    try {
      await onSubmit({ id_produk: Number(id_produk), jumlah: Number(jumlah) });
      setIdProduk("");setJumlah("");setErrors({});
      onClose();
    } catch (e) {
      setApiError(e.message);
    } finally {
      setSaving(false);
    }
  });

  const handleClose = () => {
    setIdProduk("");setJumlah("");setErrors({});setApiError("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Tambah Produksi Baru"
      maxWidth="460px"
      footer={
      <>
          <button className="btn-secondary" onClick={handleClose} disabled={saving}>Batal</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Menyimpan…" : "Tambah"}
          </button>
        </>
      }>
      
      {apiError && <p style={{ color: "#dc2626", fontSize: ".875rem" }}>{apiError}</p>}

      <div className="form-field">
        <label>Nama Produk</label>
        <SearchableSelect
          value={String(id_produk)}
          onChange={(v) => {setIdProduk(v);setErrors((p) => ({ ...p, id_produk: undefined }));}}
          placeholder="Pilih produk"
          options={produkList.
          filter((p) => p.status === "Aktif").
          map((p) => ({ value: String(p.id_produk), label: p.nama_produk }))
          } />
        
        {errors.id_produk && <span className="field-error">{errors.id_produk}</span>}
      </div>

      <div className="form-field">
        <label>Jumlah Produk</label>
        <input
          type="number"
          min="1"
          value={jumlah}
          onChange={(e) => {setJumlah(e.target.value);setErrors((p) => ({ ...p, jumlah: undefined }));}}
          placeholder="Isi jumlah produk..." />
        
        {errors.jumlah && <span className="field-error">{errors.jumlah}</span>}
      </div>
    </Modal>);

}