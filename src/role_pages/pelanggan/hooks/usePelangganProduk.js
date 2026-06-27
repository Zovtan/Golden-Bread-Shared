import { useState, useEffect, useCallback } from "react";
import { fetchEnumKategoriProduk } from "../../../shared/hooks/useEnums";
import { supabase } from "../../../lib/supabase";
import { fmtRpSpace } from "../../../shared/utils/format";

const DEFAULT_PAGE_SIZE = 20;

export function usePelangganProduk({ search = "", kategori = "", page = 1, pageSize = DEFAULT_PAGE_SIZE, sortByAvail = false }) {
  const [allProduk, setAllProduk] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {fetchEnumKategoriProduk().then(setKategoriList);}, []);


  const fetchProduk = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {


      let q = supabase.from("produk").
      select("id_produk,nama_produk,harga_satuan,gambar,kategori_produk,kategori_enum:enum_kategori_produk!kategori_produk(id,nilai)").
      eq("status", "Aktif").order("nama_produk");
      if (search) q = q.ilike("nama_produk", `%${search}%`);
      if (kategori) q = q.eq("kategori_produk", Number(kategori));

      const { data, error: e } = await q;
      if (e) throw e;
      if (!data?.length) {setAllProduk([]);return;}

      const ids = data.map((p) => p.id_produk);


      const { data: batches } = await supabase.
      from("batch_produk").
      select("id_produk,stok").
      in("id_produk", ids).
      in("status_stok", ["Normal", "Menipis"]).
      neq("status_kadaluarsa", "Ya");

      const stokMap = {};
      (batches ?? []).forEach((b) => {
        stokMap[b.id_produk] = (stokMap[b.id_produk] ?? 0) + Number(b.stok);
      });

      let result = data.map((p) => {
        const harga_num = Number(p.harga_satuan);
        return {
          id: p.id_produk, nama: p.nama_produk,
          kategori: p.kategori_enum?.nilai ?? "-",
          kategori_id: p.kategori_produk ?? null,
          harga: fmtRpSpace(harga_num), harga_num,
          gambar: p.gambar,
          stok: stokMap[p.id_produk] ?? 0
        };
      });


      if (sortByAvail) result.sort((a, b) => (b.stok > 0 ? 1 : 0) - (a.stok > 0 ? 1 : 0));

      setAllProduk(result);
    } catch (err) {setError(err.message);} finally
    {if (!silent) setLoading(false);}
  }, [search, kategori, sortByAvail]);

  useEffect(() => {fetchProduk();}, [fetchProduk]);


  const refetch = useCallback(() => fetchProduk({ silent: true }), [fetchProduk]);

  const totalPages = Math.max(1, Math.ceil(allProduk.length / pageSize));
  const produk = allProduk.slice((page - 1) * pageSize, page * pageSize);

  return { produk, kategoriList, totalPages, loading, error, refetch };
}