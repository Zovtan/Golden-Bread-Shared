import { getFreshAccessToken } from "./authToken";



export async function loadMidtransSnap() {
  if (window.snap) return true;
  return new Promise((resolve) => {
    const isProd = import.meta.env.VITE_MIDTRANS_ENV === "production";
    const script = document.createElement("script");
    script.src = isProd ?
    "https://app.midtrans.com/snap/snap.js" :
    "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", import.meta.env.VITE_MIDTRANS_CLIENT_KEY ?? "");
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}



export function buildOrderId(id_pesanan) {
  return `GOLDEN-${id_pesanan}`;
}




export async function createSnapToken({ id_pesanan, finishUrl }) {
  const accessToken = await getFreshAccessToken();
  const res = await fetch("/.netlify/functions/midtrans-snap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ id_pesanan, finishUrl })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("Gagal membuat token pembayaran: " + (data?.error ?? res.statusText));
  if (!data?.token) throw new Error("Token tidak diterima dari server.");
  return { token: data.token, orderId: data.orderId ?? buildOrderId(id_pesanan) };
}



export function openSnap(token) {
  return new Promise((resolve, reject) => {
    window.snap.pay(token, {
      onSuccess: (res) => resolve({ status: "success", res }),
      onPending: (res) => resolve({ status: "pending", res }),
      onError: (res) => reject(new Error("Pembayaran Midtrans gagal: " + JSON.stringify(res))),
      onClose: () => resolve({ status: "closed" })
    });
  });
}



export async function refundMidtrans({ midtrans_order_id, amount, reason = "Pesanan dibatalkan" }) {
  if (!midtrans_order_id) throw new Error("Midtrans order ID tidak tersedia untuk refund.");

  const accessToken = await getFreshAccessToken();
  const res = await fetch("/.netlify/functions/midtrans-refund", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ midtrans_order_id, amount, reason })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("Gagal memproses refund: " + (data?.error ?? res.statusText));
  return data;
}