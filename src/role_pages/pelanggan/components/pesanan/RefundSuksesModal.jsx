
import StatusPopUp from "./StatusPopUp";

export default function RefundSuksesModal({ open, onClose }) {
  if (!open) return null;
  return (
    <StatusPopUp icon="✓" iconBg="bg-green-100" title="Refund Diajukan" onClose={onClose}>
      <p className="text-[0.8125rem] text-gray-500 leading-relaxed mb-4">
        Permintaan refund kamu sudah dikirim. Tunggu persetujuan admin/kasir.
      </p>
      <button className="btn-primary pesanan-action-btn w-full" onClick={onClose}>Oke</button>
    </StatusPopUp>);

}