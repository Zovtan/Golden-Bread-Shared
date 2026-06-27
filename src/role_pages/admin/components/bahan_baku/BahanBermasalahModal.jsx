import { useState, useEffect } from "react";
import Modal from "../../../../shared/components/Modal";
import { useEnums, sel } from "../../../../shared/hooks/useEnums";
import { fmtDate } from "../../../../shared/utils/format";
import SearchableSelect from "../../../../shared/components/SearchableSelect";
import { labelBahan } from "../../../../shared/utils/bahanLabel";
import { useSubmitLock } from "../../../../shared/hooks/useSubmitLock";


export default function BahanBermasalahModal({ open, onClose, bahanList = [], onSubmit }) {
  const { enums } = useEnums();
  const JENIS_OPTS = sel.jenisMasalahBahan(enums);

  const [id_bahan, setIdBahan] = useState("");
  const [id_batch_bb, setIdBatch] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [nama_masalah, setNamaMasalah] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const guard = useSubmitLock();

  useEffect(() => {setIdBatch("");}, [id_bahan]);

  const selectedBahan = bahanList.find((b) => String(b.id_bahan) === String(id_bahan));
  const batchOptions = selectedBahan?.batches?.filter((b) => b.status_stok !== "Habis") ?? [];
  const selectedBatch = batchOptions.find((b) => String(b.id_batch_bb) === String(id_batch_bb));
  const maxJumlah = selectedBatch?.stok ?? undefined;

  const validate = () => {
    const err = {};
    if (!id_bahan) err.id_bahan = "Pilih bahan baku";
    if (!id_batch_bb) err.id_batch_bb = "Pilih batch";
    if (!jumlah || Number(jumlah) <= 0) err.jumlah = "Masukkan jumlah yang valid";else
    if (maxJumlah !== undefined && Number(jumlah) > maxJumlah)
    err.jumlah = `Jumlah melebihi stok batch (${maxJumlah})`;
    if (!nama_masalah) err.nama_masalah = "Pilih jenis masalah";
    return err;
  };

  const handleSubmit = guard(async () => {
    setApiError("");
    const err = validate();
    if (Object.keys(err).length) {setErrors(err);return;}
    setSaving(true);
    try {
      await onSubmit({ id_batch_bb: Number(id_batch_bb), nama_masalah, jumlah: Number(jumlah), keterangan });
      resetForm();onClose();
    } catch (e) {setApiError(e.message);} finally
    {setSaving(false);}
  });

  const resetForm = () => {
    setIdBahan("");setIdBatch("");setJumlah("");
    setNamaMasalah("");setKeterangan("");setErrors({});setApiError("");
  };
  const handleClose = () => {resetForm();onClose();};

  return (
    <Modal open={open} onClose={handleClose} title="Bahan Baku Bermasalah" maxWidth="460px"
    footer={
    <>
          <button className="btn-secondary" onClick={handleClose} disabled={saving}>Batal</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan…" : "Perbaharui"}</button>
        </>
    }>
      {apiError && <p style={{ color: "#dc2626", fontSize: ".875rem" }}>{apiError}</p>}

      <div className="form-field">
        <label>Bahan Baku</label>
        <SearchableSelect
          value={String(id_bahan)}
          onChange={(v) => {setIdBahan(v);setErrors((p) => ({ ...p, id_bahan: undefined }));}}
          placeholder="Pilih bahan baku"
          options={bahanList.map((b) => ({
            value: String(b.id_bahan),
            label: labelBahan(b)
          }))} />
        
        {errors.id_bahan && <span className="field-error">{errors.id_bahan}</span>}
      </div>

      <div className="form-field">
        <label>Batch</label>
        <SearchableSelect
          value={String(id_batch_bb)}
          onChange={(v) => {setIdBatch(v);setErrors((p) => ({ ...p, id_batch_bb: undefined }));}}
          placeholder="Pilih batch"
          disabled={!id_bahan}
          options={batchOptions.map((b) => ({
            value: String(b.id_batch_bb),
            label: `Batch #${b.id_batch_bb}`,
            sub: `Stok: ${b.stok}${b.tgl_beli ? ` · Beli: ${fmtDate(b.tgl_beli)}` : ""}${b.kadaluarsa ? ` · Kdl: ${fmtDate(b.kadaluarsa)}` : ""}`
          }))} />
        
        {errors.id_batch_bb && <span className="field-error">{errors.id_batch_bb}</span>}
      </div>

      <div className="form-field">
        <label>
          Jumlah Bahan Baku
          {maxJumlah !== undefined && <span style={{ color: "#6b7280", fontWeight: 400, fontSize: ".8rem" }}> (maks. {maxJumlah})</span>}
        </label>
        <input type="number" min="1" max={maxJumlah} value={jumlah}
        onChange={(e) => {setJumlah(e.target.value);setErrors((p) => ({ ...p, jumlah: undefined }));}}
        placeholder="Isi jumlah" />
        {errors.jumlah && <span className="field-error">{errors.jumlah}</span>}
      </div>

      <div className="form-field">
        <label>Jenis Masalah</label>
        <SearchableSelect
          value={nama_masalah}
          onChange={(v) => {setNamaMasalah(v);setErrors((p) => ({ ...p, nama_masalah: undefined }));}}
          placeholder="Pilih jenis masalah..."
          options={JENIS_OPTS.map((v) => ({ value: v, label: v }))} />
        
        {errors.nama_masalah && <span className="field-error">{errors.nama_masalah}</span>}
      </div>

      <div className="form-field">
        <label>Keterangan</label>
        <textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Isi keterangan..." rows={3} />
      </div>
    </Modal>);

}