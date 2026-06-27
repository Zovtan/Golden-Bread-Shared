import { useState, useEffect } from "react";
import Modal from "../../../../shared/components/Modal";
import { fmtRp } from "../../../../shared/utils/format";
import { useSubmitLock } from "../../../../shared/hooks/useSubmitLock";


export default function EditBatasPesananModal({ open, onClose, batas, onSubmit }) {
  const [form, setForm] = useState({});
  const [waktuList, setWaktuList] = useState([]);
  const [newWaktu, setNewWaktu] = useState("");
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const guard = useSubmitLock();

  useEffect(() => {
    if (!open) return;
    setForm({
      min_segera: String(batas?.min_segera ?? 5),
      min_preorder: String(batas?.min_preorder ?? 200),
      max_preorder: String(batas?.max_preorder ?? 500),
      ongkir_base: String(batas?.ongkir_base ?? 0),
      ongkir_multiplier_aktif: batas?.ongkir_multiplier_aktif ?? false,
      ongkir_multiplier: String(batas?.ongkir_multiplier ?? 1.5),
      jam_mulai_segera: batas?.jam_mulai_segera ?? "08:00",
      jam_selesai_segera: batas?.jam_selesai_segera ?? "17:00",
      jam_mulai_preorder: batas?.jam_mulai_preorder ?? "08:00",
      jam_selesai_preorder: batas?.jam_selesai_preorder ?? "17:00",
      menerima_segera: batas?.menerima_segera ?? true,
      menerima_preorder: batas?.menerima_preorder ?? true,
      menit_highlight_segera: String(batas?.menit_highlight_segera ?? 15)
    });
    setWaktuList(
      Array.isArray(batas?.waktu_antar_preorder) ?
      [...batas.waktu_antar_preorder] :
      ["07:00 - 09:00", "09:00 - 11:00", "11:00 - 13:00", "13:00 - 15:00"]
    );
    setNewWaktu("");
    setApiError("");
  }, [open, batas]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const addWaktu = () => {
    const trimmed = newWaktu.trim();

    if (!trimmed || !/^\d{2}:\d{2}$/.test(trimmed)) return;
    if (waktuList.includes(trimmed)) return;
    setWaktuList((l) => [...l, trimmed].sort());
    setNewWaktu("");
  };
  const removeWaktu = (idx) => setWaktuList((l) => l.filter((_, i) => i !== idx));
  const moveWaktu = (idx, dir) => setWaktuList((l) => {
    const next = [...l];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return next;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    return next;
  });

  const handleSubmit = guard(async () => {
    const min_segera = Number(form.min_segera);
    const min_preorder = Number(form.min_preorder);
    const max_preorder = Number(form.max_preorder);
    const ongkir_base = Number(form.ongkir_base);
    const ongkir_multiplier_aktif = form.ongkir_multiplier_aktif ?? false;
    const jam_mulai_segera = form.jam_mulai_segera;
    const jam_selesai_segera = form.jam_selesai_segera;
    const jam_mulai_preorder = form.jam_mulai_preorder;
    const jam_selesai_preorder = form.jam_selesai_preorder;

    if ([min_segera, min_preorder, max_preorder, ongkir_base].some(isNaN)) {
      setApiError("Pastikan semua nilai angka valid.");return;
    }
    if (min_preorder >= max_preorder) {
      setApiError("Min preorder harus lebih kecil dari max preorder.");return;
    }
    if (!jam_mulai_segera || !jam_selesai_segera) {
      setApiError("Jam operasional segera antar wajib diisi.");return;
    }
    if (jam_mulai_segera >= jam_selesai_segera) {
      setApiError("Jam mulai segera antar harus lebih awal dari jam selesai.");return;
    }
    if (!jam_mulai_preorder || !jam_selesai_preorder) {
      setApiError("Jam operasional pre-order wajib diisi.");return;
    }
    if (jam_mulai_preorder >= jam_selesai_preorder) {
      setApiError("Jam mulai pre-order harus lebih awal dari jam selesai.");return;
    }
    if (waktuList.length === 0) {
      setApiError("Minimal satu opsi waktu antar preorder wajib ada.");return;
    }

    const menit_highlight_segera = Number(form.menit_highlight_segera);
    if (isNaN(menit_highlight_segera) || menit_highlight_segera < 1) {
      setApiError("Menit highlight segera antar harus angka positif.");return;
    }

    setSaving(true);
    try {
      await onSubmit({
        min_segera, min_preorder, max_preorder,
        ongkir_base, ongkir_multiplier_aktif,
        ongkir_multiplier: Number(form.ongkir_multiplier) || 1.5,
        jam_mulai_segera, jam_selesai_segera,
        jam_mulai_preorder, jam_selesai_preorder,
        waktu_antar_preorder: JSON.stringify(waktuList),
        menerima_segera: form.menerima_segera,
        menerima_preorder: form.menerima_preorder,
        menit_highlight_segera
      });
      onClose();
    } catch (e) {setApiError(e.message);} finally
    {setSaving(false);}
  });

  return (
    <Modal open={open} onClose={onClose} title="Edit Konfigurasi Pesanan" maxWidth="480px"
    footer={
    <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Batal</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan…" : "Simpan"}</button>
        </>
    }>
      {apiError && <p style={{ color: "#dc2626", fontSize: ".875rem", marginBottom: ".75rem" }}>{apiError}</p>}

      <p style={{ fontSize: ".8125rem", color: "#6b7280", marginBottom: "1rem" }}>
        Perubahan langsung berlaku untuk semua pengguna.
      </p>

      <div style={{ border: "1px solid #fca5a5", background: "#fff7f7", borderRadius: 8, padding: ".75rem 1rem", marginBottom: "1rem" }}>
        <div style={{ fontWeight: 600, color: "#b91c1c", fontSize: ".875rem", marginBottom: ".5rem" }}>Tutup Penerimaan Pesanan</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={!form.menerima_segera}
              onChange={(e) => setForm((f) => ({ ...f, menerima_segera: !e.target.checked }))}
              style={{ width: 16, height: 16, cursor: "pointer" }} />
            
            <div>
              <div style={{ fontWeight: 500, color: "#b91c1c", fontSize: ".8125rem" }}>Tutup Segera Antar</div>
              <div style={{ fontSize: ".75rem", color: "#dc2626", marginTop: 1 }}>
                Centang untuk menghentikan sementara pesanan segera antar.
              </div>
            </div>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={!form.menerima_preorder}
              onChange={(e) => setForm((f) => ({ ...f, menerima_preorder: !e.target.checked }))}
              style={{ width: 16, height: 16, cursor: "pointer" }} />
            
            <div>
              <div style={{ fontWeight: 500, color: "#b91c1c", fontSize: ".8125rem" }}>Tutup Pre-order</div>
              <div style={{ fontSize: ".75rem", color: "#dc2626", marginTop: 1 }}>
                Centang untuk menghentikan sementara pesanan pre-order.
              </div>
            </div>
          </label>
        </div>
      </div>

      {}
      <div style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: ".75rem", marginBottom: ".75rem" }}>
        <div style={{ fontSize: ".8125rem", fontWeight: 600, color: "#374151", marginBottom: ".5rem" }}>Batas Pesanan</div>
        <div className="form-field">
          <label>Min. Qty Segera Antar</label>
          <input type="number" min="1" value={form.min_segera ?? ""} onChange={set("min_segera")} />
        </div>

        <div style={{ borderTop: "1px dashed #e5e7eb", margin: "1rem 0" }}>
          <div style={{ fontSize: ".8125rem", fontWeight: 600, color: "#374151", marginBottom: ".5rem" }}>Ongkir Dinamis Berbasis Jarak</div>
          <div className="form-field">
            <label>Ongkir Basis (Rp) - sebelum dikalikan jarak</label>
            <input type="number" min="0" value={form.ongkir_base ?? ""} onChange={set("ongkir_base")} />
            {form.ongkir_base ? <span style={{ fontSize: ".75rem", color: "#6b7280", marginBottom: "0.75rem" }}>{fmtRp(Number(form.ongkir_base))}</span> : null}
          </div>
          <div className="form-field">
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox"
              checked={form.ongkir_multiplier_aktif ?? false}
              onChange={(e) => setForm((f) => ({ ...f, ongkir_multiplier_aktif: e.target.checked }))}
              style={{ width: 16, height: 16 }} />        
              Aktifkan multiplier ongkir berdasarkan jarak
            </label>
            {!form.ongkir_multiplier_aktif &&
            <span style={{ fontSize: ".75rem", color: "#9ca3af", display: "block", marginTop: 2 }}>
                Jika tidak aktif, ongkir yang digunakan adalah Ongkir Basis di atas.
              </span>
            }
          </div>
          {form.ongkir_multiplier_aktif && (() => {
            const b = Number(form.ongkir_base) || 0;
            const round500 = (v) => Math.round(v / 500) * 500;
            return (
              <span style={{ fontSize: ".75rem", color: "#6b7280", marginTop: 4, display: "block" }}>
                Tier hasil (dibulatkan ke 500):&nbsp;
                0–3 km = {fmtRp(round500(b * 1))} &nbsp;·&nbsp;
                3–6 km = {fmtRp(round500(b * 2))} &nbsp;·&nbsp;
                6–10 km = {fmtRp(round500(b * 3))} &nbsp;·&nbsp;
                &gt;10 km = {fmtRp(round500(b * 4))}
              </span>);

          })()}
        </div>
        <div className="form-field">
          <label>Highlight Segera Antar Setelah (menit)</label>
          <input type="number" min="1" max="120" value={form.menit_highlight_segera ?? ""} onChange={set("menit_highlight_segera")} />
          <span style={{ fontSize: ".75rem", color: "#6b7280" }}>
            Baris segera antar yang masih Pending akan diberi warna setelah N menit sejak diterima.
          </span>
        </div>
        <div className="form-field">
          <label>Min. Qty Pre-order</label>
          <input type="number" min="1" value={form.min_preorder ?? ""} onChange={set("min_preorder")} />
        </div>
        <div className="form-field">
          <label>Maks. Qty Pre-order</label>
          <input type="number" min="1" value={form.max_preorder ?? ""} onChange={set("max_preorder")} />
        </div>
      </div>

      <div style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: ".75rem", marginBottom: ".75rem" }}>
        <div style={{ fontSize: ".8125rem", fontWeight: 600, color: "#374151", marginBottom: ".5rem" }}>Jam Operasional Segera Antar</div>
        <p style={{ fontSize: ".75rem", color: "#6b7280", marginBottom: ".5rem" }}>
          Pelanggan hanya bisa memesan segera antar dalam rentang jam ini (WIB).
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="form-field" style={{ flex: 1, margin: 0 }}>
            <label>Jam Mulai</label>
            <input type="time" value={form.jam_mulai_segera ?? ""} onChange={set("jam_mulai_segera")} />
          </div>
          <div className="form-field" style={{ flex: 1, margin: 0 }}>
            <label>Jam Selesai</label>
            <input type="time" value={form.jam_selesai_segera ?? ""} onChange={set("jam_selesai_segera")} />
          </div>
        </div>
      </div>

      <div style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: ".75rem", marginBottom: ".75rem" }}>
        <div style={{ fontSize: ".8125rem", fontWeight: 600, color: "#374151", marginBottom: ".5rem" }}>Jam Operasional Pre-order</div>
        <p style={{ fontSize: ".75rem", color: "#6b7280", marginBottom: ".5rem" }}>
          Pelanggan hanya bisa memasukkan pesanan pre-order dalam rentang jam ini (WIB).
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="form-field" style={{ flex: 1, margin: 0 }}>
            <label>Jam Mulai</label>
            <input type="time" value={form.jam_mulai_preorder ?? ""} onChange={set("jam_mulai_preorder")} />
          </div>
          <div className="form-field" style={{ flex: 1, margin: 0 }}>
            <label>Jam Selesai</label>
            <input type="time" value={form.jam_selesai_preorder ?? ""} onChange={set("jam_selesai_preorder")} />
          </div>
        </div>
      </div>

      <div style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: ".75rem", marginBottom: ".75rem" }}>
        <div style={{ fontSize: ".8125rem", fontWeight: 600, color: "#374151", marginBottom: ".5rem" }}>Opsi Waktu Antar Pre-order</div>
        <p style={{ fontSize: ".75rem", color: "#6b7280", marginBottom: ".5rem" }}>
          Jam antar yang tersedia di form pre-order pelanggan. Highlight akan ditampilkan 24 jam sebelum waktu ini.
        </p>
        {waktuList.map((w, i) =>
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ flex: 1, fontSize: ".875rem", padding: ".3rem .5rem", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 5 }}>{w}</span>
            <button type="button" onClick={() => moveWaktu(i, -1)} disabled={i === 0}
          style={{ padding: "2px 7px", fontSize: ".75rem", border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer", background: "#fff" }}>↑</button>
            <button type="button" onClick={() => moveWaktu(i, 1)} disabled={i === waktuList.length - 1}
          style={{ padding: "2px 7px", fontSize: ".75rem", border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer", background: "#fff" }}>↓</button>
            <button type="button" onClick={() => removeWaktu(i)}
          style={{ padding: "2px 7px", fontSize: ".75rem", border: "1px solid #fca5a5", borderRadius: 4, cursor: "pointer", background: "#fff", color: "#dc2626" }}>✕</button>
          </div>
        )}
        <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center" }}>
          <input type="time" value={newWaktu} onChange={(e) => setNewWaktu(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addWaktu()}
          style={{ flex: 1, padding: ".35rem .5rem", fontSize: ".875rem", border: "1px solid #d1d5db", borderRadius: 5 }} />
          <button type="button" onClick={addWaktu}
          style={{ padding: ".35rem .75rem", fontSize: ".875rem", background: "#16a34a", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }}>
            + Tambah
          </button>
        </div>
      </div>
    </Modal>);

}