
import { useEffect, useRef } from "react";


const TIPE_STYLE = {
  Pesanan_Baru: { bg: "#111827", color: "#fff", icon: "🛒" },
  Stok_Habis: { bg: "#dc2626", color: "#fff", icon: "⚠️" },
  Stok_Menipis: { bg: "#d97706", color: "#fff", icon: "📉" },
  Kadaluarsa: { bg: "#7c3aed", color: "#fff", icon: "📅" },
  default: { bg: "#374151", color: "#fff", icon: "🔔" }
};
const DURATION = 5000;


function Toast({ toast, onDismiss, onToastClick }) {
  const style = TIPE_STYLE[toast.tipe] ?? TIPE_STYLE.default;
  const timerRef = useRef(null);
  const navigable = !!(toast.id_pesanan || toast.id_produk || toast.id_bahan);

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(toast.id), DURATION);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, onDismiss]);

  const lines = (toast.pesan ?? "").split("\n");
  const judul = lines[0];
  const isi = lines.slice(1).join(" ");

  return (
    <div style={{ background: style.bg, color: style.color, animation: "toast-in .2s ease" }}
    className="flex items-start gap-2.5 rounded-xl px-4 py-3 relative min-w-[280px] max-w-[360px]"
    style={{ background: style.bg, color: style.color, boxShadow: "0 4px 20px rgba(0,0,0,.18)", animation: "toast-in .2s ease" }}>
      
      <span className="text-lg leading-none flex-shrink-0 mt-0.5">{style.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="m-0 font-bold text-sm leading-snug">{judul}</p>
        {isi && <p className="m-0 mt-0.5 text-[0.8125rem] leading-snug" className="opacity-[0.88]">{isi}</p>}
        {navigable &&
        <button
          onClick={() => {onToastClick?.(toast);onDismiss(toast.id);}}
          className="mt-1.5 border-none rounded cursor-pointer text-xs px-2 py-0.5 font-[inherit]"
          style={{ background: "rgba(255,255,255,0.2)", color: style.color }}>
          
            Lihat detail →
          </button>
        }
      </div>
      <button onClick={() => onDismiss(toast.id)}
      className="bg-transparent border-none cursor-pointer text-sm p-0 leading-none flex-shrink-0 mt-0.5"
      style={{ color: style.color, opacity: 0.7 }}
      aria-label="Tutup">✕</button>
      <div className="absolute bottom-0 left-0 h-[3px] w-full"
      style={{
        borderRadius: "0 0 10px 10px",
        background: "rgba(255,255,255,.4)",
        animation: `toast-progress ${DURATION}ms linear forwards`,
        transformOrigin: "left"
      }} />
    </div>);

}


export default function ToastContainer({ toasts = [], onDismiss, onToastClick }) {
  if (!toasts.length) return null;
  return (
    <>
      <style>{`
        @keyframes toast-in { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes toast-progress { from{transform:scaleX(1)} to{transform:scaleX(0)} }
      `}</style>
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map((t) =>
        <div key={t.id} className="pointer-events-auto">
            <Toast toast={t} onDismiss={onDismiss} onToastClick={onToastClick} />
          </div>
        )}
      </div>
    </>);

}