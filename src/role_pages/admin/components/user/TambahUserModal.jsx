import { useState } from "react";
import Modal from "../../../../shared/components/Modal";
import { useSubmitLock } from "../../../../shared/hooks/useSubmitLock";
import { trimStrings } from "../../../../shared/utils/trimStrings";
import {
  validateEmail, EMAIL_RULE_TEXT,
  validatePhone, PHONE_RULE_TEXT,
  validatePassword, PASSWORD_RULE_TEXT } from
"../../../../auth/utils/validation";
import { translateAuthError } from "../../../../auth/utils/authUtils";

const INIT = { nama_lengkap: "", no_telp: "", email: "", role: "", password: "" };


export default function TambahUserModal({ open, onClose, roleList = [], onSubmit }) {
  const [form, setForm] = useState(INIT);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const guard = useSubmitLock();

  const set = (k) => (e) => {setForm((f) => ({ ...f, [k]: e.target.value }));setErrors((p) => ({ ...p, [k]: undefined }));};

  const validate = () => {
    const err = {};
    if (!form.nama_lengkap.trim()) err.nama_lengkap = "Wajib diisi";
    if (!form.no_telp.trim()) err.no_telp = "Wajib diisi";else
    if (!validatePhone(form.no_telp)) err.no_telp = PHONE_RULE_TEXT;
    if (!form.email.trim()) err.email = "Wajib diisi";else
    if (!validateEmail(form.email)) err.email = EMAIL_RULE_TEXT;
    if (!form.role) err.role = "Pilih role";
    if (!form.password) err.password = "Wajib diisi";else
    if (!validatePassword(form.password)) err.password = PASSWORD_RULE_TEXT;
    return err;
  };

  const handleSubmit = guard(async () => {
    setApiError("");
    const err = validate();
    if (Object.keys(err).length) {setErrors(err);return;}
    setSaving(true);
    try {
      await onSubmit(trimStrings(form, ["password"]));
      setForm(INIT);setErrors({});setShowPass(false);onClose();
    } catch (e) {setApiError(translateAuthError(e?.message ?? String(e)));} finally
    {setSaving(false);}
  });

  const handleClose = () => {setForm(INIT);setErrors({});setApiError("");setShowPass(false);onClose();};

  return (
    <Modal open={open} onClose={handleClose} title="Tambah User Baru"
    footer={
    <>
          <button className="btn-secondary" onClick={handleClose} disabled={saving}>Batal</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan…" : "Tambah"}</button>
        </>
    }>
      {apiError && <p style={{ color: "#dc2626", fontSize: ".875rem" }}>{apiError}</p>}

      <div className="form-field">
        <label>Nama Lengkap</label>
        <input type="text" value={form.nama_lengkap} onChange={set("nama_lengkap")} placeholder="Isi nama lengkap.." />
        {errors.nama_lengkap && <span className="field-error">{errors.nama_lengkap}</span>}
      </div>

      <div className="form-field">
        <label>Nomor Telepon</label>
        <input type="tel" value={form.no_telp} onChange={set("no_telp")} placeholder="Isi no. telepon..." />
        {errors.no_telp && <span className="field-error">{errors.no_telp}</span>}
      </div>

      <div className="form-field">
        <label>Email</label>
        <input type="email" value={form.email} onChange={set("email")} placeholder="Isi email..." />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>

      <div className="form-field">
        <label>Role</label>
        <select value={form.role} onChange={set("role")}>
          <option value="">Pilih role</option>
          {roleList.filter((r) => r !== "Pelanggan").map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {errors.role && <span className="field-error">{errors.role}</span>}
      </div>

      <div className="form-field">
        <label>Password</label>
        <div style={{ position: "relative" }}>
          <input
            type={showPass ? "text" : "password"}
            value={form.password}
            onChange={set("password")}
            placeholder="Isi password"
            style={{ paddingRight: "2.5rem", width: "100%", boxSizing: "border-box" }} />
          
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 0 }}>
            
            {showPass ? "Lihat" : "Sembunyikan"}
          </button>
        </div>
        {errors.password && <span className="field-error">{errors.password}</span>}
      </div>
    </Modal>);

}