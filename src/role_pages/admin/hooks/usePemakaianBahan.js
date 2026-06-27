import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { getFreshSession } from "../../../shared/utils/authToken";
import { logActivity } from "../../../shared/utils/logActivity";
import { validateIngredientStock, stockErrorMessage } from "../../../shared/utils/stockValidator";
import { kurangiStokBahan, restoreStokBahan } from "../../../shared/utils/stokBahanUtils";
import { labelBahan, labelBahanId } from "../../../shared/utils/bahanLabel";



export function usePemakaianBahan() {
  const [bahanList, setBahanList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const submittingRef = useRef(false);


  const loadBahan = async () => {
    const { data } = await supabase.
    from("bahan_baku").
    select(`
        id_bahan, merek, stok_minimal,
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
    setLoading(true);
    setError(null);
    try {
      const session = await getFreshSession();
      const user = session?.user;
      if (!user) throw new Error("Tidak terautentikasi.");


      const bahanMap = Object.fromEntries(bahanList.map((b) => [b.id_bahan, b]));
      const stockErrors = await validateIngredientStock(
        items.map((item) => {
          const b = bahanMap[Number(item.id_bahan)];
          return {
            id_bahan: item.id_bahan,
            qty: item.jumlah,
            nama: b ? labelBahan(b) : undefined,
            satuan: b?.satuan
          };
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
          jumlah_item: items.length,
          items: batchSummary
        }
      });

      await loadBahan();
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