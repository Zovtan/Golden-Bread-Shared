
import { useState } from "react";
import DashboardLayout from "../../../shared/layouts/DashboardLayout";
import { usePelangganBeranda } from "../hooks/usePelangganBeranda";
import CartSidebar from "../components/beranda/CartSidebar";
import { SegeraAntarModal, PreOrderModal } from "../components/beranda/OrderModal";
import FiturTakTersedia from "../components/beranda/FiturTakTersedia";
import UnpaidOrdersPopUp from "../components/beranda/UnpaidOrdersPopUp";
import QtyInput from "../../../shared/components/QtyInput";
import SearchBar from "../../../shared/components/SearchBar";
import PelangganPesanan from "./PelangganHistoriPesanan";
import PelangganAkun from "./PelangganAkun";
import PelangganBantuan from "./PelangganBantuan";
import Pagination from "../../../shared/components/Pagination";

const NAV = [
{ key: "beranda", label: "Beranda", icon: "beranda" },
{ key: "pesanan", label: "Pesanan", icon: "pesanan" },
{ key: "bantuan", label: "Bantuan", icon: "bantuan" },
{ key: "akun", label: "Akun", icon: "akun" }];

const TITLE = { beranda: "Beranda", pesanan: "Pesanan", bantuan: "Bantuan", akun: "Akun" };



export const QTY_INPUT_STYLE = {
  width: 52, textAlign: "center",
  border: "1px solid #e5e7eb", borderRadius: 6,
  padding: "3px 4px", fontSize: ".875rem"
};


export default function PelangganBeranda({ profile, onLogout }) {
  const [page, setPage] = useState("beranda");

  const {
    search, kategori, mode, cartOpen, setCartOpen,
    prodPage, setProdPage,
    showAntar, setShowAntar,
    showPreOrder, setShowPreOrder,
    showFitur, setShowFitur,
    lightbox, setLightbox,
    unpaidOrders, showUnpaid, dismissUnpaid,
    gridRef, layoutRef,
    produk, kategoriList, totalPages, loading, error,
    cart, totalQty, totalPrice, clearCart,
    batas, isPreorderOpen, isSegeraAntarOpen,
    handleKategori, handleSearch, switchMode,
    handleSetQty, handleAddBtn, handleCheckout,
    handleOrderSuccess, handleNotifAction
  } = usePelangganBeranda({ profile });

  const handleNotif = (notif) => {
    const dest = handleNotifAction(notif);
    if (dest) setPage(dest);
  };

  const cartButton =
  <button className="db-notif-btn" onClick={() => setCartOpen((v) => !v)} title="Keranjang">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {totalQty > 0 && <span className="db-notif-badge">{totalQty > 9 ? "9+" : totalQty}</span>}
    </button>;


  const searchBar = page === "beranda" || page === "pesanan" ?
  <SearchBar
    value={search}
    onChange={(v) => handleSearch({ target: { value: v } })}
    placeholder={page === "pesanan" ? "Cari no. pesanan..." : "Cari nama roti, donat, kue..."} /> :

  null;

  return (
    <DashboardLayout
      profile={profile} title={TITLE[page] ?? "Beranda"}
      navItems={NAV} activePage={page} onNavigate={setPage}
      headerRight={<>{searchBar}{cartButton}</>}
      onNotifAction={handleNotif}
      layoutRef={layoutRef}
      themeClass="pelanggan-theme">
      
      {page === "beranda" &&
      <>
          {(!batas.menerima_segera || !batas.menerima_preorder) &&
        <div style={{
          background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10,
          padding: ".875rem 1.125rem", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 12
        }}>
              <span style={{ fontSize: "1.375rem", flexShrink: 0 }}>🚫</span>
              <div>
                <div style={{ fontWeight: 700, color: "#b91c1c", fontSize: ".9375rem" }}>
                  {!batas.menerima_segera && !batas.menerima_preorder ?
              "Sedang Tidak Menerima Pesanan" :
              !batas.menerima_segera ?
              "Layanan Segera Antar Ditutup" :
              "Layanan Pre-order Ditutup"}
                </div>
                <div style={{ fontSize: ".8125rem", color: "#dc2626", marginTop: 2 }}>
                  {!batas.menerima_segera && !batas.menerima_preorder ?
              "Kami sedang tidak menerima pesanan untuk saat ini. Silakan coba lagi nanti." :
              !batas.menerima_segera ?
              "Segera antar sedang tidak tersedia. Pre-order masih bisa dilakukan." :
              "Pre-order sedang tidak tersedia. Segera antar masih bisa dilakukan."}
                </div>
              </div>
            </div>
        }
          {}
      {(() => {
          const segeraTutup = batas.menerima_segera && !isSegeraAntarOpen();
          const preorderTutup = batas.menerima_preorder && !isPreorderOpen();
          const msg = mode === "segera" && segeraTutup ?
          { title: "Di Luar Jam Operasional Segera Antar", body: `Segera antar tersedia ${batas.jam_mulai_segera}–${batas.jam_selesai_segera} WIB.` } :
          mode === "preorder" && preorderTutup ?
          { title: "Di Luar Jam Operasional Pre-order", body: `Pre-order tersedia ${batas.jam_mulai_preorder}–${batas.jam_selesai_preorder} WIB.` } :
          null;
          if (!msg) return null;
          return (
            <div style={{
              background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10,
              padding: ".875rem 1.125rem", marginBottom: 16,
              display: "flex", alignItems: "center", gap: 12
            }}>
                <span style={{ fontSize: "1.375rem", flexShrink: 0 }}>🕐</span>
                <div>
                  <div style={{ fontWeight: 700, color: "#92400e", fontSize: ".9375rem" }}>{msg.title}</div>
                  <div style={{ fontSize: ".8125rem", color: "#b45309", marginTop: 2 }}>{msg.body}</div>
                </div>
              </div>);

        })()}

          {}
          {}
      <div className="db-card" style={{ padding: 0, marginBottom: 16, overflow: "hidden" }}>
            <div style={{ display: "flex" }}>
              {[
            { key: "segera", icon: "🛵", label: "Segera Antar", sub: `Min. ${batas.min_segera} produk · ${batas.jam_mulai_segera}–${batas.jam_selesai_segera} WIB` },
            { key: "preorder", icon: "📋", label: "Pre-order", sub: `Min. ${batas.min_preorder} · Maks. ${batas.max_preorder} produk · ${batas.jam_mulai_preorder}–${batas.jam_selesai_preorder} WIB` }].
            map((t) =>
            <button key={t.key} onClick={() => switchMode(t.key)} className="max-md:flex-wrap" style={{
              flex: 1, display: "flex", alignItems: "center", gap: 12,
              padding: "1rem 1.25rem", border: "none", cursor: "pointer", textAlign: "left",
              background: mode === t.key ? "#92400e" : "#fffbf2",
              color: mode === t.key ? "#fff" : "#78350f",
              borderRight: t.key === "segera" ? "1px solid #e5e7eb" : "none",
              transition: "all .15s"
            }}>
                  {}
                  <div className="mode-tab-grid">
                    <span className="mode-tab-emoji" style={{ fontSize: "1.5rem", flexShrink: 0 }}>{t.icon}</span>
                    <div className="mode-tab-label" style={{ fontWeight: 700, fontSize: ".9375rem" }}>{t.label}</div>
                    <div className="mode-tab-sub" style={{ fontSize: ".78rem", opacity: .7 }}>{t.sub}</div>
                  </div>
                  {mode === t.key &&
              <span className="ml-auto max-md:ml-0 max-md:basis-full max-md:mt-2" style={{ fontSize: ".75rem", background: "rgba(255,255,255,.2)",
                borderRadius: 99, padding: "2px 10px", flexShrink: 0, whiteSpace: "nowrap" }}>
                      Aktif ✓
                    </span>
              }
                </button>
            )}
            </div>
          </div>

          {}
          {}
      <div className="db-card">
            <div className="db-tabs">
              <button className={`db-tab${kategori === "" ? " active" : ""}`} onClick={() => handleKategori("")}>Semua Produk</button>
              {kategoriList.map((k) =>
            <button
              key={k.id}
              className={`db-tab${kategori === String(k.id) ? " active" : ""}`}
              onClick={() => handleKategori(String(k.id))}>
              
                  {k.nilai}
                </button>
            )}
            </div>

            {error && <p className="db-fetch-error">{error}</p>}
            {loading ? <p className="db-loading-text">Memuat produk...</p> :
          produk.length === 0 ?
          <p style={{ fontSize: ".875rem", color: "#6b7280" }}>Produk tidak ditemukan.</p> :

          <div ref={gridRef} className="db-product-grid">
                    {produk.map((p) => {
              const inCart = cart.find((i) => i.id === p.id);
              const cartQty = inCart?.qty ?? 0;
              const habis = mode === "segera" && p.stok !== null && p.stok <= 0;
              const atLimit = mode === "segera" && p.stok !== null && cartQty >= p.stok;
              const inputDisabled = mode === "segera" ?
              !batas.menerima_segera || !isSegeraAntarOpen() :
              !batas.menerima_preorder || !isPreorderOpen();
              return (
                <div key={p.id} className={`db-product-card${habis || inputDisabled ? " out-of-stock" : ""}`}>
                          <div className="db-product-img" style={{ cursor: p.gambar ? "zoom-in" : "default" }}
                  onClick={() => p.gambar && setLightbox({ src: p.gambar, alt: p.nama })}>
                            {p.gambar ? <img src={p.gambar} alt={p.nama} /> : <span>[IMG]</span>}
                          </div>
                          <div className="db-product-info">
                            <div className="db-product-name">{p.nama}</div>
                            <div className="db-product-meta">
                              {p.kategori}
                              {mode === "segera" && p.stok !== null ? ` · ${p.stok} Stok` : ""}
                              {mode === "preorder" && <span style={{ color: "#6b7280", fontSize: ".75rem" }}> · Pre-order</span>}
                            </div>
                            <div className="db-product-footer">
                              <span className="db-product-price">{p.harga}</span>

                              {habis ?
                      <span className="db-add-btn db-add-btn--disabled">Habis</span> :
                      inputDisabled ?
                      <span className="db-add-btn db-add-btn--disabled">Tutup</span> :
                      cartQty === 0 ?
                      <button className="db-add-btn" onClick={() => handleAddBtn(p)}>+ Tambah</button> :

                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                  <button className="cart-qty-btn"
                        onClick={() => handleSetQty(p.id, cartQty - 1)}>−</button>
                                  <QtyInput
                          value={cartQty}
                          max={mode === "segera" ? p.stok ?? undefined : undefined}
                          onChange={(v) => handleSetQty(p.id, v, p)}
                          style={QTY_INPUT_STYLE} />
                        
                                  <button className="cart-qty-btn"
                        onClick={() => handleSetQty(p.id, cartQty + 1, p)}
                        disabled={atLimit}>+</button>
                                </div>
                      }
                            </div>
                          </div>
                        </div>);

            })}
                  </div>

          }

            <Pagination page={prodPage} totalPages={totalPages} onPageChange={setProdPage} variant="amber" />
          </div>
        </>
      }

      {page === "pesanan" && <PelangganPesanan profile={profile} search={search} />}
      {page === "bantuan" && <PelangganBantuan />}
      {page === "akun" && <PelangganAkun profile={profile} onLogout={onLogout} />}

      <CartSidebar
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart} totalPrice={totalPrice}
        onSetQty={(id, qty) => handleSetQty(id, qty)}
        onClear={clearCart}
        onCheckout={handleCheckout}
        mode={mode}
        batas={batas} />
      

      {}
      {totalQty > 0 &&
      <button
        className="fixed bottom-5 right-4 z-[150] flex md:hidden items-center gap-2 bg-amber-800 text-white rounded-full px-4 py-3 shadow-xl cursor-pointer border-none font-semibold text-sm"
        onClick={() => setCartOpen(true)}>
        
          🛒
          <span className="bg-amber-100 text-amber-900 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {totalQty > 9 ? "9+" : totalQty}
          </span>
          Keranjang
        </button>
      }

      <SegeraAntarModal
        open={showAntar} onClose={() => setShowAntar(false)}
        onSuccess={handleOrderSuccess}
        cart={cart} onSetQty={handleSetQty} profile={profile} />
      
      <PreOrderModal
        open={showPreOrder} onClose={() => setShowPreOrder(false)}
        onSuccess={handleOrderSuccess}
        cart={cart} onSetQty={(id, qty) => handleSetQty(id, qty)} profile={profile} />
      
      <FiturTakTersedia open={showFitur} onClose={() => setShowFitur(false)} />

      <UnpaidOrdersPopUp
        open={showUnpaid}
        orders={unpaidOrders}
        onClose={dismissUnpaid}
        onPay={() => {dismissUnpaid();setPage("pesanan");}} />
      

      {}
      {lightbox &&
      <div
        onClick={() => setLightbox(null)}
        style={{
          position: "fixed", inset: 0, zIndex: 999,
          background: "rgba(0,0,0,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1.5rem"
        }}>
        
          <button
          onClick={() => setLightbox(null)}
          style={{
            position: "absolute", top: "1rem", right: "1rem",
            background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%",
            width: 40, height: 40, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: "1.25rem", lineHeight: 1
          }}>
          ✕</button>
          <img
          src={lightbox.src} alt={lightbox.alt}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "100%", maxHeight: "90vh",
            borderRadius: 10, objectFit: "contain",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)"
          }} />
        
        </div>
      }
    </DashboardLayout>);

}