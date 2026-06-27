


import crypto from "node:crypto";
import { enforceRateLimit } from "./lib/rateLimit.js";

const UPLOAD_FOLDER = "golden-bread/produk";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }



  const limited = enforceRateLimit(event, "cloudinary-sign", { windowMs: 60_000, max: 20 });
  if (limited) return limited;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return { statusCode: 500, body: JSON.stringify({ error: "Konfigurasi Cloudinary server belum lengkap." }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseAnon = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    return { statusCode: 500, body: JSON.stringify({ error: "Konfigurasi Supabase server belum lengkap." }) };
  }


  const authHeader = event.headers.authorization || event.headers.Authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: "Token autentikasi tidak ada." }) };
  }

  try {

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: supabaseAnon }
    });
    if (!userRes.ok) {
      return { statusCode: 401, body: JSON.stringify({ error: "Sesi tidak valid." }) };
    }
    const user = await userRes.json();


    const profRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=role`,
      { headers: { Authorization: `Bearer ${token}`, apikey: supabaseAnon } }
    );
    const profs = await profRes.json().catch(() => []);
    if (profs?.[0]?.role !== "Admin") {
      return { statusCode: 403, body: JSON.stringify({ error: "Hanya admin yang dapat mengunggah gambar." }) };
    }
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: "Gagal memverifikasi sesi: " + err.message }) };
  }




  const timestamp = Math.round(Date.now() / 1000);
  const toSign = `folder=${UPLOAD_FOLDER}&timestamp=${timestamp}`;
  const signature = crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");

  return {
    statusCode: 200,
    body: JSON.stringify({ signature, timestamp, apiKey, cloudName, folder: UPLOAD_FOLDER })
  };
};