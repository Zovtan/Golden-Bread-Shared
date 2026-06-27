import { useState, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { fmtDate, fmtDateTime, fmtRp, wibRange, todayWIB } from "../../../shared/utils/format";
import { useEnums, sel } from "../../../shared/hooks/useEnums";


const isoRange = (dari, sampai) => {const r = wibRange(dari, sampai);return [r.start, r.end];};

const TEMPO_NOTIF_DAYS = 3;

function daysUntil(iso) {
  if (!iso) return null;
  const target = new Date(`${iso.slice(0, 10)}T00:00:00+07:00`);
  const todayMs = new Date(`${todayWIB()}T00:00:00+07:00`);
  return Math.floor((target - todayMs) / 86_400_000);
}





export function useGrafikPembelian() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [supplierList, setSupplierList] = useState([]);


  const fetchSupplier = useCallback(async () => {
    const { data: sup } = await supabase.from("supplier").
    select("id_supplier, nama_supplier").order("nama_supplier");
    if (sup) setSupplierList(sup);
  }, []);


  const fetch = useCallback(async ({ status = "semua", idSupplier = "", periode = "harian", dari = "", sampai = "" } = {}) => {
    setLoading(true);setError(null);
    try {
      const [start, end] = isoRange(dari, sampai);

      let q = supabase.from("pembelian_bahan").
      select("id_pembelian, tanggal, status_pembayaran, detail_pembelian_bahan(jumlah, harga_satuan)").
      gte("tanggal", start).lte("tanggal", end);

      if (idSupplier) q = q.eq("id_supplier", idSupplier);
      if (status !== "semua") q = q.eq("status_pembayaran", status);

      const { data: rows, error: e } = await q;if (e) throw e;


      const txHariIni = (rows ?? []).length;


      const belumLunasRows = (rows ?? []).filter((r) => r.status_pembayaran !== "Lunas");
      const hutang = belumLunasRows.reduce((s, r) => s + (r.detail_pembelian_bahan ?? []).reduce((ss, d) => ss + Number(d.jumlah) * Number(d.harga_satuan), 0), 0);

      const totalPembelian = (rows ?? []).reduce((s, r) => s + (r.detail_pembelian_bahan ?? []).reduce((ss, d) => ss + Number(d.jumlah) * Number(d.harga_satuan), 0), 0);


      const toWIBDate = (isoStr, per = "harian") => {
        const s = String(isoStr);
        const utc = s.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(s) ? s : s + "Z";
        const d = new Date(new Date(utc).getTime() + 7 * 60 * 60 * 1000);
        const y = d.getUTCFullYear();
        const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
        const dy = String(d.getUTCDate()).padStart(2, "0");
        if (per === "bulanan") return `${y}-${mo}`;
        if (per === "mingguan") {

          const thu = new Date(d);
          thu.setUTCDate(d.getUTCDate() + 3 - (d.getUTCDay() + 6) % 7);
          const isoY = thu.getUTCFullYear();
          const jan4 = new Date(Date.UTC(isoY, 0, 4));
          const week = 1 + Math.round((thu.getTime() - jan4.getTime()) / 604_800_000);
          return `${isoY}-W${String(week).padStart(2, "0")}`;
        }
        return `${y}-${mo}-${dy}`;
      };
      const mapLunas = {},mapTempo = {};
      (rows ?? []).forEach((r) => {
        const k = toWIBDate(r.tanggal, periode);
        const t = (r.detail_pembelian_bahan ?? []).reduce((s, d) => s + Number(d.jumlah) * Number(d.harga_satuan), 0);
        if (r.status_pembayaran === "Lunas") mapLunas[k] = (mapLunas[k] ?? 0) + t;else
        mapTempo[k] = (mapTempo[k] ?? 0) + t;
      });

      const keys = [...new Set([...Object.keys(mapLunas), ...Object.keys(mapTempo)])].sort();
      const chartData = keys.map((k) => ({ label: k, lunas: mapLunas[k] ?? 0, tempo: mapTempo[k] ?? 0 }));

      setData({
        chartData,
        stats: {
          totalPembelian: fmtRp(totalPembelian),
          txHariIni: txHariIni ?? 0,
          tagihanBelumLunas: belumLunasRows.length,
          totalHutang: fmtRp(hutang)
        }
      });
    } catch (e) {setError(e.message);} finally
    {setLoading(false);}
  }, []);

  return { data, loading, error, fetch, supplierList, fetchSupplier };
}





export function useRiwayatPembelian() {
  const [rows, setRows] = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const fetchSupplier = useCallback(async () => {
    const { data } = await supabase.from("supplier").
    select("id_supplier, nama_supplier, alamat, no_telp").
    order("nama_supplier");
    if (data) setSupplierList(data);
  }, []);

  const fetch = useCallback(async ({ status = "semua", idSupplier = "", jenisBarang = "", dari = "", sampai = "", search = "" } = {}) => {
    setLoading(true);setError(null);
    try {
      const [start, end] = isoRange(dari, sampai);

      let q = supabase.from("pembelian_bahan").
      select(`
          id_pembelian, tanggal, status_pembayaran, jatuh_tempo, no_faktur,
          supplier(nama_supplier, alamat, no_telp),
          pencatat:profiles!id_user(nama_lengkap),
          detail_pembelian_bahan(
            id_bahan, merek, jumlah, harga_satuan,
            bahan_baku(
              id_bahan,
              jenis_bahan,
              satuan,
              jenis_bahan_enum:enum_jenis_bahan!jenis_bahan(id,nilai),
              satuan_enum:enum_satuan!satuan(id,nilai)
            )
          )
        `).
      gte("tanggal", start).lte("tanggal", end).
      order("tanggal", { ascending: false }).limit(200);

      if (idSupplier) q = q.eq("id_supplier", idSupplier);
      if (status !== "semua") q = q.eq("status_pembayaran", status);

      const { data, error: e } = await q;if (e) throw e;


      let out = (data ?? []).map((p) => {
        const detailRows = (p.detail_pembelian_bahan ?? []).map((d) => ({
          id_bahan: d.id_bahan,
          merek: d.merek ?? "-",
          jenis_bahan: d.bahan_baku?.jenis_bahan_enum?.nilai ?? String(d.bahan_baku?.jenis_bahan ?? "-"),
          satuan: d.bahan_baku?.satuan_enum?.nilai ?? String(d.bahan_baku?.satuan ?? "-"),
          qty: Number(d.jumlah),
          harga_satuan: Number(d.harga_satuan)
        }));
        const total_qty = detailRows.reduce((s, d) => s + d.qty, 0);
        const total = detailRows.reduce((s, d) => s + d.qty * d.harga_satuan, 0);
        const nama_bahan = detailRows.
        map((d) => d.merek && d.merek !== "-" ? `${d.merek} (${d.jenis_bahan})` : d.jenis_bahan).
        join(", ") || "-";
        const jtDays = daysUntil(p.jatuh_tempo);
        const jatuh_tempo_status =
        p.status_pembayaran === "Tempo" && p.jatuh_tempo ?
        jtDays <= 0 ? "Jatuh Tempo!" : jtDays <= TEMPO_NOTIF_DAYS ? `${jtDays} hari lagi` : null :
        null;
        return {
          id_pembelian: p.id_pembelian,
          no_pembelian: String(p.id_pembelian),
          tanggal: fmtDateTime(p.tanggal),
          tanggal_raw: p.tanggal,
          no_faktur: p.no_faktur ?? null,
          nama_bahan,
          supplier: p.supplier?.nama_supplier ?? "-",
          total_qty,
          total,
          status_pembayaran: p.status_pembayaran,
          jatuh_tempo: p.jatuh_tempo ?? null,
          jatuh_tempo_fmt: fmtDate(p.jatuh_tempo),
          jatuh_tempo_status,
          details: detailRows
        };
      });


      if (jenisBarang) out = out.filter((r) => r.details.some((d) => d.jenis_bahan === jenisBarang));

      if (search.trim()) {
        const sq = search.trim().toLowerCase();
        out = out.filter((r) =>
        r.no_pembelian.toLowerCase().includes(sq) ||
        (r.supplier ?? "").toLowerCase().includes(sq) ||
        r.details.some((d) =>
        (d.merek ?? "").toLowerCase().includes(sq) ||
        (d.jenis_bahan ?? "").toLowerCase().includes(sq))
        );
      }

      setRows(out);
    } catch (e) {setError(e.message);} finally
    {setLoading(false);}
  }, []);

  return { rows, supplierList, loading, error, fetch, fetchSupplier };
}






export function usePembelianTerbanyak() {
  const { enums } = useEnums();
  const [rows, setRows] = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const fetchRef = useCallback(async () => {
    const { data } = await supabase.
    from("supplier").select("id_supplier, nama_supplier, alamat, no_telp").order("nama_supplier");
    if (data) setSupplierList(data);
  }, []);


  const fetch = useCallback(async ({ peringkat = 5, namaJenisBahan = "", idSupplier = "", dari = "", sampai = "" } = {}) => {
    setLoading(true);setError(null);
    try {
      const [start, end] = isoRange(dari, sampai);

      let q = supabase.from("detail_pembelian_bahan").
      select(`
          id_bahan, merek, jumlah, harga_satuan,
          pembelian_bahan!inner(tanggal, id_supplier, supplier(nama_supplier)),
          bahan_baku(id_bahan, jenis_bahan, satuan, jenis_bahan_enum:enum_jenis_bahan!jenis_bahan(id,nilai))
        `).
      gte("pembelian_bahan.tanggal", start).
      lte("pembelian_bahan.tanggal", end);

      if (idSupplier) q = q.eq("pembelian_bahan.id_supplier", idSupplier);
      const { data, error: e } = await q;if (e) throw e;

      const map = {};

      const grandTotal = (data ?? []).reduce((s, d) => s + Number(d.jumlah) * Number(d.harga_satuan), 0);

      (data ?? []).forEach((d) => {
        const key = `${d.id_bahan}-${d.merek ?? ""}`;
        if (!map[key]) map[key] = {
          id_bahan: d.id_bahan,
          merek: d.merek ?? "-",
          jenis_bahan: d.bahan_baku?.jenis_bahan_enum?.nilai ?? String(d.bahan_baku?.jenis_bahan ?? "-"),
          satuan: d.bahan_baku?.satuan ?? "-",
          supplier: d.pembelian_bahan?.supplier?.nama_supplier ?? "-",
          jmlTx: 0, totalQty: 0, hargaTerakhir: Number(d.harga_satuan), totalNilai: 0
        };
        map[key].jmlTx += 1;
        map[key].totalQty += Number(d.jumlah);
        map[key].totalNilai += Number(d.jumlah) * Number(d.harga_satuan);
        if (Number(d.harga_satuan) > 0) map[key].hargaTerakhir = Number(d.harga_satuan);
      });

      let result = Object.values(map);
      if (namaJenisBahan) result = result.filter((r) => r.jenis_bahan === namaJenisBahan);

      setRows(
        result.
        sort((a, b) => b.totalQty - a.totalQty).
        slice(0, Number(peringkat)).
        map((r, i) => ({
          ...r,
          peringkat: i + 1,
          id_bahan_fmt: r.id_bahan,
          rataRata: r.jmlTx ? Math.round(r.totalQty / r.jmlTx) : 0,
          hargaTerakhir: r.hargaTerakhir,
          hargaTerakhir_fmt: fmtRp(r.hargaTerakhir),
          totalNilai: r.totalNilai,
          totalNilai_fmt: fmtRp(r.totalNilai),
          persen: grandTotal ? Math.round(r.totalNilai / grandTotal * 100) + "%" : "0%"
        }))
      );
    } catch (e) {setError(e.message);} finally
    {setLoading(false);}
  }, []);

  return {
    rows, supplierList, loading, error, fetch, fetchRef,

    jenisBahanList: sel.bahanJenis(enums).map((j) => ({ nama_jenis: j }))
  };
}





export function usePerubahanPembelian() {
  const [rows, setRows] = useState([]);
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const fetchUsers = useCallback(async () => {
    const { data } = await supabase.from("profiles").
    select("id, nama_lengkap, role").in("role", ["Admin", "Produksi"]).order("nama_lengkap");
    if (data) setUserList(data);
  }, []);


  const fetch = useCallback(async ({ field = "Semua", userId = "", dari = "", sampai = "", search = "" } = {}) => {
    setLoading(true);setError(null);
    try {
      let q = supabase.from("log_aktivitas").
      select("id_log, timestamp, id_user, aktivitas, modul, role_saat_itu, detail, detail_json, data_sebelum, data_sesudah, profile:profiles!id_user(nama_lengkap,role)").
      eq("aktivitas", "UPDATE").
      eq("modul", "pembelian_bahan").
      order("timestamp", { ascending: false }).limit(200);

      if (userId) q = q.eq("id_user", userId);
      if (dari) {
        const ds = new Date(`${dari}T00:00:00+07:00`);
        const de = sampai ?
        new Date(`${sampai}T23:59:59.999+07:00`) :
        new Date(`${dari}T23:59:59.999+07:00`);
        q = q.gte("timestamp", ds.toISOString()).lte("timestamp", de.toISOString());
      }

      const { data, error: e } = await q;if (e) throw e;


      const { data: sups } = await supabase.from("supplier").select("id_supplier, nama_supplier");
      const supplierMap = Object.fromEntries((sups ?? []).map((s) => [String(s.id_supplier), s.nama_supplier]));

      const SKIP = new Set(["id_pembelian", "id_user", "tanggal", "created_at", "updated_at", "total", "total_pembelian", "total_nilai", "total_harga"]);
      const LABEL = { status_pembayaran: "Status Pembayaran", id_supplier: "Supplier", jatuh_tempo: "Jatuh Tempo", no_faktur: "No. Faktur" };
      const fmtVal = (v) => v === null || v === undefined ? "-" : typeof v === "object" ? JSON.stringify(v) : String(v);

      const resolveVal = (k, v) => k === "id_supplier" ? supplierMap[String(v)] ?? fmtVal(v) : fmtVal(v);


      const diffRows = (sb, ss) => {
        if (!sb || !ss || typeof sb !== "object" || typeof ss !== "object") return null;
        return Object.keys({ ...sb, ...ss }).
        filter((k) => !SKIP.has(k) && String(sb[k] ?? "") !== String(ss[k] ?? "")).
        map((k) => ({ field: LABEL[k] ?? k, sebelum: resolveVal(k, sb[k]), sesudah: resolveVal(k, ss[k]) }));
      };

      let out = (data ?? []).filter((log) => log.profile?.role !== "Pelanggan" && log.profile?.role !== "Kasir").flatMap((log) => {
        const dj = log.detail_json ?? {};
        const sb = log.data_sebelum;
        const ss = log.data_sesudah;
        const ts = fmtDateTime(log.timestamp);
        const noPembelian = dj.no_pembelian ?? ss?.id_pembelian ?? sb?.id_pembelian ?? "-";
        const who = log.profile?.nama_lengkap ?? "-";
        const base = { id: log.id_log, tanggal: ts, tanggal_raw: log.timestamp, no_pembelian: String(noPembelian), diubah_oleh: who };

        if (!dj.field) {
          const diffs = diffRows(sb, ss);
          if (diffs && diffs.length > 0)
          return diffs.map((d, i) => ({ ...base, id: `${log.id_log}-${i}`, field: d.field, sebelum: d.sebelum, sesudah: d.sesudah }));
          return [];
        }

        return [{ ...base, field: dj.field ?? "-",
          sebelum: fmtVal(log.data_sebelum ?? dj.sebelum),
          sesudah: fmtVal(log.data_sesudah ?? dj.sesudah) }];
      }).filter((r) => !(r.sebelum === "-" && r.sesudah === "-"));

      if (field && field !== "Semua") out = out.filter((r) => r.field === field);
      if (search.trim()) out = out.filter((r) => r.no_pembelian.toLowerCase().includes(search.trim().toLowerCase()));

      setRows(out);
    } catch (e) {setError(e.message);} finally
    {setLoading(false);}
  }, []);

  return { rows, userList, loading, error, fetch, fetchUsers };
}