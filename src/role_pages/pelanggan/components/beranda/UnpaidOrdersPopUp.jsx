

import { fmtRp, fmtDateTime } from "../../../../shared/utils/format";

export default function UnpaidOrdersPopUp({ open, orders = [], onPay, onClose }) {
  if (!open || !orders.length) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 99999, background: "rgba(0,0,0,0.45)" }}>
      
      <div
        role="alertdialog"
        aria-label="Pesanan Belum Dibayar"
        className="bg-white rounded-xl flex flex-col overflow-hidden"
        style={{ width: "min(94vw, 480px)", maxHeight: "82vh", boxShadow: "0 12px 40px rgba(0,0,0,.25)" }}>
        
        {}
        <div className="flex items-center justify-between px-5 py-3.5 bg-amber-50 border-b border-amber-200 flex-shrink-0">
          <span className="text-[0.9375rem] font-bold text-amber-900">
            💳 {orders.length} Pesanan Belum Dibayar
          </span>
          <button
            className="bg-transparent border-none cursor-pointer text-sm text-gray-500 hover:text-gray-800 font-[inherit]"
            onClick={onClose}>
            
            ✕ Tutup
          </button>
        </div>

        {}
        <div className="overflow-y-auto px-4 py-3 flex flex-col gap-2">
          <p className="text-[0.8125rem] text-gray-500 mb-1">
            Selesaikan pembayaran agar pesananmu diproses. Pesanan yang tidak dibayar tepat waktu akan dibatalkan otomatis.
          </p>
          {orders.map((o) =>
          <div key={o.id_pesanan} className="bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2.5 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-gray-900">Pesanan #{o.id_pesanan}</div>
                <div className="text-[0.75rem] text-gray-500 mt-0.5">{fmtDateTime(o.tanggal)}</div>
              </div>
              <div className="text-sm font-bold text-amber-900 whitespace-nowrap">Rp{fmtRp(o.total)}</div>
            </div>
          )}
        </div>

        {}
        <div className="px-5 py-3.5 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
          <button className="btn-secondary" onClick={onClose}>Nanti</button>
          <button className="btn-primary" onClick={onPay}>Bayar Sekarang</button>
        </div>
      </div>
    </div>);

}