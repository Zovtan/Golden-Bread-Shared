import { supabase } from "../../lib/supabase";
import { computeStatusStok } from "./batchUtils";
import { checkAndNotifStokProduk } from "./notifikasiService";




export async function kurangiStokProduk(id_produk, qty, stok_minimal, nama_produk) {
  const { data: batches } = await supabase.
  from("batch_produk").
  select("id_batch, stok, status_stok, produk(stok_minimal)").
  eq("id_produk", id_produk).
  not("status_stok", "in", "(Habis,Kadaluarsa)").
  neq("status_kadaluarsa", "Ya").


  order("id_batch", { ascending: true });

  const snapshots = [];
  let sisa = Number(qty);
  for (const b of batches ?? []) {
    if (sisa <= 0) break;
    const dikurangi = Math.min(Number(b.stok), sisa);
    const stokBaru = Number(b.stok) - dikurangi;
    const min = stok_minimal ?? b.produk?.stok_minimal ?? 0;
    const status_stok = computeStatusStok(stokBaru, min);
    snapshots.push({ id_batch: b.id_batch, stok: Number(b.stok), status_stok: b.status_stok });
    await supabase.from("batch_produk").update({ stok: stokBaru, status_stok }).eq("id_batch", b.id_batch);
    sisa -= dikurangi;
  }

  await checkAndNotifStokProduk({
    id_produk,
    nama_produk: nama_produk ?? String(id_produk),
    stok_minimal: stok_minimal ?? batches?.[0]?.produk?.stok_minimal ?? 0
  });

  return snapshots;
}


export async function restoreStokProduk(snapshots) {
  for (const s of snapshots) {
    await supabase.
    from("batch_produk").
    update({ stok: s.stok, status_stok: s.status_stok }).
    eq("id_batch", s.id_batch);
  }
}