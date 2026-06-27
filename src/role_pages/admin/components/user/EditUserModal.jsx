import { useState, useEffect } from "react";
import Modal from "../../../../shared/components/Modal";
import { useSubmitLock } from "../../../../shared/hooks/useSubmitLock";
import { trimStrings } from "../../../../shared/utils/trimStrings";


export default function EditUserModal({ open, onClose, user, roleList = [], statusList = [], onSubmit }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const guard = useSubmitLock();

  useEffect(() => {
    if (!user || !open) return;
    setForm({
      nama_lengkap: user.nama_lengkap ?? "",
      no_telp: user.no_telp ?? "",
      role: user.role ?? "",
      status: user.status ?? "Aktif"
    });
    setApiError("");
  }, [user, open]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = guard(async () => {
    setApiError("");setSaving(true);
    try {
      await onSubmit(trimStrings({
        id: user.id,
        nama_lengkap: form.nama_lengkap,
        no_telp: form.no_telp,
        role: form.role,
        status: form.status
      }), {
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        status: user.status
      });
      onClose();
    } catch (e) {setApiError(e.message);} finally
    {setSaving(false);}
  });

  if (!user) return null;
  return (
    <Modal open={open} onClose={onClose} title="Edit User" maxWidth="480px"
    footer={
    <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Batal</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan…" : "Edit"}</button>
        </>
    }>
      {apiError && <p className="text-sm text-red-600">{apiError}</p>}

      <div className="form-field">
        <label>Nama Lengkap</label>
        <input type="text" value={form.nama_lengkap ?? ""} onChange={set("nama_lengkap")} />
      </div>

      <div className="form-field">
        <label>Nomor Telepon</label>
        <input type="tel" value={form.no_telp ?? ""} onChange={set("no_telp")} />
      </div>

      <div className="form-field">
        <label>Role</label>
        <select value={form.role ?? ""} onChange={set("role")}>
          {roleList.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>


      <div className="form-field">
        <label>Status</label>
        <select value={form.status ?? ""} onChange={set("status")}>
          {statusList.map((s) => <option key={s} value={s}>{s === "Tidak_Aktif" ? "Tidak Aktif" : s}</option>)}
        </select>
      </div>
    </Modal>);

}