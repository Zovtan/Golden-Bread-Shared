import { useMemo } from "react";
import { sel } from "../../../../shared/hooks/useEnums";
import { fmtRpDecimal } from "../../../../shared/utils/format";
import SearchableSelect from "../../../../shared/components/SearchableSelect";










export default function BahanItemSection({ items, bahanList, enums, errors, onChange }) {
  const jenisList = useMemo(
    () => [...sel.bahanJenis(enums)].sort(),
    [enums]
  );

  const setItem = (idx, patch) =>
  onChange(items.map((it, i) => i === idx ? { ...it, ...patch } : it));

  const addItem = () =>
  onChange([...items, emptyItem()]);

  const removeItem = (idx) =>
  onChange(items.filter((_, i) => i !== idx));

  const handleJenisChange = (idx, val) => {
    setItem(idx, { jenis_bahan: val, id_bahan: "", merek: "", satuan: "", newMerek: false, newMerekData: null });
  };

  const handleMerekChange = (idx, val) => {
    if (val === "__new__") {
      setItem(idx, { id_bahan: "", merek: "", satuan: "", newMerek: true, newMerekData: { merek: "", satuan: "", stok_minimal: "1", batas_peringatan_hari: "7" } });
    } else {
      const match = bahanList.find((b) => String(b.id_bahan) === val);
      setItem(idx, { id_bahan: val, merek: match?.merek ?? "", satuan: match?.satuan ?? "", newMerek: false, newMerekData: null });
    }
  };

  const handleNewMerekField = (idx, key, val) =>
  onChange(items.map((it, i) => i === idx ?
  { ...it, newMerekData: { ...it.newMerekData, [key]: val } } :
  it
  ));

  const grandTotal = items.reduce((s, it) =>
  s + (Number(it.jumlah) || 0) * (Number(it.harga_satuan) || 0), 0);

  return (
    <div className="item-section">
      <div className="item-section-header">Bahan yang Dibeli</div>

      {items.map((item, idx) => {
        const usedIds = new Set(
          items.
          filter((it, i) => i !== idx && !it.newMerek && it.id_bahan).
          map((it) => String(it.id_bahan))
        );
        const merekOpts = bahanList.
        filter((b) => b.jenis_bahan === item.jenis_bahan && !usedIds.has(String(b.id_bahan))).
        map((b) => ({ id_bahan: b.id_bahan, merek: b.merek })).
        sort((a, b) => a.merek.localeCompare(b.merek));

        const subtotal = (Number(item.jumlah) || 0) * (Number(item.harga_satuan) || 0);

        return (
          <div key={idx} className="item-row">
            <div className="item-row-header">
              <span style={{ fontWeight: 600, fontSize: ".875rem" }}>Bahan {idx + 1}</span>
              {items.length > 1 &&
              <button type="button" className="item-remove-btn" onClick={() => removeItem(idx)} title="Hapus">×</button>
              }
            </div>

            {}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".6rem" }}>
              <div className="form-field" style={{ margin: 0 }}>
                <label>Jenis Bahan</label>
                <SearchableSelect
                  value={item.jenis_bahan}
                  onChange={(v) => handleJenisChange(idx, v)}
                  placeholder="Pilih jenis..."
                  options={jenisList.map((j) => ({ value: j, label: j }))} />
                
                {errors?.[`jenis_bahan_${idx}`] && <span className="field-error">{errors[`jenis_bahan_${idx}`]}</span>}
              </div>

              <div className="form-field" style={{ margin: 0 }}>
                <label>Merek</label>
                <SearchableSelect
                  value={item.newMerek ? "__new__" : item.id_bahan}
                  onChange={(v) => handleMerekChange(idx, v)}
                  disabled={!item.jenis_bahan}
                  placeholder="Pilih merek..."
                  options={[
                  ...merekOpts.map((m) => ({ value: String(m.id_bahan), label: m.merek })),
                  { value: "__new__", label: "+ Merek baru..." }]
                  } />
                
                {errors?.[`id_bahan_${idx}`] && <span className="field-error">{errors[`id_bahan_${idx}`]}</span>}
              </div>
            </div>

            {}
            {item.newMerek && item.newMerekData &&
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: ".75rem", marginTop: ".4rem" }}>
                <div style={{ fontSize: ".78rem", fontWeight: 600, color: "#6b7280", marginBottom: ".5rem" }}>Detail Merek Baru</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".5rem" }}>
                  <div className="form-field" style={{ margin: 0 }}>
                    <label>Nama Merek</label>
                    <input type="text" value={item.newMerekData.merek}
                  onChange={(e) => handleNewMerekField(idx, "merek", e.target.value)} placeholder="Nama merek..." />
                    {errors?.[`merek_${idx}`] && <span className="field-error">{errors[`merek_${idx}`]}</span>}
                  </div>
                  <div className="form-field" style={{ margin: 0 }}>
                    <label>Satuan</label>
                    <SearchableSelect
                    value={item.newMerekData.satuan}
                    onChange={(v) => handleNewMerekField(idx, "satuan", v)}
                    placeholder="Pilih satuan..."
                    options={sel.satuan(enums).map((s) => ({ value: s, label: s }))} />
                  
                    {errors?.[`satuan_${idx}`] && <span className="field-error">{errors[`satuan_${idx}`]}</span>}
                  </div>
                  <div className="form-field" style={{ margin: 0 }}>
                    <label>Stok Minimal</label>
                    <input type="number" min="1" value={item.newMerekData.stok_minimal}
                  onChange={(e) => handleNewMerekField(idx, "stok_minimal", e.target.value)} />
                  </div>
                  <div className="form-field" style={{ margin: 0 }}>
                    <label>Peringatan (hari)</label>
                    <input type="number" min="1" value={item.newMerekData.batas_peringatan_hari}
                  onChange={(e) => handleNewMerekField(idx, "batas_peringatan_hari", e.target.value)} />
                  </div>
                </div>
              </div>
            }

            {}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".6rem", marginTop: ".4rem" }}>
              <div className="form-field" style={{ margin: 0 }}>
                <label>Jumlah {item.satuan ? `(${item.satuan})` : ""}</label>
                <input type="number" min="1" value={item.jumlah}
                onChange={(e) => setItem(idx, { jumlah: e.target.value })} placeholder="0" />
                {errors?.[`jumlah_${idx}`] && <span className="field-error">{errors[`jumlah_${idx}`]}</span>}
              </div>
              <div className="form-field" style={{ margin: 0 }}>
                <label>Harga Satuan (Rp)</label>
                <input type="number" min="0" value={item.harga_satuan}
                onChange={(e) => setItem(idx, { harga_satuan: e.target.value })} placeholder="0" />
                {errors?.[`harga_satuan_${idx}`] && <span className="field-error">{errors[`harga_satuan_${idx}`]}</span>}
              </div>
            </div>

            {}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".6rem", marginTop: ".4rem" }}>
              <div className="form-field" style={{ margin: 0 }}>
                <label>Tanggal Kadaluarsa</label>
                <input type="date" value={item.kadaluarsa}
                onChange={(e) => setItem(idx, { kadaluarsa: e.target.value })} />
              </div>
              <div className="form-field" style={{ margin: 0 }}>
                <label>Subtotal</label>
                <input readOnly value={fmtRpDecimal(subtotal)} style={{ background: "#f9fafb", color: "#374151" }} />
              </div>
            </div>
          </div>);

      })}

      <button type="button" className="item-add-btn" onClick={addItem}>
        <span className="item-add-icon">⊕</span>
      </button>

      {grandTotal > 0 &&
      <div style={{ marginTop: ".75rem", paddingTop: ".5rem", borderTop: "1px solid #e5e7eb",
        display: "flex", justifyContent: "flex-end", fontWeight: 600, fontSize: ".9rem", color: "#111827" }}>
          Total: {fmtRpDecimal(grandTotal)}
        </div>
      }
    </div>);

}


export const emptyItem = () => ({
  id_bahan: "", jenis_bahan: "", merek: "", satuan: "",
  jumlah: "", harga_satuan: "", kadaluarsa: "",
  newMerek: false, newMerekData: null
});