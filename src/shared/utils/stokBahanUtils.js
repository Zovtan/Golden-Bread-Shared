import { supabase } from "../../lib/supabase";
import { computeStatusStok } from "./batchUtils";
import { checkAndNotifStokBahan } from "./notifikasiService";
import { logActivity } from "./logActivity";
import { labelBahan } from "./bahanLabel";





export async function kurangiStokBahan(bahan, jumlah, id_user, pesanLog) {
  const { data: freshBatches } = await supabase.
  from("batch_bahan_baku").
  select("id_batch_bb, stok").
  eq("id_bahan", bahan.id_bahan).
  not("status_stok", "in", "(Habis,Kadaluarsa)").
  neq("status_kadaluarsa", "Ya").


  order("tgl_beli", { ascending: true }).
  order("id_batch_bb", { ascending: true });

  const snapshots = [];
  const pemakaianRows = [];
  let sisa = Number(jumlah);

  for (const bt of freshBatches ?? []) {
    if (sisa <= 0) break;
    const dikurangi = Math.min(sisa, Number(bt.stok));
    const stokBaru = Number(bt.stok) - dikurangi;
    const status_stok = computeStatusStok(stokBaru, bahan.stok_minimal ?? 0);

    snapshots.push({ id_batch_bb: bt.id_batch_bb, stok: Number(bt.stok) });
    if (id_user != null) {
      pemakaianRows.push({ id_user, id_batch_bb: bt.id_batch_bb, jumlah: dikurangi });
    }

    await supabase.from("batch_bahan_baku").
    update({ stok: stokBaru, status_stok }).
    eq("id_batch_bb", bt.id_batch_bb);

    await logActivity({
      aktivitas: "UPDATE", modul: "batch_bahan_baku",
      detail: {
        field: "Stok",
        id_batch_bb: bt.id_batch_bb,
        id_bahan: bahan.id_bahan,
        nama_bahan: labelBahan(bahan),
        satuan: bahan.satuan,
        pesan: pesanLog ?? `Pemakaian bahan #${bahan.id_bahan}`
      },
      sebelum: Number(bt.stok), sesudah: stokBaru
    });

    sisa -= dikurangi;
  }

  await checkAndNotifStokBahan({
    id_bahan: bahan.id_bahan,
    nama_bahan: labelBahan(bahan),
    satuan: bahan.satuan,
    stok_minimal: bahan.stok_minimal
  });

  return { snapshots, pemakaianRows };
}



export async function restoreStokBahan(snapshots) {
  for (const s of snapshots) {
    await supabase.from("batch_bahan_baku").
    update({ stok: s.stok }).
    eq("id_batch_bb", s.id_batch_bb);
  }
}