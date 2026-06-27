
import StatusPopUp from "./StatusPopUp";

export default function BatalSuksesModal({ open, onClose }) {
  if (!open) return null;
  return (
    <StatusPopUp icon="✓" iconBg="bg-gray-100" title="Pesanan Dibatalkan" onClose={onClose}>
      <p className="text-[0.8125rem] text-gray-500 leading-relaxed mb-4">
        Pesanan kamu berhasil dibatalkan.
      </p>
      <button className="btn-primary pesanan-action-btn w-full" onClick={onClose}>Oke</button>
    </StatusPopUp>);

}