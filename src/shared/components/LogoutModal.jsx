

export default function LogoutModal({ open, onClose, onConfirm, variant = "default" }) {
  if (!open) return null;
  const av = variant === "amber" ? " amber" : "";
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`logout-box${av}`} onClick={(e) => e.stopPropagation()}>
        <div className={`logout-icon${av}`}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>
        <h3 className={`logout-title${av}`}>Keluar dari akun?</h3>
        <p className="logout-desc">
          Kamu akan keluar dari sesi ini. Kamu bisa login kembali kapan saja.
        </p>
        <div className="logout-footer">
          <button className={`logout-cancel-btn${av}`} onClick={onClose}>Batal</button>
          <button className={`logout-confirm-btn${av}`} onClick={onConfirm}>Ya, Keluar</button>
        </div>
      </div>
    </div>);

}