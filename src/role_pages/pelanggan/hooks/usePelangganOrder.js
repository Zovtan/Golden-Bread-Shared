import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { validateProductStock, stockErrorMessage } from "../../../shared/utils/stockValidator";
import { buildOrderId } from "../../../shared/utils/midtransUtils";
import { getFreshAccessToken } from "../../../shared/utils/authToken";





export function usePelangganOrder() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);









  async function submitOrder({
    profile, cart, jenis, jenisBayar,
    waktuAntar = null, lat = null, lng = null, ongkir = null,
    namaPenerima = null, noTelpPenerima = null, alamatPengiriman = null, catatan = null
  }) {
    setSubmitting(true);setError(null);
    try {



      await getFreshAccessToken();


      if (jenis === "segera") {
        const stockErrors = await validateProductStock(
          cart.map((i) => ({ id_produk: i.id, qty: i.qty, nama: i.nama }))
        );
        if (stockErrors.length) {
          throw new Error(stockErrorMessage(stockErrors));
        }
      }


      const _nama = namaPenerima || profile.nama_lengkap;
      const _telp = noTelpPenerima || profile.no_telp;
      const _alamat = alamatPengiriman || profile.alamat || "";
      if (!_nama) throw new Error("Nama penerima wajib diisi.");
      if (!_telp) throw new Error("Nomor telepon penerima wajib diisi.");



      const insertPayload = {
        id_pelanggan: profile.id,
        id_user: profile.id,
        waktu_antar: waktuAntar ? waktuAntar.toISOString() : null,
        status: jenisBayar === "Midtrans" ? "Pending_Payment" : "Pending",
        jenis_pembayaran: jenisBayar || null,
        nama_penerima: _nama,
        no_telp_penerima: _telp,
        alamat_pengiriman: _alamat,
        catatan: catatan || null
      };
      if (lat != null) insertPayload.lat = lat;
      if (lng != null) insertPayload.lng = lng;
      if (ongkir != null) insertPayload.ongkir = ongkir;


      const { data: pesanan, error: e1 } = await supabase.
      from("pesanan_online").
      insert(insertPayload).
      select("id_pesanan").
      single();
      if (e1) throw e1;

      const id_pesanan = pesanan.id_pesanan;




      if (jenisBayar === "Midtrans") {
        await supabase.rpc("pelanggan_set_pembayaran_pesanan", {
          p_id: id_pesanan,
          p_midtrans_order_id: buildOrderId(id_pesanan)
        });
      }



      const details = cart.map((item) => ({
        id_pesanan,
        id_produk: item.id,
        qty: item.qty,
        harga_satuan: item.harga_num
      }));

      const { error: e2 } = await supabase.from("detail_pesanan_online").insert(details);
      if (e2) {

        await supabase.from("pesanan_online").delete().eq("id_pesanan", id_pesanan);
        throw e2;
      }

      const total = cart.reduce((s, i) => s + i.harga_num * i.qty, 0);


      return { id_pesanan, total };
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setSubmitting(false);
    }
  }


  async function saveSnapToken(id_pesanan, token) {
    const { error } = await supabase.rpc("pelanggan_set_pembayaran_pesanan", {
      p_id: id_pesanan, p_snap_token: token
    });
    if (error) throw error;
  }


  async function confirmPayment(id_pesanan) {
    const { error } = await supabase.rpc("pelanggan_konfirmasi_pembayaran", { p_id: id_pesanan });
    if (error) throw error;
  }

  return { submitOrder, confirmPayment, saveSnapToken, submitting, error };
}