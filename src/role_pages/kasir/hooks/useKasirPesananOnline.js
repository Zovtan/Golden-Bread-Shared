import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { deductStok, restoreStok, clearReservasi } from "../../../shared/utils/deductStok";
import { refundMidtrans } from "../../../shared/utils/midtransUtils";
import { validateProductStock } from "../../../shared/utils/stockValidator";
import { useRealtimeRefresh } from "../../../shared/hooks/useRealtimeRefresh";
import { useEnums, sel } from "../../../shared/hooks/useEnums";
import { notifStatusPesanan, notifRefundDitolak } from "../../../shared/utils/notifikasiService";
import { fmtRp, todayWIB, asUTC, fmtDateTime, toWIBDate } from "../../../shared/utils/format";
import { DEFAULT_BATAS } from "../../../shared/utils/batasPesananDefaults";
import { pesananHighlight } from "../../../shared/utils/pesananHighlight";

const WATCHED = ["pesanan_online", "detail_pesanan_online"];
const WAKTU_LIST = ["Semua", "Segera antar", "Preorder"];






export function useKasirPesananOnline(search = "") {
  const { enums } = useEnums();
  const STATUS_LIST = ["Semua", ...sel.statusPesanan(enums)];
  const [pesananList, setPesananList] = useState([]);
  const [stats, setStats] = useState({ omsetHariIni: 0, pending: 0, diproses: 0, selesaiHariIni: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [batas, setBatas] = useState(DEFAULT_BATAS);
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterWaktu, setFilterWaktu] = useState("Semua");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("Semua");
  const [appliedWaktu, setAppliedWaktu] = useState("Semua");
  const [appliedTanggal, setAppliedTanggal] = useState("");
  const fetchToken = useRef(0);
  const submittingRef = useRef(false);


  const fetchPesanan = useCallback(async (bg = false) => {
    if (!bg) setLoading(true);
    setError(null);
    const token = ++fetchToken.current;
    try {
      const { data, error: err } = await supabase.
      from("pesanan_online").
      select(`
          id_pesanan, tanggal, waktu_antar, status, jenis_pembayaran, pesan_pembatalan, lat, lng, midtrans_order_id,
          nama_penerima, no_telp_penerima, alamat_pengiriman, catatan, ongkir, refund_status, refund_alasan,
          pelanggan:profiles!id_pelanggan(id, nama_lengkap, nama_toko, no_telp, alamat),
          kasir:profiles!id_user(id,nama_lengkap),
          detail_pesanan_online(qty, harga_satuan, id_produk, produk:id_produk(nama_produk, stok_minimal))
        `).
      order("tanggal", { ascending: false }).limit(300);
      if (err) throw err;
      if (fetchToken.current !== token) return;

      const today = new Date(`${todayWIB()}T00:00:00+07:00`);
      let omsetHariIni = 0,pending = 0,diproses = 0,selesaiHariIni = 0;

      const processed = (data ?? []).map((p) => {
        const details = p.detail_pesanan_online ?? [];
        const totalQty = details.reduce((s, d) => s + Number(d.qty), 0);
        const lineTotal = details.reduce((s, d) => s + d.qty * Number(d.harga_satuan), 0);
        const ongkir = Number(p.ongkir ?? 0);
        const total = lineTotal + ongkir;
        const isToday = new Date(asUTC(p.tanggal)) >= today;
        const jenisWaktu = p.waktu_antar ? "Preorder" : "Segera antar";
        if (p.status === "Pending") pending++;
        if (p.status === "Diproses") diproses++;
        if (p.status === "Selesai" && isToday) {selesaiHariIni++;omsetHariIni += total;}
        return {
          ...p, details, totalQty, total, ongkir, jenisWaktu,
          tanggalFmt: fmtDateTime(p.tanggal),
          waktuAntarFmt: p.waktu_antar ? fmtDateTime(p.waktu_antar) : "Segera antar",
          highlight: pesananHighlight(p, batas)
        };
      });

      setStats({ omsetHariIni, pending, diproses, selesaiHariIni });
      setPesananList(processed);
      setLastUpdated(new Date());
    } catch (e) {if (fetchToken.current === token) setError(e.message);} finally
    {if (fetchToken.current === token) setLoading(false);}

  }, []);


  useEffect(() => {
    supabase.from("konfigurasi_pesanan").
    select("menit_highlight_segera").
    eq("id", 1).single().
    then(({ data }) => {if (data) setBatas((prev) => ({ ...prev, ...data }));});
  }, []);

  useEffect(() => {
    fetchPesanan(false);
    return () => {fetchToken.current++;};
  }, [fetchPesanan]);

  useRealtimeRefresh("kasir-pesanan-online", WATCHED, useCallback(() => fetchPesanan(true), [fetchPesanan]));

  const filteredList = pesananList.filter((p) => {
    if (appliedStatus !== "Semua" && p.status !== appliedStatus) return false;
    if (appliedWaktu !== "Semua" && p.jenisWaktu !== appliedWaktu) return false;
    if (appliedTanggal) {
      if (toWIBDate(p.tanggal) !== appliedTanggal) return false;
    }
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (p.pelanggan?.nama_lengkap ?? "").toLowerCase().includes(q) ||
    (p.pelanggan?.nama_toko ?? "").toLowerCase().includes(q) ||
    String(p.id_pesanan).includes(q);
  });


  async function updateStatus(id_pesanan, newStatus, sebelum, pesanPembatalan = null) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const pesanan = pesananList.find((p) => p.id_pesanan === id_pesanan);
      let didRefund = false;


      if (newStatus === "Diproses" && sebelum === "Pending_Payment") {
        throw new Error("Pesanan belum dibayar. Tunggu konfirmasi pembayaran Midtrans terlebih dahulu.");
      }

      const isPreorder = Boolean(pesanan?.waktu_antar);


      if (newStatus === "Diproses" && sebelum === "Pending") {
        if (!isPreorder) {
          const items = (pesanan?.details ?? []).map((d) => ({
            id_produk: d.id_produk,
            qty: d.qty,
            nama: d.produk?.nama_produk
          }));
          const stockErrors = await validateProductStock(items);
          if (stockErrors.length) throw new Error(stockErrors.join("\n"));
          await deductStok(id_pesanan, pesanan?.details ?? []);
        }
        const payload = { status: newStatus };
        const { data: updated, error } = await supabase.from("pesanan_online").update(payload).eq("id_pesanan", id_pesanan).select("id_pesanan");
        if (error || !updated?.length) {
          if (!isPreorder) await restoreStok(id_pesanan);
          throw error ?? new Error("Gagal memperbarui status pesanan. Tidak ada baris yang diubah.");
        }
      } else {


        if (newStatus === "Dibatalkan" &&
        pesanan?.jenis_pembayaran === "Midtrans" && (
        sebelum === "Pending" || sebelum === "Diproses")) {
          try {
            await refundMidtrans({
              midtrans_order_id: pesanan.midtrans_order_id,
              amount: pesanan.total,
              reason: pesanPembatalan || "Dibatalkan oleh kasir"
            });
            didRefund = true;
          } catch (refundErr) {
            throw new Error("Refund Midtrans gagal: " + refundErr.message + " - pembatalan tidak dilanjutkan.");
          }
        }

        const payload = { status: newStatus };
        if (newStatus === "Dibatalkan" && pesanPembatalan) payload.pesan_pembatalan = pesanPembatalan;

        if (newStatus === "Dibatalkan" && (didRefund || pesanan?.refund_status === "Diminta")) payload.refund_status = "Disetujui";

        const { data: updated, error } = await supabase.from("pesanan_online").update(payload).eq("id_pesanan", id_pesanan).select("id_pesanan");
        if (error) throw error;
        if (!updated || updated.length === 0) throw new Error("Gagal memperbarui status pesanan. Tidak ada baris yang diubah.");



        if (!isPreorder && newStatus === "Dibatalkan" && sebelum === "Diproses") await restoreStok(id_pesanan);
        if (!isPreorder && newStatus === "Selesai" && sebelum === "Diproses") await clearReservasi(id_pesanan);
      }


      if (pesanan && ["Diproses", "Selesai", "Dibatalkan"].includes(newStatus)) {
        await notifStatusPesanan({
          id_pesanan,
          id_pelanggan: pesanan.pelanggan?.id,
          newStatus,
          pesanPembatalan: newStatus === "Dibatalkan" ? pesanPembatalan : null,
          nama_produk_list: pesanan.details.map((d) => d.produk?.nama_produk).filter(Boolean),
          refunded: didRefund
        });
      }
      await fetchPesanan(true);
    } finally {submittingRef.current = false;}
  }



  async function rejectRefund(id_pesanan, alasan = null) {
    const pesanan = pesananList.find((p) => p.id_pesanan === id_pesanan);
    const payload = { refund_status: "Ditolak" };
    if (alasan) payload.refund_alasan = alasan;
    const { data: updated, error } = await supabase.from("pesanan_online").
    update(payload).eq("id_pesanan", id_pesanan).eq("refund_status", "Diminta").select("id_pesanan");
    if (error) throw error;
    if (!updated?.length) throw new Error("Gagal menolak refund. Permintaan mungkin sudah diproses.");
    await notifRefundDitolak({ id_pesanan, id_pelanggan: pesanan?.pelanggan?.id, alasan });
    await fetchPesanan(true);
  }

  return {
    pesananList: filteredList,
    stats, loading, error, lastUpdated,
    statusList: STATUS_LIST, waktuList: WAKTU_LIST,
    filterStatus, setFilterStatus,
    filterWaktu, setFilterWaktu,
    filterTanggal, setFilterTanggal,

    applyFilter: () => {setAppliedStatus(filterStatus);setAppliedWaktu(filterWaktu);setAppliedTanggal(filterTanggal);},

    resetFilter: () => {setFilterStatus("Semua");setFilterWaktu("Semua");setFilterTanggal("");setAppliedStatus("Semua");setAppliedWaktu("Semua");setAppliedTanggal("");},
    updateStatus, rejectRefund, fmtRp
  };
}