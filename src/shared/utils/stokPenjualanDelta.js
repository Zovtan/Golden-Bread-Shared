







import { supabase } from "../../lib/supabase";
import { computeStatusStok } from "./batchUtils";
import { kurangiStokProduk, restoreStokProduk } from "./stokProdukUtils";
import { validateProductStock, stockErrorMessage } from "./stockValidator";



function qtyByProduk(rows) {
  const m = {};
  for (const r of rows) m[r.id_produk] = (m[r.id_produk] ?? 0) + Number(r.qty ?? 0);
  return m;
}


export function hitungDeltaQty(origDetails, newItems) {
  const orig = qtyByProduk(origDetails);
  const baru = qtyByProduk(newItems);
  const ids = [...new Set([...Object.keys(orig), ...Object.keys(baru)].map(Number))];
  return ids.map((id) => ({ id_produk: id, delta: (baru[id] ?? 0) - (orig[id] ?? 0) }));
}


export async function validateDeltaPenjualan(deltas, produkMap = {}, namaMap = {}) {
  const naik = deltas.filter((d) => d.delta > 0);
  if (!naik.length) return;
  const errs = await validateProductStock(naik.map((d) => ({
    id_produk: d.id_produk, qty: d.delta,
    nama: namaMap[d.id_produk] ?? produkMap[d.id_produk]?.nama_produk ?? `Produk #${d.id_produk}`
  })));
  if (errs.length) throw new Error(stockErrorMessage(errs, "Edit ditolak - stok tidak mencukupi:"));
}



async function tambahStokProduk(id_produk, qty, stok_minimal) {
  const { data: batches } = await supabase.from("batch_produk").
  select("id_batch, stok, status_stok, produk(stok_minimal)").
  eq("id_produk", id_produk).
  neq("status_kadaluarsa", "Ya").

  order("id_batch", { ascending: true });
  const target = (batches ?? [])[0];
  if (!target) return [];
  const min = stok_minimal ?? target.produk?.stok_minimal ?? 0;
  const snap = { id_batch: target.id_batch, stok: Number(target.stok), status_stok: target.status_stok };
  const stokBaru = Number(target.stok) + Number(qty);
  await supabase.from("batch_produk").
  update({ stok: stokBaru, status_stok: computeStatusStok(stokBaru, min) }).
  eq("id_batch", target.id_batch);
  return [snap];
}




export async function applyDeltaPenjualan(deltas, produkMap = {}) {
  const snapshots = [];
  try {
    for (const { id_produk, delta } of deltas) {
      if (delta === 0) continue;
      const p = produkMap[id_produk];
      if (delta > 0) {
        const snaps = await kurangiStokProduk(id_produk, delta, p?.stok_minimal, p?.nama_produk ?? `Produk #${id_produk}`);
        snapshots.push(...snaps);
      } else {
        const snaps = await tambahStokProduk(id_produk, -delta, p?.stok_minimal);
        snapshots.push(...snaps);
      }
    }
  } catch (e) {
    await restoreStokProduk(snapshots);
    throw e;
  }
  return snapshots;
}