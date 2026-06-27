





export const SIANTAR = { lat: 2.9595, lng: 99.0687 };
export const MAX_KM = 12;


export function distKm(lat1, lng1, lat2, lng2) {
  const R = 6371,dL = (lat2 - lat1) * Math.PI / 180,dG = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dL / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dG / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


export const isInSiantar = (lat, lng) => distKm(lat, lng, SIANTAR.lat, SIANTAR.lng) <= MAX_KM;




export const STORE_ORIGIN = { lat: 2.961244, lng: 99.064685 };



const ONGKIR_TIERS = [
{ maxKm: 3, factor: 1 },
{ maxKm: 6, factor: 2 },
{ maxKm: 10, factor: 3 },
{ maxKm: Infinity, factor: 4 }];






export function infoOngkir(lat, lng, ongkir_base = 0, multiplier_aktif = false) {
  const km = lat == null || lng == null ?
  null :
  distKm(lat, lng, STORE_ORIGIN.lat, STORE_ORIGIN.lng);

  const ongkir = !multiplier_aktif || km == null ?
  ongkir_base :
  Math.round(ongkir_base * ONGKIR_TIERS.find((t) => km <= t.maxKm).factor / 500) * 500;

  const jarakLabel = km == null ? null :
  km <= 3 ? `Dekat (${km.toFixed(1)} km)` :
  km <= 6 ? `Sedang (${km.toFixed(1)} km)` :
  km <= 10 ? `Jauh (${km.toFixed(1)} km)` :
  `Sangat Jauh (${km.toFixed(1)} km)`;

  return { km, ongkir, jarakLabel };
}