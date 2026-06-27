import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { getFreshSession } from "../../../shared/utils/authToken";
import { logActivity } from "../../../shared/utils/logActivity";
import { checkAndNotifStokProduk } from "../../../shared/utils/notifikasiService";
import { todayWIB, fmtDateYMD } from "../../../shared/utils/format";
import { useRealtimeRefresh } from "../../../shared/hooks/useRealtimeRefresh";

const WATCHED = ["produk", "batch_produk"];




export function useProduksiInputHasil() {
  const [produkList, setProdukList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const submittingRef = useRef(false);

  const fetchProduk = useCallback(async () => {
    const { data } = await supabase.
    from("produk").
    select("id_produk, nama_produk, estimasi_kadaluarsa_hari, stok_minimal, kategori_produk, status").
    eq("status", "Aktif").
    order("nama_produk");
    if (data) setProdukList(data);
  }, []);

  useEffect(() => {fetchProduk();}, [fetchProduk]);
  useRealtimeRefresh("produksi-input-hasil", WATCHED, fetchProduk);







  async function submitHasilProduksi(items) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const session = await getFreshSession();
      const user = session?.user;
      if (!user) throw new Error("Tidak terautentikasi.");


      const { data: produksi, error: pErr } = await supabase.
      from("produksi").
      insert({ id_user: user.id, waktu: new Date().toISOString() }).
      select("id_produksi").
      single();
      if (pErr) throw pErr;


      const createdBatches = [];

      try {
        for (const item of items) {
          const produk = produkList.find((p) => p.id_produk === Number(item.id_produk));
          if (!produk) continue;



          const kadaluarsa = new Date(`${todayWIB()}T00:00:00+07:00`);
          kadaluarsa.setDate(kadaluarsa.getDate() + (produk.estimasi_kadaluarsa_hari ?? 1));

          const { data: batch, error: bErr } = await supabase.
          from("batch_produk").
          insert({
            id_produk: Number(item.id_produk),
            id_produksi: produksi.id_produksi,
            stok: Number(item.jumlah),
            jumlah_awal: Number(item.jumlah),
            kadaluarsa: fmtDateYMD(kadaluarsa)
          }).
          select("id_batch").
          single();
          if (bErr) throw bErr;

          createdBatches.push(batch.id_batch);

          await logActivity({
            aktivitas: "CREATE", modul: "Hasil Produksi",
            detail: { pesan: `${produk.nama_produk} - batch baru ${Number(item.jumlah)} pcs dari produksi #${produksi.id_produksi}` },
            sebelum: 0, sesudah: Number(item.jumlah)
          });
          await checkAndNotifStokProduk({
            id_produk: Number(item.id_produk),
            nama_produk: produk.nama_produk,
            stok_minimal: produk.stok_minimal ?? 0
          });
        }
      } catch (innerErr) {


        if (createdBatches.length) await supabase.from("batch_produk").delete().in("id_batch", createdBatches);
        await supabase.from("produksi").delete().eq("id_produksi", produksi.id_produksi);
        throw innerErr;
      }

      await logActivity({
        aktivitas: "CREATE",
        modul: "produksi",
        detail: {
          pesan: `Hasil produksi #${produksi.id_produksi} dicatat`,
          id_produksi: produksi.id_produksi,
          jumlah_item: items.length
        }
      });
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }

  return { produkList, loading, error, submitHasilProduksi };
}