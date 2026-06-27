
import { useAuthContext } from "../../../auth/hooks/AuthContext";


const CONTACTS = [
{ wa: "6285276538888", display: "0852-7653-8888" },
{ wa: "6282160676345", display: "0821-6067-6345" }];



function buildWaText({ profile, session }) {
  return encodeURIComponent(
    "Halo Golden Bread, saya butuh bantuan.\n\n" +
    `Nama  : ${profile?.nama_lengkap ?? "-"}\n` +
    `Email : ${session?.user?.email ?? "-"}\n` +
    `ID    : ${profile?.id ?? "-"}`
  );
}


const ContactCard = ({ wa, display, waText }) =>
<div className="rounded-xl border border-amber-800 bg-white p-4">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-base font-bold text-amber-900 tracking-wide">{display}</span>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <a
      href={`https://wa.me/${wa}?text=${waText}`}
      target="_blank" rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-600
                   text-white text-sm font-semibold no-underline hover:bg-green-700 transition-colors">
      

      
        💚 WhatsApp
      </a>
      <a
      href={`tel:+${wa}`}
      className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-amber-800
                   text-white bg-amber-800 text-sm font-semibold no-underline hover:bg-amber-900 transition-colors">
      

      
        📞 Telepon
      </a>
    </div>
  </div>;


export default function PelangganBantuan() {
  const { profile, session } = useAuthContext();
  const waText = buildWaText({ profile, session });

  return (
    <div className="max-w-md mx-auto px-4">
      {}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-900
                        flex items-center justify-center text-2xl mx-auto mb-3">
          
          
          💬
        </div>
        <h2 className="text-xl font-black text-amber-900">Butuh Bantuan?</h2>
        <p className="text-sm text-amber-600 mt-1">
          Kami siap membantu kamu setiap hari
        </p>
      </div>

      {}
      <div className="flex flex-col gap-3 mb-6">
        {CONTACTS.map((c) =>
        <ContactCard key={c.wa} wa={c.wa} display={c.display} waText={waText} />
        )}
      </div>

      {}
      <div className="bg-amber-50 border border-amber-900 rounded-xl p-4 text-sm text-amber-800 space-y-2">
        <div className="font-semibold text-amber-800 mb-2">Jam Operasional Toko</div>
        <div className="flex justify-between">
          <span className="text-amber-800">Senin – Sabtu</span>
          <span className="font-medium">07.00 – 21.00 WIB</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-800">Minggu</span>
          <span className="font-medium">07.00 – 20.00 WIB</span>
        </div>
      </div>

      {}
      <div className="mt-3 bg-white border border-amber-900 rounded-xl p-4 text-sm text-amber-800">
        <div className="font-semibold text-amber-900 mb-1">📍 Alamat Toko</div>
        <p className="text-amber-800 leading-relaxed">
          Jalan Dokter Wahidin No. 58, Melayu,<br />
          Kec. Siantar Utara, Kota Pematang Siantar,<br />
          Sumatera Utara 21144
        </p>
      </div>
    </div>);

}