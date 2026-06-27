import { useState, useEffect } from "react";
import Modal from "../../../../shared/components/Modal";
import { supabase } from "../../../../lib/supabase";
import { invalidateEnumsCache } from "../../../../shared/hooks/useEnums";
import { useSubmitLock } from "../../../../shared/hooks/useSubmitLock";

const TABLE_MAP = {
  jenis_bahan: "enum_jenis_bahan",
  satuan: "enum_satuan",
  kategori_produk: "enum_kategori_produk"
};

const LABEL_MAP = {
  jenis_bahan: "Jenis Bahan Baku",
  satuan: "Satuan",
  kategori_produk: "Kategori Produk"
};












export default function EditEnumModal({ open, onClose, enumType, addEnumValue: addProp, editEnumValue: editProp }) {
  const [rows, setRows] = useState([]);
  const [newVal, setNewVal] = useState("");
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const guard = useSubmitLock();

  const table = TABLE_MAP[enumType];
  const label = LABEL_MAP[enumType] ?? enumType;

  useEffect(() => {
    if (!open || !table) return;
    setLoading(true);setError("");setEditId(null);
    supabase.from(table).select("id,nilai").order("nilai").
    then(({ data, error: e }) => {
      if (e) setError(e.message);else
      setRows(data ?? []);
      setLoading(false);
    });
  }, [open, table]);

  const handleAdd = guard(async () => {
    const v = newVal.trim();
    if (!v) return;
    if (rows.some((r) => r.nilai.toLowerCase() === v.toLowerCase())) {
      setError("Nilai sudah ada");return;
    }
    setSaving(true);setError("");
    try {
      let newRow;
      if (addProp) {
        newRow = await addProp(enumType, v);
      } else {
        const { data, error: e } = await supabase.from(table).insert({ nilai: v }).select("id,nilai").single();
        if (e) throw e;
        invalidateEnumsCache();
        newRow = data;
      }
      setRows((prev) => [...prev, newRow].sort((a, b) => a.nilai.localeCompare(b.nilai)));
      setNewVal("");
    } catch (e) {setError(e.message);}
    setSaving(false);
  });

  const startEdit = (row) => {setEditId(row.id);setEditVal(row.nilai);setError("");};
  const cancelEdit = () => {setEditId(null);setEditVal("");};

  const handleEdit = guard(async (id) => {
    const v = editVal.trim();
    if (!v) return;
    if (rows.some((r) => r.id !== id && r.nilai.toLowerCase() === v.toLowerCase())) {
      setError("Nilai sudah ada");return;
    }
    setSaving(true);setError("");
    try {
      if (editProp) {
        await editProp(enumType, id, v);
      } else {
        const { error: e } = await supabase.from(table).update({ nilai: v }).eq("id", id);
        if (e) throw e;
        invalidateEnumsCache();
      }
      setRows((prev) => prev.map((r) => r.id === id ? { ...r, nilai: v } : r).sort((a, b) => a.nilai.localeCompare(b.nilai)));
      setEditId(null);setEditVal("");
    } catch (e) {setError(e.message);}
    setSaving(false);
  });

  return (
    <Modal open={open} onClose={onClose} title={`Kelola ${label}`} maxWidth="420px"
    footer={<button className="btn-secondary" onClick={onClose}>Tutup</button>}>
      {error && <p style={{ color: "#dc2626", fontSize: ".875rem", marginBottom: ".5rem" }}>{error}</p>}

      <div style={{ display: "flex", gap: ".5rem", marginBottom: "1rem" }}>
        <input
          type="text"
          value={newVal}
          onChange={(e) => {setNewVal(e.target.value);setError("");}}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder={`Tambah ${label.toLowerCase()}...`}
          style={{ flex: 1, padding: ".45rem .625rem", border: "1px solid #d1d5db", borderRadius: 6, fontSize: ".875rem" }} />
        
        <button className="btn-primary" onClick={handleAdd} disabled={saving || !newVal.trim()}
        style={{ padding: "0 1rem", borderRadius: 6, fontSize: ".875rem" }}>
          Tambah
        </button>
      </div>

      {loading && <p style={{ color: "#6b7280", fontSize: ".875rem" }}>Memuat…</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: ".375rem" }}>
        {rows.map((row) =>
        <div key={row.id} style={{
          display: "flex", alignItems: "center", gap: ".5rem",
          padding: ".4rem .625rem", background: "#f9fafb",
          border: "1px solid #e5e7eb", borderRadius: 6
        }}>
            {editId === row.id ?
          <>
                <input
              type="text"
              value={editVal}
              onChange={(e) => {setEditVal(e.target.value);setError("");}}
              onKeyDown={(e) => {if (e.key === "Enter") handleEdit(row.id);if (e.key === "Escape") cancelEdit();}}
              autoFocus
              style={{ flex: 1, padding: ".3rem .5rem", border: "1px solid #93c5fd", borderRadius: 5, fontSize: ".875rem" }} />
            
                <button onClick={() => handleEdit(row.id)} disabled={saving}
            style={{ fontSize: ".8rem", color: "#16a34a", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                  Simpan
                </button>
                <button onClick={cancelEdit}
            style={{ fontSize: ".8rem", color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}>
                  Batal
                </button>
              </> :

          <>
                <span style={{ flex: 1, fontSize: ".875rem" }}>{row.nilai}</span>
                <button onClick={() => startEdit(row)}
            style={{ fontSize: ".8rem", color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>
                  Edit
                </button>
              </>
          }
          </div>
        )}
        {!loading && rows.length === 0 &&
        <p style={{ color: "#9ca3af", fontSize: ".875rem", textAlign: "center", padding: "1rem" }}>Belum ada data</p>
        }
      </div>
    </Modal>);

}