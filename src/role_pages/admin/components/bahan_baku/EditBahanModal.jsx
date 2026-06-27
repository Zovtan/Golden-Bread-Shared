import { useState, useEffect } from "react";
import Modal from "../../../../shared/components/Modal";
import SearchableSelect from "../../../../shared/components/SearchableSelect";
import { useSubmitLock } from "../../../../shared/hooks/useSubmitLock";
import { trimStrings } from "../../../../shared/utils/trimStrings";




export default function EditBahanModal({ open, onClose, bahan, jenisBahanList = [], satuanList = [], statusBahanList = [], onSubmit }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const guard = useSubmitLock();

  useEffect(() => {
    if (!bahan || !open) return;
    setForm({
      merek: bahan.merek ?? "",
      jenis_bahan: bahan.jenis_bahan ?? "",
      satuan: bahan.satuan ?? "",
      stok_minimal: String(bahan.stok_minimal ?? ""),
      batas_peringatan_hari: String(bahan.batas_peringatan_hari ?? ""),
      deskripsi: bahan.deskripsi ?? "",
      status: bahan.status ?? "Aktif"
    });
    setApiError("");
  }, [bahan, open]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const handleSubmit = guard(async () => {
    setApiError("");setSaving(true);
    try {
      await onSubmit(trimStrings({
        id_bahan: bahan.id_bahan,
        merek: form.merek,
        jenis_bahan: form.jenis_bahan,
        satuan: form.satuan,
        stok_minimal: Number(form.stok_minimal),
        batas_peringatan_hari: Number(form.batas_peringatan_hari),
        deskripsi: form.deskripsi,
        status: form.status
      }), {

        merek: bahan.merek, jenis_bahan: bahan.jenis_bahan, satuan: bahan.satuan,
        stok_minimal: bahan.stok_minimal, status: bahan.status
      });
      onClose();
    } catch (e) {setApiError(e.message);} finally
    {setSaving(false);}
  });

  if (!bahan) return null;
  return (
    <Modal open={open} onClose={onClose} title="Edit Bahan Baku" maxWidth="560px"
    footer={
    <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Batal</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan…" : "Edit"}</button>
        </>
    }>
      {apiError && <p style={{ color: "#dc2626", fontSize: ".875rem" }}>{apiError}</p>}

      <div className="form-field">
        <label>Merek Bahan Baku</label>
        <input type="text" value={form.merek ?? ""} onChange={set("merek")} />
      </div>

      <div className="form-field">
        <label>Jenis Bahan Baku</label>
        <SearchableSelect
          value={form.jenis_bahan ?? ""} onChange={(v) => setForm((f) => ({ ...f, jenis_bahan: v }))}
          placeholder="Pilih jenis" options={jenisBahanList.map((j) => ({ value: j, label: j }))} />
        
      </div>

      <div className="form-field">
        <label>Satuan</label>
        <SearchableSelect
          value={form.satuan ?? ""} onChange={(v) => setForm((f) => ({ ...f, satuan: v }))}
          placeholder="Pilih satuan" options={satuanList.map((s) => ({ value: s, label: s }))} />
        
      </div>


        <div className="form-field">
          <label>Stok Minimal</label>
          <input type="number" min="1" value={form.stok_minimal ?? ""} onChange={set("stok_minimal")} />
        </div>
        <div className="form-field">
          <label>Batas Peringatan Sebelum Kadaluarsa (hari)</label>
          <input type="number" min="1" value={form.batas_peringatan_hari ?? ""} onChange={set("batas_peringatan_hari")} />
        </div>




      <div className="form-field">
        <label>Status Bahan</label>
        <select value={form.status ?? ""} onChange={set("status")}>
          {statusBahanList.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="form-field">
        <label>Deskripsi</label>
        <textarea value={form.deskripsi ?? ""} onChange={set("deskripsi")} rows={3} />
      </div>
    </Modal>);

}