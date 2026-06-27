import { useState, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { fmtRp, fmtDateTime, wibRange } from "../../../shared/utils/format";
import { useEnums, sel, fetchEnumKategoriProduk } from "../../../shared/hooks/useEnums";

const isoRange = (dari, sampai) => {const r = wibRange(dari, sampai);return [r.start, r.end];};



export function useLaporanGrafik() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async ({ jenis = "semua", periode = "harian", dari = "", sampai = "" } = {}) => {
    setLoading(true);setError(null);
    try {
      const [start, end] = isoRange(dari, sampai);
      const [rOnline, rToko] = await Promise.all([
      jenis !== "langsung" ?
      supabase.from("pesanan_online").
      select("tanggal, ongkir, detail_pesanan_online(qty, harga_satuan)").
      gte("tanggal", start).lte("tanggal", end).
      neq("status", "Dibatalkan") :
      Promise.resolve({ data: [] }),
      jenis !== "online" ?
      supabase.from("penjualan_langsung").
      select("tanggal, detail_penjualan_langsung(qty, harga_satuan)").
      gte("tanggal", start).lte("tanggal", end) :
      Promise.resolve({ data: [] })]
      );
      if (rOnline.error) throw rOnline.error;
      if (rToko.error) throw rToko.error;

      const toWIBDate = (isoStr) => {
        const s = String(isoStr);
        const utc = s.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(s) ? s : s + "Z";
        const d = new Date(new Date(utc).getTime() + 7 * 60 * 60 * 1000);
        const y = d.getUTCFullYear();
        const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
        const dy = String(d.getUTCDate()).padStart(2, "0");
        if (periode === "bulanan") return `${y}-${mo}`;
        if (periode === "mingguan") {

          const thu = new Date(d);
          thu.setUTCDate(d.getUTCDate() + 3 - (d.getUTCDay() + 6) % 7);
          const isoY = thu.getUTCFullYear();
          const jan4 = new Date(Date.UTC(isoY, 0, 4));
          const week = 1 + Math.round((thu.getTime() - jan4.getTime()) / 604_800_000);
          return `${isoY}-W${String(week).padStart(2, "0")}`;
        }
        return `${y}-${mo}-${dy}`;
      };
      const mapOnline = {},mapToko = {};
      (rOnline.data ?? []).forEach((p) => {
        const k = toWIBDate(p.tanggal);
        const lineTotal = (p.detail_pesanan_online ?? []).reduce((s, d) => s + Number(d.qty) * Number(d.harga_satuan), 0);
        mapOnline[k] = (mapOnline[k] ?? 0) + lineTotal + Number(p.ongkir ?? 0);
      });
      (rToko.data ?? []).forEach((p) => {
        const k = toWIBDate(p.tanggal);
        const lineTotal = (p.detail_penjualan_langsung ?? []).reduce((s, d) => s + Number(d.qty) * Number(d.harga_satuan), 0);
        mapToko[k] = (mapToko[k] ?? 0) + lineTotal;
      });
      const keys = [...new Set([...Object.keys(mapOnline), ...Object.keys(mapToko)])].sort();
      const chartData = keys.map((k) => ({ label: k, online: mapOnline[k] ?? 0, toko: mapToko[k] ?? 0, total: (mapOnline[k] ?? 0) + (mapToko[k] ?? 0) }));
      const totalOmset = chartData.reduce((s, r) => s + r.total, 0);

      const todayKey = toWIBDate(new Date().toISOString());
      const omsetHariIni = chartData.find((r) => r.label === todayKey)?.total ?? 0;
      const rataRata = chartData.length ? Math.round(totalOmset / chartData.length) : 0;
      const hariTertinggi = chartData.reduce((max, r) => r.total > max ? r.total : max, 0);
      setData({ chartData, stats: { totalOmset: fmtRp(totalOmset), omsetHariIni: fmtRp(omsetHariIni), rataRata: fmtRp(rataRata), hariTertinggi: fmtRp(hariTertinggi) } });
    } catch (e) {setError(e.message);} finally
    {setLoading(false);}
  }, []);
  return { data, loading, error, fetch };
}



export function useLaporanRiwayat() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async ({ jenis = "semua", subJenis = "", status = "", dari = "", sampai = "", search = "" } = {}) => {
    setLoading(true);setError(null);
    try {
      const [start, end] = isoRange(dari, sampai);
      const out = [];
      if (jenis === "semua" || jenis === "online" || jenis === "preorder" || jenis === "segera_antar") {
        let q = supabase.from("pesanan_online").
        select("id_pesanan, tanggal, jenis_pembayaran, status, waktu_antar, ongkir, detail_pesanan_online(qty, harga_satuan, produk:produk(nama_produk)), pelanggan:profiles!id_pelanggan(nama_lengkap)").
        gte("tanggal", start).lte("tanggal", end);
        if (status && status !== "Semua") q = q.eq("status", status);
        if (jenis === "preorder" || subJenis === "preorder") q = q.not("waktu_antar", "is", null);
        if (jenis === "segera_antar" || subJenis === "segera_antar") q = q.is("waktu_antar", null);
        const { data, error: e } = await q;if (e) throw e;
        (data ?? []).forEach((p) => {
          const details = p.detail_pesanan_online ?? [];
          const lineTotal = details.reduce((s, d) => s + d.qty * Number(d.harga_satuan), 0);
          const total = lineTotal + Number(p.ongkir ?? 0);
          out.push({
            no_pesanan: String(p.id_pesanan),
            tanggal: fmtDateTime(p.tanggal),
            tanggal_raw: p.tanggal,
            jenis: p.waktu_antar ? "Pre-Order" : "Segera Antar",
            pelanggan: p.pelanggan?.nama_lengkap ?? "-",
            details,
            ongkir: Number(p.ongkir ?? 0),
            totalQty: details.reduce((s, d) => s + Number(d.qty), 0),
            total,
            total_fmt: fmtRp(total),
            pembayaran: p.jenis_pembayaran ?? "-",
            status: p.status
          });
        });
      }
      if (jenis === "semua" || jenis === "langsung") {
        let q = supabase.from("penjualan_langsung").
        select("id_penjualan, tanggal, jenis_pembayaran, detail_penjualan_langsung(qty, harga_satuan, produk:produk(nama_produk)), kasir:profiles!id_user(nama_lengkap)").
        gte("tanggal", start).lte("tanggal", end);
        const { data, error: e } = await q;if (e) throw e;
        (data ?? []).forEach((p) => {
          if (status && status !== "Semua" && status !== "Selesai") return;
          const details = p.detail_penjualan_langsung ?? [];
          const lineTotal = details.reduce((s, d) => s + Number(d.qty) * Number(d.harga_satuan), 0);
          out.push({
            no_pesanan: String(p.id_penjualan),
            tanggal: fmtDateTime(p.tanggal),
            tanggal_raw: p.tanggal,
            jenis: "Langsung",
            pelanggan: p.kasir?.nama_lengkap ?? "-",
            details,
            totalQty: details.reduce((s, d) => s + Number(d.qty), 0),
            total: lineTotal,
            total_fmt: fmtRp(lineTotal),
            pembayaran: p.jenis_pembayaran ?? "-",
            status: "Selesai"
          });
        });
      }
      out.sort((a, b) => new Date(b.tanggal_raw) - new Date(a.tanggal_raw));
      const sq = search.toLowerCase();
      const filtered = search ? out.filter((r) =>
      r.no_pesanan.toLowerCase().includes(sq) ||
      (r.pelanggan ?? "").toLowerCase().includes(sq) ||
      (r.pembayaran ?? "").toLowerCase().includes(sq)
      ) : out;
      setRows(filtered);
    } catch (e) {setError(e.message);} finally
    {setLoading(false);}
  }, []);
  return { rows, loading, error, fetch };
}



export function useLaporanProdukTerlaris() {
  const { enums } = useEnums();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async ({ peringkat = 5, namaKategori = "", dari = "", sampai = "", jenis = "semua" } = {}) => {
    setLoading(true);setError(null);
    try {
      const [start, end] = isoRange(dari, sampai);
      const mapOnline = {},mapToko = {};
      if (jenis !== "langsung") {
        const { data, error: e } = await supabase.
        from("detail_pesanan_online").
        select("id_produk, qty, harga_satuan, pesanan_online!inner(tanggal, status)").
        gte("pesanan_online.tanggal", start).
        lte("pesanan_online.tanggal", end).
        neq("pesanan_online.status", "Dibatalkan");
        if (e) throw e;
        (data ?? []).forEach((d) => {
          if (!mapOnline[d.id_produk]) mapOnline[d.id_produk] = { qty: 0, omset: 0 };
          mapOnline[d.id_produk].qty += Number(d.qty);
          mapOnline[d.id_produk].omset += Number(d.qty) * Number(d.harga_satuan);
        });
      }
      if (jenis !== "online") {
        const { data, error: e } = await supabase.
        from("detail_penjualan_langsung").
        select("id_produk, qty, harga_satuan, penjualan_langsung!inner(tanggal)").
        gte("penjualan_langsung.tanggal", start).
        lte("penjualan_langsung.tanggal", end);
        if (e) throw e;
        (data ?? []).forEach((d) => {
          if (!mapToko[d.id_produk]) mapToko[d.id_produk] = { qty: 0, omset: 0 };
          mapToko[d.id_produk].qty += Number(d.qty);
          mapToko[d.id_produk].omset += Number(d.qty) * Number(d.harga_satuan);
        });
      }
      const allIds = [...new Set([...Object.keys(mapOnline), ...Object.keys(mapToko)])];
      let produkQ = supabase.from("produk").
      select("id_produk, nama_produk, harga_satuan, kategori_produk, kategori_enum:enum_kategori_produk!kategori_produk(id,nilai)").
      in("id_produk", allIds.length ? allIds.map(Number) : [0]);
      if (namaKategori) {

        const kList = await fetchEnumKategoriProduk();
        const found = kList.find((k) => k.nilai === namaKategori);
        if (found?.id) produkQ = produkQ.eq("kategori_produk", found.id);
      }
      const { data: produkData } = await produkQ;

      const result = (produkData ?? []).map((p) => {
        const o = mapOnline[p.id_produk] ?? { qty: 0, omset: 0 };
        const t = mapToko[p.id_produk] ?? { qty: 0, omset: 0 };
        return {
          id_produk: String(p.id_produk),
          nama_produk: p.nama_produk,
          kategori: p.kategori_enum?.nilai ?? String(p.kategori_produk ?? "-"),
          terjual_online: o.qty,
          terjual_toko: t.qty,
          total_terjual: o.qty + t.qty,
          total_omset: o.omset + t.omset,
          total_omset_fmt: fmtRp(o.omset + t.omset)
        };
      }).
      sort((a, b) => b.total_terjual - a.total_terjual).
      slice(0, Number(peringkat)).
      map((r, i) => ({ ...r, peringkat: i + 1 }));
      setRows(result);
    } catch (e) {setError(e.message);} finally
    {setLoading(false);}
  }, []);
  return {
    rows, loading, error, fetch,

    kategoriList: sel.produkKategori(enums).map((k) => ({ nama: k })),

    fetchKategori: () => {}
  };
}



export function useLaporanPerubahan() {
  const [rows, setRows] = useState([]);
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase.from("profiles").
    select("id, nama_lengkap, role").in("role", ["Admin", "Kasir"]).order("nama_lengkap");
    if (data) setUserList(data);
  }, []);

  const fetch = useCallback(async ({ jenis = "semua", field = "", userId = "", dari = "", sampai = "", search = "" } = {}) => {
    setLoading(true);setError(null);
    try {

      const ds = dari ? new Date(`${dari}T00:00:00+07:00`) : null;
      const de = sampai ? new Date(`${sampai}T23:59:59.999+07:00`) : dari ? new Date(`${dari}T23:59:59.999+07:00`) : null;


      let q = supabase.from("log_aktivitas").
      select("id_log, id_user, aktivitas, modul, detail, detail_json, data_sebelum, data_sesudah, timestamp, profile:profiles!id_user(nama_lengkap,role)").
      eq("aktivitas", "UPDATE").
      in("modul", ["pesanan_online", "penjualan_langsung"]).
      order("timestamp", { ascending: false }).
      limit(200);
      if (userId) q = q.eq("id_user", userId);
      if (ds) q = q.gte("timestamp", ds.toISOString());
      if (de) q = q.lte("timestamp", de.toISOString());
      const { data, error: e } = await q;if (e) throw e;




      const onlineLogs = (data ?? []).filter((l) => l.modul === "pesanan_online");
      const pesananIds = [...new Set(onlineLogs.map((l) => {
        const dj = l.detail_json ?? {};const sb = l.data_sebelum;const ss = l.data_sesudah;
        return dj.no_pesanan ?? ss?.id_pesanan ?? sb?.id_pesanan;
      }).filter(Boolean))];
      let waktuAntarMap = {};
      if (pesananIds.length > 0) {
        const { data: ps } = await supabase.from("pesanan_online").
        select("id_pesanan,waktu_antar").in("id_pesanan", pesananIds);
        (ps ?? []).forEach((p) => {waktuAntarMap[p.id_pesanan] = p.waktu_antar;});
      }

      const SKIP = new Set(["id_penjualan", "id_pesanan", "id_user", "id_pelanggan", "tanggal", "created_at", "updated_at", "total"]);
      const LABEL_TOKO = { jenis_pembayaran: "Jenis Pembayaran", status: "Status" };
      const LABEL_ONLINE = { status: "Status", jenis_pembayaran: "Jenis Pembayaran", waktu_antar: "Waktu Antar" };
      const fmtVal = (v) => v === null || v === undefined ? "-" : typeof v === "object" ? JSON.stringify(v) : String(v);

      const fmtLog = (v) => {const s = fmtVal(v);return s.startsWith('"') || s.startsWith("'") ? s.slice(1, -1) : s;};
      const diffRows = (sb, ss, labels, skip) => {
        if (!sb || !ss || typeof sb !== "object" || typeof ss !== "object") return null;
        return Object.keys({ ...sb, ...ss }).
        filter((k) => !skip.has(k) && String(sb[k] ?? "") !== String(ss[k] ?? "")).
        map((k) => ({ field: labels[k] ?? k, sebelum: fmtVal(sb[k]), sesudah: fmtVal(ss[k]) }));
      };


      let out = (data ?? []).filter((log) => log.profile?.role !== "Pelanggan" && log.profile?.role !== "Produksi").flatMap((log) => {
        let p = {};
        try {p = JSON.parse(log.detail ?? "{}");} catch (e) {console.warn("Gagal parse log.detail:", log.detail, e);}
        const dj = log.detail_json ?? {};
        const sb = log.data_sebelum;
        const ss = log.data_sesudah;
        const isOnline = log.modul === "pesanan_online";
        const labels = isOnline ? LABEL_ONLINE : LABEL_TOKO;
        const ts = fmtDateTime(log.timestamp);
        const noPesanan = dj.no_pesanan ?? ss?.id_penjualan ?? ss?.id_pesanan ?? sb?.id_penjualan ?? sb?.id_pesanan ?? p.no_pesanan ?? "-";
        const pesananId = dj.no_pesanan ?? ss?.id_pesanan ?? sb?.id_pesanan;
        const jenisRow = isOnline ?
        waktuAntarMap[pesananId] ? "Pre-Order" : "Segera Antar" :
        "Langsung";
        const who = log.profile?.nama_lengkap ?? "-";
        const base = { id: log.id_log, tanggal: ts, tanggal_raw: log.timestamp, no_pesanan: String(noPesanan), jenis: jenisRow, diubah_oleh: who };
        if (!dj.field) {
          const diffs = diffRows(sb, ss, labels, SKIP);
          if (diffs && diffs.length > 0)
          return diffs.map((d, i) => ({ ...base, id: `${log.id_log}-${i}`, field: d.field, sebelum: d.sebelum, sesudah: d.sesudah }));
          return [];
        }
        return [{ ...base, field: dj.field ?? "-",
          sebelum: fmtLog(log.data_sebelum ?? dj.sebelum),
          sesudah: fmtLog(log.data_sesudah ?? dj.sesudah) }];
      }).filter((r) => !(r.sebelum === "-" && r.sesudah === "-"));


      out.sort((a, b) => new Date(b.tanggal_raw) - new Date(a.tanggal_raw));

      if (jenis === "langsung") out = out.filter((r) => r.jenis === "Langsung");
      if (jenis === "segera_antar") out = out.filter((r) => r.jenis === "Segera Antar");
      if (jenis === "preorder") out = out.filter((r) => r.jenis === "Pre-Order");
      if (field && field !== "Semua") out = out.filter((r) => r.field === field);
      if (search) {
        const sq = search.toLowerCase();
        out = out.filter((r) =>
        r.no_pesanan.toLowerCase().includes(sq) ||
        (r.pelanggan ?? "").toLowerCase().includes(sq) ||
        (r.pembayaran ?? "").toLowerCase().includes(sq)
        );
      }
      setRows(out);
    } catch (e) {setError(e.message);} finally
    {setLoading(false);}
  }, []);
  return { rows, userList, loading, error, fetch, fetchUsers };
}