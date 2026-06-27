

import { enforceRateLimit } from "./lib/rateLimit.js";

const refundUrl = (isProd, orderId) =>
isProd ?
`https://api.midtrans.com/v2/${orderId}/refund` :
`https://api.sandbox.midtrans.com/v2/${orderId}/refund`;

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }


  const limited = enforceRateLimit(event, "midtrans-refund", { windowMs: 60_000, max: 20 });
  if (limited) return limited;

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const isProd = (process.env.MIDTRANS_ENV ?? process.env.VITE_MIDTRANS_ENV) === "production";
  if (!serverKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "MIDTRANS_SERVER_KEY belum diatur di environment." }) };
  }


  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseAnon = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  const authHeader = event.headers.authorization || event.headers.Authorization || "";
  const userToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!supabaseUrl || !supabaseAnon) {
    return { statusCode: 500, body: JSON.stringify({ error: "Konfigurasi Supabase server belum lengkap." }) };
  }
  if (!userToken) {
    return { statusCode: 401, body: JSON.stringify({ error: "Token autentikasi tidak ada." }) };
  }
  try {
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${userToken}`, apikey: supabaseAnon }
    });
    if (!userRes.ok) return { statusCode: 401, body: JSON.stringify({ error: "Sesi tidak valid. Silakan login ulang." }) };
    const u = await userRes.json();
    const profRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${u.id}&select=role`, {
      headers: { Authorization: `Bearer ${userToken}`, apikey: supabaseAnon }
    });
    const profs = await profRes.json().catch(() => []);
    if (!["Admin", "Kasir"].includes(profs?.[0]?.role)) {
      return { statusCode: 403, body: JSON.stringify({ error: "Hanya admin atau kasir yang dapat memproses refund." }) };
    }
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: "Gagal memverifikasi sesi: " + err.message }) };
  }

  let payload;
  try {payload = JSON.parse(event.body || "{}");}
  catch {return { statusCode: 400, body: JSON.stringify({ error: "Body permintaan tidak valid." }) };}

  const { midtrans_order_id, amount, reason = "Pesanan dibatalkan" } = payload;
  if (!midtrans_order_id) {
    return { statusCode: 400, body: JSON.stringify({ error: "midtrans_order_id wajib diisi." }) };
  }

  try {
    const res = await fetch(refundUrl(isProd, midtrans_order_id), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": "Basic " + Buffer.from(serverKey + ":").toString("base64")
      },
      body: JSON.stringify({ refund_amount: amount, reason })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify({ error: data?.status_message ?? "Gagal memproses refund." }) };
    }
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: "Tidak dapat menghubungi Midtrans: " + err.message }) };
  }
};