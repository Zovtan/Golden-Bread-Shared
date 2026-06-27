
import StatusPopUp from "./StatusPopUp";

export default function AjukanRefundModal({ open, pesananId, value, onChange, onConfirm, onClose, loading }) {
  if (!open) return null;
  return (
    <StatusPopUp icon="↩" iconBg="bg-amber-100" title="Ajukan Refund" onClose={onClose}>
      <p className="text-[0.8125rem] text-gray-500 leading-relaxed mb-2">
        Permintaan refund untuk pesanan <strong>#{pesananId}</strong> akan ditinjau admin/kasir.
        Dana dikembalikan setelah disetujui.
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="Alasan refund (opsional)"
        className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-[0.8125rem] resize-y mb-2" />
      
      <div className="flex gap-2">
        <button className="btn-secondary pesanan-action-btn flex-1" onClick={onClose} disabled={loading}>Batal</button>
        <button className="btn-primary pesanan-action-btn flex-1" onClick={onConfirm} disabled={loading}>
          {loading ? "Mengirim…" : "Ajukan"}
        </button>
      </div>
    </StatusPopUp>);

}