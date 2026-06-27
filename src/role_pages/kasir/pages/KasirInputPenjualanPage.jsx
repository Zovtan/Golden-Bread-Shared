import { useState, useMemo } from "react";
import { useKasirInputPenjualan } from "../hooks/useKasirInputPenjualan";
import { fmtRp } from "../../../shared/utils/format";
import QtyInput from "../../../shared/components/QtyInput";
import { usePaginatedTable } from "../../../shared/hooks/usePaginatedTable";
import SearchableSelect from "../../../shared/components/SearchableSelect";
import Pagination from "../../../shared/components/Pagination";
import { useSubmitLock } from "../../../shared/hooks/useSubmitLock";

const QTY_INPUT_STYLE = {
  width: 52, textAlign: "center",
  border: "1px solid #e5e7eb", borderRadius: 6,
  padding: "3px 4px", fontSize: ".875rem"
};


export default function KasirInputPenjualanPage({ onNavigate }) {
  const { produkList, kategoriList, jenisBayarList, loading, error, submitPenjualan, refreshProduk } = useKasirInputPenjualan();

  const [cart, setCart] = useState({});
  const [search, setSearch] = useState("");
  const [jenis_pembayaran, setJenisBayar] = useState("");
  const [uang_diterima, setUangDiterima] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [kategori, setKategori] = useState("");
  const guard = useSubmitLock();

  const setQty = (id, qty) => {
    setCart((c) => {
      const n = { ...c };
      if (qty <= 0) delete n[String(id)];else
      n[String(id)] = qty;
      return n;
    });
    setErrors((e) => ({ ...e, cart: undefined, [`stok_${id}`]: undefined }));
  };

  const produkMap = useMemo(() =>
  Object.fromEntries(produkList.map((p) => [String(p.id_produk), p])),
  [produkList]
  );

  const filteredProduk = useMemo(() => {
    const q = search.toLowerCase().trim();
    return produkList.filter((p) => {
      if (kategori && String(p.kategori_id) !== kategori) return false;
      if (!q) return true;
      return p.nama_produk.toLowerCase().includes(q);
    });
  }, [produkList, search, kategori]);

  const { paged: pagedProduk, page: produkPage, setPage: setProdukPage, totalPages: produkTotalPages } = usePaginatedTable(filteredProduk, 12);

  const handleKategori = (id) => {setKategori(id);setProdukPage(1);};

  const cartItems = useMemo(() =>
  Object.entries(cart).
  map(([id, qty]) => ({ produk: produkMap[id], qty, id })).
  filter(({ produk }) => produk),
  [cart, produkMap]
  );

  const totalQty = cartItems.reduce((s, { qty }) => s + qty, 0);
  const subtotal = cartItems.reduce((s, { produk, qty }) => s + Number(produk.harga_satuan) * qty, 0);
  const kembalian = Math.max(0, (Number(uang_diterima) || 0) - subtotal);

  const validate = () => {
    const err = {};
    if (cartItems.length === 0) err.cart = "Pilih minimal 1 produk";
    cartItems.forEach(({ produk, qty }) => {
      if (qty > produk.totalStok)
      err[`stok_${produk.id_produk}`] = `Stok tidak cukup (${produk.totalStok} pcs)`;
    });
    if (!jenis_pembayaran) err.jenis_pembayaran = "Pilih jenis pembayaran";
    if (!uang_diterima || Number(uang_diterima) < subtotal) err.uang_diterima = "Uang diterima kurang";
    return err;
  };

  const handleSubmit = guard(async () => {
    setApiError("");
    const err = validate();
    if (Object.keys(err).length) {setErrors(err);return;}
    setSaving(true);
    try {
      await submitPenjualan({
        items: cartItems.map(({ id, qty }) => ({ id_produk: id, qty })),
        jenis_pembayaran
      });
      setCart({});
      setJenisBayar("");
      setUangDiterima("");
      setErrors({});
      setSuccess(true);
      setSheetOpen(false);
      refreshProduk();
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setApiError(e.message);
    } finally {
      setSaving(false);
    }
  });

  const handleBatal = () => {
    setCart({});
    setJenisBayar("");
    setUangDiterima("");
    setErrors({});
    setApiError("");
    setSheetOpen(false);
    onNavigate?.("dashboard");
  };


  const orderPanelProps = {
    cartItems, apiError, success, errors,
    jenis_pembayaran, uang_diterima, kembalian, subtotal,
    jenisBayarList, saving, loading,
    setJenisBayar, setUangDiterima, setErrors,
    handleSubmit, handleBatal
  };




  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4 items-start">

        {}
        <div className="flex flex-col gap-4 pb-20 md:pb-0">

          {}
          <div className="db-card" style={{ padding: ".625rem .875rem" }}>
            <input
              type="text"
              autoComplete="off"
              placeholder="Cari nama atau kategori produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", border: "none", outline: "none",
                fontSize: ".875rem", background: "transparent", color: "#111827"
              }} />
            
          </div>

          {}
          {kategoriList.length > 0 &&
          <div className="db-card" style={{ padding: ".25rem .875rem" }}>
              <div className="db-tabs" style={{ marginBottom: 0 }}>
                <button
                className={`db-tab${kategori === "" ? " active" : ""}`}
                onClick={() => handleKategori("")}>
                
                  Semua
                </button>
                {kategoriList.map((k) =>
              <button
                key={k.id}
                className={`db-tab${kategori === String(k.id) ? " active" : ""}`}
                onClick={() => handleKategori(String(k.id))}>
                
                    {k.nilai}
                  </button>
              )}
              </div>
            </div>
          }

          {success && <p style={{ color: "#16a34a", fontSize: ".875rem" }}>✓ Transaksi berhasil disimpan.</p>}
          {error && <p className="db-fetch-error">{error}</p>}
          {loading && <p className="db-loading-text">Memuat produk…</p>}

          {}
          <div className="db-product-grid">
            {pagedProduk.map((p) => {
              const qty = cart[String(p.id_produk)] ?? 0;
              const habis = p.totalStok <= 0;
              const errKey = `stok_${p.id_produk}`;
              return (
                <div key={p.id_produk} className={`db-product-card${habis ? " out-of-stock" : ""}`}>
                  <div className="db-product-img">
                    {p.gambar ?
                    <img src={p.gambar} alt={p.nama_produk} /> :
                    <span style={{ color: "#d1d5db", fontSize: ".75rem" }}>[IMG]</span>}
                  </div>
                  <div className="db-product-info">
                    <div className="db-product-name">{p.nama_produk}</div>
                    <div className="db-product-meta">
                      {p.kategori_produk ? `${p.kategori_produk} · ` : ""}{p.totalStok} Stok
                    </div>
                    <div className="db-product-price">{fmtRp(p.harga_satuan)}</div>
                  </div>
                  <div className="db-product-footer">
                    {errors[errKey] &&
                    <div style={{ color: "#dc2626", fontSize: ".7rem", marginBottom: 4 }}>{errors[errKey]}</div>
                    }
                    {habis ?
                    <span className="db-add-btn db-add-btn--disabled" style={{ display: "block", textAlign: "center" }}>Habis</span> :
                    qty === 0 ?
                    <button className="db-add-btn" style={{ width: "100%" }}
                    onClick={() => setQty(p.id_produk, 1)}>+ Tambah</button> :

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                        <button className="cart-qty-btn" onClick={() => setQty(p.id_produk, qty - 1)}>−</button>
                        <QtyInput
                        value={qty}
                        max={p.totalStok}
                        onChange={(v) => setQty(p.id_produk, v)}
                        style={QTY_INPUT_STYLE} />
                      
                        <button className="cart-qty-btn"
                      onClick={() => setQty(p.id_produk, Math.min(qty + 1, p.totalStok))}>+</button>
                      </div>
                    }
                  </div>
                </div>);

            })}

            {!loading && pagedProduk.length === 0 &&
            <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#9ca3af", padding: "2rem", fontSize: ".875rem" }}>
                Tidak ada produk ditemukan.
              </div>
            }
          </div>
          <Pagination page={produkPage} totalPages={produkTotalPages} onPageChange={setProdukPage} />
        </div>

        {}
        <div className="hidden md:flex flex-col gap-3 sticky top-4">
          <OrderPanel {...orderPanelProps} />
        </div>
      </div>

      {}
      {totalQty > 0 &&
      <div
        className="flex md:hidden fixed bottom-0 left-0 right-0 z-[150] bg-gray-900 text-white py-3.5 px-5 items-center justify-between gap-4 [box-shadow:0_-2px_16px_rgba(0,0,0,.18)]"
        onClick={() => setSheetOpen(true)}>
        
          <div style={{ display: "flex", alignItems: "center", gap: ".625rem" }}>
            <span style={{
            background: "#fff", color: "#111827", borderRadius: "50%",
            width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: ".75rem", fontWeight: 700, flexShrink: 0
          }}>
              {totalQty > 99 ? "99+" : totalQty}
            </span>
            <span style={{ fontSize: ".875rem", fontWeight: 500 }}>
              {cartItems.length} produk dipilih
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
            <span style={{ fontWeight: 700, fontSize: ".9375rem" }}>{fmtRp(subtotal)}</span>
            <span style={{ fontSize: ".8125rem", opacity: .75 }}>Bayar ›</span>
          </div>
        </div>
      }

      {}
      {sheetOpen &&
      <div className="fixed inset-0 bg-black/45 z-[300] flex items-end" onClick={() => setSheetOpen(false)}>
          <div className="bg-white w-full max-h-[88vh] rounded-t-2xl overflow-y-auto px-4 pt-5 pb-8 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3 shrink-0" />
            <OrderPanel {...orderPanelProps} />
          </div>
        </div>
      }
    </>);

}



function OrderPanel({
  cartItems, apiError, success, errors,
  jenis_pembayaran, uang_diterima, kembalian, subtotal,
  jenisBayarList, saving, loading,
  setJenisBayar, setUangDiterima, setErrors,
  handleSubmit, handleBatal
}) {
  return (
    <>
      {}
      <div className="db-card" style={{ padding: "1rem" }}>
        <div style={{ fontWeight: 600, fontSize: ".9375rem", marginBottom: ".75rem" }}>Ringkasan Transaksi</div>

        {apiError && <p style={{ color: "#dc2626", fontSize: ".8125rem", marginBottom: ".5rem" }}>{apiError}</p>}
        {success && <p style={{ color: "#16a34a", fontSize: ".8125rem", marginBottom: ".5rem" }}>✓ Transaksi berhasil disimpan.</p>}
        {errors.cart && <p style={{ color: "#dc2626", fontSize: ".8125rem", marginBottom: ".5rem" }}>{errors.cart}</p>}

        {cartItems.length === 0 ?
        <div style={{ color: "#9ca3af", fontSize: ".8125rem", textAlign: "center", padding: ".75rem 0" }}>
            Belum ada produk dipilih
          </div> :

        <div style={{ display: "flex", flexDirection: "column", gap: ".375rem", marginBottom: ".75rem" }}>
            {cartItems.map(({ produk, qty }) =>
          <div key={produk.id_produk} style={{ display: "flex", justifyContent: "space-between", fontSize: ".8125rem", color: "#374151" }}>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
                  {produk.nama_produk} ×{qty}
                </span>
                <span style={{ whiteSpace: "nowrap", fontWeight: 500 }}>
                  {fmtRp(Number(produk.harga_satuan) * qty)}
                </span>
              </div>
          )}
          </div>
        }

        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: ".75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: ".9375rem" }}>
            <span>Total Bayar</span>
            <span>{fmtRp(subtotal)}</span>
          </div>
        </div>
      </div>

      {}
      <div className="db-card" style={{ padding: "1rem" }}>
        <div style={{ fontWeight: 600, fontSize: ".875rem", marginBottom: ".75rem" }}>Pembayaran</div>
        <div style={{ display: "flex", flexDirection: "column", gap: ".625rem" }}>
          <div className="form-field" style={{ margin: 0 }}>
            <label>Jenis Pembayaran</label>
            <SearchableSelect
              value={jenis_pembayaran}
              onChange={(v) => {setJenisBayar(v);setErrors((err) => ({ ...err, jenis_pembayaran: undefined }));}}
              placeholder="Pilih..."
              options={jenisBayarList.map((j) => ({ value: j, label: j }))} />
            
            {errors.jenis_pembayaran && <span className="field-error">{errors.jenis_pembayaran}</span>}
          </div>
          <div className="form-field" style={{ margin: 0 }}>
            <label>Uang Diterima</label>
            <input type="number" min="0" value={uang_diterima} placeholder="Rp 0"
            onChange={(e) => {setUangDiterima(e.target.value);setErrors((err) => ({ ...err, uang_diterima: undefined }));}} />
            {errors.uang_diterima && <span className="field-error">{errors.uang_diterima}</span>}
          </div>
          <div className="form-field" style={{ margin: 0 }}>
            <label>Kembalian</label>
            <input readOnly
            value={uang_diterima && subtotal > 0 ? fmtRp(kembalian) : "Rp 0"}
            style={{ background: "#f3f4f6", color: kembalian > 0 ? "#16a34a" : "#374151", fontWeight: kembalian > 0 ? 600 : 400 }} />
          </div>
        </div>
      </div>

      {}
      <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
        <button className="btn-primary" onClick={handleSubmit} disabled={saving || loading}>
          {saving ? "Menyimpan…" : "Simpan Transaksi"}
        </button>
        <button className="btn-secondary" onClick={handleBatal} disabled={saving}>
          Batal
        </button>
      </div>
    </>);

}