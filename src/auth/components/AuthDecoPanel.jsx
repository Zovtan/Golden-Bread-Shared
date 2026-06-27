
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const LOGO_URL = `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/cjsksozbjq8c0cvyacdz`;

const TAGLINES = [
"Roti segar setiap hari,\nKelezatan kue-kue yang baru dipanggang.",
"Dibuat dengan cinta,\ndisajikan dengan bangga.",
"Dari dapur kami\nuntuk meja makan kamu."];


export default function AuthDecoPanel() {
  return (
    <div className="auth-deco-panel">
      {}
      <div className="relative z-10 flex flex-col items-center text-center px-12 select-none">
        <img
          src={LOGO_URL}
          alt="Golden Bread"
          className="w-28 h-28 object-contain mb-6 drop-shadow-md" />
        
        <span className="font-black text-3xl text-amber-900 tracking-tight leading-tight mb-10">
          Golden Bread
        </span>
        {}
        <div className="w-12 h-0.5 bg-amber-300 rounded-full mb-8" />

        {}
        <p className="text-sm text-amber-800/70 leading-relaxed max-w-[220px] whitespace-pre-line text-center">
          {TAGLINES[new Date().getHours() % TAGLINES.length]}
        </p>
      </div>

      {}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <span className="inline-flex items-center gap-1.5 bg-amber-100 border border-amber-300
                         rounded-full px-4 py-1.5 text-xs font-semibold text-amber-700">
          
          
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Pematang Siantar, Sumatera Utara
        </span>
      </div>
    </div>);

}