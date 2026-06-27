import { useState } from "react";
import Modal from "../../../../shared/components/Modal";
import SearchableSelect from "../../../../shared/components/SearchableSelect";
import { useSubmitLock } from "../../../../shared/hooks/useSubmitLock";
import { trimStrings } from "../../../../shared/utils/trimStrings";

const INIT = {
  merek: "", jenis_bahan: "", satuan: "",
  stok_minimal: "", batas_peringatan_hari: "", deskripsi: ""
};


export default function TambahBahanModal({ open, onClose, jenisBahanList = [], satuanList = [], onSubmit }) {
  const [form, setForm] = useState(INIT);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const guard = useSubmitLock();

  const set = (k) => (e) => {setForm((f) => ({ ...f, [k]: e.target.value }));setErrors((p) => ({ ...p, [k]: undefined }));};

  const validate = () => {
    const err = {};
    if (!form.jenis_bahan) err.jenis_bahan = "Pilih jenis";
    if (!form.satuan) err.satuan = "Pilih satuan";
    if (!form.stok_minimal || isNaN(Number(form.stok_minimal))) err.stok_minimal = "Angka valid";
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
        stok_minimal: Number(form.stok_minimal),
        batas_peringatan_hari: Number(form.batas_peringatan_hari)
      }));
      setForm(INIT);setErrors({});onClose();
    } catch (e) {setApiError(e.message);} finally
    {setSaving(false);}
  });

  const handleClose = () => {setForm(INIT);setErrors({});setApiError("");onClose();};

  return (
    <Modal open={open} onClose={handleClose} title="Tambah Bahan Baku Baru"
    footer={
    <>
          <button className="btn-secondary" onClick={handleClose} disabled={saving}>Batal</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan…" : "Tambah"}</button>
        </>
    }>
      {apiError && <p style={{ color: "#dc2626", fontSize: ".875rem" }}>{apiError}</p>}

      <div className="form-field">
        <label>Merek Bahan Baku</label>
        <input type="text" value={form.merek} onChange={set("merek")} placeholder="Isi nama merek bahan baku..." />
      </div>

      <div className="form-field">
        <label>Jenis Bahan Baku</label>
        <SearchableSelect
          value={form.jenis_bahan}
          onChange={(v) => {setForm((f) => ({ ...f, jenis_bahan: v }));setErrors((p) => ({ ...p, jenis_bahan: undefined }));}}
          placeholder="Pilih jenis bahan baku"
          options={jenisBahanList.map((j) => ({ value: j, label: j }))} />
        
        {errors.jenis_bahan && <span className="field-error">{errors.jenis_bahan}</span>}
      </div>

      <div className="form-field">
        <label>Satuan</label>
        <SearchableSelect
          value={form.satuan}
          onChange={(v) => {setForm((f) => ({ ...f, satuan: v }));setErrors((p) => ({ ...p, satuan: undefined }));}}
          placeholder="Pilih satuan"
          options={satuanList.map((s) => ({ value: s, label: s }))} />
        
        {errors.satuan && <span className="field-error">{errors.satuan}</span>}
      </div>

      <div className="form-row">
        <div className="form-field">
          <label>Stok Minimal</label>
          <input type="number" min="1" value={form.stok_minimal} onChange={set("stok_minimal")} placeholder="Isi stok minimal..." />
          {errors.stok_minimal && <span className="field-error">{errors.stok_minimal}</span>}
        </div>
        <div className="form-field">
          <label>Batas Peringatan (Hari)</label>
          <input type="number" min="1" value={form.batas_peringatan_hari} onChange={set("batas_peringatan_hari")} placeholder="..." />
          {errors.batas_peringatan_hari && <span className="field-error">{errors.batas_peringatan_hari}</span>}
        </div>
      </div>

      <div className="form-field">
        <label>Deskripsi</label>
        <textarea value={form.deskripsi} onChange={set("deskripsi")} placeholder="Isi deskripsi produk..." rows={3} />
      </div>
    </Modal>);

}