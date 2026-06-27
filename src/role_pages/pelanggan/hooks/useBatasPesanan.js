import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { DEFAULT_BATAS } from "../../../shared/utils/batasPesananDefaults";

const DEFAULT = DEFAULT_BATAS;


function parseTime(t) {
  if (!t) return "00:00";
  return String(t).slice(0, 5);
}


function parseRow(data) {
  return {
    min_segera: data.min_segera,
    min_preorder: data.min_preorder,
    max_preorder: data.max_preorder,
    jam_mulai_segera: parseTime(data.jam_mulai_segera),
    jam_selesai_segera: parseTime(data.jam_selesai_segera),
    jam_mulai_preorder: parseTime(data.jam_mulai_preorder),
    jam_selesai_preorder: parseTime(data.jam_selesai_preorder),
    waktu_antar_preorder: (() => {
      try {return JSON.parse(data.waktu_antar_preorder);} catch {return DEFAULT.waktu_antar_preorder;}
    })(),
    menerima_segera: data.menerima_segera ?? true,
    menerima_preorder: data.menerima_preorder ?? true,
    menit_highlight_segera: data.menit_highlight_segera ?? DEFAULT.menit_highlight_segera,
    ongkir_base: data.ongkir_base ?? 0,
    ongkir_multiplier_aktif: data.ongkir_multiplier_aktif ?? false,
    ongkir_multiplier: data.ongkir_multiplier ?? 1.5
  };
}




export function useBatasPesanan() {
  const [batas, setBatas] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;

    supabase.
    from("konfigurasi_pesanan").
    select("min_segera, min_preorder, max_preorder, ongkir_base, ongkir_multiplier_aktif, ongkir_multiplier, jam_mulai_segera, jam_selesai_segera, jam_mulai_preorder, jam_selesai_preorder, waktu_antar_preorder, menerima_segera, menerima_preorder, menit_highlight_segera").
    eq("id", 1).
    single().
    then(({ data, error: err }) => {
      if (!alive) return;
      if (err) setError(err.message);
      if (data) setBatas(parseRow(data));
    }).
    finally(() => {if (alive) setLoading(false);});


    const channelName = `batas-pesanan-watch-${Math.random().toString(36).slice(2)}`;
    const channel = supabase.
    channel(channelName).
    on("postgres_changes", { event: "UPDATE", schema: "public", table: "konfigurasi_pesanan" }, (payload) => {
      if (alive && payload.new) setBatas(parseRow(payload.new));
    }).
    subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, []);


  function isSegeraAntarOpen() {
    const now = new Date().toLocaleTimeString("en-US", {
      timeZone: "Asia/Jakarta", hour12: false, hour: "2-digit", minute: "2-digit"
    }).slice(0, 5);
    return now >= batas.jam_mulai_segera && now < batas.jam_selesai_segera;
  }


  function isPreorderOpen() {
    const now = new Date().toLocaleTimeString("en-US", {
      timeZone: "Asia/Jakarta", hour12: false, hour: "2-digit", minute: "2-digit"
    }).slice(0, 5);
    return now >= batas.jam_mulai_preorder && now < batas.jam_selesai_preorder;
  }


  function validateQty(qty, jenis) {
    const n = Number(qty);
    if (jenis === "segera") {
      if (n < batas.min_segera)
      return `Minimum pesanan segera antar adalah ${batas.min_segera} item.`;
    }
    if (jenis === "preorder") {
      if (n < batas.min_preorder)
      return `Minimum pesanan preorder adalah ${batas.min_preorder} item.`;
      if (n > batas.max_preorder)
      return `Maksimum pesanan preorder adalah ${batas.max_preorder} item.`;
    }
    return null;
  }

  return { batas, loading, error, validateQty, isSegeraAntarOpen, isPreorderOpen };
}