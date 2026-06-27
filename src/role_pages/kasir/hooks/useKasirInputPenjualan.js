import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { getFreshSession } from "../../../shared/utils/authToken";
import { useEnums, sel, fetchEnumKategoriProduk } from "../../../shared/hooks/useEnums";
import { logActivity } from "../../../shared/utils/logActivity";
import { kurangiStokProduk, restoreStokProduk } from "../../../shared/utils/stokProdukUtils";
import { validateProductStock, stockErrorMessage } from "../../../shared/utils/stockValidator";
import { fmtRp } from "../../../shared/utils/format";




export function useKasirInputPenjualan() {
  const [produkList, setProdukList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { enums } = useEnums();
  const submittingRef = useRef(false);


  const refreshProduk = useCallback(() => {
    supabase.
    from("produk").
    select("id_produk, nama_produk, harga_satuan, stok_minimal, status, gambar, kategori_produk, kategori_enum:enum_kategori_produk!kategori_produk(id,nilai), batch_produk(stok, status_stok, status_kadaluarsa)").
    eq("status", "Aktif").
    order("nama_produk").
    then(({ data }) => {
      if (!data) return;
      const withStok = data.map((p) => ({
        ...p,
        kategori_id: p.kategori_produk ?? null,
        kategori_label: p.kategori_enum?.nilai ?? "",
        totalStok: (p.batch_produk ?? []).
        filter((b) => (b.status_stok === "Normal" || b.status_stok === "Menipis") && b.status_kadaluarsa !== "Ya").
        reduce((s, b) => s + Number(b.stok), 0)
      }));

      withStok.sort((a, b) => (b.totalStok > 0 ? 1 : 0) - (a.totalStok > 0 ? 1 : 0));
      setProdukList(withStok);
    });
  }, []);

  useEffect(() => {refreshProduk();}, []);


  useEffect(() => {
    fetchEnumKategoriProduk().then(setKategoriList);
  }, []);



  async function submitPenjualan({ items, jenis_pembayaran }) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const session = await getFreshSession();
      const user = session?.user;
      if (!user) throw new Error("Tidak terautentikasi.");


      const produkMap = Object.fromEntries(produkList.map((p) => [p.id_produk, p]));
      const stockErrors = await validateProductStock(
        items.map((i) => ({
          id_produk: Number(i.id_produk),
          qty: Number(i.qty),
          nama: produkMap[Number(i.id_produk)]?.nama_produk
        }))
      );
      if (stockErrors.length) throw new Error(stockErrorMessage(stockErrors));


      const hargaMap = Object.fromEntries(produkList.map((p) => [p.id_produk, Number(p.harga_satuan)]));
      const details = items.map((i) => ({
        id_produk: Number(i.id_produk),
        qty: Number(i.qty),
        harga_satuan: hargaMap[Number(i.id_produk)] ?? 0
      }));

      const total = details.reduce((s, d) => s + d.harga_satuan * d.qty, 0);

      const { data: penjualan, error: pErr } = await supabase.
      from("penjualan_langsung").
      insert({ id_user: user.id, jenis_pembayaran, tanggal: new Date().toISOString() }).
      select("id_penjualan").
      single();
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
          const produk = produkMap[d.id_produk];
          const snaps = await kurangiStokProduk(d.id_produk, d.qty, produk?.stok_minimal, produk?.nama_produk);
          allSnapshots.push(...snaps);
        }
      } catch (stockErr) {


        await restoreStokProduk(allSnapshots);
        await supabase.from("detail_penjualan_langsung").delete().eq("id_penjualan", penjualan.id_penjualan);
        await supabase.from("penjualan_langsung").delete().eq("id_penjualan", penjualan.id_penjualan);
        throw stockErr;
      }

      const itemSummary = details.map((d) => {
        const nama = produkMap[d.id_produk]?.nama_produk ?? `Produk #${d.id_produk}`;
        return `${nama} x${d.qty}`;
      }).join(", ");
      await logActivity({
        aktivitas: "CREATE", modul: "Penjualan Toko",
        detail: { pesan: `Penjualan #${penjualan.id_penjualan}: ${itemSummary} - Total ${fmtRp(total)}` }
      });
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }

  return {
    produkList,
    kategoriList,
    jenisBayarList: sel.jenisBayar(enums),
    loading,
    error,
    submitPenjualan,
    refreshProduk
  };
}