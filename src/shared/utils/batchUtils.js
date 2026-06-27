





export function computeStatusStok(stok, min) {
  if (Number(stok) <= 0) return "Habis";
  if (Number(stok) <= Number(min)) return "Menipis";
  return "Normal";
}



export function computeStatusKdl(kdl, hari = 7) {
  if (!kdl) return "Tidak";
  const diff = Math.floor((new Date(kdl) - new Date()) / 86_400_000);
  if (diff <= 0) return "Ya";
  if (diff <= hari) return "Mendekati";
  return "Tidak";
}




export function aggStatusStok(batches) {
  if (!batches.length) return "Normal";
  if (batches.every((b) => b.status_stok === "Habis")) return "Habis";
  if (batches.some((b) => b.status_stok === "Menipis")) return "Menipis";
  return "Normal";
}





export function processProduk(raw) {
  return raw.map((p) => {


    const allBatches = (p.batch_produk ?? []).map((b) => ({ ...b, tgl_produksi: b.produksi?.waktu ?? null }));
    const batches = allBatches.
    filter((b) => Number(b.stok) > 0).
    sort((a, b) => new Date(a.tgl_produksi) - new Date(b.tgl_produksi));




    const totalStok = batches.
    filter((b) => b.status_stok !== "Kadaluarsa" && b.status_kadaluarsa !== "Ya").
    reduce((s, b) => s + Number(b.stok), 0);
    const sortedKdl = [...batches].
    filter((b) => b.kadaluarsa).
    sort((a, b) => new Date(a.kadaluarsa) - new Date(b.kadaluarsa));

    const kategoriLabel = p.kategori_produk_enum?.nilai ?? p.kategori_enum?.nilai ?? p.kategori_produk ?? "-";
    return {
      ...p, batches, totalStok,
      kategori_produk: kategoriLabel,
      kategori: kategoriLabel,
      statusStok: aggStatusStok(allBatches),
      tglProduksiTerawal: batches[0]?.tgl_produksi ?? null,
      kadaluarsaTerawal: sortedKdl[0]?.kadaluarsa ?? null,
      adaKadaluarsa: batches.some((b) => b.status_kadaluarsa === "Ya") ?
      "Ya" :
      batches.some((b) => b.status_kadaluarsa === "Mendekati") ?
      "Mendekati" :
      "Tidak"
    };
  });
}





export function processBahan(raw) {
  return raw.map((b) => {
    const allBatches = b.batch_bahan_baku ?? [];
    const batches = allBatches.
    filter((bt) => Number(bt.stok) > 0).
    sort((a, x) => new Date(a.tgl_beli) - new Date(x.tgl_beli));

    const totalStok = batches.
    filter((bt) => bt.status_stok !== "Kadaluarsa" && bt.status_kadaluarsa !== "Ya").
    reduce((s, bt) => s + Number(bt.stok), 0);
    const sortedKdl = [...batches].
    filter((x) => x.kadaluarsa).
    sort((a, x) => new Date(a.kadaluarsa) - new Date(x.kadaluarsa));
    const batchesWithPrice = batches.filter((bt) => bt.harga_satuan != null);
    const hargaAvg = batchesWithPrice.length ?
    batchesWithPrice.reduce((s, bt) => s + Number(bt.harga_satuan), 0) / batchesWithPrice.length :
    0;

    const jenisBahanLabel = b.jenis_bahan_enum?.nilai ?? b.jenis?.nilai ?? String(b.jenis_bahan ?? "-");
    const satuanLabel = b.satuan_enum?.nilai ?? b.sat?.nilai ?? String(b.satuan ?? "-");
    return {
      ...b, batches, totalStok, hargaAvg,
      jenis_bahan: jenisBahanLabel,
      satuan: satuanLabel,
      statusStok: aggStatusStok(allBatches),
      tglMasukTerawal: batches[0]?.tgl_beli ?? null,
      kadaluarsaTerawal: sortedKdl[0]?.kadaluarsa ?? null,
      adaKadaluarsa: batches.some((bt) => bt.status_kadaluarsa === "Ya") ?
      "Ya" :
      batches.some((bt) => bt.status_kadaluarsa === "Mendekati") ?
      "Mendekati" :
      "Tidak"
    };
  });
}