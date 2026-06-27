
import StatusPopUp from "./StatusPopUp";

export default function PesananErrorModal({ open, title = "Terjadi Kesalahan", pesan, onClose }) {
  if (!open) return null;
  return (
    <StatusPopUp icon="✕" iconBg="bg-red-100" title={title} onClose={onClose}>
      <p className="text-[0.8125rem] text-gray-500 leading-relaxed mb-4">{pesan}</p>
      <button className="btn-primary pesanan-action-btn w-full" onClick={onClose}>Oke</button>
    </StatusPopUp>);

}