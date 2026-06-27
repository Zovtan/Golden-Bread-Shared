import { useState, useMemo } from "react";
import { sel } from "../../../shared/hooks/useEnums";
import { useProduksiInputPembelian } from "../hooks/useProduksiInputPembelian";
import { fmtRpDecimal, todayWIB } from "../../../shared/utils/format";
import SearchableSelect from "../../../shared/components/SearchableSelect";
import { useSubmitLock } from "../../../shared/hooks/useSubmitLock";
import { trimStrings } from "../../../shared/utils/trimStrings";

const INIT_ROW = () => ({
  id: Date.now(),
  jenis_bahan: "", id_bahan: "", merek: "",
  id_supplier: "", newSupplier: null, newMerek: false,
  satuan: "", stok_minimal: "1", batas_peringatan_hari: "7",
  jumlah: "", harga_satuan: "", kadaluarsa: "", status_pembayaran: "",
  jatuh_tempo: "", no_faktur: ""
});

const INIT_SUPPLIER = { nama_supplier: "", no_telp: "", alamat: "" };


export default function ProduksiInputPembelianPage({ onNavigate }) {
  const { bahanList, supplierList, enums, loading, error, submitPembelian } = useProduksiInputPembelian();

  const [rows, setRows] = useState([INIT_ROW()]);
  const [sharedSupplier, setSharedSupplier] = useState("");
  const [sharedNewSup, setSharedNewSup] = useState(false);
  const [sharedSupForm, setSharedSupForm] = useState(INIT_SUPPLIER);
  const [sharedStatus, setSharedStatus] = useState("");
  const [sharedJatuhTempo, setSharedJatuhTempo] = useState("");
  const [sharedNoFaktur, setSharedNoFaktur] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);
  const guard = useSubmitLock();

  const jenisList = useMemo(
    () => [...sel.bahanJenis(enums)].sort(),
    [enums]
  );

  const setField = (id, key, val) => {
    setRows((r) => r.map((x) => x.id === id ? { ...x, [key]: val } : x));
    setErrors((e) => ({ ...e, [`${id}_${key}`]: undefined }));
  };

  const handleJenisChange = (rowId, val) => {
    setRows((r) => r.map((x) => x.id === rowId ? { ...x, jenis_bahan: val, id_bahan: "", merek: "", newMerek: false } : x));
    setErrors((e) => ({ ...e, [`${rowId}_jenis_bahan`]: undefined, [`${rowId}_id_bahan`]: undefined }));
  };

  const handleMerekChange = (rowId, val) => {
    if (val === "__new__") {
      setRows((r) => r.map((x) => x.id === rowId ? { ...x, newMerek: true, id_bahan: "", merek: "" } : x));
    } else {
      const match = bahanList.find((b) => String(b.id_bahan) === val);
      setRows((r) => r.map((x) => x.id === rowId ? { ...x, newMerek: false, id_bahan: val, merek: match?.merek ?? "" } : x));
    }
    setErrors((e) => ({ ...e, [`${rowId}_id_bahan`]: undefined, [`${rowId}_merek`]: undefined }));
  };

  const addRow = () => setRows((r) => [...r, INIT_ROW()]);
  const removeRow = (id) => setRows((r) => r.filter((x) => x.id !== id));

  const validate = () => {
    const err = {};
    if (!sharedNewSup && !sharedStatus) err.sharedStatus = "Pilih status pembayaran";
    if (sharedNewSup && !sharedSupForm.nama_supplier.trim()) err.sharedSupplier = "Isi nama supplier baru";
    if (sharedStatus === "Tempo" && !sharedJatuhTempo) err.jatuh_tempo = "Isi tanggal jatuh tempo";

    rows.forEach((r) => {
      if (!r.jenis_bahan) err[`${r.id}_jenis_bahan`] = "Pilih jenis barang";
      if (!r.newMerek && !r.id_bahan) err[`${r.id}_id_bahan`] = "Pilih merek";
      if (r.newMerek && !r.merek?.trim()) err[`${r.id}_merek`] = "Isi nama merek baru";
      if (r.newMerek && !r.satuan) err[`${r.id}_satuan`] = "Pilih satuan";
      if (!r.jumlah || Number(r.jumlah) <= 0) err[`${r.id}_jumlah`] = "Isi jumlah";
      if (!r.harga_satuan || Number(r.harga_satuan) <= 0) err[`${r.id}_harga_satuan`] = "Isi harga";
    });
    return err;
  };

  const handleSubmit = guard(async () => {
    setApiError("");
    const err = validate();
    if (Object.keys(err).length) {setErrors(err);return;}
    setSaving(true);
    try {
      await submitPembelian(rows.map((r, idx) => trimStrings({
        ...r,
        id_supplier: sharedNewSup ? "__new__" : sharedSupplier,
        newSupplier: idx === 0 && sharedNewSup ? trimStrings(sharedSupForm) : null,
        status_pembayaran: sharedStatus,
        jatuh_tempo: sharedStatus === "Tempo" ? sharedJatuhTempo : null,
        no_faktur: sharedNoFaktur.trim() || null
      })));
      setRows([INIT_ROW()]);
      setSharedSupplier("");
      setSharedStatus("");
      setSharedJatuhTempo("");
      setSharedNoFaktur("");
      setSharedNewSup(false);
      setSharedSupForm(INIT_SUPPLIER);
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
    setRows([INIT_ROW()]);setErrors({});setApiError("");
    setSharedSupplier("");setSharedStatus("");setSharedNoFaktur("");
    onNavigate?.("dashboard");
  };

  const totalBayar = rows.reduce((s, r) => s + (Number(r.jumlah) || 0) * (Number(r.harga_satuan) || 0), 0);

  return (
    <div className="input-page-layout">

      {}
      <div className="db-card">
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Daftar Beli</h2>

        {apiError && <p style={{ color: "#dc2626", fontSize: ".875rem", marginBottom: ".75rem" }}>{apiError}</p>}
        {success && <p style={{ color: "#16a34a", fontSize: ".875rem", marginBottom: ".75rem" }}>✓ Pembelian berhasil disimpan.</p>}
        {error && <p className="db-fetch-error">{error}</p>}

        {}
        <div style={{ background: "#f0f9ff", borderRadius: 8, padding: "1rem", marginBottom: "1rem", border: "1px solid #bae6fd" }}>
          <div style={{ fontWeight: 600, fontSize: ".8125rem", color: "#0369a1", marginBottom: ".5rem" }}>Info Pembelian (berlaku untuk semua barang)</div>
          <div className="input-form-row-2">
            <div className="form-field" style={{ margin: 0 }}>
              <label>Supplier <span style={{ fontWeight: 400, color: "#6b7280" }}>(opsional)</span></label>
              <SearchableSelect
                value={sharedNewSup ? "__new__" : sharedSupplier}
                onChange={(val) => {
                  if (val === "__new__") {setSharedNewSup(true);setSharedSupplier("__new__");} else
                  {setSharedNewSup(false);setSharedSupplier(val);}
                  setErrors((err) => ({ ...err, sharedSupplier: undefined }));
                }}
                placeholder="- Tanpa supplier -"
                options={[
                { value: "", label: "- Tanpa supplier -" },
                ...supplierList.map((s) => ({ value: s.id_supplier, label: s.nama_supplier })),
                { value: "__new__", label: "+ Tambah supplier baru..." }]
                } />
              
            </div>

            <div className="form-field" style={{ margin: 0 }}>
              <label>Status Pembayaran</label>
              <select value={sharedStatus} onChange={(e) => {
                setSharedStatus(e.target.value);
                if (e.target.value !== "Tempo") setSharedJatuhTempo("");
                setErrors((err) => ({ ...err, sharedStatus: undefined, jatuh_tempo: undefined }));
              }}>
                <option value="">Pilih status...</option>
                {sel.statusPembayaran(enums).map((s) => <option key={s} value={s}>{s === "Belum" ? "Belum Bayar" : s}</option>)}
              </select>
              {errors.sharedStatus && <span className="field-error">{errors.sharedStatus}</span>}
            </div>

            {sharedStatus === "Tempo" &&
            <div className="form-field" style={{ margin: 0 }}>
                <label>Jatuh Tempo</label>
                <input type="date" value={sharedJatuhTempo}
              min={todayWIB()}
              onChange={(e) => {setSharedJatuhTempo(e.target.value);setErrors((err) => ({ ...err, jatuh_tempo: undefined }));}} />
                {errors.jatuh_tempo && <span className="field-error">{errors.jatuh_tempo}</span>}
              </div>
            }
          </div>

          <div className="form-field" style={{ margin: 0 }}>
              <label>No. Faktur <span style={{ fontWeight: 400, color: "#6b7280" }}>(opsional)</span></label>
              <input
              type="text"
              value={sharedNoFaktur}
              onChange={(e) => setSharedNoFaktur(e.target.value)}
              placeholder="Nomor faktur / invoice..." />
            
            </div>

          {sharedNewSup &&
          <div className="input-form-row-3" style={{ marginTop: ".75rem" }}>
              <div className="form-field" style={{ margin: 0 }}>
                <label>Nama Supplier Baru</label>
                <input type="text" value={sharedSupForm.nama_supplier}
              onChange={(e) => setSharedSupForm((f) => ({ ...f, nama_supplier: e.target.value }))}
              placeholder="Nama supplier..." />
                {errors.sharedSupplier && <span className="field-error">{errors.sharedSupplier}</span>}
              </div>
              <div className="form-field" style={{ margin: 0 }}>
                <label>No. Telepon</label>
                <input type="text" value={sharedSupForm.no_telp}
              onChange={(e) => setSharedSupForm((f) => ({ ...f, no_telp: e.target.value }))}
              placeholder="08xx..." />
              </div>
              <div className="form-field" style={{ margin: 0 }}>
                <label>Alamat</label>
                <input type="text" value={sharedSupForm.alamat}
              onChange={(e) => setSharedSupForm((f) => ({ ...f, alamat: e.target.value }))}
              placeholder="Alamat..." />
              </div>
            </div>
          }
        </div>

        {}
        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          {rows.map((row, idx) => {
            const merekListForJenis = bahanList.
            filter((b) => b.jenis_bahan === row.jenis_bahan && b.merek).
            map((b) => ({ id_bahan: b.id_bahan, merek: b.merek })).
            sort((a, b) => a.merek.localeCompare(b.merek));


            const usedInJenis = new Set(
              rows.filter((r) => r.id !== row.id && r.jenis_bahan === row.jenis_bahan && !r.newMerek && r.id_bahan).
              map((r) => r.id_bahan)
            );

            const subtotal = (Number(row.jumlah) || 0) * (Number(row.harga_satuan) || 0);

            return (
              <div key={row.id} style={{ background: "#f9fafb", borderRadius: 8, padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".5rem" }}>
                  <span style={{ fontWeight: 600, fontSize: ".875rem", color: "#374151" }}>Barang {idx + 1}</span>
                  <button onClick={() => removeRow(row.id)} disabled={rows.length === 1}
                  style={{ background: "none", border: "none", cursor: rows.length === 1 ? "not-allowed" : "pointer", color: rows.length === 1 ? "#d1d5db" : "#6b7280", fontSize: "1.125rem" }}>
                    ⊗
                  </button>
                </div>

                {}
                <div className="input-form-row-3" style={{ marginBottom: ".5rem" }}>
                  <div className="form-field" style={{ margin: 0 }}>
                    <label>Jenis Bahan Baku</label>
                    <SearchableSelect
                      value={row.jenis_bahan}
                      onChange={(val) => handleJenisChange(row.id, val)}
                      placeholder="Pilih jenis bahan baku..."
                      options={jenisList.map((j) => ({ value: j, label: j }))} />
                    
                    {errors[`${row.id}_jenis_bahan`] && <span className="field-error">{errors[`${row.id}_jenis_bahan`]}</span>}
                  </div>

                  <div className="form-field" style={{ margin: 0 }}>
                    <label>Merek</label>
                    <SearchableSelect
                      value={row.newMerek ? "__new__" : row.id_bahan}
                      onChange={(val) => handleMerekChange(row.id, val)}
                      placeholder="Pilih merek..."
                      disabled={!row.jenis_bahan}
                      options={[
                      ...merekListForJenis.
                      filter((m) => !usedInJenis.has(String(m.id_bahan)) || String(m.id_bahan) === row.id_bahan).
                      map((m) => ({ value: String(m.id_bahan), label: m.merek })),
                      { value: "__new__", label: "+ Tambah merek baru..." }]
                      } />
                    
                    {errors[`${row.id}_id_bahan`] && <span className="field-error">{errors[`${row.id}_id_bahan`]}</span>}
                  </div>

                  <div className="form-field" style={{ margin: 0 }}>
                    <label>Kadaluarsa</label>
                    <input type="date" value={row.kadaluarsa} onChange={(e) => setField(row.id, "kadaluarsa", e.target.value)} />
                  </div>
                </div>

                {}
                {row.newMerek &&
                <div className="input-form-row-beli">
                    <div className="form-field" style={{ margin: 0 }}>
                      <label>Nama Merek Baru</label>
                      <input type="text" value={row.merek} onChange={(e) => setField(row.id, "merek", e.target.value)} placeholder="Ketik nama merek..." />
                      {errors[`${row.id}_merek`] && <span className="field-error">{errors[`${row.id}_merek`]}</span>}
                    </div>
                    <div className="form-field" style={{ margin: 0 }}>
                      <label>Satuan</label>
                      <SearchableSelect
                      value={row.satuan}
                      onChange={(v) => setField(row.id, "satuan", v)}
                      placeholder="Pilih satuan..."
                      options={sel.satuan(enums).map((s) => ({ value: s, label: s }))} />
                    
                      {errors[`${row.id}_satuan`] && <span className="field-error">{errors[`${row.id}_satuan`]}</span>}
                    </div>
                    <div className="form-field" style={{ margin: 0 }}>
                      <label>Stok Min.</label>
                      <input type="number" min="1" value={row.stok_minimal} onChange={(e) => setField(row.id, "stok_minimal", e.target.value)} />
                    </div>
                    <div className="form-field" style={{ margin: 0 }}>
                      <label>Peringatan (hari)</label>
                      <input type="number" min="1" value={row.batas_peringatan_hari} onChange={(e) => setField(row.id, "batas_peringatan_hari", e.target.value)} />
                    </div>
                  </div>
                }

                {}
                <div className="input-form-row-3">
                  <div className="form-field" style={{ margin: 0 }}>
                    <label>Jumlah</label>
                    <input type="number" min="1" value={row.jumlah} onChange={(e) => setField(row.id, "jumlah", e.target.value)} placeholder="0" />
                    {errors[`${row.id}_jumlah`] && <span className="field-error">{errors[`${row.id}_jumlah`]}</span>}
                  </div>
                  <div className="form-field" style={{ margin: 0 }}>
                    <label>Harga Satuan</label>
                    <input type="number" min="1" value={row.harga_satuan} onChange={(e) => setField(row.id, "harga_satuan", e.target.value)} placeholder="Rp 0" />
                    {errors[`${row.id}_harga_satuan`] && <span className="field-error">{errors[`${row.id}_harga_satuan`]}</span>}
                  </div>
                  <div className="form-field" style={{ margin: 0 }}>
                    <label>Subtotal</label>
                    <input readOnly value={fmtRpDecimal(subtotal)} style={{ background: "#f9fafb", color: "#374151" }} />
                  </div>
                </div>
              </div>);

          })}
        </div>

        <button
          onClick={addRow}
          style={{ marginTop: ".75rem", background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: ".875rem", padding: "0.25rem 0" }}>
          
          + Tambah barang
        </button>
      </div>

      {}
      <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
        <div className="db-card" style={{ padding: "1rem" }}>
          <div style={{ fontWeight: 600, fontSize: ".9375rem", marginBottom: ".75rem" }}>Ringkasan Pembelian</div>

          {rows.filter((r) => r.jenis_bahan && Number(r.jumlah) > 0).map((r) => {
            const sub = (Number(r.jumlah) || 0) * (Number(r.harga_satuan) || 0);
            const label = r.newMerek ? r.merek || r.jenis_bahan : r.merek || r.jenis_bahan || "-";
            return (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: ".8125rem", marginBottom: ".375rem", color: "#374151" }}>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
                  {label} x {r.jumlah}
                </span>
                <span style={{ whiteSpace: "nowrap", fontWeight: 500 }}>{fmtRpDecimal(sub)}</span>
              </div>);

          })}

          {rows.every((r) => !r.jenis_bahan || !(Number(r.jumlah) > 0)) &&
          <div style={{ color: "#9ca3af", fontSize: ".8125rem" }}>-</div>
          }

          <div style={{ borderTop: "1px solid #e5e7eb", marginTop: ".75rem", paddingTop: ".75rem", display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: ".875rem" }}>
            <span>Total Bayar</span>
            <span>{fmtRpDecimal(totalBayar)}</span>
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