import { useState, useEffect } from "react";
import Modal from "../../../../shared/components/Modal";
import { useSubmitLock } from "../../../../shared/hooks/useSubmitLock";
import { trimStrings } from "../../../../shared/utils/trimStrings";

const STATUS_OPTS = ["Aktif", "Tidak_Aktif"];
const STATUS_LABEL = { Aktif: "Aktif", Tidak_Aktif: "Tidak Aktif" };


export default function EditPelangganModal({ open, onClose, pelanggan, jenisPelangganList = [], onSubmit }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const guard = useSubmitLock();

  useEffect(() => {
    if (!pelanggan || !open) return;
    setForm({
      nama_lengkap: pelanggan.nama_lengkap ?? "",
      nama_toko: pelanggan.nama_toko ?? "",
      jenis_pelanggan: pelanggan.jenis_pelanggan ?? "",
      no_telp: pelanggan.no_telp ?? "",
      alamat: pelanggan.alamat ?? "",
      status: pelanggan.status ?? "Aktif"
    });
    setApiError("");
  }, [pelanggan, open]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = guard(async () => {
    setApiError("");setSaving(true);
    try {
      await onSubmit(trimStrings({
        id: pelanggan.id,
        nama_lengkap: form.nama_lengkap,
        nama_toko: form.nama_toko,
        jenis_pelanggan: form.jenis_pelanggan,
        no_telp: form.no_telp,
        alamat: form.alamat,
        status: form.status
      }), {
        nama_lengkap: pelanggan.nama_lengkap,
        jenis_pelanggan: pelanggan.jenis_pelanggan,
        alamat: pelanggan.alamat,
        status: pelanggan.status
      });
      onClose();
    } catch (e) {setApiError(e.message);} finally
    {setSaving(false);}
  });

  if (!pelanggan) return null;
  return (
    <Modal open={open} onClose={onClose} title="Edit Pelanggan" maxWidth="480px"
    footer={
    <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Batal</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan…" : "Edit"}</button>
        </>
    }>
      {apiError && <p style={{ color: "#dc2626", fontSize: ".875rem" }}>{apiError}</p>}

      <div className="form-field">
        <label>Nama Pelanggan</label>
        <input type="text" value={form.nama_lengkap ?? ""} onChange={set("nama_lengkap")} />
      </div>
      <div className="form-field">
        <label>Nama Toko</label>
        <input type="text" value={form.nama_toko ?? ""} onChange={set("nama_toko")} />
      </div>
      <div className="form-field">
        <label>Jenis Pelanggan</label>
        <select value={form.jenis_pelanggan ?? ""} onChange={set("jenis_pelanggan")}>
          {jenisPelangganList.map((j) => <option key={j} value={j}>{j}</option>)}
        </select>
      </div>
      <div className="form-field">
        <label>Nomor Telepon</label>
        <input type="tel" value={form.no_telp ?? ""} onChange={set("no_telp")} />
      </div>
      <div className="form-field">
        <label>Alamat</label>
        <input type="text" value={form.alamat ?? ""} onChange={set("alamat")} />
      </div>
      <div className="form-field">
        <label>Status Akun</label>
        <select value={form.status ?? "Aktif"} onChange={set("status")}>
          {STATUS_OPTS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>
    </Modal>);

}