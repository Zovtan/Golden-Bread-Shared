import { supabase } from "../../lib/supabase";
import { computeStatusStok } from "./batchUtils";




async function deductStok(id_pesanan, details) {
  const batchSnap = [];
  const reservasiIds = [];

  try {
    for (const det of details) {
      const { data: batches } = await supabase.
      from("batch_produk").
      select("id_batch, stok, status_stok, produk(stok_minimal)").
      eq("id_produk", det.id_produk).
      not("status_stok", "in", "(Habis,Kadaluarsa)").
      neq("status_kadaluarsa", "Ya").

      order("id_batch", { ascending: true });

      let sisa = Number(det.qty);
      for (const b of batches ?? []) {
        if (sisa <= 0) break;
        const dikurangi = Math.min(Number(b.stok), sisa);
        const stokBaru = Number(b.stok) - dikurangi;
        const min = b.produk?.stok_minimal ?? 0;

        batchSnap.push({ id_batch: b.id_batch, stok: Number(b.stok), status_stok: b.status_stok });

        const { error: uErr } = await supabase.from("batch_produk").update({
          stok: stokBaru,
          status_stok: computeStatusStok(stokBaru, min)
        }).eq("id_batch", b.id_batch);
        if (uErr) throw uErr;



        const { error: rErr } = await supabase.from("reservasi_stok_pesanan").
        insert({ id_pesanan, id_batch: b.id_batch, qty: dikurangi });
        if (rErr) throw rErr;
        reservasiIds.push(b.id_batch);

        sisa -= dikurangi;
      }
      if (sisa > 0) throw new Error("Stok tidak mencukupi untuk satu atau lebih produk dalam pesanan ini.");
    }
  } catch (err) {
    if (reservasiIds.length) await supabase.from("reservasi_stok_pesanan").delete().eq("id_pesanan", id_pesanan).in("id_batch", reservasiIds);
    for (const s of batchSnap) {
      await supabase.from("batch_produk").update({ stok: s.stok, status_stok: s.status_stok }).eq("id_batch", s.id_batch);
    }
    throw err;
  }
}



async function restoreStok(id_pesanan) {
  const { data: reservations } = await supabase.
  from("reservasi_stok_pesanan").select("id_batch, qty").eq("id_pesanan", id_pesanan);
  const errors = [];
  for (const r of reservations ?? []) {
    const { data: batch } = await supabase.
    from("batch_produk").select("stok, produk(stok_minimal)").eq("id_batch", r.id_batch).single();
    if (batch) {
      const stokBaru = batch.stok + r.qty;
      const min = batch.produk?.stok_minimal ?? 0;
      const status_stok = computeStatusStok(stokBaru, min);
      const { error } = await supabase.from("batch_produk").update({ stok: stokBaru, status_stok }).eq("id_batch", r.id_batch);
      if (error) errors.push(`batch ${r.id_batch}: ${error.message}`);
    }
  }
  await supabase.from("reservasi_stok_pesanan").delete().eq("id_pesanan", id_pesanan);
  if (errors.length) throw new Error(`Restore stok tidak tuntas - ${errors.join("; ")}`);
}



async function clearReservasi(id_pesanan) {
  await supabase.from("reservasi_stok_pesanan").delete().eq("id_pesanan", id_pesanan);
}

export { deductStok, restoreStok, clearReservasi };