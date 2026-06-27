
import { useState, useRef } from "react";
import { sendPasswordReset } from "../hooks/useAuth";
import { translateAuthError } from "../utils/authUtils";
import { useSubmitLock } from "../../shared/hooks/useSubmitLock";

const COOLDOWN_SEC = 60;

export default function ForgotPasswordForm({ onSuccess, onLogin }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);
  const guard = useSubmitLock();

  const startCooldown = () => {
    setCooldown(COOLDOWN_SEC);
    timerRef.current = setInterval(() => {
      setCooldown((v) => {
        if (v <= 1) {clearInterval(timerRef.current);return 0;}
        return v - 1;
      });
    }, 1000);
  };

  const handleSubmit = guard(async (e) => {
    e.preventDefault();
    setError("");
    if (!email) {setError("Masukkan email Anda.");return;}
    if (cooldown > 0) return;
    setLoading(true);
    try {
      await sendPasswordReset(email);
      startCooldown();
      onSuccess(email);
    } catch (err) {
      setError(translateAuthError(err.message));
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="w-full max-w-[380px]">
      <button
        type="button" onClick={onLogin}
        className="flex items-center gap-1.5 bg-transparent border-none p-0 cursor-pointer
                   text-sm text-amber-600 hover:text-amber-900 transition-colors font-[inherit] mb-9">
        

        
        ← Kembali ke Login
      </button>

      <div className="mb-8">
        <h1 className="text-4xl font-black text-amber-900 leading-tight mb-1">Lupa Sandi?</h1>
        <p className="text-xs tracking-widest text-amber-600 uppercase font-semibold">
          Masukkan Email Akun Kamu
        </p>
      </div>

      {error && <div role="alert" className="auth-alert-error">{error}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-1.5">
          <label className="block text-sm font-medium text-amber-900 mb-1.5">Alamat Email</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="email" autoFocus required className="auth-input" />
          
          <p className="mt-2 text-xs text-amber-700/70">
            Kata sandi kamu akan dikirimkan langsung ke email ini.
          </p>
        </div>

        <button
          type="submit" disabled={loading || cooldown > 0}
          className="auth-btn-submit mt-5">
          
          {loading ?
          "Mengirim…" :
          cooldown > 0 ?
          `Kirim ulang dalam ${cooldown}s` :
          "Kirim Kata Sandi"}
        </button>
      </form>
    </div>);

}