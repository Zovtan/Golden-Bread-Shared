import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { useRealtimeRefresh } from "../../../shared/hooks/useRealtimeRefresh";
import { fmtRp, fmtDateTime, fmtDate, todayWIB } from "../../../shared/utils/format";
import { pesananHighlight, sortPesananPendingFirst } from "../../../shared/utils/pesananHighlight";

const WATCHED = [
"penjualan_langsung", "detail_penjualan_langsung",
"pesanan_online", "batch_produk"];




export function useKasirDashboard() {
  const [stats, setStats] = useState(null);
  const [pesananTerbaru, setPesananTerbaru] = useState([]);
  const [alertProduk, setAlertProduk] = useState([]);
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


      const [rPenjualan, rTx, rPending, rPesanan, rAlertProduk, rQtyData, rKonfig] =
      await Promise.all([
      supabase.from("penjualan_langsung").select("detail_penjualan_langsung(qty, harga_satuan)").gte("tanggal", s.toISOString()).lte("tanggal", e.toISOString()),
      supabase.from("penjualan_langsung").select("*", { count: "exact", head: true }).gte("tanggal", s.toISOString()).lte("tanggal", e.toISOString()),
      supabase.from("pesanan_online").select("*", { count: "exact", head: true }).eq("status", "Pending"),
      supabase.from("pesanan_online").select(`
            id_pesanan, tanggal, waktu_antar, status, ongkir,
            pelanggan:profiles!id_pelanggan(nama_lengkap, nama_toko),
            detail_pesanan_online(qty, harga_satuan)
          `).order("tanggal", { ascending: false }).limit(10),
      supabase.from("batch_produk").
      select("id_batch, stok, kadaluarsa, status_stok, status_kadaluarsa, produk(nama_produk, stok_minimal)").
      or("status_stok.in.(Habis,Menipis),status_kadaluarsa.in.(Mendekati,Ya)").
      order("status_stok", { ascending: true }).limit(8),
      supabase.from("detail_penjualan_langsung").
      select("qty, id_penjualan, penjualan_langsung(tanggal)").
      gte("penjualan_langsung.tanggal", s.toISOString()),
      supabase.from("konfigurasi_pesanan").select("menit_highlight_segera").eq("id", 1).single()]
      );

      if (cancelRef.current) return;


      const batasHl = { menit_highlight_segera: rKonfig.data?.menit_highlight_segera };

      const omset = (rPenjualan.data ?? []).reduce((n, r) => n + (r.detail_penjualan_langsung ?? []).reduce((s, d) => s + Number(d.qty) * Number(d.harga_satuan), 0), 0);
      const qty = (rQtyData.data ?? []).
      filter((r) => r.penjualan_langsung?.tanggal && new Date(r.penjualan_langsung.tanggal) >= s).
      reduce((n, r) => n + Number(r.qty), 0);

      setStats({ omset: fmtRp(omset), transaksi: rTx.count ?? 0, pesananPending: rPending.count ?? 0, produkTerjual: qty });

      setPesananTerbaru(sortPesananPendingFirst((rPesanan.data ?? []).map((p) => {
        const totalRaw = (p.detail_pesanan_online ?? []).reduce((s, d) => s + Number(d.qty) * Number(d.harga_satuan), 0) + Number(p.ongkir ?? 0);
        return {
          id: p.id_pesanan,
          pelanggan: p.pelanggan?.nama_toko ?? p.pelanggan?.nama_lengkap ?? "-",
          tanggal: fmtDateTime(p.tanggal),
          tanggalRaw: p.tanggal,
          total: fmtRp(totalRaw),
          totalRaw,
          status: p.status,
          highlight: pesananHighlight(p, batasHl)
        };
      })));

      setAlertProduk((rAlertProduk.data ?? []).map((b) => {
        const variant = b.status_stok === "Habis" ? "habis" : b.status_stok === "Menipis" ? "menipis" : b.status_kadaluarsa === "Ya" ? "kadaluarsa" : "mendekati";
        const sub = b.status_stok === "Habis" || b.status_stok === "Menipis" ?
        `Stok: ${b.stok} (Min: ${b.produk?.stok_minimal ?? "?"})` :
        `Tgl Kdl.: ${fmtDate(b.kadaluarsa)}`;
        return { id: b.id_batch, title: `${b.produk?.nama_produk ?? "Batch #" + b.id_batch}!`, sub, variant, navKey: "cek-stok-produk" };
      }));

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

  useRealtimeRefresh("kasir-dashboard", WATCHED, useCallback(() => fetchAll(true), [fetchAll]));

  return { stats, pesananTerbaru, alertProduk, loading, error, lastUpdated };
}