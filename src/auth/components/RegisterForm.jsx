
import { useState } from "react";
import { signUpPelanggan } from "../hooks/useAuth";
import { translateAuthError } from "../utils/authUtils";
import {
  validateEmail, EMAIL_RULE_TEXT,
  validatePhone, PHONE_RULE_TEXT,
  validatePassword, PASSWORD_RULE_TEXT } from
"../utils/validation";
import { useSubmitLock } from "../../shared/hooks/useSubmitLock";
import { trimStrings } from "../../shared/utils/trimStrings";

export default function RegisterForm({ onSuccess, onLogin }) {
  const [form, setForm] = useState({
    email: "", password: "", konfirmasi: "",
    nama_lengkap: "", no_telp: "", nama_toko: "",
    jenis_pelanggan: "Reguler", alamat: ""
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const guard = useSubmitLock();

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const validate = () => {
    const err = {};
    if (!form.email) err.email = "Wajib diisi.";else
    if (!validateEmail(form.email)) err.email = EMAIL_RULE_TEXT;
    if (!form.password) err.password = "Wajib diisi.";else
    if (!validatePassword(form.password)) err.password = PASSWORD_RULE_TEXT;
    if (form.password !== form.konfirmasi) err.konfirmasi = "Password tidak cocok.";
    if (!form.nama_lengkap) err.nama_lengkap = "Wajib diisi.";
    if (!form.no_telp) err.no_telp = "Wajib diisi.";else
    if (!validatePhone(form.no_telp)) err.no_telp = PHONE_RULE_TEXT;
    return err;
  };

  const handleSubmit = guard(async (e) => {
    e.preventDefault();
    setApiError("");
    const err = validate();
    if (Object.keys(err).length) {setErrors(err);return;}
    setLoading(true);
    try {


      const payload = trimStrings(form, ["password", "konfirmasi"]);
      await signUpPelanggan(payload);
      onSuccess(payload.email);
    } catch (err) {
      setApiError(translateAuthError(err?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
  });

  const field = (key, hasErr) => hasErr ? "auth-input-err" : "auth-input";

  return (
    <div className="w-full max-w-[660px]">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-amber-900 leading-tight mb-1">Daftar</h1>
        <p className="text-xs tracking-widest text-amber-600 uppercase font-semibold">
          Silahkan Masukkan Detail Anda
        </p>
      </div>

      {apiError && <div role="alert" className="auth-alert-error">{apiError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        {}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1.5">Nama Pengguna</label>
            <input type="text" value={form.nama_lengkap} onChange={set("nama_lengkap")}
            autoComplete="name" autoFocus required className={field("nama_lengkap", !!errors.nama_lengkap)} />
            {errors.nama_lengkap && <p className="mt-1 text-xs text-red-500">{errors.nama_lengkap}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={set("email")}
            autoComplete="email" required className={field("email", !!errors.email)} />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1.5">Nomor Telepon</label>
            <input type="tel" value={form.no_telp} onChange={set("no_telp")}
            autoComplete="tel" required className={field("no_telp", !!errors.no_telp)} />
            {errors.no_telp ?
            <p className="mt-1 text-xs text-red-500">{errors.no_telp}</p> :
            <p className="mt-1 text-xs text-amber-600/80">{PHONE_RULE_TEXT}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1.5">Kata Sandi</label>
            <input type="password" value={form.password} onChange={set("password")}
            autoComplete="new-password" required className={field("password", !!errors.password)} />
            {errors.password ?
            <p className="mt-1 text-xs text-red-500">{errors.password}</p> :
            <p className="mt-1 text-xs text-amber-600/80">{PASSWORD_RULE_TEXT}</p>}
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1.5">Alamat</label>
            <input type="text" value={form.alamat} onChange={set("alamat")} className="auth-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1.5">Konfirmasi Kata Sandi</label>
            <input type="password" value={form.konfirmasi} onChange={set("konfirmasi")}
            autoComplete="new-password" required className={field("konfirmasi", !!errors.konfirmasi)} />
            {errors.konfirmasi && <p className="mt-1 text-xs text-red-500">{errors.konfirmasi}</p>}
          </div>
        </div>

        <button type="submit" disabled={loading} className="auth-btn-submit">
          {loading ? "Mendaftar…" : "Daftar Sekarang"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-amber-700">
        Sudah punya akun?{" "}
        <button type="button" onClick={onLogin} className="auth-link-btn text-sm">
          Masuk
        </button>
      </p>
    </div>);

}