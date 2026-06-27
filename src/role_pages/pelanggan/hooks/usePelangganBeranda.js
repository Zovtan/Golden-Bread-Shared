

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { usePelangganProduk } from "./usePelangganProduk";
import { usePelangganCart } from "./usePelangganCart";
import { useBatasPesanan } from "./useBatasPesanan";
import { useRealtimeRefresh } from "../../../shared/hooks/useRealtimeRefresh";


function toProdukCart(p) {
  return {
    id: p.id, nama: p.nama, kategori: p.kategori,
    harga: p.harga, harga_num: p.harga_num,
    gambar: p.gambar ?? null, stok: p.stok ?? null
  };
}

export function usePelangganBeranda({ profile }) {
  const [search, setSearch] = useState("");
  const [kategori, setKategori] = useState("");
  const [prodPage, setProdPage] = useState(1);
  const [mode, setMode] = useState("segera");
  const [pageSize] = useState(18);

  const [cartOpen, setCartOpen] = useState(false);
  const [showAntar, setShowAntar] = useState(false);
  const [showPreOrder, setShowPreOrder] = useState(false);
  const [showFitur, setShowFitur] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const [unpaidOrders, setUnpaidOrders] = useState([]);
  const [showUnpaid, setShowUnpaid] = useState(false);

  const gridRef = useRef(null);
  const layoutRef = useRef(null);

  const { produk, kategoriList, totalPages, loading, error, refetch } =
  usePelangganProduk({ search, kategori, page: prodPage, pageSize, sortByAvail: mode === "segera" });



  useRealtimeRefresh("pelanggan-stok-reservasi", ["reservasi_stok_pesanan"], refetch);

  const { cart, addItem, setQty, clearCart, totalQty, totalPrice } = usePelangganCart();
  const { batas, isPreorderOpen, isSegeraAntarOpen } = useBatasPesanan();


  const fetchUnpaid = useCallback(async (autoShow = false) => {
    if (!profile?.id) return;
    const { data } = await supabase.
    from("pesanan_online").
    select("id_pesanan, tanggal, ongkir, detail_pesanan_online(qty, harga_satuan)").
    eq("id_pelanggan", profile.id).
    eq("status", "Pending_Payment").
    order("tanggal", { ascending: false });
    const rows = (data ?? []).map((p) => {
      const sub = (p.detail_pesanan_online ?? []).reduce((s, d) => s + d.qty * Number(d.harga_satuan), 0);
      return { id_pesanan: p.id_pesanan, tanggal: p.tanggal, total: sub + Number(p.ongkir ?? 0) };
    });
    setUnpaidOrders(rows);


    if (autoShow && rows.length > 0 && !sessionStorage.getItem("gb_unpaid_popup_shown")) {
      setShowUnpaid(true);
      sessionStorage.setItem("gb_unpaid_popup_shown", "1");
    }
  }, [profile]);


  useEffect(() => {fetchUnpaid(true);}, [fetchUnpaid]);

  const handleKategori = useCallback((k) => {setKategori(k);setProdPage(1);}, []);
  const handleSearch = useCallback((e) => {setSearch(e.target.value);setProdPage(1);}, []);



  const switchMode = useCallback((m) => {
    if (m === mode) return;
    if (m === "preorder" && profile?.jenis_pelanggan !== "Prioritas") {
      setShowFitur(true);
      return;
    }
    clearCart();setMode(m);
  }, [mode, clearCart, profile]);



  const handleSetQty = useCallback((id, qty, prodRef) => {
    const q = Math.max(0, Number(qty) || 0);
    const item = cart.find((i) => i.id === id);
    if (!item && q > 0 && prodRef) addItem(toProdukCart(prodRef));
    const stok = item?.stok ?? prodRef?.stok ?? null;
    const final = mode === "segera" && stok !== null ? Math.min(q, stok) : q;
    setQty(id, final);
  }, [cart, addItem, setQty, mode]);

  const handleAddBtn = useCallback((p) => {
    const inCart = cart.find((i) => i.id === p.id);
    if (mode === "segera" && p.stok !== null && (inCart?.qty ?? 0) >= p.stok) return;
    addItem(toProdukCart(p));
  }, [cart, addItem, mode]);

  const handleCheckout = () => {
    setCartOpen(false);
    if (mode === "segera") {
      if (!batas.menerima_segera) return;
      setShowAntar(true);
    } else {
      if (!batas.menerima_preorder) return;
      if (profile?.jenis_pelanggan !== "Prioritas") {setShowFitur(true);return;}
      if (!isPreorderOpen()) {setShowFitur(true);return;}
      setShowPreOrder(true);
    }
  };

  const handleOrderSuccess = (result) => {
    setShowAntar(false);
    setShowPreOrder(false);
    clearCart();
    const unpaid = result?.snapStatus === "unpaid";
    layoutRef.current?.addToast({
      tipe: unpaid ? "info" : "sukses",
      pesan: unpaid ?
      `Pesanan #${result.id_pesanan} dibuat. Selesaikan pembayaran di menu Pesanan.` :
      `Pesanan #${result.id_pesanan} berhasil dibuat!`,
      id_pesanan: result.id_pesanan
    });

    if (unpaid && result?.id_pesanan) {
      supabase.rpc("pelanggan_notif_belum_dibayar", { p_id: Number(result.id_pesanan) }).then(() => {}, () => {});
      fetchUnpaid(false);
    }
  };

  const handleNotifAction = (notif) => {
    if (notif.id_pesanan) return "pesanan";
    return null;
  };

  return {

    search, kategori, prodPage, mode, pageSize, cartOpen, setCartOpen,
    showAntar, setShowAntar,
    showPreOrder, setShowPreOrder,
    showFitur, setShowFitur,
    lightbox, setLightbox,

    unpaidOrders, showUnpaid, dismissUnpaid: () => setShowUnpaid(false),

    gridRef, layoutRef,

    produk, kategoriList, totalPages, loading, error,

    cart, totalQty, totalPrice, clearCart,

    batas, isPreorderOpen, isSegeraAntarOpen,

    setProdPage,
    handleKategori, handleSearch, switchMode,
    handleSetQty, handleAddBtn, handleCheckout,
    handleOrderSuccess, handleNotifAction
  };
}