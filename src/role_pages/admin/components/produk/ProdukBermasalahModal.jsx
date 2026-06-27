import { useState, useEffect } from "react";
import Modal from "../../../../shared/components/Modal";
import { useEnums, sel } from "../../../../shared/hooks/useEnums";
import { fmtDate, fmtDateTime } from "../../../../shared/utils/format";
import SearchableSelect from "../../../../shared/components/SearchableSelect";
import { useSubmitLock } from "../../../../shared/hooks/useSubmitLock";


export default function ProdukBermasalahModal({ open, onClose, produkList, onSubmit }) {
  const { enums } = useEnums();
  const JENIS_OPTS = sel.jenisMasalahProduk(enums);

  const [id_produk, setIdProduk] = useState("");
  const [id_batch, setIdBatch] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [nama_masalah, setNamaMasalah] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const guard = useSubmitLock();

  useEffect(() => {setIdBatch("");}, [id_produk]);

  const selectedProduk = produkList.find((p) => String(p.id_produk) === String(id_produk));
  const batchOptions = selectedProduk?.batches?.filter((b) => b.status_stok !== "Habis" && b.status_stok !== "Kadaluarsa") ?? [];
  const selectedBatch = batchOptions.find((b) => String(b.id_batch) === String(id_batch));
  const maxJumlah = selectedBatch?.stok ?? undefined;

  const validate = () => {
    const err = {};
    if (!id_produk) err.id_produk = "Pilih produk";
    if (!id_batch) err.id_batch = "Pilih batch";
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
      await onSubmit({ id_batch: Number(id_batch), nama_masalah, jumlah: Number(jumlah), keterangan });
      resetForm();onClose();
    } catch (e) {setApiError(e.message);} finally
    {setSaving(false);}
  });

  const resetForm = () => {
    setIdProduk("");setIdBatch("");setJumlah("");
    setNamaMasalah("");setKeterangan("");setErrors({});setApiError("");
  };
  const handleClose = () => {resetForm();onClose();};

  return (
    <Modal open={open} onClose={handleClose} title="Produk Bermasalah" maxWidth="460px"
    footer={
    <>
          <button className="btn-secondary" onClick={handleClose} disabled={saving}>Batal</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan…" : "Perbaharui"}</button>
        </>
    }>
      {apiError && <p style={{ color: "#dc2626", fontSize: ".875rem" }}>{apiError}</p>}

      <div className="form-field">
        <label>Produk</label>
        <SearchableSelect
          value={String(id_produk)}
          onChange={(v) => {setIdProduk(v);setErrors((p) => ({ ...p, id_produk: undefined }));}}
          placeholder="Pilih produk"
          options={produkList.map((p) => ({ value: String(p.id_produk), label: p.nama_produk }))} />
        
        {errors.id_produk && <span className="field-error">{errors.id_produk}</span>}
      </div>

      <div className="form-field">
        <label>Batch</label>
        <SearchableSelect
          value={String(id_batch)}
          onChange={(v) => {setIdBatch(v);setErrors((p) => ({ ...p, id_batch: undefined }));}}
          placeholder="Pilih batch"
          disabled={!id_produk}
          options={batchOptions.map((b) => ({
            value: String(b.id_batch),
            label: `Batch #${b.id_batch}`,
            sub: `Stok: ${b.stok}${b.tgl_produksi ? ` · Prod: ${fmtDateTime(b.tgl_produksi)}` : ""}${b.kadaluarsa ? ` · Kdl: ${fmtDate(b.kadaluarsa)}` : ""}`
          }))} />
        
        {errors.id_batch && <span className="field-error">{errors.id_batch}</span>}
      </div>

      <div className="form-field">
        <label>
          Jumlah Produk
          {maxJumlah !== undefined && <span style={{ color: "#6b7280", fontWeight: 400, fontSize: ".8rem" }}> (maks. {maxJumlah})</span>}
        </label>
        <input type="number" min="1" max={maxJumlah} value={jumlah}
        onChange={(e) => {setJumlah(e.target.value);setErrors((p) => ({ ...p, jumlah: undefined }));}}
        placeholder="Isi jumlah produk..." />
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