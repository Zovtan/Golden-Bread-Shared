























import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import * as STATIC_ENUMS from "../../lib/enums";



let _cache = null;
let _promise = null;



const _subscribers = new Set();

function notifySubscribers() {
  _subscribers.forEach((fn) => fn());
}

async function doFetch() {
  const { data, error } = await supabase.rpc("get_all_enums");
  if (error || !data) {
    console.warn("[useEnums] RPC gagal, pakai static fallback:", error?.message);
    _cache = buildStaticCache();
  } else {
    _cache = data;
  }
  return _cache;
}



export function useEnums() {
  const [enums, setEnums] = useState(_cache);
  const [loading, setLoading] = useState(!_cache);

  const load = useCallback(async () => {
    if (_cache) {setEnums(_cache);setLoading(false);return;}
    setLoading(true);
    if (!_promise) _promise = doFetch();
    const data = await _promise;
    setEnums(data);setLoading(false);
  }, []);

  useEffect(() => {

    load();

    _subscribers.add(load);
    return () => {_subscribers.delete(load);};
  }, [load]);

  return { enums: enums ?? buildStaticCache(), loading };
}






export function invalidateEnumsCache() {
  _cache = null;
  _promise = null;
  notifySubscribers();
}




function buildStaticCache() {
  return {
    status_akun: STATIC_ENUMS.STATUS_AKUN,
    status_bahan: STATIC_ENUMS.STATUS_BAHAN,
    status_produk: STATIC_ENUMS.STATUS_PRODUK,
    status_pesanan: STATIC_ENUMS.STATUS_PESANAN,
    status_pembayaran: STATIC_ENUMS.STATUS_PEMBAYARAN,
    status_kadaluarsa: STATIC_ENUMS.STATUS_KADALUARSA,
    status_stok: STATIC_ENUMS.STATUS_STOK,
    jenis_bayar: STATIC_ENUMS.JENIS_BAYAR,
    jenis_pelanggan: STATIC_ENUMS.JENIS_PELANGGAN,
    bahan_jenis: STATIC_ENUMS.BAHAN_JENIS,
    satuan: STATIC_ENUMS.SATUAN,
    produk_kategori: STATIC_ENUMS.PRODUK_KATEGORI,
    role_user: STATIC_ENUMS.ROLE_USER,
    role_all: STATIC_ENUMS.ROLE_ALL,
    jenis_masalah_produk: STATIC_ENUMS.JENIS_MASALAH_PRODUK,
    jenis_masalah_bahan: STATIC_ENUMS.JENIS_MASALAH_BAHAN
  };
}



export const sel = {
  statusPesanan: (e) => e?.status_pesanan ?? STATIC_ENUMS.STATUS_PESANAN,
  statusProduk: (e) => e?.status_produk ?? STATIC_ENUMS.STATUS_PRODUK,
  statusBahan: (e) => e?.status_bahan ?? STATIC_ENUMS.STATUS_BAHAN,
  statusPembayaran: (e) => e?.status_pembayaran ?? STATIC_ENUMS.STATUS_PEMBAYARAN,
  statusKadaluarsa: (e) => e?.status_kadaluarsa ?? STATIC_ENUMS.STATUS_KADALUARSA,
  statusAkun: (e) => e?.status_akun ?? STATIC_ENUMS.STATUS_AKUN,
  jenisBayar: (e) => e?.jenis_bayar ?? STATIC_ENUMS.JENIS_BAYAR,
  jenisPelanggan: (e) => e?.jenis_pelanggan ?? STATIC_ENUMS.JENIS_PELANGGAN,
  bahanJenis: (e) => e?.bahan_jenis ?? STATIC_ENUMS.BAHAN_JENIS,
  satuan: (e) => e?.satuan ?? STATIC_ENUMS.SATUAN,
  produkKategori: (e) => e?.produk_kategori ?? STATIC_ENUMS.PRODUK_KATEGORI,
  roleUser: (e) => e?.role_user ?? STATIC_ENUMS.ROLE_USER,
  roleAll: (e) => e?.role_all ?? STATIC_ENUMS.ROLE_ALL,
  statusStok: (e) => e?.status_stok ?? STATIC_ENUMS.STATUS_STOK,
  jenisMasalahProduk: (e) => e?.jenis_masalah_produk ?? STATIC_ENUMS.JENIS_MASALAH_PRODUK,
  jenisMasalahBahan: (e) => e?.jenis_masalah_bahan ?? STATIC_ENUMS.JENIS_MASALAH_BAHAN
};



let _cacheKategoriProduk = null;
export async function fetchEnumKategoriProduk() {
  if (_cacheKategoriProduk) return _cacheKategoriProduk;
  const { data } = await supabase.from("enum_kategori_produk").select("id,nilai").order("id");
  _cacheKategoriProduk = data ?? [];
  return _cacheKategoriProduk;
}
export function invalidateKategoriProdukCache() {_cacheKategoriProduk = null;}

let _cacheJenisBahan = null;
export async function fetchEnumJenisBahan() {
  if (_cacheJenisBahan) return _cacheJenisBahan;
  const { data } = await supabase.from("enum_jenis_bahan").select("id,nilai").order("id");
  _cacheJenisBahan = data ?? [];
  return _cacheJenisBahan;
}
export function invalidateJenisBahanCache() {_cacheJenisBahan = null;}

let _cacheSatuan = null;
export async function fetchEnumSatuan() {
  if (_cacheSatuan) return _cacheSatuan;
  const { data } = await supabase.from("enum_satuan").select("id,nilai").order("id");
  _cacheSatuan = data ?? [];
  return _cacheSatuan;
}
export function invalidateSatuanCache() {_cacheSatuan = null;}