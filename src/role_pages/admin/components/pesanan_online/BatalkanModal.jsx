
import { useState, useEffect } from "react";

export default function BatalkanModal({ open, pesanan, onConfirm, onClose, loading }) {
  const [alasan, setAlasan] = useState("");

  useEffect(() => {if (!open) setAlasan("");}, [open]);
  if (!open) return null;


  const isRefund = pesanan?.refund_status === "Diminta";

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl p-6 w-[420px] max-w-[90vw] shadow-[0_20px_60px_rgba(0,0,0,.18)]">
        <h3 className="text-[1.0625rem] font-bold mb-2">
          {isRefund ? "Setujui Refund" : "Batalkan"} Pesanan #{pesanan?.id_pesanan}?
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {isRefund ?
          "Pesanan akan dibatalkan, dana dikembalikan ke pelanggan via Midtrans, dan stok dikembalikan." :
          pesanan?.status === "Diproses" ?
          "Stok yang sudah dikurangi akan dikembalikan." :
          "Pesanan akan ditandai sebagai dibatalkan."}
        </p>
        <div className="form-field mb-4">
          <label>{isRefund ? "Catatan untuk pelanggan (opsional)" : "Alasan pembatalan (opsional - dikirim ke pelanggan)"}</label>
          <textarea rows={3} className="resize-y"
          placeholder={isRefund ? "Cth: Refund disetujui, dana diproses 1-3 hari kerja…" : "Cth: Stok produk habis mendadak…"}
          value={alasan} onChange={(e) => setAlasan(e.target.value)} />
        </div>
        <div className="flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Kembali</button>
          <button className="btn-primary"
          style={{ background: isRefund ? "#15803d" : "#dc2626", borderColor: isRefund ? "#15803d" : "#dc2626" }}
          onClick={() => onConfirm(alasan)} disabled={loading}>
            {loading ? "Memproses…" : isRefund ? "Ya, Setujui Refund" : "Ya, Batalkan"}
          </button>
        </div>
      </div>
    </div>);

}