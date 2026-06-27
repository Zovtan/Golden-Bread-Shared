
import { useState } from "react";

export default function ImportantAlertsPopUp({ alerts = [], loading = false }) {
  const [dismissed, setDismissed] = useState(false);

  if (loading || !alerts.length || dismissed) return null;

  const critical = alerts.filter((a) => a.variant === "habis");
  const warning = alerts.filter((a) => a.variant !== "habis");

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 99999, background: "rgba(0,0,0,0.45)" }}>
      
      <div
        role="alertdialog"
        aria-label="Peringatan Penting"
        className="bg-white rounded-xl flex flex-col overflow-hidden"
        style={{ width: "min(94vw, 540px)", maxHeight: "82vh", boxShadow: "0 12px 40px rgba(0,0,0,.25)" }}>
        
        {}
        <div className="flex items-center justify-between px-5 py-3.5 bg-amber-50 border-b border-amber-200 flex-shrink-0">
          <span className="text-[0.9375rem] font-bold text-amber-900">
            ⚠️ {alerts.length} Item Memerlukan Perhatian
          </span>
          <button
            className="bg-transparent border-none cursor-pointer text-sm text-gray-500 hover:text-gray-800 font-[inherit]"
            onClick={() => setDismissed(true)}>
            
            ✕ Tutup
          </button>
        </div>

        {}
        <div className="overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {critical.length > 0 &&
          <div>
              <div className="flex items-center gap-1.5 text-[0.8125rem] font-semibold text-red-600 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                Kritis ({critical.length})
              </div>
              <div className="flex flex-col gap-1.5">
                {critical.map((a) =>
              <div key={a.id} className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                    <div className="text-sm font-bold text-gray-900">{a.title}</div>
                    <div className="text-[0.8125rem] text-gray-500 mt-0.5">{a.sub}</div>
                  </div>
              )}
              </div>
            </div>
          }
          {warning.length > 0 &&
          <div>
              <div className="flex items-center gap-1.5 text-[0.8125rem] font-semibold text-amber-600 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                Peringatan ({warning.length})
              </div>
              <div className="flex flex-col gap-1.5">
                {warning.map((a) =>
              <div key={a.id} className="bg-yellow-50 border border-yellow-200 rounded-lg px-3.5 py-2.5">
                    <div className="text-sm font-bold text-gray-900">{a.title}</div>
                    <div className="text-[0.8125rem] text-gray-500 mt-0.5">{a.sub}</div>
                  </div>
              )}
              </div>
            </div>
          }
        </div>

        {}
        <div className="px-5 py-3.5 border-t border-gray-100 flex justify-end flex-shrink-0">
          <button className="btn-primary" onClick={() => setDismissed(true)}>
            Sudah Dipahami
          </button>
        </div>
      </div>
    </div>);

}