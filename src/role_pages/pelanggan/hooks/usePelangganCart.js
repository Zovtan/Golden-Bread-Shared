import { useState, useCallback } from "react";




export function usePelangganCart() {
  const [cart, setCart] = useState([]);


  const addItem = useCallback((produk) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === produk.id);
      if (existing) return prev.map((i) => i.id === produk.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...produk, qty: 1 }];
    });
  }, []);


  const setQty = useCallback((id, qty) => {
    if (qty <= 0) setCart((prev) => prev.filter((i) => i.id !== id));else
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty } : i));
  }, []);


  const clearCart = useCallback(() => setCart([]), []);

  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.harga_num * i.qty, 0);

  return { cart, addItem, setQty, clearCart, totalQty, totalPrice };
}