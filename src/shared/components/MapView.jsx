
import { useEffect, useRef, useState } from "react";

const CDN_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
const CDN_JS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";

let _ready = null;
function loadLeaflet() {
  if (_ready) return _ready;
  _ready = new Promise((res, rej) => {
    if (window.L) {res(window.L);return;}
    if (!document.querySelector(`link[href="${CDN_CSS}"]`)) {
      const l = document.createElement("link");l.rel = "stylesheet";l.href = CDN_CSS;
      document.head.appendChild(l);
    }
    const s = document.createElement("script");s.src = CDN_JS;
    s.onload = () => {
      const L = window.L;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"
      });
      res(L);
    };
    s.onerror = () => {_ready = null;rej(new Error("gagal memuat leaflet"));};
    document.head.appendChild(s);
  });
  return _ready;
}

export default function MapView({ lat, lng, height = 200 }) {
  const divRef = useRef(null);
  const mapRef = useRef(null);
  const [fs, setFs] = useState(false);


  useEffect(() => {
    if (!divRef.current || mapRef.current) return;
    let alive = true;
    loadLeaflet().then((L) => {
      if (!alive || !divRef.current || mapRef.current) return;
      const map = L.map(divRef.current, { center: [lat, lng], zoom: 16, zoomControl: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
      }).addTo(map);
      L.marker([lat, lng]).addTo(map);
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 100);
    });
    return () => {alive = false;};
  }, []);


  useEffect(() => {
    setTimeout(() => mapRef.current?.invalidateSize(), 80);
  }, [fs]);


  useEffect(() => {
    if (!fs) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {if (e.key === "Escape") setFs(false);};
    window.addEventListener("keydown", onKey);
    return () => {document.body.style.overflow = prev;window.removeEventListener("keydown", onKey);};
  }, [fs]);

  useEffect(() => () => {mapRef.current?.remove();mapRef.current = null;}, []);

  const fsBtn =
  <button
    onClick={() => setFs((v) => !v)}
    title={fs ? "Keluar fullscreen" : "Perbesar peta"}
    style={{
      position: "absolute", top: 8, right: 8, zIndex: 1000,
      background: "#fff", border: "1px solid #ccc", borderRadius: 4,
      width: 28, height: 28, cursor: "pointer", fontSize: "13px",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 1px 4px rgba(0,0,0,.2)"
    }}>
    
      {fs ? "✕" : "⛶"}
    </button>;


  return (
    <>
      {fs && <div style={{ position: "fixed", inset: 0, zIndex: 99998, background: "#1a1a1a" }} />}
      <div style={{
        position: fs ? "fixed" : "relative",
        inset: fs ? 0 : undefined,
        zIndex: fs ? 99999 : undefined,
        width: "100%",
        height: fs ? "100vh" : height
      }}>
        <div ref={divRef} style={{ width: "100%", height: "100%" }} />
        {fsBtn}
      </div>
    </>);

}