




export default function ActionErrorModal({ open, message, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1100]" onClick={onClose}>
      <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
        <div className="text-4xl mb-3">⚠️</div>
        <div className="font-bold text-red-600 mb-2">{/stok/i.test(message) ? "Stok Tidak Mencukupi" : "Gagal Memproses"}</div>
        <p className="text-sm text-gray-600 mb-5">{message}</p>
        <button className="btn-primary" onClick={onClose}>Mengerti</button>
      </div>
    </div>);

}