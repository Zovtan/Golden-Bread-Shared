import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { useRealtimeRefresh } from "../../../shared/hooks/useRealtimeRefresh";
import { fmtDate, fmtTime, todayWIB } from "../../../shared/utils/format";
import { labelBahan } from "../../../shared/utils/bahanLabel";

const WATCHED = [
"batch_bahan_baku", "produksi", "batch_produk",
"pemakaian_bahan",
"masalah_bahan_baku", "masalah_produk"];




export function useProduksiDashboard() {
  const [stats, setStats] = useState(null);
  const [alertBB, setAlertBB] = useState([]);
  const [aktivitasHariIni, setAktivitasHariIni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const cancelRef = useRef(false);


  const fetchAll = useCallback(async (bg = false) => {
    if (!bg) setLoading(true);
    setError(null);
    cancelRef.current = false;

    try {
      const s = new Date(`${todayWIB()}T00:00:00+07:00`);
      const e = new Date(`${todayWIB()}T23:59:59.999+07:00`);



      const [rBatch, rHabis, rKdl, rBermasalah, rAlertBB, rHasil, rMasalah, rPemakaian] =
      await Promise.all([

      supabase.from("produksi").
      select("id_produksi", { count: "exact", head: true }).
      gte("waktu", s.toISOString()).lte("waktu", e.toISOString()),
      supabase.from("batch_bahan_baku").select("*", { count: "exact", head: true }).eq("status_stok", "Habis"),
      supabase.from("batch_bahan_baku").select("*", { count: "exact", head: true }).eq("status_kadaluarsa", "Ya"),
      supabase.from("masalah_bahan_baku").select("*", { count: "exact", head: true }).gte("tanggal", s.toISOString()).lte("tanggal", e.toISOString()),
      supabase.from("batch_bahan_baku").
      select("id_batch_bb, stok, kadaluarsa, status_stok, status_kadaluarsa, bahan_baku(merek, jenis_bahan, satuan, stok_minimal, jenis_bahan_enum:enum_jenis_bahan!jenis_bahan(nilai), satuan_enum:enum_satuan!satuan(nilai))").
      or("status_stok.in.(Habis,Menipis),status_kadaluarsa.in.(Mendekati,Ya)").
      order("status_stok", { ascending: true }).limit(8),


      supabase.from("produksi").
      select("id_produksi, waktu, batch_produk(id_batch, jumlah_awal, produk(nama_produk))").
      gte("waktu", s.toISOString()).lte("waktu", e.toISOString()).
      order("waktu", { ascending: false }).limit(10),
      supabase.from("masalah_bahan_baku").
      select("id_masalah, jumlah, tanggal, batch_bahan_baku(id_batch_bb, bahan_baku(merek))").
      gte("tanggal", s.toISOString()).lte("tanggal", e.toISOString()).
      order("tanggal", { ascending: false }).limit(10),

      supabase.from("pemakaian_bahan").
      select("waktu, jumlah, batch_bahan_baku(id_batch_bb, bahan_baku(merek, jenis_bahan, satuan, jenis_bahan_enum:enum_jenis_bahan!jenis_bahan(nilai), satuan_enum:enum_satuan!satuan(nilai)))").
      gte("waktu", s.toISOString()).lte("waktu", e.toISOString()).
      order("waktu", { ascending: false }).limit(10)]
      );

      if (cancelRef.current) return;

      setStats({ batchDiproduksi: rBatch.count ?? 0, bahanHabis: rHabis.count ?? 0, bahanKadaluarsa: rKdl.count ?? 0, bahanBermasalah: rBermasalah.count ?? 0 });

      setAlertBB((rAlertBB.data ?? []).map((b) => {
        const satuan = b.bahan_baku?.satuan_enum?.nilai ?? b.bahan_baku?.satuan ?? "";
        const nama = b.bahan_baku?.merek ?? `Batch #${b.id_batch_bb}`;
        const variant = b.status_stok === "Habis" ? "habis" : b.status_stok === "Menipis" ? "menipis" : b.status_kadaluarsa === "Ya" ? "kadaluarsa" : "mendekati";
        const sub = b.status_stok === "Habis" || b.status_stok === "Menipis" ?
        `Stok: ${b.stok} ${satuan}${b.bahan_baku?.stok_minimal != null ? ` (Min: ${b.bahan_baku.stok_minimal})` : ""}` :
        `Tgl Kdl.: ${fmtDate(b.kadaluarsa)}`;
        return { id: b.id_batch_bb, title: `${nama}!`, sub, variant, navKey: "stok-bahan-baku" };
      }));



      const hasilRows = (rHasil.data ?? []).flatMap((p) =>
      (p.batch_produk ?? []).map((b) => ({
        waktu: fmtTime(p.waktu),
        waktuRaw: new Date(p.waktu),
        kegiatan: "Hasil Produksi",
        item: b.produk?.nama_produk ?? "-",
        batch: b.id_batch ?? "-",
        jumlah: `+${b.jumlah_awal} pcs`
      }))
      );
      const masalahRows = (rMasalah.data ?? []).map((d) => ({
        waktu: fmtTime(d.tanggal),
        waktuRaw: new Date(d.tanggal),
        kegiatan: "Bermasalah",
        item: d.batch_bahan_baku?.bahan_baku?.merek ?? "-",
        batch: d.batch_bahan_baku?.id_batch_bb ?? "-",
        jumlah: `-${d.jumlah}`
      }));
      const pemakaianRows = (rPemakaian.data ?? []).map((d) => {
        const bahan = d.batch_bahan_baku?.bahan_baku;
        const nama = labelBahan(bahan, "-");
        return {
          waktu: fmtTime(d.waktu),
          waktuRaw: new Date(d.waktu),
          kegiatan: "Pemakaian Bahan",
          item: nama,
          batch: d.batch_bahan_baku?.id_batch_bb ?? "-",
          jumlah: `-${d.jumlah} ${bahan?.satuan_enum?.nilai ?? bahan?.satuan ?? ""}`.trim()
        };
      });
      setAktivitasHariIni([...hasilRows, ...masalahRows, ...pemakaianRows].sort((a, b) => b.waktuRaw - a.waktuRaw));

      setLastUpdated(new Date());
    } catch (err) {
      if (!cancelRef.current) setError(err.message);
    } finally {
      if (!cancelRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cancelRef.current = false;
    fetchAll(false);
    return () => {cancelRef.current = true;};
  }, [fetchAll]);

  useRealtimeRefresh("produksi-dashboard", WATCHED, useCallback(() => fetchAll(true), [fetchAll]));

  return { stats, alertBB, aktivitasHariIni, loading, error, lastUpdated };
}