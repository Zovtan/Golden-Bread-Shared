import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { getFreshSession } from "../../../shared/utils/authToken";
import { useEnums } from "../../../shared/hooks/useEnums";
import { logActivity } from "../../../shared/utils/logActivity";
import { checkAndNotifStokBahan } from "../../../shared/utils/notifikasiService";
import { todayWIB } from "../../../shared/utils/format";
import { labelBahan } from "../../../shared/utils/bahanLabel";
import { computeStatusStok } from "../../../shared/utils/batchUtils";
import { useRealtimeRefresh } from "../../../shared/hooks/useRealtimeRefresh";

const WATCHED = ["bahan_baku", "batch_bahan_baku", "supplier"];




export function useProduksiInputPembelian() {
  const [bahanList, setBahanList] = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { enums } = useEnums();
  const submittingRef = useRef(false);

  const fetchData = useCallback(async () => {
    const [s, b] = await Promise.all([
    supabase.from("supplier").select("id_supplier,nama_supplier").order("nama_supplier"),
    supabase.from("bahan_baku").select("id_bahan,merek,jenis_bahan,satuan,stok_minimal,batas_peringatan_hari,jenis_bahan_enum:enum_jenis_bahan!jenis_bahan(id,nilai),satuan_enum:enum_satuan!satuan(id,nilai)").eq("status", "Aktif").order("id_bahan")]
    );
    if (s.data) setSupplierList(s.data);
    if (b.data) setBahanList(b.data.map((bh) => ({
      ...bh,
      jenis_bahan: bh.jenis_bahan_enum?.nilai ?? String(bh.jenis_bahan ?? ""),
      satuan: bh.satuan_enum?.nilai ?? String(bh.satuan ?? "")
    })));
  }, []);

  useEffect(() => {fetchData();}, [fetchData]);
  useRealtimeRefresh("produksi-input-pembelian", WATCHED, fetchData);









  async function submitPembelian(items) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const session = await getFreshSession();
      const user = session?.user;
      if (!user) throw new Error("Tidak terautentikasi.");

      const first = items[0] ?? {};


      let id_supplier = first.id_supplier ? Number(first.id_supplier) : null;
      if (first.newSupplier) {
        const { data: ns, error: nsErr } = await supabase.from("supplier").insert({
          nama_supplier: first.newSupplier.nama_supplier.trim(),
          no_telp: first.newSupplier.no_telp?.trim() || null,
          alamat: first.newSupplier.alamat?.trim() || null
        }).select("id_supplier").single();
        if (nsErr) throw nsErr;
        id_supplier = ns.id_supplier;
        setSupplierList((prev) => [...prev, {
          id_supplier, nama_supplier: first.newSupplier.nama_supplier
        }]);
      }


      const { data: pembelian, error: pErr } = await supabase.from("pembelian_bahan").insert({
        id_user: user.id,
        id_supplier,
        tanggal: new Date().toISOString(),
        status_pembayaran: first.status_pembayaran ?? "Belum",
        jatuh_tempo: first.status_pembayaran === "Tempo" ? first.jatuh_tempo || null : null,
        no_faktur: first.no_faktur ?? null
      }).select("id_pembelian").single();
      if (pErr) {
        if (first.newSupplier && id_supplier)
        await supabase.from("supplier").delete().eq("id_supplier", id_supplier);
        throw pErr;
      }


      const createdBahan = [];
      const createdBatch = [];
      try {
        for (const item of items) {
          let finalIdBahan = item.id_bahan ? Number(item.id_bahan) : null;

          if (item.newMerek) {
            const { data: baru, error: bErr } = await supabase.from("bahan_baku").insert({
              jenis_bahan: item.jenis_bahan,
              merek: (item.merek || "").trim(),
              satuan: item.satuan,
              stok_minimal: Number(item.stok_minimal) || 1,
              batas_peringatan_hari: Number(item.batas_peringatan_hari) || 7,
              status: "Aktif"
            }).select("id_bahan").single();
            if (bErr) throw bErr;
            finalIdBahan = baru.id_bahan;
            createdBahan.push(finalIdBahan);
            setBahanList((prev) => [...prev, {
              id_bahan: finalIdBahan, merek: (item.merek || "").trim(),
              jenis_bahan: item.jenis_bahan, satuan: item.satuan,
              stok_minimal: Number(item.stok_minimal) || 1,
              batas_peringatan_hari: Number(item.batas_peringatan_hari) || 7
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



          const statusKdl = (() => {
            if (!item.kadaluarsa) return "Tidak";
            const today = new Date(`${todayWIB()}T00:00:00+07:00`);
            const exp = new Date(`${item.kadaluarsa}T00:00:00+07:00`);
            const days = Math.ceil((exp - today) / 86400000);
            return days < 0 ? "Ya" : days <= (bahan?.batas_peringatan_hari ?? 7) ? "Mendekati" : "Tidak";
          })();
          const statusStok = computeStatusStok(jumlah, bahan?.stok_minimal ?? 0);

          const { data: bt, error: btErr } = await supabase.from("batch_bahan_baku").insert({
            id_bahan: finalIdBahan,
            id_pembelian: pembelian.id_pembelian,
            stok: jumlah,
            tgl_beli: todayWIB(),
            kadaluarsa: item.kadaluarsa || null,
            status_kadaluarsa: statusKdl,
            status_stok: statusStok
          }).select("id_batch_bb").single();
          if (btErr) throw btErr;
          createdBatch.push(bt.id_batch_bb);
        }
      } catch (itemErr) {


        if (createdBatch.length) await supabase.from("batch_bahan_baku").delete().in("id_batch_bb", createdBatch);
        await supabase.from("detail_pembelian_bahan").delete().eq("id_pembelian", pembelian.id_pembelian);
        await supabase.from("pembelian_bahan").delete().eq("id_pembelian", pembelian.id_pembelian);
        if (createdBahan.length) await supabase.from("bahan_baku").delete().in("id_bahan", createdBahan);
        if (first.newSupplier && id_supplier)
        await supabase.from("supplier").delete().eq("id_supplier", id_supplier);
        throw itemErr;
      }

      const pembelianSummary = items.map((item) =>
      `${labelBahan(item)} ${item.jumlah} ${item.satuan}`
      ).join(", ");
      logActivity({
        aktivitas: "CREATE", modul: "Pembelian Bahan",
        detail: { pesan: `Pembelian #${pembelian.id_pembelian}${first.no_faktur ? ` (${first.no_faktur})` : ""}: ${pembelianSummary}` }
      }).catch(() => {});

      for (const item of items) {
        checkAndNotifStokBahan({
          id_bahan: item.id_bahan,
          nama_bahan: labelBahan(item),
          satuan: item.satuan,
          stok_minimal: item.stok_minimal ?? 0
        }).catch(() => {});
      }
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }

  return { bahanList, supplierList, enums, loading, error, submitPembelian };
}