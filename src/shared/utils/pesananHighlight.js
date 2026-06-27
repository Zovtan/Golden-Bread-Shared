import { asUTC, fmtDurasi } from "./format";
import { DEFAULT_BATAS } from "./batasPesananDefaults";


function minutesUntil(iso) {
  if (!iso) return null;
  return Math.floor((new Date(asUTC(iso)) - Date.now()) / 60_000);
}


function minutesSince(iso) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(asUTC(iso)).getTime()) / 60_000);
}




const DASHBOARD_STATUS_RANK = { Pending: 0, Pending_Payment: 1, Diproses: 2, Selesai: 3, Dibatalkan: 4 };



export function sortPesananPendingFirst(rows) {
  return [...(rows ?? [])].sort((a, b) => {
    const ra = DASHBOARD_STATUS_RANK[a.status] ?? 99;
    const rb = DASHBOARD_STATUS_RANK[b.status] ?? 99;
    if (ra !== rb) return ra - rb;
    return new Date(b.tanggalRaw) - new Date(a.tanggalRaw);
  });
}




export function pesananHighlight(p, batas = {}) {

  const active = p.status === "Pending" || p.status === "Pending_Payment" || p.status === "Diproses";
  if (!active) return { rowBg: null, badgeText: null, badgeColor: null };

  if (p.waktu_antar) {
    const mnt = minutesUntil(p.waktu_antar);
    if (mnt <= 0) return { rowBg: "#fef2f2", badgeText: "Terlambat!", badgeColor: "#dc2626" };
    if (mnt <= 60) return { rowBg: "#fef9ec", badgeText: `< ${mnt} mnt`, badgeColor: "#d97706" };
    if (mnt <= 1440) return { rowBg: "#fefce8", badgeText: `< ${Math.round(mnt / 60)} jam`, badgeColor: "#ca8a04" };
  } else if (p.status === "Pending" || p.status === "Pending_Payment" || p.status === "Diproses") {
    const threshold = batas.menit_highlight_segera ?? DEFAULT_BATAS.menit_highlight_segera;
    const mnt = minutesSince(p.tanggal);
    if (mnt >= threshold) {
      const label = `Menunggu ${fmtDurasi(mnt)}`;
      return { rowBg: "#fef9ec", badgeText: label, badgeColor: "#d97706" };
    }
  }
  return { rowBg: null, badgeText: null, badgeColor: null };
}