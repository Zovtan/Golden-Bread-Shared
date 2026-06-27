
export default function RejectRefundModal({ open, pesanan, value, onChange, onConfirm, onClose, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-1">Tolak Refund #{pesanan?.id_pesanan}?</h3>
        <p className="text-sm text-gray-600 mb-3">Permintaan refund ditandai ditolak. Status pesanan tetap.</p>
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
        placeholder="Alasan penolakan (opsional)"
        className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-3" />
        <div className="flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Batal</button>
          <button className="btn-primary" style={{ background: "#dc2626", borderColor: "#dc2626" }}
          onClick={onConfirm} disabled={loading}>
            {loading ? "Memproses…" : "Tolak Refund"}
          </button>
        </div>
      </div>
    </div>);

}