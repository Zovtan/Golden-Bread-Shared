import { useState } from "react";
import Modal from "../../../../shared/components/Modal";
import { useEnums, sel } from "../../../../shared/hooks/useEnums";
import { todayWIB } from "../../../../shared/utils/format";
import BahanItemSection, { emptyItem } from "./BahanItemSection";
import SearchableSelect from "../../../../shared/components/SearchableSelect";
import { useSubmitLock } from "../../../../shared/hooks/useSubmitLock";
import { trimStrings } from "../../../../shared/utils/trimStrings";

const INIT_SUPPLIER = { nama_supplier: "", no_telp: "", alamat: "" };


export default function TambahPembelianModal({ open, onClose, bahanList = [], supplierList = [], onSubmit, onBahanCreated }) {
  const { enums } = useEnums();

  const [id_supplier, setIdSupplier] = useState("");
  const [newSupplier, setNewSupplier] = useState(false);
  const [supplierForm, setSupplierForm] = useState(INIT_SUPPLIER);
  const [no_faktur, setNoFaktur] = useState("");
  const [status_pembayaran, setStatusPembayaran] = useState("");
  const [jatuh_tempo, setJatuhTempo] = useState("");
  const [items, setItems] = useState([emptyItem()]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const guard = useSubmitLock();

  const setNS = (k) => (e) => setSupplierForm((f) => ({ ...f, [k]: e.target.value }));


  const validate = () => {
    const err = {};
    if (!status_pembayaran) err.status_pembayaran = "Pilih status pembayaran";
    if (status_pembayaran === "Tempo" && !jatuh_tempo) err.jatuh_tempo = "Isi tanggal jatuh tempo";
    if (newSupplier && !supplierForm.nama_supplier.trim()) err.nama_supplier = "Isi nama supplier baru";
    items.forEach((it, i) => {
      if (!it.jenis_bahan) err[`jenis_bahan_${i}`] = "Pilih jenis";
      if (!it.newMerek && !it.id_bahan) err[`id_bahan_${i}`] = "Pilih merek";
      if (it.newMerek && !it.newMerekData?.merek?.trim()) err[`merek_${i}`] = "Isi nama merek";
      if (it.newMerek && !it.newMerekData?.satuan) err[`satuan_${i}`] = "Pilih satuan";
      if (!it.jumlah || Number(it.jumlah) <= 0) err[`jumlah_${i}`] = "Isi jumlah";
      if (!it.harga_satuan || Number(it.harga_satuan) <= 0) err[`harga_satuan_${i}`] = "Isi harga";
    });
    const existingIds = items.filter((it) => !it.newMerek && it.id_bahan).map((it) => String(it.id_bahan));
    const dupes = existingIds.filter((id, i) => existingIds.indexOf(id) !== i);
    if (dupes.length) {
      items.forEach((it, i) => {
        if (!it.newMerek && dupes.includes(String(it.id_bahan))) err[`id_bahan_${i}`] = "Bahan ini sudah ada di daftar";
      });
    }
    return err;
  };

  const handleSubmit = guard(async () => {
    setApiError("");
    const err = validate();
    if (Object.keys(err).length) {setErrors(err);return;}
    setSaving(true);
    try {
      await onSubmit({
        id_supplier: newSupplier || id_supplier === "" ? null : Number(id_supplier),
        newSupplier: newSupplier ? trimStrings(supplierForm) : null,
        no_faktur: no_faktur.trim() || null,
        status_pembayaran,
        jatuh_tempo: status_pembayaran === "Tempo" ? jatuh_tempo : null,
        items: items.map((it) => ({
          id_bahan: it.newMerek ? null : Number(it.id_bahan),
          merek: it.merek,
          jenis_bahan: it.jenis_bahan,
          jumlah: Number(it.jumlah),
          harga_satuan: Number(it.harga_satuan),
          kadaluarsa: it.kadaluarsa || null,
          newMerek: it.newMerek ? trimStrings(it.newMerekData) : null
        }))
      });
      handleClose();
      onBahanCreated?.();
    } catch (e) {setApiError(e.message);} finally
    {setSaving(false);}
  });

  const handleClose = () => {
    setIdSupplier("");setNewSupplier(false);setSupplierForm(INIT_SUPPLIER);
    setStatusPembayaran("");setJatuhTempo("");setItems([emptyItem()]);
    setErrors({});setApiError("");setNoFaktur("");onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Tambah Pembelian Baru" maxWidth="600px"
    footer={<>
        <button className="btn-secondary" onClick={handleClose} disabled={saving}>Batal</button>
        <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan…" : "Tambah"}</button>
      </>}>

      {apiError && <p style={{ color: "#dc2626", fontSize: ".875rem" }}>{apiError}</p>}

      {}
      <div className="form-field">
        <label>Supplier <span style={{ fontWeight: 400, color: "#6b7280" }}>(opsional)</span></label>
        <SearchableSelect
          value={newSupplier ? "__new__" : id_supplier}
          onChange={(v) => {
            if (v === "__new__") {setNewSupplier(true);setIdSupplier("");} else
            {setNewSupplier(false);setIdSupplier(v);}
          }}
          placeholder="- Tanpa supplier -"
          options={[
          { value: "", label: "- Tanpa supplier -" },
          ...supplierList.map((s) => ({ value: s.id_supplier, label: s.nama_supplier })),
          { value: "__new__", label: "+ Tambah supplier baru..." }]
          } />
        
      </div>

      {newSupplier &&
      <>
          <div className="form-field">
            <label>Nama Supplier Baru</label>
            <input type="text" value={supplierForm.nama_supplier} onChange={setNS("nama_supplier")} placeholder="Nama supplier..." />
            {errors.nama_supplier && <span className="field-error">{errors.nama_supplier}</span>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
            <div className="form-field">
              <label>No. Telepon</label>
              <input type="text" value={supplierForm.no_telp} onChange={setNS("no_telp")} placeholder="08xx..." />
            </div>
            <div className="form-field">
              <label>Alamat</label>
              <input type="text" value={supplierForm.alamat} onChange={setNS("alamat")} placeholder="Alamat supplier..." />
            </div>
          </div>
        </>
      }

      {}
      <div className="form-field">
        <label>No. Faktur <span style={{ fontWeight: 400, color: "#6b7280" }}>(opsional)</span></label>
        <input
          type="text"
          value={no_faktur}
          onChange={(e) => setNoFaktur(e.target.value)}
          placeholder="Nomor faktur supplier..." />
        
      </div>

      {}
      <div style={{ display: "grid", gridTemplateColumns: jatuh_tempo !== undefined && status_pembayaran === "Tempo" ? "1fr 1fr" : "1fr", gap: ".75rem" }}>
        <div className="form-field">
          <label>Status Pembayaran</label>
          <SearchableSelect
            value={status_pembayaran}
            onChange={(v) => {setStatusPembayaran(v);setErrors((p) => ({ ...p, status_pembayaran: undefined }));}}
            placeholder="Pilih status..."
            options={sel.statusPembayaran(enums).map((s) => ({ value: s, label: s === "Belum" ? "Belum Bayar" : s }))} />
          
          {errors.status_pembayaran && <span className="field-error">{errors.status_pembayaran}</span>}
        </div>
        {status_pembayaran === "Tempo" &&
        <div className="form-field">
            <label>Tanggal Jatuh Tempo</label>
            <input type="date" value={jatuh_tempo} min={todayWIB()}
          onChange={(e) => {setJatuhTempo(e.target.value);setErrors((p) => ({ ...p, jatuh_tempo: undefined }));}} />
            {errors.jatuh_tempo && <span className="field-error">{errors.jatuh_tempo}</span>}
          </div>
        }
      </div>

      {}
      <BahanItemSection
        items={items}
        bahanList={bahanList}
        enums={enums}
        errors={errors}
        onChange={setItems} />
      
    </Modal>);

}