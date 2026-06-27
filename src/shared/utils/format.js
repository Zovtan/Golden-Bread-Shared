



const LOCALE = "id-ID";
const TZ = "Asia/Jakarta";




export const asUTC = (iso) => {
  if (!iso) return iso;
  const s = String(iso);

  if (s.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(s)) return s;

  return s + "Z";
};



export const parseWIB = (iso) => {
  if (!iso) return null;
  const s = String(iso);
  if (s.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(s)) return new Date(s);
  return new Date(s + "+07:00");
};





export const fmtRp = (n) => `Rp${Number(n ?? 0).toLocaleString(LOCALE)}`;



export const fmtRpSpace = (n) => `Rp ${Number(n ?? 0).toLocaleString(LOCALE)}`;



export const fmtRpDecimal = (n) =>
`Rp${Number(n ?? 0).toLocaleString(LOCALE, { minimumFractionDigits: 2 })}`;



export const fmtRpCompact = (n) => {
  const v = Number(n ?? 0);
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1).replace(".0", "")}jt`;
  if (v >= 1_000) return `Rp ${(v / 1_000).toFixed(0)}rb`;
  return `Rp${v.toLocaleString(LOCALE)}`;
};








export const todayWIB = () => {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());

};





export const weekStartWIB = () => {
  const wibNow = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
  const day = wibNow.getDay();
  const diff = (day + 6) % 7;
  const monday = new Date(wibNow);
  monday.setDate(wibNow.getDate() - diff);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(monday);
};









export const wibDayRange = (dateStr) => ({
  start: new Date(`${dateStr}T00:00:00+07:00`).toISOString(),
  end: new Date(`${dateStr}T23:59:59.999+07:00`).toISOString()
});



export const toWIBDate = (iso) =>
iso ? new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(asUTC(iso))) : "";






export const wibRange = (dari, sampai) => {
  const today = todayWIB();
  const from = dari || (() => {
    const d = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
    d.setDate(d.getDate() - 6);
    return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
  })();
  const to = sampai || today;
  return {
    start: new Date(`${from}T00:00:00+07:00`).toISOString(),
    end: new Date(`${to}T23:59:59.999+07:00`).toISOString()
  };
};





export const fmtDate = (iso) =>
iso ? new Date(asUTC(iso)).toLocaleDateString(LOCALE, { day: "numeric", month: "short", year: "numeric", timeZone: TZ }) : "-";



export const fmtDateShort = (iso) =>
iso ? new Date(asUTC(iso)).toLocaleDateString(LOCALE, { day: "numeric", month: "short", timeZone: TZ }) : "-";



export const fmtDateLong = (iso) =>
iso ? new Date(asUTC(iso)).toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ }) : "-";



export const fmtDateTime = (iso) =>
iso ? new Date(asUTC(iso)).toLocaleString(LOCALE, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TZ }) : "-";



export const fmtTime = (iso) =>
iso ? new Date(asUTC(iso)).toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit", timeZone: TZ }) : "-";



export const fmtDurasi = (menitTotal) => {
  const m = Math.floor(Math.abs(menitTotal));
  if (m < 60) return `${m}m`;
  const j = Math.floor(m / 60);
  const s = m % 60;
  return s === 0 ? `${j}j` : `${j}j ${s}m`;
};



export const fmtRelative = (iso) => {
  if (!iso) return "-";
  const diff = Math.floor((Date.now() - new Date(asUTC(iso)).getTime()) / 1000);
  if (diff < 60) return "Baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return fmtDate(iso);
};



export const fmtDateYMD = (d) => {
  const date = d instanceof Date ? d : new Date(typeof d === "string" ? asUTC(d) : d);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(date);
};



export const fmtMonthYear = (iso) =>
iso ? new Date(iso + "T12:00:00").toLocaleDateString(LOCALE, { month: "short", year: "numeric" }) : "-";



export const fmtChartDate = (iso) =>
iso ? new Date(iso + "T12:00:00").toLocaleDateString(LOCALE, { day: "numeric", month: "short", year: "numeric" }) : "-";



export const fmtDayMonth = (iso) =>
iso ? new Date(iso + "T12:00:00").toLocaleDateString(LOCALE, { day: "numeric", month: "short" }) : "-";