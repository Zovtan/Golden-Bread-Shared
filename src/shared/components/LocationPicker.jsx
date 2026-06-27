

import { useState, useEffect, useRef, useCallback } from "react";

const CDN_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
const CDN_JS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";

const CENTER = [2.9543, 99.0695];
const BOUNDS = [[2.82, 98.95], [3.07, 99.20]];
const SIANTAR = { lat: 2.9595, lng: 99.0687 };
const MAX_KM = 12;

function distKm(lat1, lng1, lat2, lng2) {
  const R = 6371,dL = (lat2 - lat1) * Math.PI / 180,dG = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dL / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dG / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

let _leafletReady = null;
function loadLeaflet() {
  if (_leafletReady) return _leafletReady;
  _leafletReady = new Promise((resolve, reject) => {
    if (window.L) {resolve(window.L);return;}
    if (!document.querySelector(`link[href="${CDN_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";link.href = CDN_CSS;
      document.head.appendChild(link);
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
      resolve(L);
    };
    s.onerror = () => {_leafletReady = null;reject(new Error("Gagal memuat library peta."));};
    document.head.appendChild(s);
  });
  return _leafletReady;
}

function inBounds(lat, lng) {
  return lat >= BOUNDS[0][0] && lat <= BOUNDS[1][0] && lng >= BOUNDS[0][1] && lng <= BOUNDS[1][1];
}
function withinDelivery(lat, lng) {
  return distKm(lat, lng, SIANTAR.lat, SIANTAR.lng) <= MAX_KM;
}
function inSiantar(data) {
  const a = data?.address ?? {};
  return [a.city, a.town, a.municipality, a.county].join(" ").toLowerCase().includes("siantar");
}
async function reverseLookup(lat, lng) {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
    { headers: { "Accept-Language": "id", "User-Agent": "GoldenBread/1.0" } }
  );
  return r.json();
}

export default function LocationPicker({
  lat = null, lng = null,
  onChange,
  optional = false, skipLocation = false, onSkipChange,
  required = false,
  variant = "default"
}) {
  const divRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const wrapRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoad] = useState(false);
  const [geoErr, setGeoErr] = useState("");
  const [mapErr, setMapErr] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [permState, setPermState] = useState("prompt");

  const emit = useCallback((patch) => onChange?.({ lat, lng, ...patch }), [lat, lng, onChange]);


  useEffect(() => {
    if (!navigator.permissions) return;
    navigator.permissions.query({ name: "geolocation" }).then((status) => {
      setPermState(status.state);
      status.onchange = () => setPermState(status.state);
    }).catch(() => {});
  }, []);


  const fetchGPS = useCallback(() => {
    if (!navigator.geolocation) {setGeoErr("Browser ini tidak mendukung GPS.");return;}
    setGpsLoad(true);setGeoErr("");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: clat, longitude: clng } = coords;
        setPermState("granted");
        try {
          if (!inBounds(clat, clng)) {setGeoErr("Posisi GPS di luar Kota Pematang Siantar.");return;}
          const data = await reverseLookup(clat, clng);
          if (!inSiantar(data) && !withinDelivery(clat, clng)) {
            setGeoErr("Posisi GPS di luar area pengiriman Pematang Siantar.");
            return;
          }
          emit({ lat: clat, lng: clng });
          setGeoErr("");
        } catch {setGeoErr("Gagal mendapatkan info GPS.");
        } finally {setGpsLoad(false);}
      },
      (err) => {
        setGpsLoad(false);
        setPermState(err.code === 1 ? "denied" : "prompt");
        setGeoErr(err.code === 1 ?
        "Izin GPS ditolak. Aktifkan lokasi di pengaturan browser/perangkat, lalu tap GPS lagi." :
        "Gagal mendapatkan posisi GPS. Coba lagi atau pin lokasi manual.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [emit]);


  useEffect(() => {
    if (permState === "granted" && lat == null) fetchGPS();
  }, [permState]);


  useEffect(() => {



    if (skipLocation) {
      mapRef.current?.remove();mapRef.current = null;markerRef.current = null;
      return;
    }
    if (!divRef.current || mapRef.current) return;
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !divRef.current || mapRef.current) return;
      const map = L.map(divRef.current, {
        center: lat && lng ? [lat, lng] : CENTER,
        zoom: lat && lng ? 16 : 13,
        maxBounds: BOUNDS, maxBoundsViscosity: 0.9
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
      }).addTo(map);
      if (lat && lng) markerRef.current = L.marker([lat, lng]).addTo(map);

      map.on("click", async ({ latlng }) => {
        const { lat: clat, lng: clng } = latlng;
        if (!inBounds(clat, clng)) {setGeoErr("Lokasi di luar Kota Pematang Siantar.");return;}
        setLoading(true);setGeoErr("");
        try {
          const data = await reverseLookup(clat, clng);
          if (!inSiantar(data) && !withinDelivery(clat, clng)) {
            setGeoErr("Lokasi di luar area pengiriman Pematang Siantar.");
            return;
          }
          emit({ lat: clat, lng: clng });
        } catch {setGeoErr("Gagal mengambil info lokasi. Coba lagi.");
        } finally {setLoading(false);}
      });
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 150);
    }).catch((e) => setMapErr(e.message));
    return () => {cancelled = true;};
  }, [skipLocation]);


  useEffect(() => {
    if (mapRef.current) setTimeout(() => mapRef.current?.invalidateSize(), 80);
  }, [fullscreen]);


  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.L) return;
    if (lat && lng) {
      if (markerRef.current) markerRef.current.setLatLng([lat, lng]);else
      markerRef.current = window.L.marker([lat, lng]).addTo(map);
      map.setView([lat, lng], 16);
    } else if (markerRef.current) {markerRef.current.remove();markerRef.current = null;}
  }, [lat, lng]);

  useEffect(() => () => {mapRef.current?.remove();mapRef.current = null;markerRef.current = null;}, []);


  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {if (e.key === "Escape") setFullscreen(false);};
    window.addEventListener("keydown", onKey);
    return () => {document.body.style.overflow = prev;window.removeEventListener("keydown", onKey);};
  }, [fullscreen]);

  const mapHeight = fullscreen ? "100%" : 220;

  const isAmber = variant === "amber";
  const gpsBg = permState === "granted" ? "#065f46" :
  permState === "denied" ? "#7f1d1d" :
  isAmber ? "#d97706" : "#374151";
  const gpsBtn =
  <button type="button" onClick={fetchGPS} disabled={gpsLoading || loading}
  title={permState === "denied" ? "Izin GPS ditolak - aktifkan di pengaturan" : "Gunakan GPS"}
  style={{
    background: gpsBg,
    color: "#fff", border: "none", borderRadius: 6,
    padding: isAmber ? ".35rem .875rem" : ".2rem .55rem",
    fontSize: isAmber ? ".8125rem" : ".75rem",
    fontFamily: "inherit", cursor: "pointer",
    display: "flex", alignItems: "center", gap: 5,
    fontWeight: isAmber ? 600 : 400,
    boxShadow: isAmber && permState !== "denied" ? "0 2px 8px rgba(217,119,6,.35)" : "none",
    opacity: gpsLoading || loading ? .6 : 1
  }}>
      {gpsLoading ? "⏳" : permState === "denied" ? "🚫" : "📍"}
      {isAmber ? gpsLoading ? " Mendeteksi…" : " Gunakan GPS" : " GPS"}
    </button>;


  const fsBtn =
  <button type="button" onClick={() => setFullscreen((v) => !v)}
  title={fullscreen ? "Keluar fullscreen" : "Perbesar peta"}
  style={{
    background: "#374151", color: "#fff", border: "1px solid rgba(255,255,255,.2)",
    borderRadius: 4, padding: ".2rem .5rem", fontSize: ".75rem", fontFamily: "inherit", cursor: "pointer"
  }}>
      {fullscreen ? "✕" : "⛶"}
    </button>;


  const headerBar =
  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#111827", color: "#fff", padding: ".375rem .875rem", fontSize: ".8125rem", flexShrink: 0 }}>
      <span style={{ fontWeight: 600 }}>📍 Kota Pematang Siantar</span>
      <span style={{ marginLeft: "auto", opacity: .5, fontSize: ".7rem" }}>
        {loading ? "Mendeteksi…" : "Tap peta untuk pin"}
      </span>
      {gpsBtn}
      {fsBtn}
    </div>;


  const mapContent =
  <>
      {headerBar}
      {mapErr ?
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6" }}>⚠ {mapErr}</div> :
    <div ref={divRef} style={{ height: mapHeight, flex: fullscreen ? 1 : undefined, cursor: "crosshair", background: "#e5e7eb" }} />
    }
      {geoErr &&
    <div style={{ padding: ".375rem .875rem", background: "#fef2f2", borderTop: "1px solid #fecaca", fontSize: ".8125rem", color: "#b91c1c", flexShrink: 0 }}>
          ⚠ {geoErr}
        </div>
    }
      {lat && lng ?
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: ".375rem .875rem", background: "#f0fdf4", borderTop: "1px solid #bbf7d0", fontSize: ".75rem", color: "#166534", flexShrink: 0 }}>
          <span>✓ Pin: {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}</span>
          <button type="button" onClick={() => emit({ lat: null, lng: null })}
      style={{ marginLeft: "auto", background: "transparent", border: "none", cursor: "pointer", fontSize: ".75rem", color: "#6b7280", fontFamily: "inherit" }}>
            ✕ Hapus pin
          </button>
        </div> :

    <div style={{ padding: ".25rem .875rem", background: required ? "#fef2f2" : "#fefce8", borderTop: `1px solid ${required ? "#fecaca" : "#fde68a"}`, fontSize: ".8125rem", color: required ? "#b91c1c" : "#92400e", flexShrink: 0 }}>
          {required ? "⚠ Lokasi wajib diisi - tap peta atau gunakan GPS" : "Belum ada pin - tap peta atau gunakan GPS"}
        </div>
    }
    </>;


  return (
    <div ref={wrapRef} style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
      {optional &&
      <label style={{ display: "flex", alignItems: "center", gap: 8, padding: ".375rem .875rem", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", cursor: "pointer", fontSize: ".8125rem" }}>
          <input type="checkbox" checked={skipLocation}
        onChange={(e) => onSkipChange?.(e.target.checked)}
        style={{ width: 16, height: 16, cursor: "pointer" }} />
          <span style={{ color: "#374151" }}>Tidak ingin berbagi lokasi</span>
        </label>
      }

      {!skipLocation &&
      <>
          {

        }
          <div
          style={fullscreen ?
          { position: "fixed", inset: 0, zIndex: 99999, display: "flex", flexDirection: "column", background: "#111827" } :
          { display: "flex", flexDirection: "column" }}>
          
            {mapContent}
          </div>

          {}
          {fullscreen &&
        <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", color: "#9ca3af", fontSize: ".875rem", gap: 8 }}>
              🗺 Peta terbuka di fullscreen
              <button type="button" onClick={() => setFullscreen(false)}
          style={{ background: "#374151", color: "#fff", border: "none", borderRadius: 4, padding: ".25rem .6rem", fontSize: ".75rem", fontFamily: "inherit", cursor: "pointer" }}>
                Tutup
              </button>
            </div>
        }
        </>
      }

      {skipLocation &&
      <div style={{ padding: "1rem .875rem", color: "#6b7280", fontSize: ".8125rem", textAlign: "center" }}>
          Lokasi tidak akan dibagikan.
        </div>
      }
    </div>);

}