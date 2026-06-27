

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { fmtRelative } from "../utils/format";

export function useNotifikasi(userId) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [toasts, setToasts] = useState([]);
  const knownIds = useRef(new Set());
  const isFirst = useRef(true);


  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data } = await supabase.
      from("notifikasi").
      select(`
          id_notif, tipe, pesan, dibaca, waktu,
          id_produk, id_bahan, id_pesanan,
          produk(nama_produk),
          bahan_baku(merek, jenis_bahan),
          pesanan_online(id_pesanan, status)
        `).
      eq("id_user", userId).
      order("waktu", { ascending: false }).
      limit(50);

      const rows = (data ?? []).map((n) => ({
        id: n.id_notif,
        tipe: n.tipe,
        pesan: n.pesan,
        dibaca: n.dibaca,
        waktu: n.waktu,
        waktu_fmt: fmtRelative(n.waktu),
        modul: resolveModul(n),
        id_produk: n.id_produk ?? null,
        id_bahan: n.id_bahan ?? null,
        id_pesanan: n.id_pesanan ?? null
      }));



      if (!isFirst.current) {
        const newRows = rows.filter((r) => !knownIds.current.has(r.id));
        if (newRows.length > 0) {
          setToasts((prev) => [
          ...prev,
          ...newRows.map((r) => ({ id: `${r.id}-${Date.now()}`, tipe: r.tipe, pesan: r.pesan }))]
          );
        }
      }
      isFirst.current = false;
      rows.forEach((r) => knownIds.current.add(r.id));

      setNotifs(rows);
      setUnread(rows.filter((r) => !r.dibaca).length);
    } finally {
      setLoading(false);
    }
  }, [userId]);


  useEffect(() => {
    if (!userId) return;
    fetch();

    const ch = supabase.
    channel(`notif-${userId}`).
    on("postgres_changes",
    { event: "INSERT", schema: "public", table: "notifikasi", filter: `id_user=eq.${userId}` },
    () => fetch()
    ).
    on("postgres_changes",
    { event: "UPDATE", schema: "public", table: "notifikasi", filter: `id_user=eq.${userId}` },
    () => fetch()
    ).
    subscribe();

    return () => {supabase.removeChannel(ch);};
  }, [userId, fetch]);



  const tandaiDibaca = useCallback(async (id) => {
    await supabase.from("notifikasi").update({ dibaca: true }).eq("id_notif", id);
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, dibaca: true } : n));
    setUnread((prev) => Math.max(0, prev - 1));
  }, []);


  const tandaiSemuaDibaca = useCallback(async () => {
    if (!userId) return;
    await supabase.from("notifikasi").
    update({ dibaca: true }).
    eq("id_user", userId).
    eq("dibaca", false);
    setNotifs((prev) => prev.map((n) => ({ ...n, dibaca: true })));
    setUnread(0);
  }, [userId]);


  const addToast = useCallback((toast) => {
    setToasts((prev) => [...prev, { id: `local-${Date.now()}-${Math.random()}`, ...toast }]);
  }, []);


  const dismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  return { notifs, unread, loading, fetch, tandaiDibaca, tandaiSemuaDibaca, toasts, addToast, dismissToast };
}






function resolveModul(n) {
  if (n.id_bahan) return "Manajemen Bahan Baku";
  if (n.id_produk) return "Manajemen Produk";
  if (n.id_pesanan) return "Penjualan Online";
  return "Sistem";
}