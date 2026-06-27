




import { useState, useMemo, useCallback } from "react";


const STATUS_STOK_ORDER = { Habis: 0, Menipis: 1, Normal: 2 };
const STATUS_KDL_ORDER = { Ya: 0, Mendekati: 1, Tidak: 2 };
const STATUS_BAHAN_ORDER = { "Tidak Aktif": 0, Aktif: 1 };
const STATUS_PRODUK_ORDER = { "Tidak Aktif": 0, Aktif: 1 };
const STATUS_PESANAN_ORDER = { Dibatalkan: 0, Selesai: 1, Diproses: 2, Pending: 3 };
const STATUS_BAYAR_ORDER = { Belum: 0, Tempo: 1, Lunas: 2 };
const ROLE_ORDER = { Admin: 0, Kasir: 1, Produksi: 2, Pelanggan: 3 };
const STATUS_AKUN_ORDER = { "Tidak Aktif": 0, Aktif: 1 };

export const ENUM_MAPS = {
  status_stok: STATUS_STOK_ORDER,
  status_kdaluarsa: STATUS_KDL_ORDER,
  ada_kadaluarsa: STATUS_KDL_ORDER,
  status_bahan: STATUS_BAHAN_ORDER,
  status_produk: STATUS_PRODUK_ORDER,
  status_pesanan: STATUS_PESANAN_ORDER,
  status_pembayaran: STATUS_BAYAR_ORDER,
  role: ROLE_ORDER,
  status_akun: STATUS_AKUN_ORDER
};


function getValue(row, key) {
  return key.split(".").reduce((o, k) => o == null ? null : o[k], row);
}


function compareValues(a, b, type, enumMap) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (type === "number") return Number(a) - Number(b);
  if (type === "date") return new Date(a) - new Date(b);
  if (type === "enum" && enumMap) {
    const ia = enumMap[a] ?? 99;
    const ib = enumMap[b] ?? 99;
    return ia - ib;
  }
  return String(a).localeCompare(String(b), "id", { sensitivity: "base" });
}


export function useSortableTable(rows) {

  const [sort, setSort] = useState({ key: null, dir: "asc", type: "string", enumMap: null });


  const toggleSort = useCallback((key, type = "string", enumMap = null) => {
    setSort((prev) => {
      if (prev.key === key) {
        if (prev.dir === "asc") return { key, dir: "desc", type, enumMap };
        if (prev.dir === "desc") return { key: null, dir: "asc", type: "string", enumMap: null };
      }
      return { key, dir: "asc", type, enumMap };
    });
  }, []);

  const sorted = useMemo(() => {
    if (!sort.key || !rows?.length) return rows ?? [];
    return [...rows].sort((a, b) => {
      const av = getValue(a, sort.key);
      const bv = getValue(b, sort.key);
      const cmp = compareValues(av, bv, sort.type, sort.enumMap);
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort]);

  return { sorted, sortKey: sort.key, sortDir: sort.dir, toggleSort };
}