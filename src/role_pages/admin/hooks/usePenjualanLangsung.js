import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { useRealtimeRefresh } from "../../../shared/hooks/useRealtimeRefresh";
import { logActivity } from "../../../shared/utils/logActivity";
import { validateProductStock, stockErrorMessage } from "../../../shared/utils/stockValidator";
import { kurangiStokProduk, restoreStokProduk } from "../../../shared/utils/stokProdukUtils";
import { hitungDeltaQty, validateDeltaPenjualan, applyDeltaPenjualan } from "../../../shared/utils/stokPenjualanDelta";
import { fmtRp, fmtDateTime, todayWIB } from "../../../shared/utils/format";

const WATCHED = ["penjualan_langsung", "detail_penjualan_langsung"];



function processPenjualan(rows) {
  return rows.map((p) => {
    const details = p.detail_penjualan_langsung ?? [];
    const totalQty = details.reduce((s, d) => s + Number(d.qty), 0);
    const total = details.reduce((s, d) => s + Number(d.qty) * Number(d.harga_satuan), 0);
    return {
      id_penjualan: p.id_penjualan,
      no_pesanan: String(p.id_penjualan),
      waktu: p.tanggal,
      waktu_fmt: fmtDateTime(p.tanggal),
      kasir_id: p.id_user,
      kasir_nama: p.kasir?.nama_lengkap ?? "-",
      pembayaran: p.jenis_pembayaran ?? "-",
      details, totalQty, total, total_fmt: fmtRp(total)
    };
  });
}




export function usePenjualanLangsung({ search = "", filterKasir = "", filterTanggal = "" } = {}) {
  const [list, setList] = useState([]);
  const [kasirList, setKasirList] = useState([]);
  const [produkList, setProdukList] = useState([]);
  const [jenisBayarList] = useState([]);
  const [stats, setStats] = useState({ omset: 0, produkTerjual: 0, transaksiHariIni: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const fetchToken = useRef(0);
  const submittingRef = useRef(false);

  useEffect(() => {
    Promise.all([
    supabase.from("profiles").select("id,nama_lengkap,role").in("role", ["Kasir", "Admin"]).eq("status", "Aktif").order("nama_lengkap"),
    supabase.from("produk").select(`id_produk,nama_produk,harga_satuan,status,stok_minimal,batch_produk(stok,status_stok,status_kadaluarsa)`).eq("status", "Aktif").order("nama_produk")]
    ).then(([kasir, produk]) => {
      if (kasir.data) setKasirList(kasir.data);
      if (produk.data) setProdukList(produk.data.map((p) => {

        const batches = (p.batch_produk ?? []).filter((b) =>
        (b.status_stok === "Normal" || b.status_stok === "Menipis") && b.status_kadaluarsa !== "Ya"
        );
        const totalStok = batches.reduce((s, b) => s + Number(b.stok), 0);
        let statusStok = "Normal";
        if (!batches.length || batches.every((b) => b.status_stok === "Habis")) statusStok = "Habis";else
        if (batches.some((b) => b.status_stok === "Menipis")) statusStok = "Menipis";
        return { id_produk: p.id_produk, nama_produk: p.nama_produk, harga_satuan: p.harga_satuan, totalStok, statusStok };
      }));
    });
  }, []);


  const [editedIds, setEditedIds] = useState(new Set());
  useEffect(() => {
    if (!list.length) return;
    supabase.from("log_aktivitas").
    select("detail_json").
    eq("modul", "penjualan_langsung").
    eq("aktivitas", "UPDATE").


    contains("detail_json", { field: "Item Pesanan" }).
    limit(500).
    then(({ data }) => {
      const ids = new Set();
      (data ?? []).forEach((l) => {
        const no = l.detail_json?.no_pesanan;
        if (no != null) ids.add(Number(no));
      });
      setEditedIds(ids);
    });
  }, [list]);


  const fetchAll = useCallback(async (bg = false) => {
    const token = ++fetchToken.current;
    if (!bg) setLoading(true);
    setError(null);
    try {
      const ts = new Date(`${todayWIB()}T00:00:00+07:00`);
      const te = new Date(`${todayWIB()}T23:59:59.999+07:00`);
      const [rOmset, rQty] = await Promise.all([
      supabase.from("penjualan_langsung").select("detail_penjualan_langsung(qty, harga_satuan)").gte("tanggal", ts.toISOString()).lte("tanggal", te.toISOString()),
      supabase.from("detail_penjualan_langsung").select("qty,penjualan_langsung!inner(tanggal)").gte("penjualan_langsung.tanggal", ts.toISOString()).lte("penjualan_langsung.tanggal", te.toISOString())]
      );
      setStats({
        omset: (rOmset.data ?? []).reduce((s, r) => s + (r.detail_penjualan_langsung ?? []).reduce((sub, d) => sub + Number(d.qty) * Number(d.harga_satuan), 0), 0),
        transaksiHariIni: (rOmset.data ?? []).length,
        produkTerjual: (rQty.data ?? []).reduce((s, r) => s + Number(r.qty), 0)
      });

      let q = supabase.from("penjualan_langsung").
      select(`id_penjualan,tanggal,id_user,jenis_pembayaran,
                 kasir:profiles!id_user(nama_lengkap),
                 detail_penjualan_langsung(id_produk,qty,harga_satuan,produk(nama_produk))`).
      order("tanggal", { ascending: false }).limit(100);
      if (filterKasir) q = q.eq("id_user", filterKasir);
      if (filterTanggal) {
        const ds = new Date(`${filterTanggal}T00:00:00+07:00`);
        const de = new Date(`${filterTanggal}T23:59:59.999+07:00`);
        if (!isNaN(ds)) q = q.gte("tanggal", ds.toISOString()).lte("tanggal", de.toISOString());
      }

      const { data, error: err } = await q;
      if (err) throw err;
      if (fetchToken.current !== token) return;

      let processed = processPenjualan(data ?? []);
      if (search.trim()) {
        const s = search.trim().toLowerCase();
        processed = processed.filter((p) =>
        p.no_pesanan.toLowerCase().includes(s) ||
        p.kasir_nama.toLowerCase().includes(s) ||
        p.pembayaran.toLowerCase().includes(s) ||
        (p.details ?? []).some((d) => (d.produk?.nama_produk ?? "").toLowerCase().includes(s))
        );
      }
      setList(processed);setLastUpdated(new Date());
    } catch (e) {if (fetchToken.current === token) setError(e.message);} finally
    {if (fetchToken.current === token) setLoading(false);}
  }, [search, filterKasir, filterTanggal]);

  useEffect(() => {fetchAll(false);return () => {fetchToken.current++;};}, [fetchAll]);
  useRealtimeRefresh("penjualan-langsung-page", WATCHED, useCallback(() => fetchAll(true), [fetchAll]));



  async function tambahPenjualan(payload) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const { data: produkData } = await supabase.from("produk").
      select("id_produk,nama_produk,harga_satuan,stok_minimal").
      in("id_produk", [...new Set(payload.items.map((i) => i.id_produk))]);
      const produkMap = Object.fromEntries((produkData ?? []).map((p) => [p.id_produk, p]));
      const hargaMap = Object.fromEntries((produkData ?? []).map((p) => [p.id_produk, Number(p.harga_satuan)]));

      const stockErrors = await validateProductStock(
        payload.items.map((i) => ({ id_produk: i.id_produk, qty: i.qty, nama: produkMap[i.id_produk]?.nama_produk }))
      );
      if (stockErrors.length) throw new Error(stockErrorMessage(stockErrors));

      const details = payload.items.map((i) => ({
        id_produk: i.id_produk,
        qty: Number(i.qty),
        harga_satuan: hargaMap[i.id_produk] ?? 0
      }));
      const lineTotal = details.reduce((s, d) => s + d.harga_satuan * d.qty, 0);
      const total = lineTotal;

      const { data: penjualan, error: pErr } = await supabase.from("penjualan_langsung").
      insert({ id_user: payload.id_user, jenis_pembayaran: payload.jenis_pembayaran,
        tanggal: new Date().toISOString() }).
      select("id_penjualan").single();
      if (pErr) throw pErr;

      const { error: dErr } = await supabase.from("detail_penjualan_langsung").
      insert(details.map((d) => ({ ...d, id_penjualan: penjualan.id_penjualan })));
      if (dErr) {

        await supabase.from("penjualan_langsung").delete().eq("id_penjualan", penjualan.id_penjualan);
        throw dErr;
      }

      const allSnapshots = [];
      try {
        for (const d of details) {
          const p = produkMap[d.id_produk];
          const snaps = await kurangiStokProduk(d.id_produk, d.qty, p?.stok_minimal, p?.nama_produk ?? `Produk #${d.id_produk}`);
          allSnapshots.push(...snaps);
        }
      } catch (stokErr) {
        await restoreStokProduk(allSnapshots);
        await supabase.from("detail_penjualan_langsung").delete().eq("id_penjualan", penjualan.id_penjualan);
        await supabase.from("penjualan_langsung").delete().eq("id_penjualan", penjualan.id_penjualan);
        throw stokErr;
      }
      const itemSummary = details.map((d) => `${produkMap[d.id_produk]?.nama_produk ?? `Produk #${d.id_produk}`} x${d.qty}`).join(", ");
      await logActivity({ aktivitas: "CREATE", modul: "Penjualan Toko",
        detail: { pesan: `Penjualan #${penjualan.id_penjualan}: ${itemSummary} - Total ${fmtRp(total)}` } });
      await fetchAll(true);
    } finally {submittingRef.current = false;}
  }




  async function editPenjualan(payload) {
    const { data: origDetails_ } = await supabase.
    from("detail_penjualan_langsung").
    select("id_produk, qty").
    eq("id_penjualan", payload.id_penjualan);
    const origDetails = origDetails_ ?? [];

    const allProdukIds = [...new Set([
    ...origDetails.map((d) => d.id_produk),
    ...payload.items.map((i) => i.id_produk)]
    )];
    const { data: produkData } = await supabase.from("produk").
    select("id_produk,nama_produk,harga_satuan,stok_minimal").
    in("id_produk", allProdukIds);
    const produkMap = Object.fromEntries((produkData ?? []).map((p) => [p.id_produk, p]));
    const hargaMap = Object.fromEntries((produkData ?? []).map((p) => [p.id_produk, Number(p.harga_satuan)]));
    const namaMap = Object.fromEntries((produkData ?? []).map((p) => [p.id_produk, p.nama_produk]));


    const deltas = hitungDeltaQty(origDetails, payload.items);
    await validateDeltaPenjualan(deltas, produkMap, namaMap);

    const details = payload.items.map((i) => ({
      id_penjualan: payload.id_penjualan,
      id_produk: i.id_produk,
      qty: Number(i.qty),
      harga_satuan: hargaMap[i.id_produk] ?? 0
    }));

    const { data: sebelum } = await supabase.from("penjualan_langsung").
    select("id_user,jenis_pembayaran").eq("id_penjualan", payload.id_penjualan).single();
    const origDetailsForRollback = origDetails.map((d) => ({
      id_penjualan: payload.id_penjualan, id_produk: d.id_produk, qty: d.qty,
      harga_satuan: hargaMap[d.id_produk] ?? 0
    }));

    const itemsSebelumLabel = origDetails.map((d) => `${namaMap[d.id_produk] ?? d.id_produk} ×${d.qty}`).join(", ") || "-";
    const itemsSesudahLabel = payload.items.map((i) => `${namaMap[i.id_produk] ?? i.id_produk} ×${i.qty}`).join(", ") || "-";


    await supabase.from("detail_penjualan_langsung").delete().eq("id_penjualan", payload.id_penjualan);

    const { error: pErr } = await supabase.from("penjualan_langsung").
    update({ id_user: payload.id_user, jenis_pembayaran: payload.jenis_pembayaran }).
    eq("id_penjualan", payload.id_penjualan);
    if (pErr) {
      if (origDetailsForRollback.length) await supabase.from("detail_penjualan_langsung").insert(origDetailsForRollback);
      throw pErr;
    }

    const { error: dErr } = await supabase.from("detail_penjualan_langsung").insert(details);
    if (dErr) {
      await supabase.from("penjualan_langsung").
      update({ id_user: sebelum.id_user, jenis_pembayaran: sebelum.jenis_pembayaran }).
      eq("id_penjualan", payload.id_penjualan);
      if (origDetailsForRollback.length) await supabase.from("detail_penjualan_langsung").insert(origDetailsForRollback);
      throw dErr;
    }


    try {
      await applyDeltaPenjualan(deltas, produkMap);
    } catch (stokErr) {

      await supabase.from("detail_penjualan_langsung").delete().eq("id_penjualan", payload.id_penjualan);
      await supabase.from("penjualan_langsung").
      update({ id_user: sebelum.id_user, jenis_pembayaran: sebelum.jenis_pembayaran }).
      eq("id_penjualan", payload.id_penjualan);
      if (origDetailsForRollback.length) await supabase.from("detail_penjualan_langsung").insert(origDetailsForRollback);
      throw stokErr;
    }

    if (itemsSebelumLabel !== itemsSesudahLabel) {
      logActivity({
        aktivitas: "UPDATE", modul: "penjualan_langsung",
        detail: {
          pesan: `Item pesanan #${payload.id_penjualan} diubah`,
          no_pesanan: payload.id_penjualan,
          field: "Item Pesanan"
        },
        sebelum: itemsSebelumLabel,
        sesudah: itemsSesudahLabel
      });
    }

    await fetchAll(true);
  }

  return { list, kasirList, produkList, jenisBayarList, stats, loading, error, lastUpdated, editedIds, tambahPenjualan, editPenjualan };
}