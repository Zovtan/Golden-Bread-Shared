


import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";

const SUCCESS = ["settlement", "capture", "success"];
const PENDINGS = ["pending"];
const FAILED = ["deny", "cancel", "expire", "failure"];

export default function PaymentResultPage({ variant = "finish" }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const orderId = params.get("order_id") || "";
  const trxStatus = (params.get("transaction_status") || "").toLowerCase();
  const idPesanan = orderId.startsWith("GOLDEN-") ? orderId.slice(7) : null;


  const isError = variant === "error" || FAILED.includes(trxStatus);
  const paid = !isError && SUCCESS.includes(trxStatus);
  const pending = !isError && PENDINGS.includes(trxStatus);

  useEffect(() => {


    if (paid && idPesanan) {
      supabase.rpc("pelanggan_konfirmasi_pembayaran", { p_id: Number(idPesanan) }).
      then(() => {}, () => {});
    }
  }, [paid, idPesanan]);

  const icon = isError ? "✕" : paid ? "✓" : "⏳";
  const color = isError ? "#dc2626" : paid ? "#15803d" : "#b45309";
  const title = isError ? "Pembayaran Gagal" :
  paid ? "Pembayaran Berhasil!" :
  pending ? "Menunggu Konfirmasi Pembayaran" :
  "Memproses Pembayaran…";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", background: "#fffdf8" }}>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "2rem", maxWidth: 380, width: "100%", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,.06)" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: color + "18", color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", margin: "0 auto 1rem" }}>{icon}</div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1f2937", marginBottom: ".5rem" }}>{title}</h1>
        {orderId && <p style={{ fontSize: ".8125rem", color: "#6b7280", marginBottom: ".75rem" }}>No. Pesanan: {orderId}</p>}
        <p style={{ fontSize: ".8125rem", color: "#6b7280", marginBottom: "1.25rem" }}>
          {isError ?
          "Pembayaran tidak selesai. Kamu bisa memesan lagi atau menghubungi kami." :
          "Cek status pesananmu di menu Pesanan."}
        </p>
        <button onClick={() => navigate("/", { replace: true })}
        style={{ width: "100%", padding: ".75rem", borderRadius: 10, border: "none", background: "#92400e", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
          Kembali ke Beranda
        </button>
      </div>
    </div>);

}