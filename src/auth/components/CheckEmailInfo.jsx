
import { useState } from "react";
import { sendPasswordReset } from "../hooks/useAuth";
import { translateAuthError } from "../utils/authUtils";
import { useSubmitLock } from "../../shared/hooks/useSubmitLock";

export default function CheckEmailInfo({ email, onLogin, onRetry }) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");
  const guard = useSubmitLock();

  const handleResend = guard(async () => {
    if (!email || resending) return;
    setResending(true);setError("");
    try {
      await sendPasswordReset(email);
      setResent(true);
    } catch (err) {
      setError(translateAuthError(err?.message ?? String(err)));
    } finally {
      setResending(false);
    }
  });

  return (
    <div className="w-full max-w-[380px]">
      {}
      <div className="mb-8 w-16 h-16 rounded-full bg-amber-100 border border-amber-200
                      flex items-center justify-center">
        
        
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
        stroke="#92400e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M2 7l10 7 10-7" />
        </svg>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-black text-amber-900 leading-tight mb-1">Cek Email Kamu</h1>
        <p className="text-xs tracking-widest text-amber-600 uppercase font-semibold">
          Instruksi Telah Dikirim
        </p>
      </div>

      <p className="text-sm text-amber-800/70 mb-2">
        Kami telah mengirim instruksi reset kata sandi ke:
      </p>
      <p className="text-sm font-semibold text-amber-900 mb-6 break-all">{email || "email kamu"}</p>

      <p className="text-xs text-amber-700/60 mb-8 leading-relaxed">
        Periksa folder <strong>Spam</strong> atau <strong>Promotions</strong> jika email tidak
        muncul di kotak masuk dalam beberapa menit.
      </p>

      {error && <div role="alert" className="auth-alert-error">{error}</div>}
      {resent &&
      <div className="auth-alert-success">Email berhasil dikirim ulang.</div>
      }

      <button type="button" onClick={onLogin} className="auth-btn-submit mb-3">
        Kembali ke Login
      </button>

      <button
        type="button" onClick={handleResend} disabled={resending || resent}
        className="auth-btn-secondary">
        
        {resending ? "Mengirim…" : resent ? "Email Terkirim ✓" : "Kirim Ulang Email"}
      </button>

      <p className="mt-6 text-center text-xs text-amber-600/70">
        Email yang salah?{" "}
        <button type="button" onClick={onRetry} className="auth-link-btn text-xs">
          Coba lagi
        </button>
      </p>
    </div>);

}