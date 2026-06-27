
export default function KonfirmasiStatusModal({ open, pesanan, newStatus, onConfirm, onClose, loading }) {
  if (!open || !pesanan) return null;
  const isProses = newStatus === "Diproses";
  const isPreorder = Boolean(pesanan.waktu_antar);
  const label = isProses ? "Proses" : "Selesaikan";
  const desc = isProses ?
  isPreorder ?
  "Pesanan pre-order akan diproses." :
  "Stok produk akan langsung dikurangi. Pastikan stok mencukupi." :
  "Pesanan akan ditandai selesai dan reservasi stok akan dibebaskan.";
  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl p-6 w-[400px] max-w-[90vw] shadow-[0_20px_60px_rgba(0,0,0,.18)]">
        <h3 className="text-[1.0625rem] font-bold mb-2">
          {label} Pesanan #{pesanan.id_pesanan}?
        </h3>
        <p className="text-sm text-gray-500 mb-5">{desc}</p>
        <div className="flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Batal</button>
          <button className="btn-primary" onClick={onConfirm} disabled={loading}>
            {loading ? "Memproses…" : `Ya, ${label}`}
          </button>
        </div>
      </div>
    </div>);

}