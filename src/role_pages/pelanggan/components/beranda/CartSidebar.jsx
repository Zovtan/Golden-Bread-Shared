import { useState } from "react";
import QtyInput from "../../../../shared/components/QtyInput";
import { fmtRp } from "../../../../shared/utils/format";






export default function CartSidebar({ open, onClose, cart, totalPrice, onSetQty, onClear, onCheckout, mode = "segera", batas }) {
  const [confirmClear, setConfirmClear] = useState(false);

  if (!cart) return null;

  const handleClearClick = () => setConfirmClear(true);
  const handleClearConfirm = () => {onClear();setConfirmClear(false);};
  const handleClearCancel = () => setConfirmClear(false);

  const minQty = mode === "segera" ? batas?.min_segera ?? null : batas?.min_preorder ?? null;
  const maxQty = mode === "preorder" ? batas?.max_preorder ?? null : null;

  return (
    <>
      {open && <div className="cart-overlay-backdrop" onClick={onClose} />}

      <aside className={`cart-sidebar-overlay${open ? " open" : ""}`}>
        <div className="cart-sidebar-header">
          <span className="cart-sidebar-title">Pesanan Kamu</span>
          <button className="cart-sidebar-close" onClick={onClose} aria-label="Tutup">✕</button>
        </div>

        {}
        {batas &&
        <div className="px-3.5 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500">
            {minQty != null && <span>Min pesanan: <strong>{minQty} item</strong></span>}
            {maxQty != null && <span> Maks pesanan: <strong>{maxQty} item</strong></span>}
            {mode === "segera" && <span className="text-gray-700"> Stok terbatas per item.</span>}
          </div>
        }

        {}
        <div className="cart-items">
          {cart.length === 0 ?
          <p className="cart-empty">Belum ada produk dipilih.</p> :
          cart.map((item) => {
            const stockMax = mode === "segera" ? item.stok ?? null : maxQty ?? undefined;
            const atMax = stockMax != null && item.qty >= stockMax;
            return (
              <div key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.nama}</div>
                      <div className="cart-item-cat">{item.kategori}</div>
                      <div className="cart-item-price">{item.harga}</div>
                    </div>
                    <div className="cart-qty-ctrl">
                      <button className="cart-qty-btn" onClick={() => onSetQty(item.id, item.qty - 1)}>−</button>
                      <QtyInput
                    value={item.qty}
                    max={mode === "segera" ? item.stok ?? undefined : maxQty ?? undefined}
                    onChange={(v) => onSetQty(item.id, v)} />

                  
                      <button
                    className="cart-qty-btn"
                    onClick={() => onSetQty(item.id, item.qty + 1)}
                    disabled={atMax}
                    title={atMax ? `Batas maksimum: ${stockMax}` : undefined}>
                    +</button>
                    </div>
                  </div>);

          })
          }
        </div>

        {}
        <div className="cart-summary">
          {cart.map((item) =>
          <div key={item.id} className="cart-summary-row">
              <span>{item.nama}</span>
              <span>x{item.qty} {fmtRp(item.harga_num * item.qty)}</span>
            </div>
          )}
          <div className="cart-summary-total">
            <span>Total</span>
            <span>{fmtRp(totalPrice)}</span>
          </div>
        </div>

        <button className="cart-checkout-btn" onClick={onCheckout} disabled={cart.length === 0}>
          Lanjut ke Pengiriman
        </button>

        {}
        {!confirmClear ?

        <button className="cart-clear-btn" onClick={handleClearClick} disabled={cart.length === 0}>
              Kosongkan Keranjang
            </button> :

        <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg mx-3 my-2">
              <p className="m-0 text-[0.8125rem] text-red-600 font-semibold">
                Kosongkan semua produk?
              </p>
              <div className="flex gap-2">
                <button onClick={handleClearCancel} className="btn-secondary flex-1 justify-center">
                  Batal
                </button>
                <button onClick={handleClearConfirm} className="btn-danger flex-1 justify-center">
                  Ya, Kosongkan
                </button>
              </div>
            </div>

        }
      </aside>
    </>);

}