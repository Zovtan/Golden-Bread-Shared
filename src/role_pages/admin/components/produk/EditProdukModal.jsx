import { useState, useEffect, useRef } from "react";
import Modal from "../../../../shared/components/Modal";
import { useEnums, sel } from "../../../../shared/hooks/useEnums";
import SearchableSelect from "../../../../shared/components/SearchableSelect";
import { useSubmitLock } from "../../../../shared/hooks/useSubmitLock";
import { trimStrings } from "../../../../shared/utils/trimStrings";


export default function EditProdukModal({ open, onClose, produk, onSubmit }) {
  const { enums } = useEnums();
  const kategoriList = sel.produkKategori(enums);
  const [form, setForm] = useState({});
  const [gambarFile, setGambarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const fileInputRef = useRef(null);
  const guard = useSubmitLock();

  useEffect(() => {
    if (!produk || !open) return;
    setForm({
      nama_produk: produk.nama_produk ?? "",
      kategori_produk: produk.kategori_produk ?? "",
      harga_satuan: String(produk.harga_satuan ?? ""),
      stok_minimal: String(produk.stok_minimal ?? ""),
      estimasi_kadaluarsa_hari: String(produk.estimasi_kadaluarsa_hari ?? ""),
      batas_peringatan_hari: String(produk.batas_peringatan_hari ?? ""),
      deskripsi: produk.deskripsi ?? "",
      resep: produk.resep ?? "",
      status: produk.status ?? "Aktif"
    });
    setGambarFile(null);
    setPreviewUrl(produk.gambar ?? "");
    setApiError("");
  }, [produk, open]);


  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setApiError("Ukuran file terlalu besar (maks 5MB). Gambar akan dikompres otomatis ke WebP.");
    } else {
      setApiError("");
    }
    setGambarFile(f);
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = guard(async () => {
    setApiError("");setSaving(true);
    try {
      await onSubmit(trimStrings({
        id_produk: produk.id_produk,
        nama_produk: form.nama_produk,
        kategori_produk: form.kategori_produk,
        harga_satuan: Number(form.harga_satuan),
        stok_minimal: Number(form.stok_minimal),
        estimasi_kadaluarsa_hari: Number(form.estimasi_kadaluarsa_hari),
        batas_peringatan_hari: Number(form.batas_peringatan_hari),
        deskripsi: form.deskripsi,
        resep: form.resep,
        status: form.status,
        gambarFile
      }));
      onClose();
    } catch (e) {setApiError(e.message);} finally
    {setSaving(false);}
  });

  if (!produk) return null;
  return (
    <Modal open={open} onClose={onClose} title="Edit Produk" maxWidth="560px"
    footer={
    <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Batal</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan…" : "Edit"}</button>
        </>
    }>
      {apiError && <p className="text-sm text-red-600" style={{ marginBottom: ".5rem" }}>{apiError}</p>}

      {}
      <div className="form-field">
        <label>Foto Produk</label>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          {}
          <div style={{ width: 80, height: 80, border: "1px solid #d1d5db", borderRadius: 8, overflow: "hidden",
            background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {previewUrl ?
            <img src={previewUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> :
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
            }
          </div>
          <div style={{ flex: 1 }}>
            <label className="form-upload-btn" style={{ cursor: "pointer" }}>
              <span>⬆</span>
              <span>{gambarFile ? gambarFile.name : previewUrl ? "Ganti foto" : "Upload foto"}</span>
              <input ref={fileInputRef} type="file" accept="image/*"
              onChange={handleFileChange} className="hidden" />
            </label>
            <p style={{ fontSize: ".7rem", color: "#9ca3af", marginTop: 4 }}>
              Format JPEG/PNG diterima · Otomatis dikompres ke WebP · Maks 500KB hasil akhir
            </p>
          </div>
        </div>
      </div>

      <div className="form-field"><label>Nama Produk</label><input type="text" value={form.nama_produk ?? ""} onChange={set("nama_produk")} /></div>
      <div className="form-field">
        <label>Kategori</label>
        <SearchableSelect
          value={form.kategori_produk ?? ""}
          onChange={(v) => setForm((f) => ({ ...f, kategori_produk: v }))}
          placeholder="Pilih kategori"
          options={kategoriList.map((k) => ({ value: k, label: k }))} />
        
      </div>
        <div className="form-field"><label>Stok Minimal (Pcs)</label><input type="number" min="1" value={form.stok_minimal ?? ""} onChange={set("stok_minimal")} /></div>
        <div className="form-field"><label>Estimasi Kadaluarsa (Hari)</label><input type="number" min="1" value={form.estimasi_kadaluarsa_hari ?? ""} onChange={set("estimasi_kadaluarsa_hari")} /></div>
      <div className="form-field"><label>Batas Peringatan Sebelum Kadaluarsa (Hari)</label><input type="number" min="1" value={form.batas_peringatan_hari ?? ""} onChange={set("batas_peringatan_hari")} /></div>
        <div className="form-field"><label>Harga Satuan (Rp)</label><input type="number" min="1" value={form.harga_satuan ?? ""} onChange={set("harga_satuan")} /></div>
      <div className="form-field">
        <label>Status Produk</label>
        <select value={form.status ?? "Aktif"} onChange={set("status")}>
          {sel.statusProduk(enums).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="form-field"><label>Deskripsi</label><textarea value={form.deskripsi ?? ""} onChange={set("deskripsi")} rows={3} /></div>
      <div className="form-field"><label>Bahan / Resep</label><textarea value={form.resep ?? ""} onChange={set("resep")} rows={4} /></div>
    </Modal>);

}