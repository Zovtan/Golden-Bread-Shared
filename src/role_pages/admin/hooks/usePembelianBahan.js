import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { getFreshSession } from "../../../shared/utils/authToken";
import { useRealtimeRefresh } from "../../../shared/hooks/useRealtimeRefresh";
import { useEnums, sel } from "../../../shared/hooks/useEnums";
import { asUTC, fmtDate, fmtDateTime, fmtRp, todayWIB, toWIBDate } from "../../../shared/utils/format";
import { computeStatusStok, computeStatusKdl } from "../../../shared/utils/batchUtils";

const WATCHED = ["pembelian_bahan", "detail_pembelian_bahan", "batch_bahan_baku"];
const TEMPO_NOTIF_DAYS = 3;

function daysUntil(iso) {
  if (!iso) return null;

  const target = new Date(`${iso.slice(0, 10)}T00:00:00+07:00`);
  const todayMs = new Date(`${todayWIB()}T00:00:00+07:00`);
  return Math.floor((target - todayMs) / 86_400_000);
}



export function usePembelianBahan(search = "") {
  const [list, setList] = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [bahanList, setBahanList] = useState([]);
  const [stats, setStats] = useState({ nilaiHariIni: 0, tagihan: 0, jumlahHariIni: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("Semua Status");
  const [appliedTanggal, setAppliedTanggal] = useState("");

  const { enums } = useEnums();
  const fetchToken = useRef(0);
  const submittingRef = useRef(false);

  useEffect(() => {
    Promise.all([
    supabase.from("supplier").select("id_supplier,nama_supplier,no_telp,alamat").order("nama_supplier"),
    supabase.from("bahan_baku").select("id_bahan,merek,jenis_bahan,satuan,stok_minimal,batas_peringatan_hari,jenis_bahan_enum:enum_jenis_bahan!jenis_bahan(id,nilai),satuan_enum:enum_satuan!satuan(id,nilai)").eq("status", "Aktif").order("id_bahan")]
    ).then(([s, b]) => {
      if (s.data) setSupplierList(s.data);
      if (b.data) setBahanList(b.data.map((bh) => ({ ...bh, jenis_bahan: bh.jenis_bahan_enum?.nilai ?? String(bh.jenis_bahan ?? ""), satuan: bh.satuan_enum?.nilai ?? String(bh.satuan ?? "") })));
    });
  }, []);


  const fetchAll = useCallback(async (bg = false) => {
    if (!bg) setLoading(true);
    setError(null);
    const token = ++fetchToken.current;
    try {
      const { data, error: e } = await supabase.
      from("pembelian_bahan").
      select(`
          id_pembelian, tanggal, status_pembayaran, jatuh_tempo, no_faktur,
          supplier(id_supplier, nama_supplier, alamat, no_telp),
          pencatat:profiles!id_user(nama_lengkap),
          detail_pembelian_bahan(
            id_bahan, merek, jumlah, harga_satuan, kadaluarsa,
            bahan_baku(id_bahan, jenis_bahan, satuan, stok_minimal, batas_peringatan_hari,
              jenis_bahan_enum:enum_jenis_bahan!jenis_bahan(id,nilai),
              satuan_enum:enum_satuan!satuan(id,nilai))
          )
        `).
      order("tanggal", { ascending: false }).
      limit(300);
      if (e) throw e;
      if (fetchToken.current !== token) return;

      const today = new Date(`${todayWIB()}T00:00:00+07:00`);
      let nilaiHariIni = 0,tagihan = 0,jumlahHariIni = 0;


      const processed = (data ?? []).map((p) => {
        const details = p.detail_pembelian_bahan ?? [];
        const totalNilai = details.reduce((s, d) => s + Number(d.jumlah) * Number(d.harga_satuan), 0);
        const totalQty = details.reduce((s, d) => s + Number(d.jumlah), 0);
        const isToday = new Date(asUTC(p.tanggal)) >= today;
        if (isToday) {nilaiHariIni += totalNilai;jumlahHariIni++;}
        if (p.status_pembayaran !== "Lunas") tagihan++;

        const jtDays = daysUntil(p.jatuh_tempo);
        const jatuhTempoStatus =
        p.status_pembayaran === "Tempo" && p.jatuh_tempo ?
        jtDays <= 0 ? "Jatuh Tempo!" : jtDays <= TEMPO_NOTIF_DAYS ? `${jtDays} hari lagi` : null :
        null;


        const detailRows = details.map((d) => ({
          id_bahan: d.id_bahan,
          merek: d.merek ?? "-",
          jenis_bahan: d.bahan_baku?.jenis_bahan_enum?.nilai ?? String(d.bahan_baku?.jenis_bahan ?? "-"),
          satuan: d.bahan_baku?.satuan_enum?.nilai ?? String(d.bahan_baku?.satuan ?? "-"),
          qty: Number(d.jumlah),
          harga_satuan: Number(d.harga_satuan),
          kadaluarsa: d.kadaluarsa,
          _rawDetail: d
        }));


        const nama_bahan = detailRows.map((d) =>
        d.merek ? `${d.merek} (${d.jenis_bahan})` : d.jenis_bahan
        ).join(", ");

        return {
          id_pembelian: p.id_pembelian,
          tanggal: fmtDateTime(p.tanggal),
          tanggal_raw: p.tanggal,
          no_faktur: p.no_faktur ?? null,
          nama_bahan,
          supplier: p.supplier?.nama_supplier ?? "-",
          supplier_alamat: p.supplier?.alamat ?? "-",
          supplier_telp: p.supplier?.no_telp ?? "-",
          total_qty: totalQty,
          total: totalNilai,
          status_pembayaran: p.status_pembayaran,
          jatuh_tempo: p.jatuh_tempo ?? null,
          jatuh_tempo_fmt: fmtDate(p.jatuh_tempo),
          jatuh_tempo_status: jatuhTempoStatus,
          id_supplier: p.supplier?.id_supplier,
          pencatat: p.pencatat?.nama_lengkap ?? "-",
          details: detailRows,
          _rawPembelian: p
        };
      });

      setStats({ nilaiHariIni, tagihan, jumlahHariIni });
      setList(processed);
      setLastUpdated(new Date());
    } catch (e) {if (fetchToken.current === token) setError(e.message);} finally
    {if (fetchToken.current === token) setLoading(false);}
  }, []);

  useEffect(() => {
    fetchAll(false);
    return () => {fetchToken.current++;};
  }, [fetchAll]);

  useRealtimeRefresh("pembelian-bahan", WATCHED, useCallback(() => fetchAll(true), [fetchAll]));


  const filteredList = list.filter((r) => {
    if (appliedStatus !== "Semua Status" && r.status_pembayaran !== appliedStatus) return false;
    if (appliedTanggal) {
      if (toWIBDate(r.tanggal_raw) !== appliedTanggal) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!String(r.id_pembelian).includes(q) &&
      !(r.nama_bahan ?? "").toLowerCase().includes(q) &&
      !(r.supplier ?? "").toLowerCase().includes(q) &&
      !(r.status_pembayaran ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  });



  async function tambahPembelian(payload) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const session = await getFreshSession();
      const user = session?.user;
      if (!user) throw new Error("Tidak terautentikasi.");


      let id_supplier = payload.id_supplier ? Number(payload.id_supplier) : null;
      if (payload.newSupplier) {
        const { data: ns, error: nsErr } = await supabase.from("supplier").insert({
          nama_supplier: payload.newSupplier.nama_supplier.trim(),
          no_telp: payload.newSupplier.no_telp?.trim() || null,
          alamat: payload.newSupplier.alamat?.trim() || null
        }).select("id_supplier").single();
        if (nsErr) throw nsErr;
        id_supplier = ns.id_supplier;
        setSupplierList((prev) => [...prev, {
          id_supplier, nama_supplier: payload.newSupplier.nama_supplier
        }]);
      }


      const { data: pembelian, error: pErr } = await supabase.from("pembelian_bahan").insert({
        id_user: user.id,
        id_supplier,
        no_faktur: payload.no_faktur ?? null,
        tanggal: new Date().toISOString(),
        status_pembayaran: payload.status_pembayaran,
        jatuh_tempo: payload.status_pembayaran === "Tempo" ? payload.jatuh_tempo || null : null
      }).select("id_pembelian").single();
      if (pErr) {
        if (payload.newSupplier && id_supplier)
        await supabase.from("supplier").delete().eq("id_supplier", id_supplier);
        throw pErr;
      }


      const createdBahan = [];
      const createdBatch = [];
      try {
        for (const item of payload.items) {
          let finalIdBahan = item.id_bahan ? Number(item.id_bahan) : null;

          if (item.newMerek) {
            const nm = item.newMerek;
            const { data: baru, error: bErr } = await supabase.from("bahan_baku").insert({
              jenis_bahan: item.jenis_bahan,
              merek: (item.merek || nm.merek || "").trim(),
              satuan: nm.satuan,
              stok_minimal: Number(nm.stok_minimal) || 1,
              batas_peringatan_hari: Number(nm.batas_peringatan_hari) || 7,
              status: "Aktif"
            }).select("id_bahan").single();
            if (bErr) throw bErr;
            finalIdBahan = baru.id_bahan;
            createdBahan.push(finalIdBahan);
            setBahanList((prev) => [...prev, {
              id_bahan: finalIdBahan, merek: (item.merek || nm.merek || "").trim(),
              jenis_bahan: item.jenis_bahan, satuan: nm.satuan,
              stok_minimal: Number(nm.stok_minimal) || 1,
              batas_peringatan_hari: Number(nm.batas_peringatan_hari) || 7
            }]);
          }

          const jumlah = Number(item.jumlah);
          const harga = Number(item.harga_satuan);
          const bahan = bahanList.find((b) => b.id_bahan === finalIdBahan);

          const { error: dErr } = await supabase.from("detail_pembelian_bahan").insert({
            id_pembelian: pembelian.id_pembelian,
            id_bahan: finalIdBahan,
            merek: item.merek || null,
            jumlah, harga_satuan: harga,
            kadaluarsa: item.kadaluarsa || null
          });
          if (dErr) throw dErr;

          const { data: bt, error: btErr } = await supabase.from("batch_bahan_baku").insert({
            id_bahan: finalIdBahan,
            id_pembelian: pembelian.id_pembelian,
            stok: jumlah,
            tgl_beli: todayWIB(),
            kadaluarsa: item.kadaluarsa || null,
            status_kadaluarsa: computeStatusKdl(item.kadaluarsa, bahan?.batas_peringatan_hari ?? 7),
            status_stok: computeStatusStok(jumlah, bahan?.stok_minimal ?? 0)
          }).select("id_batch_bb").single();
          if (btErr) throw btErr;
          createdBatch.push(bt.id_batch_bb);
        }
      } catch (itemErr) {

        if (createdBatch.length) await supabase.from("batch_bahan_baku").delete().in("id_batch_bb", createdBatch);
        await supabase.from("detail_pembelian_bahan").delete().eq("id_pembelian", pembelian.id_pembelian);
        await supabase.from("pembelian_bahan").delete().eq("id_pembelian", pembelian.id_pembelian);
        if (createdBahan.length) await supabase.from("bahan_baku").delete().in("id_bahan", createdBahan);
        if (payload.newSupplier && id_supplier)
        await supabase.from("supplier").delete().eq("id_supplier", id_supplier);
        throw itemErr;
      }


      await fetchAll(true);
    } finally {submittingRef.current = false;}
  }



  async function editPembelian(payload) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const { error: pErr } = await supabase.from("pembelian_bahan").update({
        id_supplier: payload.id_supplier ? Number(payload.id_supplier) : null,
        no_faktur: payload.no_faktur ?? null,
        status_pembayaran: payload.status_pembayaran,
        jatuh_tempo: payload.status_pembayaran === "Tempo" ? payload.jatuh_tempo || null : null,
        tanggal: payload.tanggal ? new Date(payload.tanggal).toISOString() : undefined
      }).eq("id_pembelian", payload.id_pembelian);
      if (pErr) throw pErr;


      await fetchAll(true);
    } finally {submittingRef.current = false;}
  }


  async function tandaiLunas(id_pembelian) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const { error } = await supabase.from("pembelian_bahan").
      update({ status_pembayaran: "Lunas", jatuh_tempo: null }).
      eq("id_pembelian", id_pembelian);
      if (error) throw error;

      await fetchAll(true);
    } finally {submittingRef.current = false;}
  }


  async function editSupplier(payload) {
    const { error } = await supabase.from("supplier").update({
      nama_supplier: payload.nama_supplier,
      no_telp: payload.no_telp || null,
      alamat: payload.alamat || null
    }).eq("id_supplier", payload.id_supplier);
    if (error) throw error;
    await fetchAll(true);
  }

  return {
    list: filteredList, supplierList, bahanList,
    stats, loading, error, lastUpdated,
    statusOpt: ["Semua Status", ...sel.statusPembayaran(enums)], satuanOpt: sel.satuan(enums),
    filterStatus, setFilterStatus,
    filterTanggal, setFilterTanggal,

    applyFilter: () => {setAppliedStatus(filterStatus);setAppliedTanggal(filterTanggal);},

    resetFilter: () => {setFilterStatus("Semua Status");setFilterTanggal("");setAppliedStatus("Semua Status");setAppliedTanggal("");},
    tambahPembelian, editPembelian, tandaiLunas, editSupplier,
    fmtRp,
    refetch: () => fetchAll(false)
  };
}