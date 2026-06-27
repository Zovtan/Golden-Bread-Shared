
import StatusPopUp from "./StatusPopUp";

export default function BatalkanPesananModal({ open, pesananId, value, onChange, onConfirm, onClose, loading }) {
  if (!open) return null;
  return (
    <StatusPopUp icon="🚫" iconBg="bg-red-100" title="Batalkan Pesanan?" onClose={onClose}>
      <p className="text-[0.8125rem] text-gray-500 leading-relaxed mb-2">
        Pesanan <strong>#{pesananId}</strong> akan dibatalkan dan tidak dapat dikembalikan.
        Kamu yakin ingin membatalkan pesanan ini?
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="Alasan pembatalan (opsional)"
        className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-[0.8125rem] resize-y mb-2" />
      
      <div className="flex gap-2 justify-center">
        <button className="btn-secondary pesanan-action-btn flex-1" onClick={onClose} disabled={loading}>
          Tidak
        </button>
        <button
          className="btn-primary pesanan-action-btn flex-1"
          style={{ background: "#dc2626", borderColor: "#dc2626" }}
          onClick={onConfirm}
          disabled={loading}>
          
          {loading ? "Membatalkan…" : "Ya, Batalkan"}
        </button>
      </div>
    </StatusPopUp>);

}