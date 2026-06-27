import { useState, useEffect } from "react";
import Modal from "../../../../shared/components/Modal";
import { supabase } from "../../../../lib/supabase";
import { fmtDateTime } from "../../../../shared/utils/format";


function parseItems(val) {
  if (!val) return [];
  const str = typeof val === "string" ? val : JSON.stringify(val);
  if (!str || str === "-") return [];
  return str.split(",").map((s) => {
    const m = s.trim().match(/^(.+?)\s*[×x]\s*(\d+)$/);
    return m ? { nama: m[1].trim(), qty: Number(m[2]) } : { nama: s.trim(), qty: null };
  }).filter((i) => i.nama);
}


async function fetchRiwayat(id_penjualan) {
  const { data } = await supabase.
  from("log_aktivitas").
  select("id_log, timestamp, data_sebelum, data_sesudah, detail_json, profile:profiles!id_user(nama_lengkap)").
  eq("modul", "penjualan_langsung").
  eq("aktivitas", "UPDATE").
  order("timestamp", { ascending: false }).
  limit(100);

  return (data ?? []).filter((l) => {
    const dj = l.detail_json ?? {};
    return String(dj.no_pesanan) === String(id_penjualan) && dj.field === "Item Pesanan";
  });
}


export default function RiwayatEditModal({ open, onClose, id_penjualan, no_pesanan }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !id_penjualan) return;

    setLoading(true);
    setError(null);
    fetchRiwayat(id_penjualan).
    then(setRows).
    catch((e) => setError(e.message)).
    finally(() => setLoading(false));
  }, [open, id_penjualan]);

  return (
    <Modal
      open={open} onClose={onClose}
      title={`Riwayat Edit - Pesanan #${no_pesanan ?? id_penjualan}`}
      maxWidth="560px"
      footer={<button className="btn-secondary" onClick={onClose}>Tutup</button>}>
      
      {loading && <p className="db-loading-text">Memuat riwayat…</p>}
      {error && <p className="db-fetch-error">{error}</p>}

      {!loading && !error && rows.length === 0 &&
      <p style={{ color: "#6b7280", fontSize: ".875rem", textAlign: "center", padding: "1.5rem 0" }}>
          Belum ada riwayat perubahan untuk pesanan ini.
        </p>
      }

      {!loading && rows.map((r, idx) => {
        const before = parseItems(r.data_sebelum);
        const after = parseItems(r.data_sesudah);
        const editor = r.profile?.nama_lengkap ?? "-";
        const waktu = fmtDateTime(r.timestamp);
        return (
          <div key={r.id_log} style={{
            borderBottom: idx < rows.length - 1 ? "1px solid #e5e7eb" : "none",
            padding: ".75rem 0"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".8125rem", color: "#6b7280", marginBottom: ".375rem" }}>
              <span>{waktu}</span>
              <span>oleh <strong style={{ color: "#374151" }}>{editor}</strong></span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".5rem" }}>
              <div>
                <div style={{ fontSize: ".75rem", fontWeight: 600, color: "#dc2626", marginBottom: ".25rem", textTransform: "uppercase", letterSpacing: ".04em" }}>Sebelum</div>
                {before.length ? before.map((i, j) =>
                <div key={j} style={{ fontSize: ".8125rem", display: "flex", justifyContent: "space-between", padding: ".15rem 0", color: "#374151" }}>
                    <span>{i.nama}</span>
                    {i.qty != null && <span style={{ color: "#6b7280" }}>×{i.qty}</span>}
                  </div>
                ) : <span style={{ fontSize: ".8125rem", color: "#9ca3af" }}>-</span>}
              </div>

              <div>
                <div style={{ fontSize: ".75rem", fontWeight: 600, color: "#16a34a", marginBottom: ".25rem", textTransform: "uppercase", letterSpacing: ".04em" }}>Sesudah</div>
                {after.length ? after.map((i, j) =>
                <div key={j} style={{ fontSize: ".8125rem", display: "flex", justifyContent: "space-between", padding: ".15rem 0", color: "#374151" }}>
                    <span>{i.nama}</span>
                    {i.qty != null && <span style={{ color: "#6b7280" }}>×{i.qty}</span>}
                  </div>
                ) : <span style={{ fontSize: ".8125rem", color: "#9ca3af" }}>-</span>}
              </div>
            </div>
          </div>);

      })}
    </Modal>);

}