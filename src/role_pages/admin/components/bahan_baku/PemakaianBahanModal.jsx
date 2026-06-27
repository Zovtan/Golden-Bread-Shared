import { useState } from "react";
import Modal from "../../../../shared/components/Modal";
import { usePemakaianBahan } from "../../hooks/useBahanBakuManajemen";
import SearchableSelect from "../../../../shared/components/SearchableSelect";
import { labelBahan, labelBahanPendek } from "../../../../shared/utils/bahanLabel";
import QtyInput from "../../../../shared/components/QtyInput";
import { sumJumlahBahanLain } from "../../../../shared/utils/pemakaianBahanUtils";
import { useSubmitLock } from "../../../../shared/hooks/useSubmitLock";

const INIT_ROW = () => ({ id: Date.now(), id_bahan: "", jumlah: "" });


export default function PemakaianBahanModal({ open, onClose, onSuccess, fetchBahan }) {
  const { bahanList, loading, error, submitPemakaian } = usePemakaianBahan(fetchBahan);

  const [rows, setRows] = useState([INIT_ROW()]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);
  const guard = useSubmitLock();

  const selectedIds = new Set(rows.map((r) => r.id_bahan).filter(Boolean));

  const addRow = () => setRows((r) => [...r, INIT_ROW()]);
  const removeRow = (id) => setRows((r) => r.filter((x) => x.id !== id));
  const setField = (id, key, val) => {
    setRows((r) => r.map((x) => x.id === id ? { ...x, [key]: val } : x));
    setErrors((e) => ({ ...e, [`${id}_${key}`]: undefined }));
  };

  const validate = () => {
    const err = {};
    rows.forEach((r) => {
      if (!r.id_bahan) {err[`${r.id}_id_bahan`] = "Pilih bahan";return;}
      if (!r.jumlah || Number(r.jumlah) <= 0) {err[`${r.id}_jumlah`] = "Isi jumlah";return;}
      const b = bahanList.find((b) => String(b.id_bahan) === r.id_bahan);
      if (b && Number(r.jumlah) + sumJumlahBahanLain(rows, r.id, r.id_bahan) > b.totalStok)
      err[`${r.id}_jumlah`] = `Melebihi stok (${b.totalStok} ${b.satuan})`;
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
      onSuccess?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {setApiError(e.message);} finally
    {setSaving(false);}
  });

  const handleClose = () => {
    setRows([INIT_ROW()]);
    setErrors({});
    setApiError("");
    setSuccess(false);
    onClose();
  };

  const filledRows = rows.filter((r) => r.id_bahan && Number(r.jumlah) > 0);

  return (
    <Modal open={open} onClose={handleClose} title="Input Pemakaian Bahan Baku"
    maxWidth="600px"
    footer={
    <>
          <button className="btn-secondary" onClick={handleClose} disabled={saving}>Batal</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving || loading}>
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </>
    }>
      
      {apiError && <p style={{ color: "#dc2626", fontSize: ".875rem", marginBottom: ".75rem" }}>{apiError}</p>}
      {success && <p style={{ color: "#16a34a", fontSize: ".875rem", marginBottom: ".75rem" }}>✓ Pemakaian berhasil disimpan.</p>}
      {error && <p className="db-fetch-error">{error}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
        {rows.map((row, idx) => {
          const selBahan = bahanList.find((b) => String(b.id_bahan) === row.id_bahan);
          return (
            <div key={row.id} style={{ background: "#f9fafb", borderRadius: 8, padding: "1rem" }}>
              <div style={{ fontWeight: 600, fontSize: ".875rem", marginBottom: ".5rem", color: "#374151" }}>
                Bahan Baku {idx + 1}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 32px", gap: ".5rem", alignItems: "end" }}>
                <div className="form-field" style={{ margin: 0 }}>
                  <label>Nama Bahan Baku</label>
                  <SearchableSelect
                    value={row.id_bahan}
                    onChange={(v) => setField(row.id, "id_bahan", v)}
                    placeholder="Pilih Bahan Baku..."
                    options={bahanList.
                    filter((b) => !selectedIds.has(String(b.id_bahan)) || String(b.id_bahan) === row.id_bahan).
                    map((b) => ({
                      value: String(b.id_bahan),
                      label: labelBahan(b),
                      sub: `Stok: ${b.totalStok} ${b.satuan}`
                    }))} />
                  
                  {errors[`${row.id}_id_bahan`] && <span className="field-error">{errors[`${row.id}_id_bahan`]}</span>}
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
                  
                  {errors[`${row.id}_jumlah`] && <span className="field-error">{errors[`${row.id}_jumlah`]}</span>}
                </div>
                <button onClick={() => removeRow(row.id)} disabled={rows.length === 1}
                style={{ background: "none", border: "none", cursor: rows.length === 1 ? "not-allowed" : "pointer",
                  color: rows.length === 1 ? "#d1d5db" : "#6b7280", fontSize: "1.25rem",
                  width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "50%", flexShrink: 0 }}>
                  ⊗
                </button>
              </div>
            </div>);

        })}
      </div>

      <button onClick={addRow}
      style={{ marginTop: ".75rem", background: "none", border: "none", color: "#6b7280",
        cursor: "pointer", fontSize: ".875rem", padding: "0.25rem 0" }}>
        + Tambah bahan baku
      </button>

      {filledRows.length > 0 &&
      <div style={{ marginTop: "1rem", borderTop: "1px solid #e5e7eb", paddingTop: ".75rem" }}>
          <div style={{ fontWeight: 600, fontSize: ".875rem", marginBottom: ".5rem" }}>Ringkasan</div>
          {filledRows.map((r) => {
          const b = bahanList.find((b) => String(b.id_bahan) === r.id_bahan);
          return (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: ".8125rem", color: "#374151", marginBottom: ".25rem" }}>
                <span>{labelBahanPendek(b, "-")}</span>
                <span style={{ fontWeight: 500 }}>{r.jumlah} {b?.satuan}</span>
              </div>);

        })}
        </div>
      }
    </Modal>);

}