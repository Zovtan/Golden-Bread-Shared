import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { supabase } from "../../../lib/supabase";
import { getFreshSession } from "../../../shared/utils/authToken";
import { useRealtimeRefresh } from "../../../shared/hooks/useRealtimeRefresh";
import { computeStatusStok, processBahan } from "../../../shared/utils/batchUtils";

const WATCHED = ["bahan_baku", "batch_bahan_baku", "masalah_bahan_baku"];



export function useProduksiStokBahanBaku(search = "") {
  const [semuaBahan, setSemuaBahan] = useState([]);
  const [stats, setStats] = useState({ habis: 0, kadaluarsa: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const fetchToken = useRef(0);
  const submittingRef = useRef(false);

  const bahanList = useMemo(() => {
    if (!search.trim()) return semuaBahan;
    const q = search.trim().toLowerCase();
    return semuaBahan.filter((b) =>
    b.merek?.toLowerCase().includes(q) ||
    b.jenis_bahan?.toLowerCase().includes(q) ||
    b.satuan?.toLowerCase().includes(q) ||
    b.statusStok?.toLowerCase().includes(q)
    );
  }, [semuaBahan, search]);


  const fetchBahan = useCallback(async (bg = false) => {
    if (!bg) setLoading(true);
    setError(null);
    const token = ++fetchToken.current;
    try {
      const { data, error: err } = await supabase.
      from("bahan_baku").
      select(`
          id_bahan, merek, jenis_bahan, satuan, stok_minimal,
          batas_peringatan_hari, status,
          jenis_bahan_enum:enum_jenis_bahan!jenis_bahan(id,nilai),
          satuan_enum:enum_satuan!satuan(id,nilai),
          batch_bahan_baku(
            id_batch_bb, stok, tgl_beli, kadaluarsa,
            status_stok, status_kadaluarsa,
            detail_pembelian_bahan(harga_satuan, pembelian_bahan(id_pembelian, supplier(nama_supplier)))
          )
        `).
      eq("status", "Aktif").
      order("id_bahan");
      if (err) throw err;
      if (fetchToken.current !== token) return;



      const normalized = (data ?? []).map((b) => ({
        ...b,
        batch_bahan_baku: (b.batch_bahan_baku ?? []).map((bt) => ({
          ...bt,
          harga_satuan: bt.detail_pembelian_bahan?.harga_satuan ?? null,
          no_pembelian: bt.detail_pembelian_bahan?.pembelian_bahan?.id_pembelian ?? null,
          supplier_nama: bt.detail_pembelian_bahan?.pembelian_bahan?.supplier?.nama_supplier ?? null
        }))
      }));
      const processed = processBahan(normalized);
      setSemuaBahan(processed);
      setStats({
        habis: processed.filter((b) => b.statusStok === "Habis").length,
        kadaluarsa: processed.filter((b) => b.adaKadaluarsa === "Ya").length
      });
      setLastUpdated(new Date());
    } catch (e) {
      if (fetchToken.current === token) setError(e.message);
    } finally {
      if (fetchToken.current === token) setLoading(false);
    }
  }, []);


  useEffect(() => {fetchBahan(false);}, [fetchBahan]);
  useRealtimeRefresh("produksi-stok-bb", WATCHED, useCallback(() => fetchBahan(true), [fetchBahan]));



  async function laporMasalah({ id_batch_bb, nama_masalah, jumlah, keterangan }) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const session = await getFreshSession();
      const user = session?.user;
      if (!user) throw new Error("Tidak terautentikasi.");

      const { data: batch, error: bErr } = await supabase.
      from("batch_bahan_baku").
      select("stok, id_bahan, bahan_baku(stok_minimal)").
      eq("id_batch_bb", id_batch_bb).
      single();
      if (bErr) throw bErr;

      const stokBaru = Math.max(0, Number(batch.stok) - Number(jumlah));

      const { data: masalah, error: mErr } = await supabase.from("masalah_bahan_baku").insert({
        id_batch_bb,
        id_user: user.id,
        nama_masalah,
        tanggal: new Date().toISOString(),
        jumlah: Number(jumlah),
        keterangan: keterangan || null,
        stok_dikurangi: Number(jumlah)
      }).select("id_masalah").single();
      if (mErr) throw mErr;

      const batchUpdate = stokBaru <= 0 ?
      { stok: 0, status_stok: "Habis" } :
      { stok: stokBaru, status_stok: computeStatusStok(stokBaru, batch.bahan_baku?.stok_minimal ?? 0) };
      const { error: upErr } = await supabase.from("batch_bahan_baku").update(batchUpdate).eq("id_batch_bb", id_batch_bb);
      if (upErr) {

        await supabase.from("masalah_bahan_baku").delete().eq("id_masalah", masalah.id_masalah);
        throw upErr;
      }

      await fetchBahan(true);
    } finally {
      submittingRef.current = false;
    }
  }

  return { bahanList, stats, loading, error, lastUpdated, laporMasalah, refetch: () => fetchBahan(false) };
}