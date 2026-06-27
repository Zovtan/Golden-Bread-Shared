import { useAuthContext } from "../../../../auth/hooks/AuthContext";


const CONTACTS = [
{ wa: "6285276538888", display: "0852-7653-8888" },
{ wa: "6282160676345", display: "0821-6067-6345" }];



function buildWaText({ profile, session }) {
  return encodeURIComponent(
    "Halo Golden Bread, saya ingin memperbarui akun ke Prioritas.\n\n" +
    `Nama  : ${profile?.nama_lengkap ?? "-"}\n` +
    `Email : ${session?.user?.email ?? "-"}\n` +
    `ID    : ${profile?.id ?? "-"}`
  );
}

export default function FiturTakTersedia({ open, onClose }) {
  const { profile, session } = useAuthContext();
  if (!open) return null;
  const waText = buildWaText({ profile, session });
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="bg-white rounded-2xl border border-amber-900 py-8 px-6 w-full max-w-[340px] text-center"
        onClick={(e) => e.stopPropagation()}>
        
        {}
        <div className="w-14 h-14 rounded-full bg-amber-100 border border-amber-900
                        flex items-center justify-center text-2xl text-amber-900 mx-auto mb-4">
          
          
          ✕
        </div>
        <div className="text-[1.0625rem] font-black text-amber-900 mb-2.5">Fitur tidak tersedia!</div>
        {}
        <p className="text-sm text-amber-800 leading-relaxed mb-4">
          Untuk menggunakan fitur Pre-Order, kamu harus memperbarui akun ke status <strong>Prioritas</strong>.
          Hubungi nomor berikut untuk memperbarui akun kamu!
        </p>
        {}
        <div className="flex flex-col gap-3 mb-5 text-left">
          {CONTACTS.map(({ wa, display }) =>
          <div key={wa}>
              <div className="text-sm font-semibold text-amber-900 mb-1.5">{display}</div>
              <div className="grid grid-cols-2 gap-2">
                <a
                href={`https://wa.me/${wa}?text=${waText}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2 rounded-lg bg-green-600
                             text-white text-[0.8125rem] font-semibold no-underline hover:bg-green-700 transition-colors">
                

                
                  💚 WhatsApp
                </a>
                <a
                href={`tel:+${wa}`}
                className="flex items-center justify-center gap-2 py-2 rounded-lg border border-amber-800
                             bg-amber-800 text-white text-[0.8125rem] font-semibold no-underline hover:bg-amber-900 transition-colors">
                

                
                  📞 Telepon
                </a>
              </div>
            </div>
          )}
        </div>
        {}
        <button className="fitur-tak-tersedia-btn" onClick={onClose}>Oke</button>
      </div>
    </div>);

}