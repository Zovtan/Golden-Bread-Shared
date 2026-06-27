

import { supabase } from "../../lib/supabase";
import { fmtRp, fmtDate, fmtDurasi } from "./format";




async function getUsersByRole(role) {
  const { data } = await supabase.from("profiles").select("id").eq("role", role).eq("status", "Aktif");
  return (data ?? []).map((p) => p.id);
}


async function insertNotifs({ userIds, tipe, pesan, id_produk, id_bahan, id_pesanan }) {
  if (!userIds.length) return;
  await supabase.from("notifikasi").insert(
    userIds.map((id_user) => ({
      id_user, tipe, pesan, dibaca: false, waktu: new Date().toISOString(),
      ...(id_produk ? { id_produk } : {}),
      ...(id_bahan ? { id_bahan } : {}),
      ...(id_pesanan ? { id_pesanan } : {})
    }))
  );
}





export async function checkAndNotifStokProduk({ id_produk, nama_produk, stok_minimal }) {
  const { data: batches } = await supabase.
  from("batch_produk").select("stok,status_stok").eq("id_produk", id_produk);
  const all = batches ?? [];
  const totalStok = all.reduce((s, b) => s + Number(b.stok), 0);
  const nMenipis = all.filter((b) => b.status_stok === "Menipis").length;

  let tipe = null,pesan = "";
  if (totalStok <= 0) {
    tipe = "Stok_Habis";
    pesan = `${nama_produk} - Stok Habis!\nSemua ${all.length} batch kosong`;
  } else if (totalStok <= Number(stok_minimal ?? 0)) {
    tipe = "Stok_Menipis";
    const batchNote = nMenipis > 0 ? ` · ${nMenipis} dari ${all.length} batch menipis` : "";
    pesan = `${nama_produk} - Stok Menipis!\nSisa total: ${totalStok} pcs (min: ${stok_minimal})${batchNote}`;
  }
  if (!tipe) return;

  const [kasirIds, adminIds] = await Promise.all([getUsersByRole("Kasir"), getUsersByRole("Admin")]);
  await insertNotifs({ userIds: [...new Set([...kasirIds, ...adminIds])], tipe, id_produk, pesan });
}





export async function checkAndNotifStokBahan({ id_bahan, nama_bahan, satuan, stok_minimal }) {
  const { data: batches } = await supabase.
  from("batch_bahan_baku").select("stok,status_stok").eq("id_bahan", id_bahan);
  const all = batches ?? [];
  const totalStok = all.reduce((s, b) => s + Number(b.stok), 0);
  const nMenipis = all.filter((b) => b.status_stok === "Menipis").length;

  let tipe = null,pesan = "";
  if (totalStok <= 0) {
    tipe = "Stok_Habis";
    pesan = `${nama_bahan} - Stok Habis!\nSemua ${all.length} batch kosong`;
  } else if (totalStok <= Number(stok_minimal ?? 0)) {
    tipe = "Stok_Menipis";
    const batchNote = nMenipis > 0 ? ` · ${nMenipis} dari ${all.length} batch menipis` : "";
    pesan = `${nama_bahan} - Stok Menipis!\nSisa total: ${totalStok} ${satuan} (min: ${stok_minimal})${batchNote}`;
  }
  if (!tipe) return;

  const [produksiIds, adminIds] = await Promise.all([getUsersByRole("Produksi"), getUsersByRole("Admin")]);
  await insertNotifs({ userIds: [...new Set([...produksiIds, ...adminIds])], tipe, id_bahan, pesan });
}




export async function notifPesananBaru({ id_pesanan, nama_pelanggan, total, waktu_antar }) {
  const [kasirIds, adminIds] = await Promise.all([getUsersByRole("Kasir"), getUsersByRole("Admin")]);
  const jenis = waktu_antar ? "Pre-order" : "Segera antar";
  const fmtTotal = `Rp${fmtRp(total ?? 0)}`;
  await insertNotifs({
    userIds: [...new Set([...kasirIds, ...adminIds])],
    tipe: "Pesanan_Baru", id_pesanan,
    pesan: `Pesanan Baru #${id_pesanan}\nDari: ${nama_pelanggan ?? "Pelanggan"} · ${jenis} · ${fmtTotal}`
  });
}





export async function notifStatusPesanan({ id_pesanan, id_pelanggan, newStatus, pesanPembatalan, nama_produk_list, refunded = false }) {
  if (!id_pelanggan) return;

  const label = newStatus === "Diproses" ? "sedang diproses 🔄" :
  newStatus === "Selesai" ? "telah selesai & siap antar ✅" :
  newStatus === "Dibatalkan" ? "telah dibatalkan ❌" :
  newStatus.toLowerCase();

  const produkStr = (nama_produk_list ?? []).slice(0, 2).join(", ");
  const adminIds = await getUsersByRole("Admin");
  const allIds = [...new Set([id_pelanggan, ...adminIds])];

  let pesan = `Pesanan #${id_pesanan} ${label}`;
  if (produkStr) pesan += `\n${produkStr}`;
  if (newStatus === "Dibatalkan" && pesanPembatalan) pesan += `\nAlasan: ${pesanPembatalan}`;
  if (refunded) pesan += `\n💸 Dana telah dikembalikan (refund berhasil).`;

  await insertNotifs({ userIds: allIds, tipe: "Pesanan_Baru", id_pesanan, pesan });
}


export async function notifRefundDitolak({ id_pesanan, id_pelanggan, alasan }) {
  if (!id_pelanggan) return;
  let pesan = `Permintaan refund pesanan #${id_pesanan} ditolak ❌`;
  if (alasan) pesan += `\nAlasan: ${alasan}`;
  await insertNotifs({ userIds: [id_pelanggan], tipe: "Pesanan_Baru", id_pesanan, pesan });
}




export async function checkAndNotifOrderAlerts() {
  try {
    const now = new Date();
    const ago1h = new Date(now - 1 * 3600000).toISOString();
    const in12h = new Date(now.getTime() + 12 * 3600000).toISOString();

    const { data: orders } = await supabase.
    from("pesanan_online").
    select("id_pesanan, tanggal, waktu_antar, status").
    in("status", ["Pending", "Diproses"]);

    if (!orders?.length) return;

    const [kasirIds, adminIds] = await Promise.all([getUsersByRole("Kasir"), getUsersByRole("Admin")]);
    const staff = [...new Set([...kasirIds, ...adminIds])];
    if (!staff.length) return;


    const cutoff = new Date(now - 3 * 3600000).toISOString();
    const { data: recent } = await supabase.
    from("notifikasi").
    select("id_pesanan").
    gte("waktu", cutoff).
    not("id_pesanan", "is", null);
    const recentSet = new Set((recent ?? []).map((r) => r.id_pesanan));

    const toNotif = [];

    for (const o of orders) {
      if (recentSet.has(o.id_pesanan)) continue;

      if (!o.waktu_antar) {

        if (o.status === "Pending" && o.tanggal < ago1h) {
          const minsLate = Math.floor((now - new Date(o.tanggal)) / 60000);
          toNotif.push({
            id_pesanan: o.id_pesanan,
            pesan: `⏰ Pesanan #${o.id_pesanan} belum diproses!\nSudah ${fmtDurasi(minsLate)} sejak pesanan masuk.`
          });
        }
      } else {

        const deadline = new Date(o.waktu_antar);
        if (deadline > now && o.waktu_antar <= in12h) {
          const sisaMnt = Math.floor((deadline - now) / 60000);
          toNotif.push({
            id_pesanan: o.id_pesanan,
            pesan: `📦 Pre-order #${o.id_pesanan} - deadline dalam ${fmtDurasi(sisaMnt)}!\nStatus saat ini: ${o.status}`
          });
        }
      }
    }

    for (const n of toNotif) {
      await insertNotifs({ userIds: staff, tipe: "Pesanan_Baru", id_pesanan: n.id_pesanan, pesan: n.pesan });
    }
  } catch (err) {
    console.warn("[checkAndNotifOrderAlerts]", err.message);
  }
}



export async function notifJatuhTempo({ id_pembelian, id_user, jatuh_tempo }) {
  if (!jatuh_tempo || !id_user) return;
  const tz = "Asia/Jakarta";
  const fmtISO = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
  const target = new Date(`${jatuh_tempo.slice(0, 10)}T00:00:00+07:00`);
  const todayMs = new Date(`${fmtISO(new Date())}T00:00:00+07:00`);
  const days = Math.floor((target - todayMs) / 86_400_000);
  if (days === null || days > 3) return;
  const label = days <= 0 ? "sudah jatuh tempo!" : `jatuh tempo dalam ${days} hari`;
  const fmtTgl = fmtDate(jatuh_tempo);
  const adminIds = await getUsersByRole("Admin");
  await insertNotifs({
    userIds: [...new Set([id_user, ...adminIds])], tipe: "Jatuh_Tempo",
    pesan: `Pembayaran #${id_pembelian} - Tempo ${label}\nJatuh tempo: ${fmtTgl}`
  });
}