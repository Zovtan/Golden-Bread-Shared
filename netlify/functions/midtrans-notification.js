



import crypto from "node:crypto";
import { enforceRateLimit } from "./lib/rateLimit.js";

const refundUrl = (isProd, orderId) =>
isProd ?
`https://api.midtrans.com/v2/${orderId}/refund` :
`https://api.sandbox.midtrans.com/v2/${orderId}/refund`;



export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }





  const limited = enforceRateLimit(event, "midtrans-notification", { windowMs: 60_000, max: 300 });
  if (limited) return limited;

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "MIDTRANS_SERVER_KEY belum diatur." }) };
  }
  const isProd = (process.env.MIDTRANS_ENV ?? process.env.VITE_MIDTRANS_ENV) === "production";

  let body;
  try {body = JSON.parse(event.body || "{}");}
  catch {return { statusCode: 400, body: JSON.stringify({ error: "Body tidak valid." }) };}

  const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = body;
  if (!order_id || !signature_key) {
    return { statusCode: 400, body: JSON.stringify({ error: "Notifikasi tidak lengkap." }) };
  }


  const expected = crypto.createHash("sha512").
  update(`${order_id}${status_code}${gross_amount}${serverKey}`).digest("hex");
  if (expected !== signature_key) {
    return { statusCode: 401, body: JSON.stringify({ error: "Signature tidak valid." }) };
  }


  const idPesanan = String(order_id).startsWith("GOLDEN-") ? String(order_id).slice(7) : null;
  if (!idPesanan) return { statusCode: 200, body: JSON.stringify({ message: "order_id diabaikan." }) };


  const paid = transaction_status === "settlement" || transaction_status === "capture" && fraud_status === "accept";
  const expired = transaction_status === "expire";






  if (!paid && !expired) return { statusCode: 200, body: JSON.stringify({ message: "Tidak ada perubahan status." }) };



  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Konfigurasi Supabase server belum lengkap (SUPABASE_SECRET_KEY)." }) };
  }
  const sb = (path, init = {}) => fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });

  try {

    const getRes = await sb(`pesanan_online?id_pesanan=eq.${idPesanan}&select=status,refund_status,id_pelanggan`);
    const rows = await getRes.json().catch(() => []);
    const order = rows?.[0];
    if (!order) return { statusCode: 200, body: JSON.stringify({ message: "Pesanan tidak ditemukan." }) };


    if (expired) {
      if (order.status === "Pending_Payment") {
        await sb(`pesanan_online?id_pesanan=eq.${idPesanan}&status=eq.Pending_Payment`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ status: "Dibatalkan", pesan_pembatalan: "Batas waktu pembayaran habis (Midtrans)" })
        });
      }
      return { statusCode: 200, body: JSON.stringify({ message: "OK", status: "Dibatalkan" }) };
    }


    if (order.status === "Pending_Payment") {
      await sb(`pesanan_online?id_pesanan=eq.${idPesanan}&status=eq.Pending_Payment`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status: "Pending" })
      });
      return { statusCode: 200, body: JSON.stringify({ message: "OK", status: "Pending" }) };
    }



    if (order.status === "Dibatalkan" && !order.refund_status) {
      const refundRes = await fetch(refundUrl(isProd, order_id), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Basic " + Buffer.from(serverKey + ":").toString("base64")
        },
        body: JSON.stringify({
          refund_amount: Math.round(Number(gross_amount)),
          reason: "Pembayaran diterima setelah pesanan dibatalkan"
        })
      });
      const refundData = await refundRes.json().catch(() => ({}));
      if (!refundRes.ok) {

        return { statusCode: 500, body: JSON.stringify({ error: "Refund otomatis gagal: " + (refundData?.status_message ?? refundRes.status) }) };
      }
      await sb(`pesanan_online?id_pesanan=eq.${idPesanan}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ refund_status: "Disetujui", pesan_pembatalan: "Pembayaran diterima setelah pembatalan - direfund otomatis" })
      });

      if (order.id_pelanggan) {
        await sb("notifikasi", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            id_user: order.id_pelanggan,
            tipe: "Pesanan_Baru",
            pesan: `Pesanan #${idPesanan} telah direfund.\n💸 Pembayaran yang masuk setelah pembatalan dikembalikan otomatis.`,
            dibaca: false,
            waktu: new Date().toISOString(),
            id_pesanan: Number(idPesanan)
          })
        });
      }
      return { statusCode: 200, body: JSON.stringify({ message: "Refund otomatis berhasil", id_pesanan: idPesanan }) };
    }


    return { statusCode: 200, body: JSON.stringify({ message: "Tidak ada perubahan." }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Webhook gagal: " + err.message }) };
  }
};