import { useState, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { fmtDateTime } from "../../../shared/utils/format";
import { useEnums, sel } from "../../../shared/hooks/useEnums";




const AKTIVITAS_OPTS = ["Semua Aktivitas", "LOGIN", "LOGOUT", "LOGIN_FAILED", "CREATE", "UPDATE", "DELETE"];


const MODUL_MAP = {
  "Semua Modul": [],
  "Autentikasi": ["Authentication"],
  "Produk": ["produk", "batch_produk", "masalah_produk"],
  "Bahan Baku": ["bahan_baku", "batch_bahan_baku", "masalah_bahan_baku", "Pemakaian Bahan"],
  "Pembelian Bahan": ["pembelian_bahan"],
  "Penjualan Toko": ["penjualan_langsung"],
  "Penjualan Online": ["pesanan_online"],
  "Produksi": ["produksi", "Hasil Produksi"],
  "Manajemen User": ["profiles"]
};

const MODUL_OPTS = Object.keys(MODUL_MAP);


const MODUL_LABEL = {
  Authentication: "Autentikasi",
  produk: "Produk",
  batch_produk: "Produk (Batch)",
  masalah_produk: "Produk (Masalah)",
  bahan_baku: "Bahan Baku",
  batch_bahan_baku: "Bahan Baku (Batch)",
  masalah_bahan_baku: "Bahan Baku (Masalah)",
  pembelian_bahan: "Pembelian Bahan",
  penjualan_langsung: "Penjualan Toko",
  pesanan_online: "Penjualan Online",
  produksi: "Produksi",
  "Hasil Produksi": "Produksi (Hasil)",
  "Pemakaian Bahan": "Bahan Baku (Pemakaian)",
  profiles: "Manajemen User",
  "Manajemen User": "Manajemen User"
};

export { AKTIVITAS_OPTS, MODUL_OPTS, MODUL_MAP, MODUL_LABEL };



export function useLogAktivitas() {
  const { enums } = useEnums();
  const ROLE_OPTS = ["Semua Role", ...sel.roleAll(enums)];
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const fetch = useCallback(async ({
    tanggal = "",
    role = "",
    aktivitas = "",
    modul = "",
    search = ""
  } = {}) => {
    setLoading(true);setError(null);
    try {
      let q = supabase.
      from("log_aktivitas").
      select(`
          id_log,
          timestamp,
          id_user,
          role_saat_itu,
          aktivitas,
          modul,
          detail,
          detail_json,
          data_sebelum,
          data_sesudah,
          profile:profiles!id_user(nama_lengkap)
        `).
      order("timestamp", { ascending: false }).
      limit(500);

      if (role) q = q.eq("role_saat_itu", role);
      if (aktivitas) q = q.eq("aktivitas", aktivitas);

      if (modul && MODUL_MAP[modul]?.length > 0) q = q.in("modul", MODUL_MAP[modul]);

      if (tanggal) {
        const ds = new Date(`${tanggal}T00:00:00+07:00`);
        const de = new Date(`${tanggal}T23:59:59.999+07:00`);
        q = q.gte("timestamp", ds.toISOString()).lte("timestamp", de.toISOString());
      }

      const { data, error: e } = await q;
      if (e) throw e;

      let out = (data ?? []).map((log) => {
        let dj = log.detail_json ?? {};

        if (typeof log.detail === "string") {
          try {dj = { ...JSON.parse(log.detail), ...dj };} catch (e) {console.warn("Gagal parse log.detail:", log.detail, e);}
        }


        const nama = dj.nama_produk ?? dj.nama_bahan ?? dj.nama ?? "";
        const noRef = dj.no_pesanan ? `#${dj.no_pesanan}` :
        dj.no_pembelian ? `#${dj.no_pembelian}` :
        dj.id_penjualan ? `#${dj.id_penjualan}` :
        dj.id_produksi ? `#${dj.id_produksi}` :
        dj.id_produk ? `#${dj.id_produk}` :
        dj.id_bahan ? `#${dj.id_bahan}` :
        "";
        const prefix = [nama, noRef].filter(Boolean).join(" ");


        const MODUL_ACTION = {
          penjualan_langsung: { CREATE: "Penjualan dicatat", UPDATE: "Penjualan diubah" },
          pesanan_online: { CREATE: "Pesanan dibuat", UPDATE: "Pesanan diubah" },
          pembelian_bahan: { CREATE: "Pembelian dicatat", UPDATE: "Pembelian diubah" },
          produksi: { CREATE: "Produksi dicatat", UPDATE: "Produksi diubah" },
          "Hasil Produksi": { CREATE: "Hasil produksi dicatat" },
          "Pemakaian Bahan": { CREATE: "Pemakaian bahan dicatat" },
          produk: { CREATE: "Produk ditambah", UPDATE: "Produk diubah" },
          batch_produk: { CREATE: "Batch produk dibuat", UPDATE: "Batch produk diubah" },
          masalah_produk: { CREATE: "Masalah dicatat", UPDATE: "Masalah diubah" },
          bahan_baku: { CREATE: "Bahan ditambah", UPDATE: "Bahan diubah" },
          batch_bahan_baku: { CREATE: "Batch bahan dibuat", UPDATE: "Batch bahan diubah" },
          masalah_bahan_baku: { CREATE: "Masalah dicatat", UPDATE: "Masalah diubah" },
          Authentication: { CREATE: "Login", LOGIN: "Login", LOGOUT: "Logout", LOGIN_FAILED: "Login gagal" },
          profiles: { CREATE: "Akun dibuat", UPDATE: "Akun diubah" }
        };
        const modulActions = MODUL_ACTION[log.modul] ?? {};

        let detailText = log.detail ?? "";

        const GENERIC = new Set(["Penjualan ditambah", "Pesanan dibuat", "Pembelian ditambah",
        "Produksi insert", "Produksi update", "Bahan baku ditambah", "Produk ditambah",
        "Profil dibuat", "Profil diubah"]);
        if (!detailText || GENERIC.has(detailText)) {
          if (dj.pesan) detailText = dj.pesan;else
          if (dj.field) detailText = `${dj.field} diubah`;else
          detailText = modulActions[log.aktivitas] ?? `${log.aktivitas} ${log.modul}`;
        }


        const full = prefix && !detailText.includes(prefix.replace("#", "")) ?
        `${prefix} - ${detailText}` :
        detailText;

        return {
          id: log.id_log,
          timestamp: fmtDateTime(log.timestamp),
          timestamp_raw: log.timestamp,
          user: log.profile?.nama_lengkap ?? "Unknown",
          role: log.role_saat_itu ?? "-",
          aktivitas: log.aktivitas,
          modul: log.modul,
          detail: full || "-",
          data_sebelum: log.data_sebelum ?? null,
          data_sesudah: log.data_sesudah ?? null
        };
      });


      if (search.trim()) {
        const s = search.trim().toLowerCase();
        out = out.filter((r) =>
        r.user.toLowerCase().includes(s) ||
        r.detail.toLowerCase().includes(s) ||
        r.modul.toLowerCase().includes(s)
        );
      }

      setRows(out);
    } catch (e) {setError(e.message);} finally
    {setLoading(false);}
  }, []);

  return { rows, loading, error, fetch, ROLE_OPTS };
}