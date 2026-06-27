
import { useState } from "react";


const TABS_ALL = [
{ key: "semua", label: "Semua" },
{ key: "belum", label: "Belum dibaca" },
{ key: "pesanan", label: "Pesanan" },
{ key: "persediaan", label: "Persediaan" }];

const TABS_PELANGGAN = [
{ key: "semua", label: "Semua" },
{ key: "belum", label: "Belum dibaca" }];



const TIPE_COLOR = {
  Stok_Habis: "#dc2626",
  Stok_Menipis: "#d97706",
  Kadaluarsa: "#7c3aed",
  Pesanan_Baru: "#111827"
};

const TIPE_KATEGORI = {
  Stok_Habis: "persediaan",
  Stok_Menipis: "persediaan",
  Kadaluarsa: "persediaan",
  Pesanan_Baru: "pesanan"
};


export default function NotifikasiModal({ open, onClose, notifs = [], onTandaiDibaca, onTandaiSemua, onNotifClick, role }) {
  const [tab, setTab] = useState("semua");
  const TABS = role === "Pelanggan" ? TABS_PELANGGAN : TABS_ALL;
  if (!open) return null;

  const filtered = notifs.filter((n) => {
    if (tab === "belum") return !n.dibaca;
    if (tab === "pesanan") return TIPE_KATEGORI[n.tipe] === "pesanan";
    if (tab === "persediaan") return TIPE_KATEGORI[n.tipe] === "persediaan";
    return true;
  });

  const parseMsg = (pesan) => {
    const lines = (pesan ?? "").split("\n");
    return { judul: lines[0] ?? "", isi: lines.slice(1).join(" ") };
  };

  const isNavigable = (n) => !!(n.id_pesanan || n.id_produk || n.id_bahan);

  const handleRowClick = (n) => {if (!n.dibaca) onTandaiDibaca(n.id);};
  const handleNavigate = (e, n) => {
    e.stopPropagation();
    if (!n.dibaca) onTandaiDibaca(n.id);
    onNotifClick?.(n);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1200] flex justify-end pointer-events-none">
      <div className="absolute inset-0 pointer-events-auto" onClick={onClose} />

      {}
      <div
        className="relative z-10 w-[220px] md:w-[400px] h-screen bg-white border-l border-gray-200 flex flex-col shadow-xl pointer-events-auto"
        style={{ animation: "notifSlideIn .25s cubic-bezier(.4,0,.2,1)" }}>
        

        {}
        <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-[1.125rem] font-bold m-0 text-gray-900">Notifikasi</h2>
            <div className="flex items-center gap-3">
              {}
              <button
                onClick={onTandaiSemua}
                className="hidden md:inline bg-transparent border-none cursor-pointer text-sm text-blue-600 underline font-[inherit] hover:text-blue-800">
                
                Tandai semua dibaca
              </button>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-transparent border-none cursor-pointer text-gray-400 hover:bg-gray-100 hover:text-gray-700 text-lg leading-none"
                aria-label="Tutup">
                
                ×
              </button>
            </div>
          </div>
          {}
          <button
            onClick={onTandaiSemua}
            className="md:hidden mt-2 p-0 bg-transparent border-none cursor-pointer text-sm text-blue-600 underline font-[inherit] hover:text-blue-800">
            
            Tandai semua dibaca
          </button>
        </div>

        {}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          {TABS.map((t) =>
          <button key={t.key} onClick={() => setTab(t.key)}
          className={[
          "px-4 py-2.5 text-sm cursor-pointer font-[inherit] whitespace-nowrap transition-colors",
          "bg-transparent border-t-0 border-l-0 border-r-0 border-b-2",
          tab === t.key ?
          "border-b-gray-900 font-semibold text-gray-900 notif-tab-active" :
          "border-b-transparent font-normal text-gray-500 hover:text-gray-700"].
          join(" ")}>
            {t.label}</button>
          )}
        </div>

        {}
        <div className="flex-1 overflow-y-auto min-h-0">
          {filtered.length === 0 ?
          <p className="text-gray-400 text-sm px-6 py-10 text-center">Tidak ada notifikasi.</p> :
          filtered.map((n) => {
            const { judul, isi } = parseMsg(n.pesan);
            const dotColor = TIPE_COLOR[n.tipe] ?? "#111827";
            const navigable = isNavigable(n);
            return (
              <div key={n.id} onClick={() => handleRowClick(n)}
              className={[
              "px-5 py-3.5 border-b border-gray-50 transition-colors",
              n.dibaca ? "bg-white cursor-default" : "bg-gray-50/70 cursor-pointer hover:bg-gray-100/50"].
              join(" ")}>
                
                <div className="flex items-start gap-2 mb-1">
                  {}
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0 mt-[5px]"
                    style={{ background: n.dibaca ? "transparent" : dotColor, border: n.dibaca ? "none" : undefined }} />
                  
                  <p className={`m-0 flex-1 text-[0.9rem] leading-snug text-gray-900 ${n.dibaca ? "font-normal" : "font-semibold"}`}>
                    {judul}
                  </p>
                  {navigable &&
                  <button onClick={(e) => handleNavigate(e, n)}
                  className="ml-1 flex-shrink-0 bg-transparent border border-gray-200 rounded-md cursor-pointer
                                 text-xs text-gray-600 font-[inherit] px-2 py-0.5 whitespace-nowrap hover:bg-gray-100 transition-colors">
                    
                    
                      Lihat →
                    </button>
                  }
                </div>
                {isi &&
                <p className="text-[0.8125rem] text-gray-600 m-0 mb-1 pl-4 leading-relaxed">
                    {isi}
                  </p>
                }
                <p className="text-[0.75rem] text-gray-400 m-0 pl-4">
                  {n.waktu_fmt} · {n.modul}
                </p>
              </div>);

          })}
        </div>
      </div>
    </div>);

}