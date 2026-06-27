import { useState, useEffect } from "react";
import Modal from "../../../../shared/components/Modal";
import SearchableSelect from "../../../../shared/components/SearchableSelect";
import { useEnums, sel } from "../../../../shared/hooks/useEnums";
import { useSubmitLock } from "../../../../shared/hooks/useSubmitLock";



export default function EditPembelianModal({ open, onClose, pembelian, supplierList = [], onSubmit }) {
  const { enums } = useEnums();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const guard = useSubmitLock();

  useEffect(() => {
    if (!pembelian || !open) return;
    setForm({
      id_supplier: String(pembelian.id_supplier ?? ""),
      no_faktur: pembelian.no_faktur ?? "",
      status_pembayaran: pembelian.status_pembayaran ?? "",
      jatuh_tempo: pembelian.jatuh_tempo ?? "",
      tanggal: (pembelian.tanggal_raw ?? "").slice(0, 16)
    });
    setApiError("");
  }, [pembelian, open]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const handleStatusChange = (val) => {
    setForm((f) => ({ ...f, status_pembayaran: val, jatuh_tempo: val !== "Tempo" ? "" : f.jatuh_tempo }));
  };

  const validate = () => {
    const err = {};
    if (!form.status_pembayaran) err.status_pembayaran = "Pilih status pembayaran";
    if (form.status_pembayaran === "Tempo" && !form.jatuh_tempo) err.jatuh_tempo = "Isi tanggal jatuh tempo";
    return err;
  };

  const handleSubmit = guard(async () => {
    const errs = validate();
    if (Object.keys(errs).length) {setApiError(Object.values(errs).join(", "));return;}
    setApiError("");setSaving(true);
    try {
      await onSubmit({
        id_pembelian: pembelian.id_pembelian,
        id_supplier: form.id_supplier ? Number(form.id_supplier) : null,
        no_faktur: form.no_faktur?.trim() || null,
        status_pembayaran: form.status_pembayaran,
        jatuh_tempo: form.status_pembayaran === "Tempo" ? form.jatuh_tempo || null : null,
        tanggal: form.tanggal || null
      }, { status_pembayaran: pembelian.status_pembayaran });
      onClose();
    } catch (e) {setApiError(e.message);} finally
    {setSaving(false);}
  });

  if (!pembelian) return null;
  return (
    <Modal open={open} onClose={onClose} title={`Edit Pembelian #${pembelian.id_pembelian}`} maxWidth="500px"
    footer={
    <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Batal</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan…" : "Simpan"}</button>
        </>
    }>
      {apiError && <p className="text-sm text-red-600" style={{ marginBottom: ".5rem" }}>{apiError}</p>}

      <div className="form-field">
        <label>Tanggal Pembelian</label>
        <input type="datetime-local" value={form.tanggal ?? ""} onChange={set("tanggal")} />
      </div>

      <div className="form-field">
        <label>Supplier</label>
        <SearchableSelect
          value={form.id_supplier ?? ""}
          onChange={(v) => setForm((f) => ({ ...f, id_supplier: v }))}
          placeholder="- Tanpa supplier -"
          options={[
          { value: "", label: "- Tanpa supplier -" },
          ...supplierList.map((s) => ({ value: s.id_supplier, label: s.nama_supplier }))]
          } />
        
      </div>

      <div className="form-field">
        <label>No. Faktur <span style={{ fontWeight: 400, color: "#6b7280" }}>(opsional)</span></label>
        <input type="text" value={form.no_faktur ?? ""} onChange={set("no_faktur")} placeholder="Nomor faktur supplier..." />
      </div>

      <div className="form-field">
        <label>Status Pembayaran</label>
        <SearchableSelect
          value={form.status_pembayaran ?? ""}
          onChange={handleStatusChange}
          placeholder="Pilih status..."
          options={sel.statusPembayaran(enums).map((s) => ({ value: s, label: s === "Belum" ? "Belum Bayar" : s }))} />
        
      </div>

      {form.status_pembayaran === "Tempo" &&
      <div className="form-field">
          <label>Tanggal Jatuh Tempo</label>
          <input type="date" value={form.jatuh_tempo ?? ""} onChange={set("jatuh_tempo")} />
        </div>
      }
    </Modal>);

}