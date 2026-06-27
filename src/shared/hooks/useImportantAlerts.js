





import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { fmtDate, fmtDurasi, asUTC } from "../utils/format";
import { checkAndNotifOrderAlerts } from "../utils/notifikasiService";

export function useImportantAlerts(role) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);


  const check = useCallback(async () => {
    try {
      const now = new Date();
      const items = [];


      if (role === "Admin" || role === "Kasir") {
        checkAndNotifOrderAlerts();
        const { data: orders } = await supabase.
        from("pesanan_online").
        select("id_pesanan, tanggal, waktu_antar, status").
        in("status", ["Pending", "Diproses"]);

        for (const o of orders ?? []) {
          const tgl = new Date(asUTC(o.tanggal));
          if (!o.waktu_antar) {

            if (o.status === "Pending" && now - tgl > 3_600_000) {
              const m = Math.floor((now - tgl) / 60_000);
              items.push({
                id: `seg-${o.id_pesanan}`,
                title: `#${o.id_pesanan} Belum Diproses`,
                sub: `Segera antar - sudah ${fmtDurasi(m)} menunggu`,
                variant: "habis"
              });
            }
          } else {

            const dl = new Date(asUTC(o.waktu_antar));
            const h = (dl - now) / 3_600_000;
            if (h <= 0 && o.status !== "Selesai" && o.status !== "Dibatalkan") {
              const mLewat = Math.floor(-h * 60);
              items.push({
                id: `po-${o.id_pesanan}`,
                title: `#${o.id_pesanan} LEWAT DEADLINE`,
                sub: `Pre-order - terlambat ${fmtDurasi(mLewat)} (status: ${o.status})`,
                variant: "habis"
              });
            } else if (h > 0 && h <= 24) {
              const mSisa = Math.floor(h * 60);
              items.push({
                id: `po-${o.id_pesanan}`,
                title: `#${o.id_pesanan} - Deadline Dekat`,
                sub: `Pre-order - ${fmtDurasi(mSisa)} lagi`,
                variant: h < 6 ? "habis" : "mendekati"
              });
            }
          }
        }
      }


      if (role === "Admin") {
        const in3 = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).
        format(new Date(now.getTime() + 3 * 86_400_000));

        const { data: pm } = await supabase.
        from("pembelian_bahan").
        select("id_pembelian, jatuh_tempo").
        eq("status_pembayaran", "Tempo").
        not("jatuh_tempo", "is", null).
        lte("jatuh_tempo", in3);

        for (const p of pm ?? []) {
          const dl = new Date(`${p.jatuh_tempo}T00:00:00+07:00`);
          const days = Math.ceil((dl - now) / 86_400_000);
          items.push({
            id: `jt-${p.id_pembelian}`,
            title: `Pembelian #${p.id_pembelian} - ${days < 0 ? "Tunggakan!" : days === 0 ? "Jatuh Tempo Hari Ini" : `${days} Hari Lagi`}`,
            sub: `Jatuh tempo: ${fmtDate(p.jatuh_tempo)}`,
            variant: days <= 0 ? "habis" : "mendekati"
          });
        }
      }


      if (role === "Admin" || role === "Kasir") {
        const { data: bp } = await supabase.
        from("batch_produk").
        select("id_batch, id_produk, produk(nama_produk), status_stok, status_kadaluarsa, stok").
        or("status_stok.in.(Menipis,Habis),status_kadaluarsa.in.(Mendekati,Ya)");


        const produkMap = {};
        for (const b of bp ?? []) {
          const pid = b.id_produk;
          const nama = b.produk?.nama_produk ?? `#${pid}`;
          if (!produkMap[pid]) produkMap[pid] = { nama, totalStok: 0, hasMenuju: false, hasHabis: false, hasMendekati: false, hasKadaluarsa: false };
          const entry = produkMap[pid];
          entry.totalStok += Number(b.stok);
          if (b.status_stok === "Habis") entry.hasHabis = true;
          if (b.status_stok === "Menipis") entry.hasMenuju = true;
          if (b.status_kadaluarsa === "Mendekati") entry.hasMendekati = true;
          if (b.status_kadaluarsa === "Ya") entry.hasKadaluarsa = true;
        }

        for (const [pid, p] of Object.entries(produkMap)) {


          const hasStock = p.totalStok > 0;
          if (!hasStock && p.hasHabis) {
            items.push({ id: `bp-stok-${pid}`, title: `Produk: ${p.nama}`, sub: "Seluruh stok habis", variant: "habis" });
          } else if (p.hasMenuju && !p.hasHabis) {
            items.push({ id: `bp-stok-${pid}`, title: `Produk: ${p.nama}`, sub: `Stok batch menipis (${p.totalStok})`, variant: "mendekati" });
          }

          if (hasStock && p.hasKadaluarsa) {
            items.push({ id: `bp-exp-${pid}`, title: `Produk: ${p.nama}`, sub: "Ada batch sudah kadaluarsa", variant: "habis" });
          } else if (hasStock && p.hasMendekati) {
            items.push({ id: `bp-exp-${pid}`, title: `Produk: ${p.nama}`, sub: "Mendekati kadaluarsa", variant: "mendekati" });
          }
        }
      }


      if (role === "Admin" || role === "Produksi") {
        const { data: bb } = await supabase.
        from("batch_bahan_baku").
        select("id_batch_bb, id_bahan, bahan_baku(merek), status_stok, status_kadaluarsa, stok").
        or("status_stok.in.(Menipis,Habis),status_kadaluarsa.in.(Mendekati,Ya)");


        const bahanMap = {};
        for (const b of bb ?? []) {
          const bid = b.id_bahan;
          const nama = b.bahan_baku?.merek ?? `#${bid}`;
          if (!bahanMap[bid]) bahanMap[bid] = { nama, totalStok: 0, hasMenuju: false, hasHabis: false, hasMendekati: false, hasKadaluarsa: false };
          const entry = bahanMap[bid];
          entry.totalStok += Number(b.stok);
          if (b.status_stok === "Habis") entry.hasHabis = true;
          if (b.status_stok === "Menipis") entry.hasMenuju = true;
          if (b.status_kadaluarsa === "Mendekati") entry.hasMendekati = true;
          if (b.status_kadaluarsa === "Ya") entry.hasKadaluarsa = true;
        }

        for (const [bid, b] of Object.entries(bahanMap)) {
          const hasStock = b.totalStok > 0;
          if (!hasStock && b.hasHabis) {
            items.push({ id: `bb-stok-${bid}`, title: `Bahan: ${b.nama}`, sub: "Seluruh stok habis", variant: "habis" });
          } else if (b.hasMenuju && !b.hasHabis) {
            items.push({ id: `bb-stok-${bid}`, title: `Bahan: ${b.nama}`, sub: `Stok batch menipis (${b.totalStok})`, variant: "mendekati" });
          }
          if (hasStock && b.hasKadaluarsa) {
            items.push({ id: `bb-exp-${bid}`, title: `Bahan: ${b.nama}`, sub: "Ada batch sudah kadaluarsa", variant: "habis" });
          } else if (hasStock && b.hasMendekati) {
            items.push({ id: `bb-exp-${bid}`, title: `Bahan: ${b.nama}`, sub: "Mendekati kadaluarsa", variant: "mendekati" });
          }
        }
      }

      setAlerts(items);
    } catch (e) {
      console.warn("[useImportantAlerts]", e.message);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    check();
    const id = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [check]);

  return { alerts, loading };
}