
import { useState } from "react";
import { signIn } from "../hooks/useAuth";
import { translateAuthError } from "../utils/authUtils";
import { useSubmitLock } from "../../shared/hooks/useSubmitLock";

export default function LoginForm({ onSuccess, onForgot, onRegister, notice }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const guard = useSubmitLock();

  const handleSubmit = guard(async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {setError("Harap isi email dan kata sandi.");return;}
    setLoading(true);
    try {
      const { session, profile } = await signIn(email, password, remember);
      onSuccess(session, profile);
    } catch (err) {
      setError(translateAuthError(err.message));
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="w-full max-w-[380px]">
      {}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-amber-900 leading-tight mb-1">Masuk</h1>
        <p className="text-xs tracking-widest text-amber-600 uppercase font-semibold">
          Silahkan Masukkan Detail Anda
        </p>
      </div>

      {notice && !error &&
      <div role="status" className="auth-alert-success">{notice}</div>
      }

      {error &&
      <div role="alert" className="auth-alert-error">{error}</div>
      }

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label className="block text-sm font-medium text-amber-900 mb-1.5">Alamat Email</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="email" autoFocus required className="auth-input" />
          
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-amber-900 mb-1.5">Kata Sandi</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"} value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password" required
              className="auth-input pr-20" />
            
            <button
              type="button" tabIndex={-1} onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-600
                         hover:text-amber-900 bg-transparent border-none cursor-pointer p-0 leading-none">
              

              
              {showPw ? "Sembunyikan" : "Lihat"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-7 text-sm">
          <label className="flex items-center gap-2 cursor-pointer text-amber-800 select-none">
            <input
              type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 accent-amber-700 rounded" />
            
            Ingat untuk 30 Hari
          </label>
          <button type="button" onClick={onForgot} className="auth-link-btn text-sm">
            Lupa Kata Sandi
          </button>
        </div>

        <button type="submit" disabled={loading} className="auth-btn-submit">
          {loading ? "Memproses…" : "Masuk"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-amber-700">
        Tidak punya akun?{" "}
        <button type="button" onClick={onRegister} className="auth-link-btn text-sm">
          Daftar
        </button>
      </p>
    </div>);

}