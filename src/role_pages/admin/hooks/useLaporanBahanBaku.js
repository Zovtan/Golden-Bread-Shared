import { useState, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { fmtDate, fmtDateTime } from "../../../shared/utils/format";
import { labelBahanPendek } from "../../../shared/utils/bahanLabel";
import { useEnums, sel } from "../../../shared/hooks/useEnums";
import { aggStatusStok } from "../../../shared/utils/batchUtils";






export function useOverviewBahan() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ habis: [], menipis: [], kadaluarsa: [], mendekati: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const fetch = useCallback(async ({ statusStok = "Semua", kadaluarsa = "Semua", jenisBahan = "Semua", search = "" } = {}) => {
    setLoading(true);setError(null);
    try {
      const { data, error: e } = await supabase.
      from("bahan_baku").
      select(`
          id_bahan, merek, jenis_bahan, satuan, stok_minimal,
          batas_peringatan_hari, status,
          jenis_bahan_enum:enum_jenis_bahan!jenis_bahan(id,nilai),
          satuan_enum:enum_satuan!satuan(id,nilai),
          batch_bahan_baku(
            id_batch_bb, stok, tgl_beli, kadaluarsa,
            status_stok, status_kadaluarsa,
            detail_pembelian_bahan(harga_satuan,
              pembelian_bahan(id_pembelian, supplier(nama_supplier)))
          )
        `).
      order("id_bahan");
      if (e) throw e;


      const processed = (data ?? []).map((b) => {
        const batches = (b.batch_bahan_baku ?? []).filter((b) => Number(b.stok) > 0).
        sort((a, x) => new Date(a.tgl_beli) - new Date(x.tgl_beli)).
        map((bt) => ({
          ...bt,
          harga_satuan: bt.detail_pembelian_bahan?.harga_satuan ?? null,
          supplier_nama: bt.detail_pembelian_bahan?.pembelian_bahan?.supplier?.nama_supplier ?? "-",
          no_pembelian: bt.detail_pembelian_bahan?.pembelian_bahan?.id_pembelian ?? "-"
        }));
        const totalStok = batches.filter((bt) => bt.status_stok !== "Kadaluarsa" && bt.status_kadaluarsa !== "Ya").reduce((s, bt) => s + Number(bt.stok), 0);
        const statusStokAgg = aggStatusStok(b.batch_bahan_baku ?? []);
        const sortedKdl = [...batches].filter((bt) => bt.kadaluarsa).sort((a, x) => new Date(a.kadaluarsa) - new Date(x.kadaluarsa));
        const kdlTerawal = sortedKdl[0]?.kadaluarsa ?? null;
        const kdlStatus = sortedKdl[0]?.status_kadaluarsa ?? "Tidak";
        const adaKdl = batches.some((bt) => bt.status_kadaluarsa === "Ya") ? "Ya" : batches.some((bt) => bt.status_kadaluarsa === "Mendekati") ? "Mendekati" : "Tidak";
        const tglMasukTerawal = batches[0]?.tgl_beli ?? null;
        const hargaAvg = batches.length ?
        batches.reduce((s, bt) => s + Number(bt.harga_satuan ?? 0), 0) / batches.length :
        0;
        return { ...b, jenis_bahan: b.jenis_bahan_enum?.nilai ?? String(b.jenis_bahan ?? "-"), satuan: b.satuan_enum?.nilai ?? String(b.satuan ?? "-"), batches, totalStok, statusStokAgg, kdlTerawal, kdlStatus, adaKdl, tglMasukTerawal, hargaAvg };
      });

      setStats({
        habis: processed.filter((p) => p.statusStokAgg === "Habis"),
        menipis: processed.filter((p) => p.statusStokAgg === "Menipis"),
        kadaluarsa: processed.filter((p) => p.kdlStatus === "Ya"),
        mendekati: processed.filter((p) => p.kdlStatus === "Mendekati")
      });

      let out = processed;
      if (statusStok !== "Semua") out = out.filter((b) => b.statusStokAgg === statusStok);
      if (kadaluarsa !== "Semua") out = out.filter((b) => {
        if (kadaluarsa === "Ya") return b.kdlStatus === "Ya";
        if (kadaluarsa === "Mendekati") return b.kdlStatus === "Mendekati";
        if (kadaluarsa === "Tidak") return b.kdlStatus === "Tidak";
        return true;
      });
      if (jenisBahan !== "Semua") out = out.filter((b) => b.jenis_bahan === jenisBahan);
      if (search.trim()) out = out.filter((b) => labelBahanPendek(b, "").toLowerCase().includes(search.toLowerCase()));
      setRows(out);
    } catch (e) {setError(e.message);} finally
    {setLoading(false);}
  }, []);

  return { rows, stats, loading, error, fetch };
}





export function useBahanBermasalah() {
  const { enums } = useEnums();
  const [rows, setRows] = useState([]);
  const [userList, setUserList] = useState([]);
  const [merekList, setMerekList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const fetchRef = useCallback(async () => {
    const [bb, us] = await Promise.all([
    supabase.from("bahan_baku").select("merek").eq("status", "Aktif"),
    supabase.from("profiles").select("id,nama_lengkap,role").in("role", ["Admin", "Produksi"]).order("nama_lengkap")]
    );
    if (bb.data) setMerekList([...new Set(bb.data.map((b) => b.merek).filter(Boolean))].sort());
    if (us.data) setUserList(us.data);
  }, []);


  const fetch = useCallback(async ({ merek = "", jenisBahan = "", dari = "", sampai = "", userId = "", jenisMasalah = "", namaMasalah = "", search = "" } = {}) => {
    setLoading(true);setError(null);
    try {
      let q = supabase.from("masalah_bahan_baku").
      select(`
          id_masalah, tanggal, jumlah, keterangan, stok_dikurangi, id_user,
          pencatat:profiles!id_user(nama_lengkap),
          nama_masalah,
          batch_bahan_baku(
            id_batch_bb, tgl_beli,
            bahan_baku(id_bahan, merek, jenis_bahan, satuan, jenis_bahan_enum:enum_jenis_bahan!jenis_bahan(nilai), satuan_enum:enum_satuan!satuan(nilai)),
            detail_pembelian_bahan(pembelian_bahan(id_pembelian))
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
        id_bahan: m.batch_bahan_baku?.bahan_baku?.id_bahan ?? "-",
        merek: m.batch_bahan_baku?.bahan_baku?.merek ?? "-",
        jenis_bahan: m.batch_bahan_baku?.bahan_baku?.jenis_bahan_enum?.nilai ?? String(m.batch_bahan_baku?.bahan_baku?.jenis_bahan ?? "-"),
        id_batch: m.batch_bahan_baku?.id_batch_bb ?? "-",
        tgl_masuk: fmtDate(m.batch_bahan_baku?.tgl_beli),
        jumlah: m.jumlah,
        satuan: m.batch_bahan_baku?.bahan_baku?.satuan_enum?.nilai ?? String(m.batch_bahan_baku?.bahan_baku?.satuan ?? "-"),
        jenis_masalah: m.nama_masalah ?? "-",
        keterangan: m.keterangan ?? "-",
        stok_dikurangi: m.stok_dikurangi ? `-${m.stok_dikurangi}` : "0",
        no_pembelian: m.batch_bahan_baku?.detail_pembelian_bahan?.pembelian_bahan?.id_pembelian ?? "-",
        dicatat_oleh: m.pencatat?.nama_lengkap ?? "-",
        id_user: m.id_user ?? null
      }));

      if (merek) out = out.filter((r) => r.merek === merek);
      if (jenisBahan) out = out.filter((r) => r.jenis_bahan === jenisBahan);
      const masalahFilter = jenisMasalah || namaMasalah;
      if (masalahFilter) out = out.filter((r) => r.jenis_masalah === masalahFilter);
      if (search.trim()) out = out.filter((r) =>
      r.merek.toLowerCase().includes(search.toLowerCase()) ||
      r.jenis_bahan.toLowerCase().includes(search.toLowerCase())
      );
      setRows(out);
    } catch (e) {setError(e.message);} finally
    {setLoading(false);}
  }, []);

  return {
    rows, userList, merekList, loading, error, fetch, fetchRef,

    jenisBahanList: sel.bahanJenis(enums),
    jenisMasalahList: sel.jenisMasalahBahan(enums)
  };
}





export function usePerubahanBahan() {
  const [rows, setRows] = useState([]);
  const [userList, setUserList] = useState([]);
  const [bahanList, setBahanList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const fetchRef = useCallback(async () => {
    const [u, b] = await Promise.all([
    supabase.from("profiles").select("id,nama_lengkap,role").in("role", ["Admin", "Produksi"]).order("nama_lengkap"),
    supabase.from("bahan_baku").select("id_bahan,merek,jenis_bahan,jenis_bahan_enum:enum_jenis_bahan!jenis_bahan(id,nilai)").order("id_bahan")]
    );
    if (u.data) setUserList(u.data);
    if (b.data) setBahanList(b.data.map((bh) => ({ ...bh, jenis_bahan: bh.jenis_bahan_enum?.nilai ?? String(bh.jenis_bahan ?? "") })));
  }, []);


  const fetch = useCallback(async ({ idBahan = "", field = "Semua", userId = "", dari = "", sampai = "", search = "" } = {}) => {
    setLoading(true);setError(null);
    try {
      let q = supabase.from("log_aktivitas").
      select("id_log, timestamp, aktivitas, modul, role_saat_itu, detail_json, data_sebelum, data_sesudah, profile:profiles!id_user(nama_lengkap)").
      in("aktivitas", ["CREATE", "UPDATE"]).
      in("modul", ["bahan_baku", "batch_bahan_baku", "Bahan Baku", "Pembelian Bahan", "Pemakaian Bahan"]).
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

      const SOURCE_MAP = { bahan_baku: "Edit Bahan", "Bahan Baku": "Edit Bahan", batch_bahan_baku: "Edit Batch", "Pembelian Bahan": "Pembelian", "Pemakaian Bahan": "Pemakaian" };
      const SKIP = new Set(["id_bahan", "updated_at", "created_at"]);
      const LABEL = { merek: "Merek", jenis_bahan: "Jenis Bahan", satuan: "Satuan", stok_minimal: "Stok Minimal",
        batas_peringatan_hari: "Batas Peringatan (hari)", deskripsi: "Deskripsi", status: "Status" };

      const fmtVal = (v) => v === null || v === undefined ? "-" : typeof v === "object" ? JSON.stringify(v) : String(v);


      const diffRows = (sb, ss) => {
        if (!sb || !ss || typeof sb !== "object" || typeof ss !== "object") return null;
        return Object.keys({ ...sb, ...ss }).
        filter((k) => !SKIP.has(k) && String(sb[k] ?? "") !== String(ss[k] ?? "")).
        map((k) => ({ field: LABEL[k] ?? k, sebelum: fmtVal(sb[k]), sesudah: fmtVal(ss[k]) }));
      };

      let out = (data ?? []).filter((log) => log.role_saat_itu !== "Kasir" && log.role_saat_itu !== "Pelanggan").flatMap((log) => {
        const dj = log.detail_json ?? {};
        const sb = log.data_sebelum;
        const ss = log.data_sesudah;
        const src = SOURCE_MAP[log.modul] ?? log.modul;
        const who = log.profile?.nama_lengkap ?? "-";
        const ts = fmtDateTime(log.timestamp);

        const idBahanVal = dj.id_bahan ?? ss?.id_bahan ?? sb?.id_bahan ?? "-";
        const nama = dj.nama_bahan ?? dj.merek ?? ss?.merek ?? sb?.merek ?? "-";
        const satuan = dj.satuan ?? ss?.satuan ?? sb?.satuan ?? "-";
        const batchInfo = dj.batch_ke ? `Batch #${dj.batch_ke}` : dj.id_batch_bb ? `ID ${dj.id_batch_bb}` : "-";
        const no_ref = dj.no_pembelian ?? batchInfo;

        const base = { id: log.id_log, tanggal: ts, tanggal_raw: log.timestamp, bahan: nama, satuan: String(satuan),
          no_ref: String(no_ref), id_ref: String(idBahanVal), sumber: src, diubah_oleh: who };


        if (!dj.field && log.aktivitas === "UPDATE" && log.modul === "bahan_baku") return [];
        if (!dj.field) {
          const diffs = diffRows(sb, ss);
          if (diffs && diffs.length > 0)
          return diffs.map((d, i) => ({ ...base, id: `${log.id_log}-${i}`, field: d.field, sebelum: d.sebelum, sesudah: d.sesudah }));
          if (log.aktivitas === "CREATE")
          return [{ ...base, field: "Bahan Baru", sebelum: "-", sesudah: nama }];
          return [];
        }
        return [{ ...base, field: dj.field ?? "-",
          sebelum: fmtVal(log.data_sebelum ?? dj.sebelum),
          sesudah: fmtVal(log.data_sesudah ?? dj.sesudah) }];
      }).filter((r) => !(r.sebelum === "-" && r.sesudah === "-"));

      if (idBahan) out = out.filter((r) => r.bahan.toLowerCase().includes(String(idBahan)));
      if (field !== "Semua") out = out.filter((r) => r.field === field);
      if (search.trim()) {
        const sq = search.toLowerCase();
        out = out.filter((r) =>
        r.bahan.toLowerCase().includes(sq) ||
        r.no_ref.toLowerCase().includes(sq) ||
        r.sumber.toLowerCase().includes(sq)
        );
      }
      setRows(out);
    } catch (e) {setError(e.message);} finally
    {setLoading(false);}
  }, []);

  return { rows, userList, bahanList, loading, error, fetch, fetchRef };
}





export function usePemakaianBahan() {
  const [rows, setRows] = useState([]);
  const [userList, setUserList] = useState([]);
  const [bahanList, setBahanList] = useState([]);
  const [stats, setStats] = useState({ totalPemakaian: 0, totalItem: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const fetchRef = useCallback(async () => {
    const [u, b] = await Promise.all([
    supabase.from("profiles").select("id,nama_lengkap,role").in("role", ["Admin", "Produksi"]).order("nama_lengkap"),
    supabase.from("bahan_baku").select("id_bahan,merek,jenis_bahan,satuan,jenis_bahan_enum:enum_jenis_bahan!jenis_bahan(id,nilai)").order("id_bahan")]
    );
    if (u.data) setUserList(u.data);
    if (b.data) setBahanList(b.data.map((bh) => ({ ...bh, jenis_bahan: bh.jenis_bahan_enum?.nilai ?? String(bh.jenis_bahan ?? "") })));
  }, []);


  const fetch = useCallback(async ({ userId = "", idBahan = "", jenisBahan = "", dari = "", sampai = "", search = "" } = {}) => {
    setLoading(true);setError(null);
    try {
      let q = supabase.
      from("pemakaian_bahan").
      select(`
          id_pemakaian, waktu, jumlah, id_user,
          pencatat:profiles!id_user(nama_lengkap, role),
          batch_bahan_baku(
            id_batch_bb, id_bahan,
            bahan_baku(merek, jenis_bahan, satuan, jenis_bahan_enum:enum_jenis_bahan!jenis_bahan(id,nilai), satuan_enum:enum_satuan!satuan(id,nilai))
          )
        `).
      order("waktu", { ascending: false }).
      limit(500);

      if (userId) q = q.eq("id_user", userId);
      if (dari || sampai) {
        const ds = dari ? new Date(`${dari}T00:00:00+07:00`) : null;
        const de = sampai ? new Date(`${sampai}T23:59:59.999+07:00`) : null;
        if (ds) q = q.gte("waktu", ds.toISOString());
        if (de) q = q.lte("waktu", de.toISOString());
      }

      const { data, error: e } = await q;
      if (e) throw e;


      let out = (data ?? []).map((d) => {
        const bahan = d.batch_bahan_baku?.bahan_baku;
        const jenisBahanLabel = bahan?.jenis_bahan_enum?.nilai ?? String(bahan?.jenis_bahan ?? "-");
        const satuanLabel = bahan?.satuan_enum?.nilai ?? String(bahan?.satuan ?? "-");
        const namaBahan = bahan?.merek ?
        `${bahan.merek} (${jenisBahanLabel})` :
        jenisBahanLabel;
        return {
          id_pemakaian: d.id_pemakaian,
          waktu: fmtDate(d.waktu),
          waktu_raw: new Date(d.waktu),
          pencatat: d.pencatat?.nama_lengkap ?? "-",
          role: d.pencatat?.role ?? "-",
          id_bahan: d.batch_bahan_baku?.id_bahan,
          jenis_bahan_label: jenisBahanLabel,
          nama_bahan: namaBahan,
          satuan: satuanLabel,
          jumlah: Number(d.jumlah),
          id_batch_bb: d.batch_bahan_baku?.id_batch_bb ?? "-"
        };
      });

      if (idBahan) out = out.filter((r) => String(r.id_bahan) === idBahan);
      if (jenisBahan) out = out.filter((r) => r.jenis_bahan_label === jenisBahan);
      if (search.trim()) {
        const sq = search.trim().toLowerCase();
        out = out.filter((r) =>
        r.nama_bahan.toLowerCase().includes(sq) ||
        r.pencatat.toLowerCase().includes(sq) ||
        String(r.id_pemakaian).includes(sq)
        );
      }

      setStats({
        totalPemakaian: out.length,
        totalItem: out.reduce((s, r) => s + r.jumlah, 0)
      });
      setRows(out);
    } catch (e) {setError(e.message);} finally
    {setLoading(false);}
  }, []);

  return { rows, userList, bahanList, stats, loading, error, fetch, fetchRef };
}