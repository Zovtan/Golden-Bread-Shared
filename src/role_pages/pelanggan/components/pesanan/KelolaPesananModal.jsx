

export default function KelolaPesananModal({ open, pesanan, onResume, onBatal, onClose, loading }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}>
      
      <div
        className="bg-white rounded-xl w-[min(94vw,420px)] flex flex-col overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,.25)]"
        onClick={(e) => e.stopPropagation()}>
        
        {}
        <div className="flex items-center justify-between px-5 py-3.5 bg-amber-50 border-b border-amber-200">
          <span className="text-[0.9375rem] font-bold text-amber-900">
            💳 Kelola Pesanan #{pesanan?.id_pesanan}
          </span>
          <button
            className="bg-transparent border-none cursor-pointer text-sm text-gray-500 hover:text-gray-800 font-[inherit] disabled:opacity-55"
            onClick={onClose}
            disabled={loading}>
            
            ✕ Tutup
          </button>
        </div>

        {}
        <div className="px-5 py-4 flex flex-col gap-2.5">
          <p className="text-[0.8125rem] text-gray-500 leading-relaxed">
            Pesanan ini masih menunggu pembayaran. Lanjutkan pembayaran atau batalkan pesanan.
          </p>
          <button
            className="btn-primary pesanan-action-btn w-full justify-center"
            onClick={onResume}
            disabled={loading}>
            
            {loading ? "Memproses…" : "Sambung Pembayaran"}
          </button>
          <button
            className="pesanan-action-btn w-full bg-red-50 border border-red-200 text-red-600 font-semibold disabled:opacity-55"
            onClick={onBatal}
            disabled={loading}>
            
            Batal Pesanan
          </button>
        </div>
      </div>
    </div>);

}