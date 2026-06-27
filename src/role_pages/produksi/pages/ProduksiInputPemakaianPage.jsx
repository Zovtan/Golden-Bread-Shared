import { useState } from "react";
import { useProduksiInputPemakaian } from "../hooks/useProduksiInputPemakaian";
import SearchableSelect from "../../../shared/components/SearchableSelect";
import QtyInput from "../../../shared/components/QtyInput";
import { labelBahan, labelBahanPendek } from "../../../shared/utils/bahanLabel";
import { sumJumlahBahanLain } from "../../../shared/utils/pemakaianBahanUtils";
import { useSubmitLock } from "../../../shared/hooks/useSubmitLock";

const INIT_ROW = () => ({ id: Date.now(), id_bahan: "", jumlah: "" });


export default function ProduksiInputPemakaianPage({ onNavigate }) {
  const { bahanList, loading, error, submitPemakaian } = useProduksiInputPemakaian();

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
    rows.forEach((r) => {
      if (!r.id_bahan) err[`${r.id}_id_bahan`] = "Pilih bahan";
      if (!r.jumlah || Number(r.jumlah) <= 0) err[`${r.id}_jumlah`] = "Isi jumlah";else
      {
        const b = bahanList.find((b) => String(b.id_bahan) === r.id_bahan);
        if (b) {
          const alreadyUsed = sumJumlahBahanLain(rows, r.id, r.id_bahan);
          if (Number(r.jumlah) + alreadyUsed > b.totalStok)
          err[`${r.id}_jumlah`] = `Melebihi stok (${b.totalStok} ${b.satuan})`;
        }
      }
    });

    const seen = {};
    rows.forEach((r) => {
      if (!r.id_bahan) return;
      if (seen[r.id_bahan]) err[`${r.id}_id_bahan`] = "Bahan sudah dipilih di baris lain";
      seen[r.id_bahan] = true;
    });
    return err;
  };

  const handleSubmit = guard(async () => {
    setApiError("");
    const err = validate();
    if (Object.keys(err).length) {setErrors(err);return;}
    setSaving(true);
    try {
      await submitPemakaian(rows.map((r) => ({ id_bahan: Number(r.id_bahan), jumlah: Number(r.jumlah) })));
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

  const totalItems = rows.filter((r) => r.id_bahan && Number(r.jumlah) > 0).length;
  const selectedIds = new Set(rows.map((r) => r.id_bahan).filter(Boolean));

  return (
    <div className="input-page-layout">

      {}
      <div className="db-card">
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Bahan Baku Terpakai</h2>

        {apiError && <p style={{ color: "#dc2626", fontSize: ".875rem", marginBottom: ".75rem" }}>{apiError}</p>}
        {success && <p style={{ color: "#16a34a", fontSize: ".875rem", marginBottom: ".75rem" }}>✓ Pemakaian berhasil disimpan.</p>}
        {error && <p className="db-fetch-error">{error}</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          {rows.map((row, idx) => {
            const selBahan = bahanList.find((b) => String(b.id_bahan) === row.id_bahan);
            return (
              <div key={row.id} style={{ background: "#f9fafb", borderRadius: 8, padding: "1rem", position: "relative" }}>
                <div style={{ fontWeight: 600, fontSize: ".875rem", marginBottom: ".5rem", color: "#374151" }}>
                  Bahan Baku {idx + 1}
                </div>

                <div className="input-item-row-3">
                  <div className="form-field" style={{ margin: 0 }}>
                    <label>Nama Bahan Baku</label>
                    <SearchableSelect
                      value={row.id_bahan}
                      onChange={(val) => setField(row.id, "id_bahan", val)}
                      placeholder="Pilih Bahan Baku..."
                      options={bahanList.
                      filter((b) => !selectedIds.has(String(b.id_bahan)) || String(b.id_bahan) === row.id_bahan).
                      map((b) => ({
                        value: String(b.id_bahan),
                        label: labelBahan(b),
                        sub: `Stok: ${b.totalStok} ${b.satuan}`
                      }))
                      } />
                    
                    {errors[`${row.id}_id_bahan`] &&
                    <span className="field-error">{errors[`${row.id}_id_bahan`]}</span>
                    }
                  </div>

                  <div className="form-field" style={{ margin: 0 }}>
                    <label>Jumlah{selBahan ? ` (${selBahan.satuan})` : ""}</label>
                    <QtyInput
                      value={Number(row.jumlah) || 0}
                      max={selBahan ? selBahan.totalStok - sumJumlahBahanLain(rows, row.id, row.id_bahan) : undefined}
                      step={0.01}
                      onChange={(v) => setField(row.id, "jumlah", v)}
                      style={{ width: "100%", textAlign: "left", border: "1px solid #e5e7eb",
                        borderRadius: 6, padding: "6px 8px", fontSize: ".875rem" }} />
                    
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
              </div>);

          })}
        </div>

        <button
          onClick={addRow}
          style={{ marginTop: ".75rem", background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: ".875rem", padding: "0.25rem 0" }}>
          
          + Tambah bahan baku
        </button>
      </div>

      {}
      <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
        <div className="db-card" style={{ padding: "1rem" }}>
          <div style={{ fontWeight: 600, fontSize: ".9375rem", marginBottom: ".75rem" }}>Ringkasan Pemakaian</div>

          {rows.filter((r) => r.id_bahan && Number(r.jumlah) > 0).map((r) => {
            const b = bahanList.find((b) => String(b.id_bahan) === r.id_bahan);
            return (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: ".8125rem", marginBottom: ".375rem", color: "#374151" }}>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
                  {labelBahanPendek(b, "-")}
                </span>
                <span style={{ whiteSpace: "nowrap", fontWeight: 500 }}>
                  {r.jumlah} {b?.satuan}
                </span>
              </div>);

          })}

          {totalItems === 0 &&
          <div style={{ color: "#9ca3af", fontSize: ".8125rem" }}>-</div>
          }

          <div style={{ borderTop: "1px solid #e5e7eb", marginTop: ".75rem", paddingTop: ".75rem", display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: ".875rem" }}>
            <span>Total Pemakaian</span>
            <span>{totalItems}</span>
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