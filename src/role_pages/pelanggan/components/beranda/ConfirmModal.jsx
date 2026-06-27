







export default function ConfirmModal({
  open, onClose, onConfirm, loading = false,
  title = "Konfirmasi",
  message = "Apakah kamu yakin?",
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  variant = "default"
}) {
  if (!open) return null;
  const confirmClass = variant === "danger" ? "btn-danger" : "btn-primary";
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-modal-title">{title}</h3>
        <p className="confirm-modal-msg">{message}</p>
        <div className="confirm-modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>{cancelLabel}</button>
          <button className={confirmClass} onClick={onConfirm} disabled={loading}>
            {loading ? "Memproses…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>);

}