import { useState } from "react";
import { useProduksiInputHasil } from "../hooks/useProduksiInputHasil";
import SearchableSelect from "../../../shared/components/SearchableSelect";
import { useSubmitLock } from "../../../shared/hooks/useSubmitLock";

const INIT_ROW = () => ({ id: Date.now(), id_produk: "", jumlah: "" });


export default function ProduksiInputHasilPage({ onNavigate }) {
  const { produkList, loading, error, submitHasilProduksi } = useProduksiInputHasil();

  const [rows, setRows] = useState([INIT_ROW()]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);
  const guard = useSubmitLock();

  const addRow = () => setRows((r) => [...r, INIT_ROW()]);
  const removeRow = (id) => setRows((r) => r.filter((x) => x.id !== id));

  const setField = (id, key, val) => {
    setRows((r) => r.map((x) => x.id === id ? { ...x, [key]: val } : x));
    setErrors((e) => ({ ...e, [`${id}_${key}`]: undefined }));
  };

  const validate = () => {
    const err = {};
    const seen = {};
    rows.forEach((r) => {
      if (!r.id_produk) err[`${r.id}_id_produk`] = "Pilih produk";else
      if (seen[r.id_produk]) err[`${r.id}_id_produk`] = "Produk sudah dipilih di baris lain";else
      seen[r.id_produk] = true;
      if (!r.jumlah || Number(r.jumlah) <= 0) err[`${r.id}_jumlah`] = "Isi jumlah";
    });
    return err;
  };

  const handleSubmit = guard(async () => {
    setApiError("");
    const err = validate();
    if (Object.keys(err).length) {setErrors(err);return;}
    setSaving(true);
    try {
      await submitHasilProduksi(rows.map((r) => ({ id_produk: Number(r.id_produk), jumlah: Number(r.jumlah) })));
      setRows([INIT_ROW()]);
      setErrors({});
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setApiError(e.message);
    } finally {
      setSaving(false);
    }
  });

  const handleBatal = () => {
    setRows([INIT_ROW()]);
    setErrors({});
    setApiError("");
    onNavigate?.("dashboard");
  };

  const filledRows = rows.filter((r) => r.id_produk && Number(r.jumlah) > 0);
  const totalPcs = filledRows.reduce((s, r) => s + Number(r.jumlah), 0);
  const selectedIds = new Set(rows.map((r) => r.id_produk).filter(Boolean));

  return (
    <div className="input-page-layout">

      {}
      <div className="db-card">
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Produk yang Dihasilkan</h2>

        {apiError && <p style={{ color: "#dc2626", fontSize: ".875rem", marginBottom: ".75rem" }}>{apiError}</p>}
        {success && <p style={{ color: "#16a34a", fontSize: ".875rem", marginBottom: ".75rem" }}>✓ Hasil produksi berhasil disimpan.</p>}
        {error && <p className="db-fetch-error">{error}</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          {rows.map((row, idx) =>
          <div key={row.id} style={{ background: "#f9fafb", borderRadius: 8, padding: "1rem" }}>
              <div style={{ fontWeight: 600, fontSize: ".875rem", marginBottom: ".5rem", color: "#374151" }}>
                Produk {idx + 1}
              </div>

              <div className="input-item-row-3">
                <div className="form-field" style={{ margin: 0 }}>
                  <label>Nama Produk</label>
                  <SearchableSelect
                  value={row.id_produk}
                  onChange={(val) => setField(row.id, "id_produk", val)}
                  placeholder="Pilih produk..."
                  options={produkList.
                  filter((p) => !selectedIds.has(String(p.id_produk)) || String(p.id_produk) === row.id_produk).
                  map((p) => ({ value: String(p.id_produk), label: p.nama_produk }))
                  } />
                
                  {errors[`${row.id}_id_produk`] &&
                <span className="field-error">{errors[`${row.id}_id_produk`]}</span>
                }
                </div>

                <div className="form-field" style={{ margin: 0 }}>
                  <label>Jumlah (pcs)</label>
                  <input
                  type="number" min="1" step="1"
                  value={row.jumlah}
                  onChange={(e) => setField(row.id, "jumlah", e.target.value)}
                  placeholder="0" />
                
                  {errors[`${row.id}_jumlah`] &&
                <span className="field-error">{errors[`${row.id}_jumlah`]}</span>
                }
                </div>

                <button
                onClick={() => removeRow(row.id)}
                disabled={rows.length === 1}
                style={{
                  background: "none", border: "none", cursor: rows.length === 1 ? "not-allowed" : "pointer",
                  color: rows.length === 1 ? "#d1d5db" : "#6b7280", fontSize: "1.25rem",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0
                }}
                title="Hapus baris">
                
                  ⊗
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={addRow}
          style={{ marginTop: ".75rem", background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: ".875rem", padding: "0.25rem 0" }}>
          
          + Tambah produk
        </button>
      </div>

      {}
      <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
        <div className="db-card" style={{ padding: "1rem" }}>
          <div style={{ fontWeight: 600, fontSize: ".9375rem", marginBottom: ".75rem" }}>Ringkasan Produksi</div>

          {filledRows.map((r) => {
            const p = produkList.find((p) => String(p.id_produk) === r.id_produk);
            return (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: ".8125rem", marginBottom: ".375rem", color: "#374151" }}>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
                  {p?.nama_produk ?? "-"}
                </span>
                <span style={{ whiteSpace: "nowrap", fontWeight: 500 }}>{r.jumlah} pcs</span>
              </div>);

          })}

          {filledRows.length === 0 &&
          <div style={{ color: "#9ca3af", fontSize: ".8125rem" }}>-</div>
          }

          <div style={{ borderTop: "1px solid #e5e7eb", marginTop: ".75rem", paddingTop: ".75rem", display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: ".875rem" }}>
            <span>Total Produksi</span>
            <span>{totalPcs > 0 ? `${totalPcs} pcs` : "0 pcs"}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving || loading}>
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
          <button className="btn-secondary" onClick={handleBatal} disabled={saving}>
            Batal
          </button>
        </div>
      </div>
    </div>);

}