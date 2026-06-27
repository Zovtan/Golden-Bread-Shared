import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { useRealtimeRefresh } from "../../../shared/hooks/useRealtimeRefresh";
import { useEnums, sel } from "../../../shared/hooks/useEnums";
import { fmtRp, fmtDateTime, asUTC, parseWIB, todayWIB, toWIBDate } from "../../../shared/utils/format";
import { logActivity } from "../../../shared/utils/logActivity";
import { hitungDeltaQty, validateDeltaPenjualan, applyDeltaPenjualan } from "../../../shared/utils/stokPenjualanDelta";

const WATCHED = ["penjualan_langsung", "detail_penjualan_langsung", "pesanan_online", "detail_pesanan_online"];






export function useKasirRiwayatPenjualan(search = "") {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);


  const [filterJenis, setFilterJenis] = useState("semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterTanggalMulai, setFilterTanggalMulai] = useState(todayWIB);
  const [filterTanggalAkhir, setFilterTanggalAkhir] = useState(todayWIB);


  const [applied, setApplied] = useState({
    jenis: "semua", status: "Semua", dari: todayWIB(), sampai: todayWIB()
  });


  const applyFilter = () => setApplied({
    jenis: filterJenis,
    status: filterStatus,
    dari: filterTanggalMulai,
    sampai: filterTanggalAkhir
  });


  const resetFilter = () => {
    setFilterJenis("semua");
    setFilterStatus("Semua");
    setFilterTanggalMulai(todayWIB());
    setFilterTanggalAkhir(todayWIB());
    setApplied({ jenis: "semua", status: "Semua", dari: todayWIB(), sampai: todayWIB() });
  };

  const { enums } = useEnums();
  const fetchToken = useRef(0);


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


  const [produkList, setProdukList] = useState([]);
  const produkLoadedRef = useRef(false);
  const loadProduk = useCallback(async () => {
    if (produkLoadedRef.current) return;
    produkLoadedRef.current = true;
    const { data } = await supabase.from("produk").
    select("id_produk,nama_produk,harga_satuan,status,stok_minimal,batch_produk(stok,status_stok,status_kadaluarsa)").
    eq("status", "Aktif").order("nama_produk");
    if (data) setProdukList(data.map((p) => {
      const batches = (p.batch_produk ?? []).filter((b) =>
      (b.status_stok === "Normal" || b.status_stok === "Menipis") && b.status_kadaluarsa !== "Ya"
      );
      const totalStok = batches.reduce((s, b) => s + Number(b.stok), 0);
      let statusStok = "Normal";
      if (!batches.length || batches.every((b) => b.status_stok === "Habis")) statusStok = "Habis";else
      if (batches.some((b) => b.status_stok === "Menipis")) statusStok = "Menipis";
      return { id_produk: p.id_produk, nama_produk: p.nama_produk, harga_satuan: p.harga_satuan, totalStok, statusStok };
    }));
  }, []);


  const fetchAll = useCallback(async (bg = false) => {
    if (!bg) setLoading(true);
    setError(null);
    const token = ++fetchToken.current;
    try {
      const [rLangsung, rOnline] = await Promise.all([
      supabase.from("penjualan_langsung").
      select(`id_penjualan, tanggal, jenis_pembayaran,
                   kasir:profiles!id_user(nama_lengkap),
                   detail_penjualan_langsung(qty, harga_satuan, produk:id_produk(nama_produk))`).
      order("tanggal", { ascending: false }).
      limit(200),
      supabase.from("pesanan_online").
      select(`id_pesanan, tanggal, status, jenis_pembayaran, waktu_antar, ongkir,
                   pelanggan:profiles!id_pelanggan(nama_lengkap, nama_toko),
                   detail_pesanan_online(qty, harga_satuan, produk:id_produk(nama_produk))`).
      order("tanggal", { ascending: false }).
      limit(200)]
      );
      if (fetchToken.current !== token) return;


      const langsungRows = (rLangsung.data ?? []).map((p) => {
        const details = p.detail_penjualan_langsung ?? [];
        const totalQty = details.reduce((s, d) => s + Number(d.qty), 0);
        const total = details.reduce((s, d) => s + Number(d.qty) * Number(d.harga_satuan), 0);
        return {
          id: `L-${p.id_penjualan}`,
          no_pesanan: String(p.id_penjualan),
          tanggal: fmtDateTime(p.tanggal),
          tanggal_raw: parseWIB(p.tanggal) ?? new Date(asUTC(p.tanggal)),
          jenis: "Langsung",
          jenisSub: null,
          pelanggan: p.kasir?.nama_lengkap ?? "-",
          items: details.slice(0, 2).map((d) => `${d.produk?.nama_produk ?? "?"} ×${d.qty}`),
          itemsExtra: Math.max(0, details.length - 2),
          totalQty, total,
          total_fmt: fmtRp(total),
          pembayaran: p.jenis_pembayaran ?? "-",
          status: "Selesai"
        };
      });


      const onlineRows = (rOnline.data ?? []).map((p) => {
        const details = p.detail_pesanan_online ?? [];
        const totalQty = details.reduce((s, d) => s + Number(d.qty), 0);
        const lineTotal = details.reduce((s, d) => s + d.qty * Number(d.harga_satuan), 0);
        const total = lineTotal + Number(p.ongkir ?? 0);
        const jenisSub = p.waktu_antar ? "Pre-Order" : "Segera Antar";
        return {
          id: `O-${p.id_pesanan}`,
          no_pesanan: String(p.id_pesanan),
          tanggal: fmtDateTime(p.tanggal),
          tanggal_raw: parseWIB(p.tanggal) ?? new Date(asUTC(p.tanggal)),
          jenis: "Online",
          jenisSub,
          pelanggan: p.pelanggan?.nama_lengkap ?? "-",
          nama_toko: p.pelanggan?.nama_toko ?? "-",
          items: details.slice(0, 2).map((d) => `${d.produk?.nama_produk ?? "?"} ×${d.qty}`),
          itemsExtra: Math.max(0, details.length - 2),
          totalQty, total,
          total_fmt: fmtRp(total),
          pembayaran: p.jenis_pembayaran ?? "-",
          status: p.status ?? "-"
        };
      });

      setList([...langsungRows, ...onlineRows].sort((a, b) => b.tanggal_raw - a.tanggal_raw));
      setLastUpdated(new Date());
    } catch (e) {
      if (fetchToken.current === token) setError(e.message);
    } finally {
      if (fetchToken.current === token) setLoading(false);
    }
  }, []);

  useEffect(() => {fetchAll(false);}, [fetchAll]);
  useRealtimeRefresh("kasir-riwayat", WATCHED, useCallback(() => fetchAll(true), [fetchAll]));

  const filtered = list.filter((r) => {
    const j = applied.jenis;
    if (j === "langsung" && r.jenis !== "Langsung") return false;
    if (j === "segera_antar" && !(r.jenis === "Online" && r.jenisSub === "Segera Antar")) return false;
    if (j === "preorder" && !(r.jenis === "Online" && r.jenisSub === "Pre-Order")) return false;
    if (applied.status !== "Semua" && r.status !== applied.status) return false;
    if (applied.dari) {
      if (toWIBDate(r.tanggal_raw) < applied.dari) return false;
    }
    if (applied.sampai) {
      if (toWIBDate(r.tanggal_raw) > applied.sampai) return false;
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        r.no_pesanan.includes(q) ||
        r.pelanggan.toLowerCase().includes(q) ||
        r.pembayaran.toLowerCase().includes(q) ||
        (r.jenisSub ?? r.jenis).toLowerCase().includes(q) ||
        r.items.some((i) => i.toLowerCase().includes(q)));

    }
    return true;
  });

  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);


  const fetchDetail = useCallback(async (item) => {
    if (!item) return;
    setDetail(null);
    setLoadingDetail(true);
    try {
      if (item.jenis === "Langsung") {
        const { data } = await supabase.
        from("penjualan_langsung").
        select(`
            id_penjualan, tanggal, jenis_pembayaran,
            kasir:profiles!id_user(nama_lengkap),
            detail_penjualan_langsung(qty, harga_satuan, produk(nama_produk))
          `).
        eq("id_penjualan", Number(item.no_pesanan)).
        single();
        if (data) {
          const details = data.detail_penjualan_langsung ?? [];
          const totalQty = details.reduce((s, d) => s + Number(d.qty), 0);
          const total = details.reduce((s, d) => s + Number(d.qty) * Number(d.harga_satuan), 0);


          const { data: logData } = await supabase.
          from("log_aktivitas").
          select("timestamp, data_sebelum, data_sesudah, profile:profiles!id_user(nama_lengkap)").
          eq("modul", "penjualan_langsung").
          eq("aktivitas", "UPDATE").
          contains("detail_json", { no_pesanan: data.id_penjualan, field: "Item Pesanan" }).
          order("timestamp", { ascending: false }).
          limit(20);

          const editHistory = (logData ?? []).map((l) => ({
            waktu: fmtDateTime(l.timestamp),
            oleh: l.profile?.nama_lengkap ?? "-",
            sebelum: typeof l.data_sebelum === "string" ?
            l.data_sebelum :
            JSON.stringify(l.data_sebelum ?? "-"),
            sesudah: typeof l.data_sesudah === "string" ?
            l.data_sesudah :
            JSON.stringify(l.data_sesudah ?? "-"),
            total_sesudah: fmtRp(total)
          }));

          setDetail({
            no: data.id_penjualan,
            tanggal: fmtDateTime(data.tanggal),
            jenis: "Penjualan Langsung",
            kasir: data.kasir?.nama_lengkap ?? "-",
            pembayaran: data.jenis_pembayaran,
            totalQty,
            total: fmtRp(total),
            details: details.map((d) => ({
              nama: d.produk?.nama_produk ?? "-",
              qty: d.qty,
              harga: fmtRp(d.harga_satuan),
              subtotal: fmtRp(Number(d.qty) * Number(d.harga_satuan))
            })),
            editHistory
          });
        }
      } else {
        const { data } = await supabase.
        from("pesanan_online").
        select(`
            id_pesanan, tanggal, status, jenis_pembayaran, waktu_antar, lat, lng, ongkir,
            nama_penerima, no_telp_penerima, alamat_pengiriman, catatan,
            pesan_pembatalan, refund_status, refund_alasan,
            pelanggan:profiles!id_pelanggan(nama_lengkap, nama_toko, no_telp, alamat),
            detail_pesanan_online(qty, harga_satuan, produk(nama_produk))
          `).
        eq("id_pesanan", Number(item.no_pesanan)).
        single();
        if (data) {
          const details = data.detail_pesanan_online ?? [];
          const totalQty = details.reduce((s, d) => s + Number(d.qty), 0);
          const lineTotal = details.reduce((s, d) => s + d.qty * Number(d.harga_satuan), 0);
          const ongkir = Number(data.ongkir ?? 0);
          const total = lineTotal + ongkir;
          setDetail({
            no: data.id_pesanan,
            tanggal: fmtDateTime(data.tanggal),
            jenis: "Pesanan Online",
            pelanggan: data.pelanggan?.nama_lengkap ?? "-",
            nama_toko: data.pelanggan?.nama_toko ?? "-",
            telp: data.no_telp_penerima ?? data.pelanggan?.no_telp ?? null,
            alamat: data.alamat_pengiriman ?? data.pelanggan?.alamat ?? null,
            catatan: data.catatan ?? null,
            waktu_antar: data.waktu_antar ? fmtDateTime(data.waktu_antar) : "Segera antar",
            pembayaran: data.jenis_pembayaran,
            status: data.status,
            pesan_pembatalan: data.pesan_pembatalan ?? null,
            refund_status: data.refund_status ?? null,
            refund_alasan: data.refund_alasan ?? null,
            lat: data.lat != null ? Number(data.lat) : null,
            lng: data.lng != null ? Number(data.lng) : null,
            totalQty,
            ongkir: ongkir > 0 ? fmtRp(ongkir) : null,
            total: fmtRp(total),
            details: details.map((d) => ({
              nama: d.produk?.nama_produk ?? "-",
              qty: d.qty,
              harga: fmtRp(d.harga_satuan),
              subtotal: fmtRp(d.qty * Number(d.harga_satuan))
            }))
          });
        }
      }
    } finally {
      setLoadingDetail(false);
    }
  }, []);


  const clearDetail = useCallback(() => {
    setDetail(null);
    setLoadingDetail(false);
  }, []);

  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);



  const editPenjualan = useCallback(async (payload) => {
    setEditLoading(true);setEditError(null);
    try {
      const { data: origDetails } = await supabase.
      from("detail_penjualan_langsung").
      select("id_produk, qty").
      eq("id_penjualan", payload.id_penjualan);
      const orig = origDetails ?? [];

      const allIds = [...new Set([
      ...orig.map((d) => d.id_produk),
      ...payload.items.map((i) => i.id_produk)]
      )];
      const { data: produkData } = await supabase.from("produk").
      select("id_produk,nama_produk,harga_satuan,stok_minimal").
      in("id_produk", allIds);
      const hargaMap = Object.fromEntries((produkData ?? []).map((p) => [p.id_produk, Number(p.harga_satuan)]));
      const namaMap = Object.fromEntries((produkData ?? []).map((p) => [p.id_produk, p.nama_produk]));
      const produkMap = Object.fromEntries((produkData ?? []).map((p) => [p.id_produk, p]));


      const deltas = hitungDeltaQty(orig, payload.items);
      await validateDeltaPenjualan(deltas, produkMap, namaMap);

      const details = payload.items.map((i) => ({
        id_penjualan: payload.id_penjualan,
        id_produk: i.id_produk,
        qty: Number(i.qty),
        harga_satuan: hargaMap[i.id_produk] ?? 0
      }));
      const origDetailsForRollback = orig.map((d) => ({
        id_penjualan: payload.id_penjualan, id_produk: d.id_produk, qty: d.qty,
        harga_satuan: hargaMap[d.id_produk] ?? 0
      }));
      const { data: sebelum } = await supabase.from("penjualan_langsung").
      select("jenis_pembayaran").eq("id_penjualan", payload.id_penjualan).single();

      const itemsSebelumLabel = orig.map((d) => `${namaMap[d.id_produk] ?? d.id_produk} ×${d.qty}`).join(", ") || "-";
      const itemsSesudahLabel = payload.items.map((i) => `${namaMap[i.id_produk] ?? i.id_produk} ×${i.qty}`).join(", ") || "-";

      await supabase.from("detail_penjualan_langsung").delete().eq("id_penjualan", payload.id_penjualan);

      const { error: pErr } = await supabase.from("penjualan_langsung").
      update({ jenis_pembayaran: payload.jenis_pembayaran }).
      eq("id_penjualan", payload.id_penjualan);
      if (pErr) {
        if (origDetailsForRollback.length) await supabase.from("detail_penjualan_langsung").insert(origDetailsForRollback);
        throw pErr;
      }

      const { error: dErr } = await supabase.from("detail_penjualan_langsung").insert(details);
      if (dErr) {
        await supabase.from("penjualan_langsung").update({ jenis_pembayaran: sebelum?.jenis_pembayaran }).eq("id_penjualan", payload.id_penjualan);
        if (origDetailsForRollback.length) await supabase.from("detail_penjualan_langsung").insert(origDetailsForRollback);
        throw dErr;
      }


      try {
        await applyDeltaPenjualan(deltas, produkMap);
      } catch (stokErr) {
        await supabase.from("detail_penjualan_langsung").delete().eq("id_penjualan", payload.id_penjualan);
        await supabase.from("penjualan_langsung").update({ jenis_pembayaran: sebelum?.jenis_pembayaran }).eq("id_penjualan", payload.id_penjualan);
        if (origDetailsForRollback.length) await supabase.from("detail_penjualan_langsung").insert(origDetailsForRollback);
        throw stokErr;
      }

      if (itemsSebelumLabel !== itemsSesudahLabel) {
        logActivity({
          aktivitas: "UPDATE", modul: "penjualan_langsung",
          detail: { pesan: `Item pesanan #${payload.id_penjualan} diubah`, no_pesanan: payload.id_penjualan, field: "Item Pesanan" },
          sebelum: itemsSebelumLabel,
          sesudah: itemsSesudahLabel
        });
      }
    } catch (e) {
      setEditError(e.message);
      throw e;
    } finally {
      setEditLoading(false);
    }
  }, []);


  const fetchEditData = useCallback(async (no_pesanan) => {
    const { data } = await supabase.
    from("penjualan_langsung").
    select("id_penjualan, jenis_pembayaran, id_user, detail_penjualan_langsung(id_produk, qty)").
    eq("id_penjualan", Number(no_pesanan)).
    single();
    if (!data) throw new Error("Data penjualan tidak ditemukan");
    return {
      id_penjualan: data.id_penjualan,
      kasir_id: data.id_user ?? "",
      pembayaran: data.jenis_pembayaran ?? "",
      details: (data.detail_penjualan_langsung ?? []).map((d) => ({ id_produk: d.id_produk, qty: d.qty }))
    };
  }, []);

  return {
    list: filtered,
    loading, error, lastUpdated,
    filterJenis, setFilterJenis,
    filterStatus, setFilterStatus,
    filterTanggalMulai, setFilterTanggalMulai,
    filterTanggalAkhir, setFilterTanggalAkhir,
    applyFilter, resetFilter,
    detail, loadingDetail, fetchDetail, clearDetail,
    editPenjualan, editLoading, editError, fetchEditData,
    editedIds, produkList, loadProduk,
    statusOpt: ["Semua", ...sel.statusPesanan(enums)]
  };
}