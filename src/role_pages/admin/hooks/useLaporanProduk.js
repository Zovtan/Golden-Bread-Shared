import { useState, useCallback } from "react";
import { fetchEnumKategoriProduk } from "../../../shared/hooks/useEnums";
import { supabase } from "../../../lib/supabase";
import { fmtDate, fmtDateTime } from "../../../shared/utils/format";
import { aggStatusStok } from "../../../shared/utils/batchUtils";





export function useOverviewProduk() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ habis: [], menipis: [], kadaluarsa: [], mendekati: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const fetch = useCallback(async ({ statusStok = "Semua", kadaluarsa = "Semua", kategori = "Semua", search = "" } = {}) => {
    setLoading(true);setError(null);
    try {
      const { data, error: e } = await supabase.
      from("produk").
      select(`
          id_produk, nama_produk, kategori_produk, harga_satuan, status,
          gambar, stok_minimal, batas_peringatan_hari, estimasi_kadaluarsa_hari,
          kategori_enum:enum_kategori_produk!kategori_produk(id,nilai),
          batch_produk(id_batch, stok, kadaluarsa, status_stok, status_kadaluarsa, produksi(waktu))
        `).
      order("id_produk");
      if (e) throw e;



      const processed = (data ?? []).map((p) => {
        const batches = (p.batch_produk ?? []).map((b) => ({ ...b, tgl_produksi: b.produksi?.waktu ?? null })).
        filter((b) => Number(b.stok) > 0).sort((a, b) => new Date(a.tgl_produksi) - new Date(b.tgl_produksi));
        const totalStok = batches.filter((b) => b.status_stok !== "Kadaluarsa" && b.status_kadaluarsa !== "Ya").reduce((s, b) => s + Number(b.stok), 0);
        const statusStokAgg = aggStatusStok(p.batch_produk ?? []);
        const sortedKdl = [...batches].filter((b) => b.kadaluarsa).sort((a, b) => new Date(a.kadaluarsa) - new Date(b.kadaluarsa));
        const kdlTerawal = sortedKdl[0]?.kadaluarsa ?? null;
        const adaKdl = batches.some((b) => b.status_kadaluarsa === "Ya") ? "Ya" : batches.some((b) => b.status_kadaluarsa === "Mendekati") ? "Mendekati" : "Tidak";
        const kdlStatus = sortedKdl[0]?.status_kadaluarsa ?? "Tidak";
        const tglProdTerawal = batches[0]?.tgl_produksi ?? null;
        const kategoriLabel = p.kategori_enum?.nilai ?? p.kategori_produk_enum?.nilai ?? String(p.kategori_produk ?? "-");
        return { ...p, kategori_produk: kategoriLabel, batches, totalStok, statusStokAgg, kdlTerawal, kdlStatus, adaKdl, tglProdTerawal };
      });

      setStats({
        habis: processed.filter((p) => p.statusStokAgg === "Habis"),
        menipis: processed.filter((p) => p.statusStokAgg === "Menipis"),
        kadaluarsa: processed.filter((p) => p.kdlStatus === "Ya"),
        mendekati: processed.filter((p) => p.kdlStatus === "Mendekati")
      });

      let out = processed;
      if (statusStok !== "Semua") out = out.filter((p) => p.statusStokAgg === statusStok);
      if (kadaluarsa !== "Semua") out = out.filter((p) => {
        if (kadaluarsa === "Ya") return p.kdlStatus === "Ya";
        if (kadaluarsa === "Mendekati") return p.kdlStatus === "Mendekati";
        if (kadaluarsa === "Tidak") return p.kdlStatus === "Tidak";
        return true;
      });
      if (kategori !== "Semua") out = out.filter((p) => p.kategori_produk === kategori);
      if (search.trim()) out = out.filter((p) => (p.nama_produk ?? "").toLowerCase().includes(search.toLowerCase()));
      setRows(out);
    } catch (e) {setError(e.message);} finally
    {setLoading(false);}
  }, []);

  return { rows, stats, loading, error, fetch };
}





export function useProdukBermasalah() {
  const [rows, setRows] = useState([]);
  const [produkList, setProdukList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const fetchRef = useCallback(async () => {
    const [pr, st] = await Promise.all([
    supabase.from("produk").select("id_produk,nama_produk,kategori_enum:enum_kategori_produk!kategori_produk(nilai)").eq("status", "Aktif").order("nama_produk"),
    supabase.from("profiles").select("id,nama_lengkap,role").in("role", ["Admin", "Kasir"]).order("nama_lengkap")]
    );
    if (pr.data) setProdukList(pr.data);
    if (st.data) setStaffList(st.data);
  }, []);


  const fetch = useCallback(async ({ idProduk = "", jenisMasalah = "", userId = "", dari = "", sampai = "", search = "" } = {}) => {
    setLoading(true);setError(null);
    try {
      let q = supabase.from("masalah_produk").
      select(`
          id_masalah, tanggal, jumlah, keterangan, stok_dikurangi, id_user,
          pencatat:profiles!id_user(nama_lengkap),
          nama_masalah,
          batch_produk(id_batch, id_produk, produksi(waktu),
            produk(id_produk, nama_produk)
          )
        `).
      order("tanggal", { ascending: false }).limit(300);

      if (dari) {
        const ds = new Date(`${dari}T00:00:00+07:00`);
        const de = sampai ?
        new Date(`${sampai}T23:59:59.999+07:00`) :
        new Date(`${dari}T23:59:59.999+07:00`);
        q = q.gte("tanggal", ds.toISOString()).lte("tanggal", de.toISOString());
      }
      if (userId) q = q.eq("id_user", userId);
      const { data, error: e } = await q;if (e) throw e;

      let out = (data ?? []).map((m) => ({
        tanggal: fmtDateTime(m.tanggal),
        id_produk: m.batch_produk?.produk?.id_produk ?? "-",
        nama_produk: m.batch_produk?.produk?.nama_produk ?? "-",
        id_batch: m.batch_produk?.id_batch ?? "-",
        tgl_produksi: fmtDate(m.batch_produk?.produksi?.waktu),
        jumlah: m.jumlah,
        jenis_masalah: m.nama_masalah ?? "-",
        keterangan: m.keterangan ?? "-",
        stok_dikurangi: m.stok_dikurangi ? `-${m.stok_dikurangi}` : "0",
        dicatat_oleh: m.pencatat?.nama_lengkap ?? "-"
      }));

      if (idProduk) out = out.filter((r) => String(r.id_produk) === String(idProduk));
      if (jenisMasalah) out = out.filter((r) => r.jenis_masalah === jenisMasalah);
      if (search.trim()) out = out.filter((r) => r.nama_produk.toLowerCase().includes(search.toLowerCase()));
      setRows(out);
    } catch (e) {setError(e.message);} finally
    {setLoading(false);}
  }, []);

  return { rows, produkList, staffList, loading, error, fetch, fetchRef };
}





export function usePerubahanProduk() {
  const [rows, setRows] = useState([]);
  const [userList, setUserList] = useState([]);
  const [produkList, setProdukList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const fetchRef = useCallback(async () => {
    const [u, p] = await Promise.all([
    supabase.from("profiles").select("id,nama_lengkap,role").in("role", ["Admin", "Kasir"]).order("nama_lengkap"),
    supabase.from("produk").select("id_produk,nama_produk,kategori_enum:enum_kategori_produk!kategori_produk(nilai)").order("nama_produk")]
    );
    if (u.data) setUserList(u.data);
    if (p.data) setProdukList(p.data);
  }, []);


  const fetch = useCallback(async ({ idProduk = "", field = "Semua", userId = "", dari = "", sampai = "", search = "" } = {}) => {
    setLoading(true);setError(null);
    try {
      let q = supabase.from("log_aktivitas").
      select("id_log, timestamp, aktivitas, modul, role_saat_itu, detail_json, data_sebelum, data_sesudah, profile:profiles!id_user(nama_lengkap,role)").
      in("aktivitas", ["CREATE", "UPDATE"]).
      in("modul", ["produk", "batch_produk", "Produk", "Penjualan Toko", "Hasil Produksi"]).
      order("timestamp", { ascending: false }).limit(500);
      if (userId) q = q.eq("id_user", userId);
      if (dari) {
        const ds = new Date(`${dari}T00:00:00+07:00`);
        const de = sampai ?
        new Date(`${sampai}T23:59:59.999+07:00`) :
        new Date(`${dari}T23:59:59.999+07:00`);
        q = q.gte("timestamp", ds.toISOString()).lte("timestamp", de.toISOString());
      }
      const { data, error: e } = await q;if (e) throw e;

      const SOURCE_MAP = { produk: "Edit Produk", "Produk": "Edit Produk", batch_produk: "Edit Batch", "Penjualan Toko": "Penjualan", "Hasil Produksi": "Produksi" };
      const SKIP = new Set(["id_produk", "updated_at", "created_at", "gambar", "jenis_pembayaran", "id_user", "id_penjualan"]);
      const LABEL = { nama_produk: "Nama Produk", harga_satuan: "Harga Satuan", kategori_produk: "Kategori",
        stok_minimal: "Stok Minimal", status: "Status", estimasi_kadaluarsa_hari: "Est. Kadaluarsa (hari)",
        batas_peringatan_hari: "Batas Peringatan (hari)", deskripsi: "Deskripsi", resep: "Resep" };
      const fmtVal = (v) => v === null || v === undefined ? "-" : typeof v === "object" ? JSON.stringify(v) : String(v);


      const diffRows = (sb, ss) => {
        if (!sb || !ss || typeof sb !== "object" || typeof ss !== "object") return null;
        return Object.keys({ ...sb, ...ss }).
        filter((k) => !SKIP.has(k) && String(sb[k] ?? "") !== String(ss[k] ?? "")).
        map((k) => ({ field: LABEL[k] ?? k, sebelum: fmtVal(sb[k]), sesudah: fmtVal(ss[k]) }));
      };

      let out = (data ?? []).filter((log) => log.profile?.role !== "Pelanggan" && log.profile?.role !== "Produksi").flatMap((log) => {
        const dj = log.detail_json ?? {};
        const sb = log.data_sebelum;
        const ss = log.data_sesudah;
        const src = SOURCE_MAP[log.modul] ?? log.modul;
        const who = log.profile?.nama_lengkap ?? "-";
        const ts = fmtDateTime(log.timestamp);
        const idProdukVal = dj.id_produk ?? ss?.id_produk ?? sb?.id_produk ?? "-";
        const nama = dj.nama_produk ?? ss?.nama_produk ?? sb?.nama_produk ?? String(idProdukVal);
        const batchInfo = dj.batch_ke ? `Batch #${dj.batch_ke}` : dj.id_batch ? `ID ${dj.id_batch}` : "-";
        const no_ref = dj.no_pesanan ?? dj.no_produksi ?? batchInfo;
        const base = { id: log.id_log, tanggal: ts, tanggal_raw: log.timestamp, produk: nama, no_ref: String(no_ref), id_ref: String(idProdukVal), sumber: src, diubah_oleh: who };
        if (!dj.field && log.aktivitas === "UPDATE" && log.modul === "produk") return [];
        if (!dj.field) {
          const diffs = diffRows(sb, ss);
          if (diffs && diffs.length > 0)
          return diffs.map((d, i) => ({ ...base, id: `${log.id_log}-${i}`, field: d.field, sebelum: d.sebelum, sesudah: d.sesudah }));
          if (log.aktivitas === "CREATE")
          return [{ ...base, field: "Produk Baru", sebelum: "-", sesudah: nama }];
          return [];
        }
        return [{ ...base, field: dj.field ?? "-",
          sebelum: fmtVal(log.data_sebelum ?? dj.sebelum),
          sesudah: fmtVal(log.data_sesudah ?? dj.sesudah) }];
      }).filter((r) => !(r.sebelum === "-" && r.sesudah === "-"));

      if (idProduk) out = out.filter((r) => r.produk.toLowerCase().includes(String(idProduk)));
      if (field !== "Semua") out = out.filter((r) => r.field === field);
      if (search.trim()) {
        const sq = search.toLowerCase();
        out = out.filter((r) => r.produk.toLowerCase().includes(sq) || r.no_ref.toLowerCase().includes(sq) || r.sumber.toLowerCase().includes(sq));
      }
      setRows(out);
    } catch (e) {setError(e.message);} finally
    {setLoading(false);}
  }, []);

  return { rows, userList, produkList, loading, error, fetch, fetchRef };
}





export function useHasilProduksi() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ totalSesi: 0, totalBatch: 0, totalQty: 0, produkTerbanyak: "-" });
  const [produkList, setProdukList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);




  const fetchRef = useCallback(async () => {
    const [{ data: produk }, { data: staff }, kategori] = await Promise.all([
    supabase.from("produk").select("id_produk,nama_produk,kategori_enum:enum_kategori_produk!kategori_produk(id,nilai)").eq("status", "Aktif").order("nama_produk"),
    supabase.from("profiles").select("id,nama_lengkap,role").in("role", ["Admin", "Produksi"]).order("nama_lengkap"),
    fetchEnumKategoriProduk()]
    );
    if (produk) setProdukList(produk);
    if (staff) setStaffList(staff);
    if (kategori) setKategoriList(kategori);
  }, []);


  const fetch = useCallback(async ({ idProduk = "", idKategori = "", userId = "", dari = "", sampai = "", search = "" } = {}) => {
    setLoading(true);setError(null);
    try {
      let q = supabase.
      from("produksi").
      select(`
          id_produksi, waktu, id_user,
          pencatat:profiles!id_user(nama_lengkap),
          batch_produk(
            id_batch, jumlah_awal, kadaluarsa, status_stok, stok,
            produk(id_produk, nama_produk, kategori_produk, harga_satuan,
              kategori_enum:enum_kategori_produk!kategori_produk(id,nilai))
          )
        `).
      order("waktu", { ascending: false }).
      limit(500);

      if (dari) {
        const d = new Date(`${dari}T00:00:00+07:00`);
        q = q.gte("waktu", d.toISOString());
      }
      if (sampai) {
        const d = new Date(`${sampai}T23:59:59.999+07:00`);
        q = q.lte("waktu", d.toISOString());
      }

      const { data, error: e } = await q;if (e) throw e;


      let out = (data ?? []).flatMap((sesi) =>
      (sesi.batch_produk ?? []).map((batch) => {
        const produk = batch.produk ?? {};
        return {
          id_produksi: sesi.id_produksi,
          waktu: fmtDateTime(sesi.waktu),
          waktu_raw: sesi.waktu,
          dicatat_oleh: sesi.pencatat?.nama_lengkap ?? "-",
          dicatat_oleh_id: sesi.id_user ?? null,
          id_produk: produk.id_produk ?? "-",
          nama_produk: produk.nama_produk ?? "-",
          kategori: produk.kategori_enum?.nilai ?? String(produk.kategori_produk ?? "-"),
          kategori_id: produk.kategori_produk ?? null,
          harga_satuan: produk.harga_satuan ?? 0,
          id_batch: batch.id_batch ?? "-",
          kadaluarsa: fmtDate(batch.kadaluarsa),
          status_stok: batch.status_stok ?? "-",
          stok_saat_ini: batch.stok ?? 0,
          jumlah: batch.jumlah_awal ?? 0,
          nilai: Number(produk.harga_satuan ?? 0) * Number(batch.jumlah_awal ?? 0)
        };
      })
      );


      if (idProduk) out = out.filter((r) => String(r.id_produk) === String(idProduk));
      if (idKategori) out = out.filter((r) => String(r.kategori_id) === String(idKategori));
      if (userId) out = out.filter((r) => r.dicatat_oleh_id && String(r.dicatat_oleh_id) === String(userId));
      if (search.trim()) {
        const q2 = search.toLowerCase();
        out = out.filter((r) =>
        r.nama_produk.toLowerCase().includes(q2) ||
        String(r.id_produksi).includes(q2) ||
        r.dicatat_oleh.toLowerCase().includes(q2)
        );
      }


      const totalSesi = new Set(out.map((r) => r.id_produksi)).size;
      const totalBatch = new Set(out.map((r) => r.id_batch)).size;
      const totalQty = out.reduce((s, r) => s + Number(r.jumlah), 0);
      const qtyByProd = out.reduce((acc, r) => {
        acc[r.nama_produk] = (acc[r.nama_produk] ?? 0) + Number(r.jumlah);
        return acc;
      }, {});
      const produkTerbanyak = Object.entries(qtyByProd).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

      setStats({ totalSesi, totalBatch, totalQty, produkTerbanyak });
      setRows(out);
    } catch (e) {setError(e.message);} finally
    {setLoading(false);}
  }, []);

  return { rows, stats, produkList, staffList, kategoriList, loading, error, fetch, fetchRef };
}