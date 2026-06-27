import { useState } from "react";
import Modal from "../../../../shared/components/Modal";
import SearchableSelect from "../../../../shared/components/SearchableSelect";
import { useSubmitLock } from "../../../../shared/hooks/useSubmitLock";
import { trimStrings } from "../../../../shared/utils/trimStrings";
const EMPTY = { nama_supplier: "", no_telp: "", alamat: "" };

export default function EditSupplierModal({ open, onClose, supplierList = [], onSubmit }) {
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const guard = useSubmitLock();

  const handleSelect = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    setErrors({});
    const s = supplierList.find((s) => String(s.id_supplier) === id);
    setForm(s ? { nama_supplier: s.nama_supplier ?? "", no_telp: s.no_telp ?? "", alamat: s.alamat ?? "" } : EMPTY);
  };
  const set = (k) => (e) => {setForm((f) => ({ ...f, [k]: e.target.value }));setErrors((p) => ({ ...p, [k]: undefined }));};
  const validate = () => {
    const err = {};
    if (!selectedId) err.selectedId = "Pilih supplier";
    if (!form.nama_supplier.trim()) err.nama_supplier = "Nama supplier wajib diisi";
    return err;
  };
  const handleSubmit = guard(async () => {
    setApiError("");
    const err = validate();
    if (Object.keys(err).length) {setErrors(err);return;}
    setSaving(true);
    try {
      await onSubmit(trimStrings({ ...form, id_supplier: Number(selectedId) }));
      handleClose();
    } catch (e) {setApiError(e.message);} finally
    {setSaving(false);}
  });
  const handleClose = () => {
    setSelectedId("");setForm(EMPTY);setErrors({});setApiError("");onClose();
  };
  return (
    <Modal open={open} onClose={handleClose} title="Edit Supplier" maxWidth="420px"
    footer={
    <>
          <button className="btn-secondary" onClick={handleClose} disabled={saving}>Batal</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving || !selectedId}>
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </>
    }>
      {apiError && <p style={{ color: "#dc2626", fontSize: ".875rem" }}>{apiError}</p>}
      <div className="form-field">
        <label>Pilih Supplier</label>
        <SearchableSelect
          value={selectedId}
          onChange={(id) => handleSelect({ target: { value: id } })}
          placeholder="Pilih supplier..."
          options={supplierList.
          slice().
          sort((a, b) => (a.nama_supplier ?? "").localeCompare(b.nama_supplier ?? "")).
          map((s) => ({ value: String(s.id_supplier), label: s.nama_supplier }))} />
        
        {errors.selectedId && <span className="field-error">{errors.selectedId}</span>}
      </div>
      {selectedId &&
      <>
          <div className="form-field">
            <label>Nama Supplier <span style={{ color: "#dc2626" }}>*</span></label>
            <input type="text" value={form.nama_supplier} onChange={set("nama_supplier")} placeholder="Nama supplier..." />
            {errors.nama_supplier && <span className="field-error">{errors.nama_supplier}</span>}
          </div>
          <div className="form-field">
            <label>No. Telepon</label>
            <input type="text" value={form.no_telp} onChange={set("no_telp")} placeholder="08xx..." />
          </div>
          <div className="form-field">
            <label>Alamat</label>
            <input type="text" value={form.alamat} onChange={set("alamat")} placeholder="Alamat supplier..." />
          </div>
        </>
      }
    </Modal>);

}