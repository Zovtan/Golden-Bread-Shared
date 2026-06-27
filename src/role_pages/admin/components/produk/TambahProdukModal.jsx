import { useEnums, sel } from "../../../../shared/hooks/useEnums";
import { useState } from "react";
import Modal from "../../../../shared/components/Modal";
import SearchableSelect from "../../../../shared/components/SearchableSelect";
import { useSubmitLock } from "../../../../shared/hooks/useSubmitLock";
import { trimStrings } from "../../../../shared/utils/trimStrings";

const INIT = {
  nama_produk: "", kategori_produk: "", harga_satuan: "",
  stok_minimal: "", estimasi_kadaluarsa_hari: "",
  batas_peringatan_hari: "", deskripsi: "", resep: ""
};



export default function TambahProdukModal({ open, onClose, onSubmit }) {
  const { enums } = useEnums();
  const kategoriList = sel.produkKategori(enums);
  const [form, setForm] = useState(INIT);
  const [gambarFile, setGambarFile] = useState(null);
  const [gambarName, setGambarName] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const guard = useSubmitLock();

  const set = (k) => (e) => {setForm((f) => ({ ...f, [k]: e.target.value }));setErrors((p) => ({ ...p, [k]: undefined }));};

  const validate = () => {
    const err = {};
    if (!form.nama_produk.trim()) err.nama_produk = "Wajib diisi";
    if (!form.kategori_produk) err.kategori_produk = "Pilih kategori";
    if (!form.harga_satuan || isNaN(Number(form.harga_satuan)) || Number(form.harga_satuan) <= 0) err.harga_satuan = "Angka valid";
    if (!form.stok_minimal || isNaN(Number(form.stok_minimal))) err.stok_minimal = "Angka valid";
    if (!form.estimasi_kadaluarsa_hari || isNaN(Number(form.estimasi_kadaluarsa_hari)) || Number(form.estimasi_kadaluarsa_hari) <= 0) err.estimasi_kadaluarsa_hari = "Angka valid";
    if (!form.batas_peringatan_hari || isNaN(Number(form.batas_peringatan_hari)) || Number(form.batas_peringatan_hari) <= 0) err.batas_peringatan_hari = "Angka valid";
    return err;
  };

  const handleSubmit = guard(async () => {
    setApiError("");
    const err = validate();
    if (Object.keys(err).length) {setErrors(err);return;}
    setSaving(true);
    try {
      await onSubmit(trimStrings({
        ...form,
        harga_satuan: Number(form.harga_satuan), stok_minimal: Number(form.stok_minimal),
        estimasi_kadaluarsa_hari: Number(form.estimasi_kadaluarsa_hari),
        batas_peringatan_hari: Number(form.batas_peringatan_hari),
        gambarFile
      }));
      setForm(INIT);setGambarFile(null);setGambarName("");setErrors({});onClose();
    } catch (e) {setApiError(e.message);} finally
    {setSaving(false);}
  });
  const handleClose = () => {setForm(INIT);setGambarFile(null);setGambarName("");setErrors({});setApiError("");onClose();};

  return (
    <Modal open={open} onClose={handleClose} title="Tambah Produk Baru"
    footer={<><button className="btn-secondary" onClick={handleClose} disabled={saving}>Batal</button>
               <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan…" : "Tambah"}</button></>}>
      {apiError && <p style={{ color: "#dc2626", fontSize: ".875rem" }}>{apiError}</p>}
      <div className="form-field">
        <label>Foto Produk</label>
        <label className="form-upload-btn"><span>⬆</span><span>{gambarName || "Belum ada foto terpilih"}</span>
          <input type="file" accept="image/*" onChange={(e) => {const f = e.target.files?.[0];if (f) {setGambarFile(f);setGambarName(f.name);}}} style={{ display: "none" }} />
        </label>
      </div>
      <div className="form-field">
        <label>Nama Produk</label>
        <input type="text" value={form.nama_produk} onChange={set("nama_produk")} placeholder="Isi nama produk..." />
        {errors.nama_produk && <span className="field-error">{errors.nama_produk}</span>}
      </div>
      <div className="form-field">
        <label>Kategori</label>
        <SearchableSelect
          value={form.kategori_produk}
          onChange={(v) => {setForm((f) => ({ ...f, kategori_produk: v }));setErrors((p) => ({ ...p, kategori_produk: undefined }));}}
          placeholder="Pilih kategori"
          options={kategoriList.map((k) => ({ value: k, label: k }))} />
        
        {errors.kategori_produk && <span className="field-error">{errors.kategori_produk}</span>}
      </div>
      <div className="form-row">
        <div className="form-field">
          <label>Stok Minimal (Pcs)</label>
          <input type="number" min="1" value={form.stok_minimal} onChange={set("stok_minimal")} placeholder="..." />
          {errors.stok_minimal && <span className="field-error">{errors.stok_minimal}</span>}
        </div>
        <div className="form-field">
          <label>Harga Satuan (Rp)</label>
          <input type="number" min="1" value={form.harga_satuan} onChange={set("harga_satuan")} placeholder="..." />
          {errors.harga_satuan && <span className="field-error">{errors.harga_satuan}</span>}
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label>Estimasi Kadaluarsa (Hari)</label>
          <input type="number" min="1" value={form.estimasi_kadaluarsa_hari} onChange={set("estimasi_kadaluarsa_hari")} placeholder="..." />
          {errors.estimasi_kadaluarsa_hari && <span className="field-error">{errors.estimasi_kadaluarsa_hari}</span>}
        </div>
        <div className="form-field">
          <label>Batas Peringatan (Hari)</label>
          <input type="number" min="1" value={form.batas_peringatan_hari} onChange={set("batas_peringatan_hari")} placeholder="..." />
          {errors.batas_peringatan_hari && <span className="field-error">{errors.batas_peringatan_hari}</span>}
        </div>
      </div>
      <div className="form-field"><label>Deskripsi</label><textarea value={form.deskripsi} onChange={set("deskripsi")} rows={3} /></div>
      <div className="form-field"><label>Resep</label><textarea value={form.resep} onChange={set("resep")} rows={4} /></div>
    </Modal>);

}