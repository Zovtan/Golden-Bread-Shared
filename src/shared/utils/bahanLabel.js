





export function labelBahan(bahan, fallback = "-") {
  if (!bahan) return fallback;
  return bahan.merek ? `${bahan.merek} (${bahan.jenis_bahan})` : bahan.jenis_bahan || fallback;
}



export function labelBahanId(bahan, id_bahan) {
  if (!bahan) return `Bahan #${id_bahan}`;
  return bahan.merek ? `${bahan.merek} (${bahan.jenis_bahan})` : bahan.jenis_bahan || `Bahan #${id_bahan}`;
}



export function labelBahanPendek(bahan, fallback = "-") {
  if (!bahan) return fallback;
  return bahan.merek ?? bahan.jenis_bahan ?? fallback;
}