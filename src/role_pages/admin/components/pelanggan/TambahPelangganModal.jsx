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

const INIT = { nama_lengkap: "", nama_toko: "", jenis_pelanggan: "", no_telp: "", email: "", alamat: "", password: "" };


export default function TambahPelangganModal({ open, onClose, jenisPelangganList = [], onSubmit }) {
  const [form, setForm] = useState(INIT);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const guard = useSubmitLock();

  const set = (k) => (e) => {setForm((f) => ({ ...f, [k]: e.target.value }));setErrors((p) => ({ ...p, [k]: undefined }));};

  const validate = () => {
    const err = {};
    if (!form.nama_lengkap.trim()) err.nama_lengkap = "Wajib diisi";
    if (!form.jenis_pelanggan) err.jenis_pelanggan = "Pilih jenis";
    if (!form.no_telp.trim()) err.no_telp = "Wajib diisi";else
    if (!validatePhone(form.no_telp)) err.no_telp = PHONE_RULE_TEXT;
    if (!form.email.trim()) err.email = "Wajib diisi";else
    if (!validateEmail(form.email)) err.email = EMAIL_RULE_TEXT;
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
      setForm(INIT);setErrors({});onClose();
    } catch (e) {setApiError(translateAuthError(e?.message ?? String(e)));} finally
    {setSaving(false);}
  });
  const handleClose = () => {setForm(INIT);setErrors({});setApiError("");onClose();};

  return (
    <Modal open={open} onClose={handleClose} title="Tambah Pelanggan Baru"
    footer={
    <>
          <button className="btn-secondary" onClick={handleClose} disabled={saving}>Batal</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan…" : "Tambah"}</button>
        </>
    }>
      {apiError && <p style={{ color: "#dc2626", fontSize: ".875rem" }}>{apiError}</p>}

      <div className="form-field">
        <label>Nama Pelanggan</label>
        <input type="text" value={form.nama_lengkap} onChange={set("nama_lengkap")} placeholder="Isi nama pelanggan..." />
        {errors.nama_lengkap && <span className="field-error">{errors.nama_lengkap}</span>}
      </div>
      <div className="form-field">
        <label>Nama Toko</label>
        <input type="text" value={form.nama_toko} onChange={set("nama_toko")} placeholder="Isi nama toko.." />
      </div>
      <div className="form-field">
        <label>Jenis Pelanggan</label>
        <select value={form.jenis_pelanggan} onChange={set("jenis_pelanggan")}>
          <option value="">Pilih jenis pelanggan</option>
          {jenisPelangganList.map((j) => <option key={j} value={j}>{j}</option>)}
        </select>
        {errors.jenis_pelanggan && <span className="field-error">{errors.jenis_pelanggan}</span>}
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
        <label>Alamat</label>
        <input type="text" value={form.alamat} onChange={set("alamat")} placeholder="Isi alamat..." />
      </div>
      <div className="form-field">
        <label>Password</label>
        <div className="relative">
          <input type={showPw ? "text" : "password"} value={form.password} onChange={set("password")}
          placeholder="Isi password" style={{ paddingRight: "4.5rem" }} />
          <button type="button" tabIndex={-1} onClick={() => setShowPw((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-800 bg-transparent border-none cursor-pointer p-0 leading-none">
            {showPw ? "Sembunyikan" : "Lihat"}
          </button>
        </div>
        {errors.password && <span className="field-error">{errors.password}</span>}
      </div>
    </Modal>);

}