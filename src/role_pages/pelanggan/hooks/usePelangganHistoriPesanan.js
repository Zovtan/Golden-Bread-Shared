import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { fmtDateTime } from "../../../shared/utils/format";
import { loadMidtransSnap, openSnap, createSnapToken } from "../../../shared/utils/midtransUtils";
import { useRealtimeRefresh } from "../../../shared/hooks/useRealtimeRefresh";

const PAGE_SIZE = 6;



const STATUS_LABEL = {
  Pending_Payment: "Menunggu Pembayaran",
  Pending: "Menunggu Diproses",
  Diproses: "Diproses",
  Selesai: "Selesai",
  Dibatalkan: "Dibatalkan"
};


const TAB_DISPLAY = {
  Semua: "Semua Pesanan",
  Pending_Payment: "Belum Dibayar",
  Pending: "Menunggu Diproses",
  Diproses: "Diproses",
  Selesai: "Selesai",
  Dibatalkan: "Dibatalkan"
};



export function usePelangganHistoriPesanan(pelangganId, search = "") {
  const STATUS_TABS = ["Semua", "Pending_Payment", "Pending", "Diproses", "Selesai", "Dibatalkan"];

  const [pesananList, setPesananList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [page, setPage] = useState(1);



  const fetchPesanan = useCallback(async (bg = false) => {
    if (!pelangganId) return;
    if (!bg) setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.
      from("pesanan_online").
      select(`
          id_pesanan, tanggal, waktu_antar, status, jenis_pembayaran, midtrans_order_id, snap_token, ongkir, pesan_pembatalan, refund_status, refund_alasan,
          detail_pesanan_online(
            qty, harga_satuan,
            produk:id_produk(id_produk, nama_produk, kategori_enum:enum_kategori_produk!kategori_produk(id,nilai))
          )
        `).
      eq("id_pelanggan", pelangganId).
      order("tanggal", { ascending: false });
      if (err) throw err;


      const rows = (data ?? []).map((p) => {
        const details = p.detail_pesanan_online ?? [];
        const subtotal = details.reduce((s, d) => s + d.qty * Number(d.harga_satuan), 0);
        const ongkir = Number(p.ongkir ?? 0);
        const total = subtotal + ongkir;
        const totalQty = details.reduce((s, d) => s + Number(d.qty), 0);
        return {
          ...p,
          details,
          subtotal,
          total,
          totalQty,
          ongkir,
          jenis: p.waktu_antar ? "Pre-Order" : "Segera Antar",
          tanggalFmt: fmtDateTime(p.tanggal),
          label: STATUS_LABEL[p.status] ?? p.status
        };
      });
      setPesananList(rows);
    } catch (e) {
      setError(e.message);
    } finally {
      if (!bg) setLoading(false);
    }
  }, [pelangganId]);

  useEffect(() => {
    fetchPesanan();
  }, [fetchPesanan]);



  useRealtimeRefresh(
    "pelanggan-histori-pesanan",
    ["pesanan_online"],
    useCallback(() => fetchPesanan(true), [fetchPesanan])
  );



  useEffect(() => {setPage(1);}, [search, filterStatus]);



  async function batalkanPesanan(id_pesanan, alasan = null) {
    const pesanan = pesananList.find((p) => p.id_pesanan === id_pesanan);
    if (!pesanan) throw new Error("Pesanan tidak ditemukan.");
    if (pesanan.status !== "Pending" && pesanan.status !== "Pending_Payment") {
      throw new Error(
        pesanan.status === "Diproses" ?
        "Pesanan sudah diproses dan tidak dapat dibatalkan." :
        pesanan.status === "Selesai" ?
        "Pesanan sudah selesai." :
        "Pesanan sudah dibatalkan."
      );
    }


    if (pesanan.jenis_pembayaran === "Midtrans" && pesanan.status === "Pending") {
      throw new Error('Pesanan sudah dibayar. Gunakan "Ajukan Refund" untuk meminta pengembalian dana.');
    }


    const { error: e } = await supabase.rpc("pelanggan_batalkan_pesanan", {
      p_id: id_pesanan, p_alasan: alasan || "Dibatalkan oleh pelanggan"
    });
    if (e) throw e;


    await fetchPesanan();
  }



  async function requestRefund(id_pesanan, alasan = null) {
    const pesanan = pesananList.find((p) => p.id_pesanan === id_pesanan);
    if (!pesanan) throw new Error("Pesanan tidak ditemukan.");
    if (pesanan.jenis_pembayaran !== "Midtrans" || pesanan.status !== "Pending") {
      throw new Error("Refund hanya bisa diajukan untuk pesanan Midtrans yang sudah dibayar.");
    }

    if (pesanan.refund_status) {
      throw new Error(
        pesanan.refund_status === "Ditolak" ?
        "Permintaan refund untuk pesanan ini sudah ditolak dan tidak dapat diajukan lagi." :
        "Permintaan refund untuk pesanan ini sudah pernah diajukan."
      );
    }
    const { error: e } = await supabase.rpc("pelanggan_ajukan_refund", {
      p_id: id_pesanan, p_alasan: alasan || null
    });
    if (e) throw e;
    await fetchPesanan();
  }



  async function resumePayment(id_pesanan) {
    const pesanan = pesananList.find((p) => p.id_pesanan === id_pesanan);
    if (!pesanan) throw new Error("Pesanan tidak ditemukan.");
    if (pesanan.status !== "Pending_Payment") throw new Error("Pesanan ini tidak menunggu pembayaran.");

    const ready = await loadMidtransSnap();
    if (!ready) throw new Error("Gagal memuat halaman pembayaran. Coba lagi.");

    let token = pesanan.snap_token;
    if (!token) {

      const res = await createSnapToken({ id_pesanan, finishUrl: `${window.location.origin}/payment/finish` });
      token = res.token;
      try {
        await supabase.rpc("pelanggan_set_pembayaran_pesanan", { p_id: id_pesanan, p_snap_token: token });
      } catch {}
    }

    const { status } = await openSnap(token);
    if (status === "success") {
      const { error: e } = await supabase.rpc("pelanggan_konfirmasi_pembayaran", { p_id: id_pesanan });
      if (e) throw e;
      await fetchPesanan();
    } else if (status === "error") {
      throw new Error("Sesi pembayaran kedaluwarsa. Batalkan pesanan ini lalu buat ulang.");
    }

  }



  const sq = search.trim().toLowerCase();
  const filtered = pesananList.filter(
    (p) => (filterStatus === "Semua" || p.status === filterStatus) && (
    !sq || String(p.id_pesanan).includes(sq) ||
    p.details.some((d) => (d.produk?.nama_produk ?? "").toLowerCase().includes(sq)))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);



  const handleFilterStatus = (s) => {
    setFilterStatus(s);
    setPage(1);
  };

  return {
    pesananList: paged,
    allPesanan: pesananList,
    loading,
    error,
    filterStatus,
    setFilterStatus: handleFilterStatus,
    page,
    setPage,
    totalPages,
    STATUS_TABS,
    STATUS_LABEL,
    TAB_DISPLAY,
    batalkanPesanan,
    requestRefund,
    resumePayment,
    fetchPesanan
  };
}