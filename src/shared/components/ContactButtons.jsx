

import { toWaNumber } from "../utils/phone";

export default function ContactButtons({ phone, waText }) {
  if (!phone) return null;
  const wa = toWaNumber(phone);
  const waUrl = `https://wa.me/${wa}${waText ? `?text=${waText}` : ""}`;

  return (
    <div style={{ display: "flex", gap: ".5rem", marginTop: "-.25rem", marginBottom: ".75rem" }}>
      <a
        href={waUrl}
        target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg bg-green-600
                   text-white text-sm font-semibold no-underline hover:bg-green-700 transition-colors">
        

        
        💚 WhatsApp
      </a>
      <a
        href={`tel:+${wa}`}
        className="inline-flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg bg-blue-600
                   text-white text-sm font-semibold no-underline hover:bg-blue-700 transition-colors">
        

        
        📞 Telepon
      </a>
    </div>);

}