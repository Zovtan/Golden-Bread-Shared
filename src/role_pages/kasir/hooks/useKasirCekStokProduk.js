import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { supabase } from "../../../lib/supabase";
import { getFreshSession } from "../../../shared/utils/authToken";
import { useRealtimeRefresh } from "../../../shared/hooks/useRealtimeRefresh";
import { logActivity } from "../../../shared/utils/logActivity";
import { computeStatusStok, processProduk } from "../../../shared/utils/batchUtils";

const WATCHED = ["produk", "batch_produk", "masalah_produk"];



export function useKasirCekStokProduk(search = "") {
  const [semuaProduk, setSemuaProduk] = useState([]);
  const [stats, setStats] = useState({ habis: 0, kadaluarsa: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const fetchToken = useRef(0);
  const submittingRef = useRef(false);


  const produkList = useMemo(() => {
    if (!search.trim()) return semuaProduk;
    const q = search.trim().toLowerCase();
    return semuaProduk.filter((p) =>
    p.nama_produk?.toLowerCase().includes(q) ||
    p.kategori_produk?.toLowerCase().includes(q) ||
    p.statusStok?.toLowerCase().includes(q)
    );
  }, [semuaProduk, search]);


  const fetchProduk = useCallback(async (bg = false) => {
    if (!bg) setLoading(true);
    setError(null);
    const token = ++fetchToken.current;
    try {
      const { data, error: err } = await supabase.
      from("produk").
      select(`
          id_produk, nama_produk, gambar, harga_satuan, stok_minimal,
          batas_peringatan_hari, status, kategori_produk, estimasi_kadaluarsa_hari,
          kategori_enum:enum_kategori_produk!kategori_produk(id,nilai),
          batch_produk(id_batch, stok, kadaluarsa, status_stok, status_kadaluarsa, produksi(waktu))
        `).
      eq("status", "Aktif").
      order("id_produk");
      if (err) throw err;
      if (fetchToken.current !== token) return;
      const processed = processProduk(data ?? []);
      setSemuaProduk(processed);
      setStats({
        habis: processed.filter((p) => p.statusStok === "Habis").length,
        kadaluarsa: processed.filter((p) => p.adaKadaluarsa === "Ya").length
      });
      setLastUpdated(new Date());
    } catch (e) {
      if (fetchToken.current === token) setError(e.message);
    } finally {
      if (fetchToken.current === token) setLoading(false);
    }
  }, []);

  useEffect(() => {fetchProduk(false);}, [fetchProduk]);
  useRealtimeRefresh("kasir-stok-produk", WATCHED, useCallback(() => fetchProduk(true), [fetchProduk]));



  async function laporMasalah({ id_batch, nama_masalah, jumlah, keterangan }) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const session = await getFreshSession();
      const user = session?.user;
      if (!user) throw new Error("Tidak terautentikasi.");

      const { data: batch, error: bErr } = await supabase.
      from("batch_produk").select("stok, id_produk, produk(stok_minimal)").eq("id_batch", id_batch).single();
      if (bErr) throw bErr;

      const stokBaru = Math.max(0, Number(batch.stok) - Number(jumlah));

      const { data: masalah, error: mErr } = await supabase.from("masalah_produk").insert({
        id_batch, id_user: user.id, nama_masalah,
        tanggal: new Date().toISOString(),
        jumlah: Number(jumlah),
        keterangan: keterangan || null,
        stok_dikurangi: Number(jumlah)
      }).select("id_masalah").single();
      if (mErr) throw mErr;

      const { error: upErr } = await supabase.from("batch_produk").update({
        stok: stokBaru,
        status_stok: computeStatusStok(stokBaru, batch.produk?.stok_minimal ?? 0)
      }).eq("id_batch", id_batch);
      if (upErr) {

        await supabase.from("masalah_produk").delete().eq("id_masalah", masalah.id_masalah);
        throw upErr;
      }

      const produkItem = produkList.find((p) => p.id_produk === batch.id_produk);
      const namaProduk = produkItem?.nama_produk ?? `Produk #${batch.id_produk}`;
      await logActivity({
        aktivitas: "CREATE", modul: "Masalah Produk",
        detail: { pesan: `${namaProduk} - ${nama_masalah}: ${jumlah} unit dilaporkan${keterangan ? ` (${keterangan})` : ""}` }
      });
      await fetchProduk(true);
    } finally {
      submittingRef.current = false;
    }
  }

  return { produkList, stats, loading, error, lastUpdated, laporMasalah };
}