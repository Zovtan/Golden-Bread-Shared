
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { translateAuthError } from "../utils/authUtils";
import { validatePassword, PASSWORD_RULE_TEXT } from "../utils/validation";
import { useSubmitLock } from "../../shared/hooks/useSubmitLock";

export default function ResetPasswordForm({ onSuccess }) {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showKonf, setShowKonf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [konfErr, setKonfErr] = useState("");
  const guard = useSubmitLock();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = guard(async (e) => {
    e.preventDefault();
    setError("");setPwErr("");setKonfErr("");
    let hasErr = false;
    if (!validatePassword(password)) {setPwErr(PASSWORD_RULE_TEXT);hasErr = true;}
    if (password !== konfirmasi) {setKonfErr("Password tidak cocok.");hasErr = true;}
    if (hasErr) return;
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      await supabase.auth.signOut();
      if (typeof onSuccess === "function") onSuccess();
    } catch (err) {
      setError(translateAuthError(err.message));
    } finally {
      setLoading(false);
    }
  });

  if (!ready) return (
    <div className="w-full max-w-[380px]">
      <p className="text-sm text-amber-700">Memvalidasi link reset password…</p>
    </div>);


  return (
    <div className="w-full max-w-[380px]">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-amber-900 leading-tight mb-1">Password Baru</h1>
        <p className="text-xs tracking-widest text-amber-600 uppercase font-semibold">
          Masukkan Password Baru Untuk Akun Anda
        </p>
      </div>

      {error && <div role="alert" className="auth-alert-error">{error}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label className="block text-sm font-medium text-amber-900 mb-1.5" htmlFor="reset-password">
            Password baru
          </label>
          <div className="relative">
            <input
              id="reset-password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => {setPassword(e.target.value);setPwErr("");}}
              autoComplete="new-password" autoFocus required
              className={`${pwErr ? "auth-input-err" : "auth-input"} pr-20`} />
            
            <button type="button" tabIndex={-1} onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-600
                         hover:text-amber-900 bg-transparent border-none cursor-pointer p-0 leading-none">
              

              
              {showPw ? "Sembunyikan" : "Lihat"}
            </button>
          </div>
          {pwErr ?
          <p className="mt-1 text-xs text-red-500">{pwErr}</p> :
          <p className="mt-1 text-xs text-amber-600/80">{PASSWORD_RULE_TEXT}</p>}
        </div>

        <div className="mb-7">
          <label className="block text-sm font-medium text-amber-900 mb-1.5" htmlFor="reset-konfirmasi">
            Konfirmasi password baru
          </label>
          <div className="relative">
            <input
              id="reset-konfirmasi"
              type={showKonf ? "text" : "password"}
              value={konfirmasi}
              onChange={(e) => {setKonfirmasi(e.target.value);setKonfErr("");}}
              autoComplete="new-password" required
              className={`${konfErr ? "auth-input-err" : "auth-input"} pr-20`} />
            
            <button type="button" tabIndex={-1} onClick={() => setShowKonf((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-600
                         hover:text-amber-900 bg-transparent border-none cursor-pointer p-0 leading-none">
              

              
              {showKonf ? "Sembunyikan" : "Lihat"}
            </button>
          </div>
          {konfErr && <p className="mt-1 text-xs text-red-500">{konfErr}</p>}
        </div>

        <button type="submit" disabled={loading} className="auth-btn-submit">
          {loading ? "Menyimpan…" : "Simpan Password Baru"}
        </button>
      </form>
    </div>);

}