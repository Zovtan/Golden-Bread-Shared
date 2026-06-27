






import { enforceRateLimit } from "./lib/rateLimit.js";

const snapUrl = (isProd) =>
isProd ?
"https://app.midtrans.com/snap/v1/transactions" :
"https://app.sandbox.midtrans.com/snap/v1/transactions";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }



  const limited = enforceRateLimit(event, "midtrans-snap", { windowMs: 60_000, max: 15 });
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

  let payload;
  try {payload = JSON.parse(event.body || "{}");}
  catch {return { statusCode: 400, body: JSON.stringify({ error: "Body permintaan tidak valid." }) };}

  const { id_pesanan, finishUrl } = payload;
  if (!id_pesanan) {
    return { statusCode: 400, body: JSON.stringify({ error: "id_pesanan wajib diisi." }) };
  }



  const expiryMinutes = Number(process.env.MIDTRANS_EXPIRY_MINUTES ?? 60);



  const sbHeaders = { Authorization: `Bearer ${userToken}`, apikey: supabaseAnon };
  let order, details;
  try {
    const orderRes = await fetch(
      `${supabaseUrl}/rest/v1/pesanan_online?id_pesanan=eq.${id_pesanan}` +
      `&select=id_pesanan,id_pelanggan,status,ongkir,nama_penerima,no_telp_penerima`,
      { headers: sbHeaders }
    );
    if (!orderRes.ok) return { statusCode: 401, body: JSON.stringify({ error: "Sesi tidak valid." }) };
    const orders = await orderRes.json().catch(() => []);
    order = orders?.[0];

    if (!order) {
      return { statusCode: 404, body: JSON.stringify({ error: "Pesanan tidak ditemukan." }) };
    }
    if (order.status !== "Pending_Payment") {
      return { statusCode: 409, body: JSON.stringify({ error: "Pesanan tidak menunggu pembayaran." }) };
    }

    const detRes = await fetch(
      `${supabaseUrl}/rest/v1/detail_pesanan_online?id_pesanan=eq.${id_pesanan}` +
      `&select=qty,harga_satuan,id_produk,produk:id_produk(nama_produk)`,
      { headers: sbHeaders }
    );
    details = await detRes.json().catch(() => []);
    if (!Array.isArray(details) || details.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "Detail pesanan kosong." }) };
    }
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: "Gagal mengambil data pesanan: " + err.message }) };
  }



  const orderId = `GOLDEN-${id_pesanan}`;
  const itemDetails = details.map((d) => ({
    id: String(d.id_produk),
    price: Math.round(Number(d.harga_satuan)),
    quantity: Number(d.qty),
    name: String(d.produk?.nama_produk ?? "Produk").slice(0, 50)
  }));
  const ongkir = Math.round(Number(order.ongkir ?? 0));
  if (ongkir > 0) itemDetails.push({ id: "ONGKIR", price: ongkir, quantity: 1, name: "Ongkos Kirim" });
  const grossAmount = itemDetails.reduce((s, i) => s + i.price * i.quantity, 0);
  if (grossAmount <= 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "Total pembayaran tidak valid." }) };
  }

  try {
    const res = await fetch(snapUrl(isProd), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": "Basic " + Buffer.from(serverKey + ":").toString("base64")
      },
      body: JSON.stringify({
        transaction_details: { order_id: orderId, gross_amount: grossAmount },
        item_details: itemDetails,
        customer_details: { first_name: order.nama_penerima, phone: order.no_telp_penerima },

        ...(expiryMinutes > 0 ? { expiry: { unit: "minutes", duration: expiryMinutes } } : {}),

        ...(finishUrl ? { callbacks: { finish: finishUrl } } : {})
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify({ error: data?.error_messages?.join(", ") ?? "Gagal membuat token pembayaran." }) };
    }
    if (!data?.token) {
      return { statusCode: 502, body: JSON.stringify({ error: "Token tidak diterima dari Midtrans." }) };
    }
    return { statusCode: 200, body: JSON.stringify({ token: data.token, orderId }) };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: "Tidak dapat menghubungi Midtrans: " + err.message }) };
  }
};