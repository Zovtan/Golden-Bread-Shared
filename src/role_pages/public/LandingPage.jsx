
import { useNavigate } from "react-router-dom";
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const LOGO_URL = `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/cjsksozbjq8c0cvyacdz`;
const LOGO_URL_SMALL = `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/pgud1aph4piwmomi12uu`;

const MAPS_URL = "https://www.google.com/maps/place/GOLDEN+BREAD+%26+ES+KRIM+HOKLAI,+Jalan+Dokter+Wahidin+No.58,+Melayu,+Kec.+Siantar+Utara,+Kota+Pematang+Siantar,+Sumatera+Utara+21144/@2.9775671,99.0550698,11z/data=!4m9!1m2!2m1!1sgolden+bread!3m5!1s0x303185eaf01125d9:0x2ab8dfad0e96690d!8m2!3d2.9612346!4d99.0646801!16s%2Fg%2F11w3819f50";
const EMBED_URL = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3982.5!2d99.0646801!3d2.9612346!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x303185eaf01125d9%3A0x2ab8dfad0e96690d!2sGolden%20Bread%20%26%20Es%20Krim%20Hoklai!5e0!3m2!1sid!2sid!4v1";

const PRODUCTS = [
{ emoji: "🥐", name: "Roti Isi", desc: "Aneka rasa favorit untuk semua selera" },
{ emoji: "🍞", name: "Roti Tawar", desc: "Lembut, fresh, dan selalu siap dinikmati" },
{ emoji: "🍩", name: "Donat", desc: "Pilihan topping favorit dengan tekstur yang empuk" },
{ emoji: "🎂", name: "Bolu", desc: "Tekstur lembut dengan rasa yang istimewa" },
{ emoji: "🍨", name: "Aneka Jajan", desc: "Pilihan camilan dan jajanan yang beragam" }];


export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-amber-50 text-stone-900" style={{ fontFamily: "'Georgia', serif" }}>

      {}
      <nav className="sticky top-0 z-50 bg-amber-50/90 backdrop-blur-sm border-b border-amber-200 px-6 h-15 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={LOGO_URL_SMALL} alt="Golden Bread" className="w-10 h-10 object-contain" />
          <span className="font-bold text-lg text-amber-800 tracking-tight">Golden Bread</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/auth")}
            className="px-4 py-2 rounded-full border border-amber-800 text-amber-800 bg-transparent text-sm font-semibold hover:bg-amber-800 hover:text-white transition-colors cursor-pointer">
            
            Masuk
          </button>
          <button
            onClick={() => navigate("/auth?view=register")}
            className="px-4 py-2 rounded-full border-none bg-amber-800 text-white text-sm font-semibold hover:bg-amber-900 transition-colors cursor-pointer">
            
            Daftar
          </button>
        </div>
      </nav>

      {}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 border-b border-amber-200 px-6 py-6 sm:py-6 text-center">
        {}
        <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-amber-300/20" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-amber-300/15" />

        <div className="relative max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <img
              src={LOGO_URL}
              alt="Golden Bread"
              style={{ width: "max(250px)", height: "auto", objectFit: "contain" }}
              className="drop-shadow-2xl" />
            
          </div>

          <span className="inline-block bg-amber-100 border border-amber-300 rounded-full px-4 py-1 text-xs text-amber-800 font-semibold uppercase tracking-widest mb-5">
            🌟 Pematang Siantar · Sumatera Utara
          </span>

          <h1 className="text-4xl lg:text-5xl font-black text-amber-900 leading-tight mb-5">
            Roti & Kue Berkualitas,<br />
            <span className="text-amber-500">Langsung dari Oven Kami</span>
          </h1>

          <p className="text-base sm:text-lg text-amber-800/80 leading-relaxed max-w-lg mx-auto mb-8">
            Golden Bread menghadirkan roti segar, kue lezat, dan bolu lembut
            yang sudah dipercaya warga Siantar sejak bertahun-tahun.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/auth?view=register")}
              className="w-full sm:w-auto px-7 py-3 rounded-full bg-amber-800 text-white font-bold text-base hover:bg-amber-900 transition-all shadow-lg shadow-amber-800/30 cursor-pointer">
              
              Pesan Sekarang
            </button>
            <a
              href={MAPS_URL} target="_blank" rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-7 py-3 rounded-full border border-amber-800 text-amber-800 font-semibold text-base hover:bg-amber-800 hover:text-white transition-colors no-underline">
              
              📍 Lihat Lokasi
            </a>
          </div>
        </div>
      </section>

      {}
      <section className="max-w-4xl mx-auto px-6 py-14">
        <h2 className="text-center text-3xl font-bold text-amber-900 mb-2">Produk Unggulan</h2>
        <p className="text-center text-amber-800/70 text-sm mb-8">Dibuat fresh setiap hari dengan bahan pilihan</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {PRODUCTS.map((p) =>
          <div key={p.name}
          className="bg-white border border-amber-200 rounded-2xl px-3 py-5 text-center shadow-sm hover:-translate-y-1 hover:shadow-md transition-all">
            
              <div className="text-4xl mb-3">{p.emoji}</div>
              <div className="font-bold text-sm text-amber-900 mb-1">{p.name}</div>
              <div className="text-xs text-amber-800/60">{p.desc}</div>
            </div>
          )}
        </div>
      </section>

      {}
      <section className="bg-gradient-to-r from-amber-800 to-amber-700 px-6 py-14 text-center text-white">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">
          Pesan Lebih Mudah dengan Akun Pelanggan
        </h2>
        <p className="text-white/85 text-sm sm:text-base max-w-md mx-auto mb-7 leading-relaxed">
          Daftar gratis dan nikmati kemudahan pemesanan online, lacak status pesanan,
          dan lihat riwayat pembelian kapan saja.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate("/auth?view=register")}
            className="w-full sm:w-auto px-7 py-3 rounded-full bg-amber-100 text-amber-900 font-bold text-base hover:bg-white transition-colors cursor-pointer">
            
            Buat Akun Gratis
          </button>
          <button
            onClick={() => navigate("/auth?view=register")}
            className="w-full sm:w-auto px-7 py-3 rounded-full border border-amber-100 text-amber-100 font-semibold text-base hover:bg-amber-100/10 transition-colors cursor-pointer">
            
            Sudah Punya Akun? Masuk
          </button>
        </div>
      </section>

      {}
      <section className="max-w-3xl mx-auto px-6 py-14">
        <h2 className="text-center text-3xl font-bold text-amber-900 mb-2">Temukan Kami</h2>  
        <p className="text-center text-amber-800/70 text-sm mb-2">
          📍 Jl. Dokter Wahidin No.58, Melayu, Kec. Siantar Utara,<br />
          Kota Pematang Siantar, Sumatera Utara 21144
        </p>
        <div className="rounded-2xl overflow-hidden border border-amber-200 shadow-md h-64 sm:h-80">
          <iframe
            title="Lokasi Golden Bread"
            src={EMBED_URL}
            width="100%" height="100%"
            className="block border-0"
            allowFullScreen loading="lazy"
            referrerPolicy="no-referrer-when-downgrade" />
          
        </div>

        <div className="text-center mt-4">
          <a
            href={MAPS_URL} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-amber-800 font-semibold text-sm border-b border-amber-500 pb-px no-underline hover:text-amber-900 transition-colors">
            
            Buka di Google Maps ↗
          </a>
        </div>

        <h2 className="text-center text-3xl font-bold text-amber-900 mb-2 mt-6">Hubungi Kami</h2>  
        <p className="text-center text-amber-800/70 text-sm">
          📞 +6285276538888 <br /> 
          📞 +6282160676345
        </p>      

      </section>

      {}
      <footer className="border-t border-amber-200 bg-amber-50 py-7 text-center text-amber-800/70 text-sm">
        © {new Date().getFullYear()} Golden Bread · Pematang Siantar
      </footer>
    </div>);

}