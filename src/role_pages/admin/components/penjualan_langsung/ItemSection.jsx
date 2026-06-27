import { fmtRp } from "../../../../shared/utils/format";
import QtyInput from "../../../../shared/components/QtyInput";
import SearchableSelect from "../../../../shared/components/SearchableSelect";









const STATUS_COLOR = {
  Habis: "#dc2626",
  Menipis: "#d97706",
  Normal: "#16a34a"
};

export default function ItemSection({ items, produkList, onChange, readonly = false }) {
  const selectedIds = items.map((it) => String(it.id_produk)).filter(Boolean);

  const setItem = (idx, key, val) => {
    if (key === "id_produk" && val) {
      const existingIdx = items.findIndex(
        (it, i) => i !== idx && String(it.id_produk) === String(val)
      );
      if (existingIdx !== -1) {
        const merged = items.
        map((it, i) => {
          if (i === existingIdx) return { ...it, qty: Number(it.qty) + Number(items[idx].qty || 1) };
          return it;
        }).
        filter((_, i) => i !== idx);
        onChange(merged);
        return;
      }
    }
    onChange(items.map((it, i) => i === idx ? { ...it, [key]: val } : it));
  };

  const addItem = () => onChange([...items, { id_produk: "", qty: 1 }]);
  const removeItem = (idx) => onChange(items.filter((_, i) => i !== idx));


  const total = items.reduce((sum, it) => {
    const p = produkList.find((p) => String(p.id_produk) === String(it.id_produk));
    return sum + (p ? Number(p.harga_satuan ?? 0) * Number(it.qty || 0) : 0);
  }, 0);

  return (
    <div className="item-section">
      <div className="item-section-header">Item</div>

      {items.map((item, idx) => {
        const available = produkList.filter((p) =>
        p.statusStok !== "Habis" && p.statusStok !== "Kadaluarsa" && (p.totalStok ?? 0) > 0 && (
        !selectedIds.includes(String(p.id_produk)) ||
        String(p.id_produk) === String(item.id_produk))
        );
        const selProduk = produkList.find((p) => String(p.id_produk) === String(item.id_produk));
        const subtotal = selProduk ? Number(selProduk.harga_satuan ?? 0) * Number(item.qty || 0) : 0;

        return (
          <div key={idx} className="item-row">
            <div className="item-row-header">
              <span style={{ fontWeight: 600, fontSize: ".875rem" }}>Produk {idx + 1}</span>
              <span style={{ fontWeight: 600, fontSize: ".875rem", marginLeft: "auto" }}>Jumlah</span>
            </div>

            <div className="item-row-inputs">
              <div style={{ flex: 1 }}>
                {readonly ?
                <div className="form-field-readonly">
                    {produkList.find((p) => String(p.id_produk) === String(item.id_produk))?.nama_produk ?? "-"}
                  </div> :

                <SearchableSelect
                  value={String(item.id_produk)}
                  onChange={(val) => setItem(idx, "id_produk", val)}
                  placeholder="Pilih produk..."
                  options={available.map((p) => ({
                    value: String(p.id_produk),
                    label: p.nama_produk,
                    sub: `Stok: ${p.totalStok ?? "?"}`
                  }))} />

                }
              </div>

              <div style={{ width: 80 }}>
                {readonly ?
                <div className="form-field-readonly" style={{ textAlign: "center" }}>{item.qty}</div> :

                <QtyInput
                  value={Number(item.qty) || 1}
                  max={selProduk?.totalStok ?? undefined}
                  onChange={(v) => setItem(idx, "qty", v)}
                  style={{ width: 70, textAlign: "center", border: "1px solid #e5e7eb",
                    borderRadius: 6, padding: "4px 6px", fontSize: ".875rem" }} />

                }
              </div>

              {!readonly && items.length > 1 &&
              <button
                type="button"
                className="item-remove-btn"
                onClick={() => removeItem(idx)}
                title="Hapus item">
                ×</button>
              }
            </div>

            {}
            {selProduk &&
            <div style={{ display: "flex", gap: "1rem", fontSize: ".78rem", color: "#6b7280", marginTop: ".25rem", paddingLeft: 2 }}>
                <span>Harga Satuan: <strong style={{ color: "#111827" }}>{fmtRp(selProduk.harga_satuan)}</strong></span>
                {!readonly && <span>Subtotal: <strong style={{ color: "#111827" }}>{fmtRp(subtotal)}</strong></span>}
              </div>
            }
          </div>);

      })}

      {!readonly && selectedIds.filter(Boolean).length < produkList.filter((p) =>
      p.statusStok !== "Habis" && p.statusStok !== "Kadaluarsa" && (p.totalStok ?? 0) > 0
      ).length &&
      <button type="button" className="item-add-btn" onClick={addItem}>
          <span className="item-add-icon">⊕</span>
        </button>
      }

      {}
      {!readonly && total > 0 &&
      <div style={{ marginTop: ".75rem", paddingTop: ".5rem", borderTop: "1px solid #e5e7eb",
        display: "flex", justifyContent: "flex-end", fontWeight: 600, fontSize: ".9rem", color: "#111827" }}>
          Total: {fmtRp(total)}
        </div>
      }
    </div>);

}