import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "../../../lib/supabase";
import { getFreshSession } from "../../../shared/utils/authToken";
import { useRealtimeRefresh } from "../../../shared/hooks/useRealtimeRefresh";
import { logActivity } from "../../../shared/utils/logActivity";
import { useEnums, invalidateEnumsCache, sel, fetchEnumJenisBahan, fetchEnumSatuan, invalidateJenisBahanCache, invalidateSatuanCache } from "../../../shared/hooks/useEnums";
import { checkAndNotifStokBahan } from "../../../shared/utils/notifikasiService";
import { validateIngredientStock, stockErrorMessage } from "../../../shared/utils/stockValidator";
import { computeStatusStok, computeStatusKdl, processBahan } from "../../../shared/utils/batchUtils";
import { kurangiStokBahan, restoreStokBahan } from "../../../shared/utils/stokBahanUtils";
import { labelBahan, labelBahanId, labelBahanPendek } from "../../../shared/utils/bahanLabel";

const WATCHED = ["bahan_baku", "batch_bahan_baku", "masalah_bahan_baku", "pembelian_bahan", "detail_pembelian_bahan"];


export function useBahanBakuManajemen(search = "") {
  const [semuaBahan, setSemuaBahan] = useState([]);

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
  const [supplierList, setSupplierList] = useState([]);
  const [stats, setStats] = useState({ habis: 0, kadaluarsa: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { enums } = useEnums();
  const fetchToken = useRef(0);
  const submittingRef = useRef(false);


  useEffect(() => {
    supabase.from("supplier").select("id_supplier,nama_supplier").order("nama_supplier").
    then(({ data }) => {if (data) setSupplierList(data);});
  }, []);


  const fetchBahan = useCallback(async (bg = false) => {
    if (!bg) setLoading(true);
    setError(null);
    const token = ++fetchToken.current;
    try {
      let q = supabase.from("bahan_baku").
      select(`
          id_bahan, merek, stok_minimal,
          jenis_bahan, jenis_bahan_enum:enum_jenis_bahan!jenis_bahan(id, nilai),
          satuan,      satuan_enum:enum_satuan!satuan(id, nilai),
          batas_peringatan_hari, deskripsi, status,
          batch_bahan_baku(
            id_batch_bb, stok, tgl_beli, kadaluarsa,
            status_stok, status_kadaluarsa,
            detail_pembelian_bahan(
              harga_satuan,
              pembelian_bahan(id_pembelian, supplier(nama_supplier))
            )
          )
        `).
      order("id_bahan");
      if (search.trim()) q = q.ilike("merek", `%${search.trim()}%`);
      const { data, error: err } = await q;
      if (err) throw err;
      if (fetchToken.current !== token) return;



      const normalized = (data ?? []).map((b) => ({
        ...b,
        batch_bahan_baku: (b.batch_bahan_baku ?? []).map((bt) => {

          const dpb = Array.isArray(bt.detail_pembelian_bahan) ?
          bt.detail_pembelian_bahan[0] :
          bt.detail_pembelian_bahan;
          return {
            ...bt,
            harga_satuan: dpb?.harga_satuan ?? null,
            supplier_nama: dpb?.pembelian_bahan?.supplier?.nama_supplier ?? "-",
            no_pembelian: dpb?.pembelian_bahan?.id_pembelian ?? "-"
          };
        })
      }));

      const processed = processBahan(normalized);
      setSemuaBahan(processed);
      setStats({
        habis: processed.filter((b) => b.statusStok === "Habis").length,
        kadaluarsa: processed.filter((b) => b.adaKadaluarsa === "Ya").length
      });
      setLastUpdated(new Date());
    } catch (e) {if (fetchToken.current === token) setError(e.message);} finally
    {if (fetchToken.current === token) setLoading(false);}

  }, []);

  useEffect(() => {
    fetchBahan(false);
    return () => {fetchToken.current++;};
  }, [fetchBahan]);

  useRealtimeRefresh("bahan-baku-manajemen", WATCHED, useCallback(() => fetchBahan(true), [fetchBahan]));


  async function resolveEnumIds({ jenis_bahan, satuan }) {
    const [jenisList, satuanList] = await Promise.all([fetchEnumJenisBahan(), fetchEnumSatuan()]);
    const ejRow = jenisList.find((r) => r.nilai === jenis_bahan);
    const esRow = satuanList.find((r) => r.nilai === satuan);
    if (!ejRow) throw new Error(`Jenis bahan "${jenis_bahan}" tidak ditemukan`);
    if (!esRow) throw new Error(`Satuan "${satuan}" tidak ditemukan`);
    return { jenis_bahan_id: ejRow.id, satuan_id: esRow.id };
  }


  async function tambahBahan(payload) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const session = await getFreshSession();const user = session?.user;
      if (!user) throw new Error("Tidak terautentikasi.");

      const { jenis_bahan_id, satuan_id } = await resolveEnumIds(payload);

      const { error: bErr } = await supabase.from("bahan_baku").insert({
        merek: payload.merek || null,
        jenis_bahan: jenis_bahan_id,
        satuan: satuan_id,
        stok_minimal: Number(payload.stok_minimal),
        batas_peringatan_hari: Number(payload.batas_peringatan_hari),
        deskripsi: payload.deskripsi || null,
        status: "Aktif"
      }).select("id_bahan").single();
      if (bErr) throw bErr;

      await fetchBahan(true);
    } finally {submittingRef.current = false;}
  }


  {



































































































  }


  async function editBahan(payload) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {

      const { data: sebelum } = await supabase.from("bahan_baku").select("*").eq("id_bahan", payload.id_bahan).single();
      const { data: sebelumBahan } = await supabase.from("bahan_baku").
      select("jenis_bahan_enum:enum_jenis_bahan!jenis_bahan(nilai), satuan_enum:enum_satuan!satuan(nilai)").
      eq("id_bahan", payload.id_bahan).single();
      const { jenis_bahan_id, satuan_id } = await resolveEnumIds(payload);
      const { error: bErr } = await supabase.from("bahan_baku").update({
        merek: payload.merek || null,
        jenis_bahan: jenis_bahan_id,
        satuan: satuan_id,
        stok_minimal: Number(payload.stok_minimal),
        batas_peringatan_hari: Number(payload.batas_peringatan_hari),
        deskripsi: payload.deskripsi || null,
        status: payload.status
      }).eq("id_bahan", payload.id_bahan);
      if (bErr) throw bErr;

      const BAHAN_LABELS = {
        merek: "Merek", jenis_bahan: "Jenis Bahan", satuan: "Satuan",
        stok_minimal: "Stok Minimal", batas_peringatan_hari: "Batas Peringatan (hari)",
        deskripsi: "Deskripsi", status: "Status"
      };




      const sebelumResolved = {
        ...sebelum,
        jenis_bahan: sebelumBahan?.jenis_bahan_enum?.nilai ?? sebelum?.jenis_bahan,
        satuan: sebelumBahan?.satuan_enum?.nilai ?? sebelum?.satuan
      };
      const namaBahan = labelBahanPendek(sebelumResolved, String(payload.id_bahan));
      for (const [k, label] of Object.entries(BAHAN_LABELS)) {
        const valBefore = sebelumResolved?.[k] ?? null;
        const valAfter = payload[k] ?? null;
        if (String(valBefore ?? "") !== String(valAfter ?? "")) {
          await logActivity({ aktivitas: "UPDATE", modul: "bahan_baku",
            detail: { field: label, id_bahan: payload.id_bahan, nama_bahan: namaBahan },
            sebelum: valBefore, sesudah: valAfter });
        }
      }


      const editSnapshots = [];
      for (const bt of payload.batches ?? []) {
        const { data: snap } = await supabase.from("batch_bahan_baku").
        select("id_batch_bb, stok, tgl_beli, kadaluarsa, status_stok, status_kadaluarsa").
        eq("id_batch_bb", bt.id_batch_bb).single();
        if (snap) editSnapshots.push(snap);
      }


      const updatedBatches = [];
      try {
        for (const [batchIdx, bt] of (payload.batches ?? []).entries()) {
          const before = editSnapshots.find((s) => s.id_batch_bb === bt.id_batch_bb);
          const { error: btErr } = await supabase.from("batch_bahan_baku").update({
            stok: Number(bt.stok),
            tgl_beli: bt.tgl_beli,
            kadaluarsa: bt.kadaluarsa || null,
            status_stok: computeStatusStok(bt.stok, payload.stok_minimal),
            status_kadaluarsa: computeStatusKdl(bt.kadaluarsa, payload.batas_peringatan_hari)
          }).eq("id_batch_bb", bt.id_batch_bb);
          if (btErr) throw btErr;
          updatedBatches.push(bt.id_batch_bb);

          const BATCH_FIELDS = { stok: "Stok", tgl_beli: "Tgl Beli", kadaluarsa: "Kadaluarsa" };
          for (const [k, label] of Object.entries(BATCH_FIELDS)) {
            const vBefore = before?.[k] ?? null;
            const vAfter = k === "stok" ? Number(bt.stok) : bt[k] || null;
            if (String(vBefore ?? "") !== String(vAfter ?? "")) {
              await logActivity({ aktivitas: "UPDATE", modul: "batch_bahan_baku",
                detail: { field: label, id_batch_bb: bt.id_batch_bb, id_bahan: payload.id_bahan,
                  nama_bahan: namaBahan, satuan: payload.satuan, batch_ke: batchIdx + 1 },
                sebelum: vBefore, sesudah: vAfter });
            }
          }
        }
      } catch (btLoopErr) {

        for (const snap of editSnapshots.filter((s) => updatedBatches.includes(s.id_batch_bb))) {
          await supabase.from("batch_bahan_baku").update({
            stok: snap.stok, tgl_beli: snap.tgl_beli, kadaluarsa: snap.kadaluarsa,
            status_stok: snap.status_stok, status_kadaluarsa: snap.status_kadaluarsa
          }).eq("id_batch_bb", snap.id_batch_bb);
        }

        await supabase.from("bahan_baku").update({
          merek: sebelum.merek, jenis_bahan: sebelum.jenis_bahan, satuan: sebelum.satuan,
          stok_minimal: sebelum.stok_minimal, batas_peringatan_hari: sebelum.batas_peringatan_hari,
          deskripsi: sebelum.deskripsi, status: sebelum.status
        }).eq("id_bahan", payload.id_bahan);
        throw btLoopErr;
      }

      await checkAndNotifStokBahan({
        id_bahan: payload.id_bahan,
        nama_bahan: namaBahan,
        satuan: payload.satuan,
        stok_minimal: payload.stok_minimal ?? 0
      });
      await fetchBahan(true);
    } finally {submittingRef.current = false;}
  }


  async function laporMasalah(payload) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const session = await getFreshSession();const user = session?.user;
      if (!user) throw new Error("Tidak terautentikasi.");
      const jumlah = Number(payload.jumlah);
      const { data: batch } = await supabase.from("batch_bahan_baku").
      select("stok,id_bahan,bahan_baku(stok_minimal,batas_peringatan_hari)").eq("id_batch_bb", payload.id_batch_bb).single();
      if (!batch) throw new Error("Batch tidak ditemukan.");
      if (jumlah > Number(batch.stok)) throw new Error(`Jumlah masalah (${jumlah}) melebihi stok batch saat ini (${batch.stok}).`);
      const stokBaru = Math.max(0, Number(batch.stok) - jumlah);
      const { data: masalah, error } = await supabase.from("masalah_bahan_baku").insert({
        id_batch_bb: payload.id_batch_bb,
        id_user: user.id,
        nama_masalah: payload.nama_masalah,
        tanggal: new Date().toISOString(),
        jumlah,
        keterangan: payload.keterangan || null,
        stok_dikurangi: jumlah
      }).select("id_masalah").single();
      if (error) throw error;

      if (stokBaru <= 0) {
        const { error: bErr } = await supabase.from("batch_bahan_baku").
        update({ stok: 0, status_stok: "Habis" }).eq("id_batch_bb", payload.id_batch_bb);
        if (bErr) {
          await supabase.from("masalah_bahan_baku").delete().eq("id_masalah", masalah.id_masalah);
          throw bErr;
        }
      } else {
        const { error: bErr } = await supabase.from("batch_bahan_baku").update({
          stok: stokBaru,
          status_stok: computeStatusStok(stokBaru, batch.bahan_baku?.stok_minimal ?? 0)
        }).eq("id_batch_bb", payload.id_batch_bb);
        if (bErr) {
          await supabase.from("masalah_bahan_baku").delete().eq("id_masalah", masalah.id_masalah);
          throw bErr;
        }
      }
      await logActivity({
        aktivitas: "CREATE", modul: "Masalah Bahan",
        detail: { pesan: `${payload.nama_bahan ?? `Bahan #${payload.id_batch_bb}`} - ${payload.nama_masalah}: ${jumlah} unit dilaporkan${payload.keterangan ? ` (${payload.keterangan})` : ""}` }
      });
      const bahan = bahanList.find((b) => b.batches?.some((bt) => bt.id_batch_bb === payload.id_batch_bb));
      if (bahan) {
        await checkAndNotifStokBahan({
          id_bahan: bahan.id_bahan,
          nama_bahan: labelBahan(bahan),
          satuan: bahan.satuan,
          stok_minimal: bahan.stok_minimal
        });
      }
      await fetchBahan(true);
    } finally {submittingRef.current = false;}
  }


  async function toggleStatusBahan(id_bahan, currentStatus) {
    const newStatus = currentStatus === "Aktif" ? "Tidak" : "Aktif";
    const { error } = await supabase.from("bahan_baku").
    update({ status: newStatus }).eq("id_bahan", id_bahan);
    if (error) throw error;
    const bahan = bahanList.find((b) => b.id_bahan === id_bahan);
    const nama = labelBahanId(bahan, id_bahan);
    await logActivity({
      aktivitas: "UPDATE", modul: "Bahan Baku",
      detail: { pesan: `${nama} - status diubah dari ${currentStatus} menjadi ${newStatus}` },
      sebelum: currentStatus, sesudah: newStatus
    });
    await fetchBahan(true);
  }

  async function addEnumValue(enumType, nilai) {
    const TABLE = { jenis_bahan: "enum_jenis_bahan", satuan: "enum_satuan" };
    const table = TABLE[enumType];
    if (!table) throw new Error(`Unknown enum type: ${enumType}`);
    const { data, error } = await supabase.from(table).insert({ nilai: nilai.trim() }).select("id,nilai").single();
    if (error) throw error;
    invalidateEnumsCache();invalidateJenisBahanCache();invalidateSatuanCache();
    return data;
  }

  async function editEnumValue(enumType, id, nilai) {
    const TABLE = { jenis_bahan: "enum_jenis_bahan", satuan: "enum_satuan" };
    const table = TABLE[enumType];
    if (!table) throw new Error(`Unknown enum type: ${enumType}`);
    const { error } = await supabase.from(table).update({ nilai: nilai.trim() }).eq("id", id);
    if (error) throw error;
    invalidateEnumsCache();invalidateJenisBahanCache();invalidateSatuanCache();
  }

  return {
    bahanList, supplierList, jenisMasalahList: sel.jenisMasalahBahan(enums),
    jenisBahanList: sel.bahanJenis(enums),
    satuanList: sel.satuan(enums),
    statusBahanList: sel.statusBahan(enums),
    statusBayarList: sel.statusPembayaran(enums),
    stats, loading, error, lastUpdated,
    tambahBahan, editBahan, laporMasalah, toggleStatusBahan,
    addEnumValue, editEnumValue,
    refetch: () => fetchBahan(false)
  };
}






export function usePemakaianBahan(fetchBahan) {
  const [bahanList, setBahanList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const submittingRef = useRef(false);


  const loadBahan = async () => {
    const { data } = await supabase.
    from("bahan_baku").
    select(`
        id_bahan, merek, stok_minimal, status,
        jenis:enum_jenis_bahan!jenis_bahan(id, nilai),
        sat:enum_satuan!satuan(id, nilai),
        batch_bahan_baku(id_batch_bb, stok, tgl_beli, status_stok, status_kadaluarsa)
      `).
    eq("status", "Aktif").
    order("id_bahan");
    if (!data) return;
    const processed = data.map((b) => {

      const batches = (b.batch_bahan_baku ?? []).
      filter((bt) => bt.status_stok !== "Habis" && bt.status_stok !== "Kadaluarsa" && bt.status_kadaluarsa !== "Ya" && Number(bt.stok) > 0).
      sort((a, x) => new Date(a.tgl_beli) - new Date(x.tgl_beli));
      return {
        ...b,
        jenis_bahan: b.jenis?.nilai ?? String(b.jenis?.id ?? ""),
        satuan: b.sat?.nilai ?? String(b.sat?.id ?? ""),
        batches,
        totalStok: batches.reduce((s, bt) => s + Number(bt.stok), 0)
      };
    }).filter((b) => b.totalStok > 0);
    setBahanList(processed);
  };

  useEffect(() => {loadBahan();}, []);


  async function submitPemakaian(items) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);setError(null);
    try {
      const session = await getFreshSession();
      const user = session?.user;
      if (!user) throw new Error("Tidak terautentikasi.");


      const bahanMap = Object.fromEntries(bahanList.map((b) => [b.id_bahan, b]));
      const stockErrors = await validateIngredientStock(
        items.map((item) => {
          const b = bahanMap[Number(item.id_bahan)];
          return { id_bahan: item.id_bahan, qty: item.jumlah,
            nama: b ? labelBahan(b) : undefined, satuan: b?.satuan };
        })
      );
      if (stockErrors.length) throw new Error(stockErrorMessage(stockErrors));


      const allSnapshots = [];
      const pemakaianRows = [];

      try {
        for (const item of items) {
          const bahan = bahanMap[Number(item.id_bahan)];
          if (!bahan) continue;
          const { snapshots, pemakaianRows: rows } = await kurangiStokBahan(
            bahan, item.jumlah, user.id, "Pemakaian bahan (admin)"
          );
          allSnapshots.push(...snapshots);
          pemakaianRows.push(...rows);
        }

        if (pemakaianRows.length > 0) {
          const { error: iErr } = await supabase.from("pemakaian_bahan").insert(pemakaianRows);
          if (iErr) throw iErr;
        }
      } catch (innerErr) {
        await restoreStokBahan(allSnapshots);
        throw innerErr;
      }

      const batchSummary = items.map((item) => {
        const b = bahanMap[Number(item.id_bahan)];
        return `${labelBahanId(b, item.id_bahan)} ${item.jumlah} ${b?.satuan ?? ""}`;
      }).join(", ");
      await logActivity({
        aktivitas: "CREATE", modul: "Pemakaian Bahan",
        detail: {
          pesan: `Pemakaian bahan (admin) dicatat`,
          jumlah_item: items.length, items: batchSummary
        }
      });


      await loadBahan();
      fetchBahan?.(false);
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }

  return { bahanList, loading, error, submitPemakaian };
}