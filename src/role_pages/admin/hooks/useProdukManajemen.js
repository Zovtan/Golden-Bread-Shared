import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "../../../lib/supabase";
import { useEnums, invalidateEnumsCache, sel, fetchEnumKategoriProduk } from "../../../shared/hooks/useEnums";
import { useRealtimeRefresh } from "../../../shared/hooks/useRealtimeRefresh";
import { logActivity } from "../../../shared/utils/logActivity";
import { checkAndNotifStokProduk } from "../../../shared/utils/notifikasiService";
import { todayWIB, fmtDateYMD } from "../../../shared/utils/format";
import { getFreshAccessToken, getFreshSession } from "../../../shared/utils/authToken";
import { computeStatusStok, computeStatusKdl, processProduk } from "../../../shared/utils/batchUtils";

const WATCHED = ["produk", "batch_produk", "masalah_produk"];



export function useProdukManajemen(search = "") {
  const [semuaProduk, setSemuaProduk] = useState([]);

  const produkList = useMemo(() => {
    if (!search.trim()) return semuaProduk;
    const q = search.trim().toLowerCase();
    return semuaProduk.filter((p) =>
    p.nama_produk?.toLowerCase().includes(q) ||
    p.kategori?.toLowerCase().includes(q) ||
    p.statusStok?.toLowerCase().includes(q) ||
    p.status?.toLowerCase().includes(q)
    );
  }, [semuaProduk, search]);
  const [kategoriList, setKategoriList] = useState([]);
  const [jenisMasalahList, setJenisMasalahList] = useState([]);
  const [stats, setStats] = useState({ habis: 0, kadaluarsa: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { enums } = useEnums();
  const fetchToken = useRef(0);
  const submittingRef = useRef(false);


  useEffect(() => {
    setKategoriList(sel.produkKategori(enums));
    setJenisMasalahList(sel.jenisMasalahProduk(enums));
  }, [enums]);


  const fetchProduk = useCallback(async (bg = false) => {
    if (!bg) setLoading(true);
    setError(null);
    const token = ++fetchToken.current;
    try {
      let q = supabase.from("produk").
      select(`id_produk,nama_produk,gambar,harga_satuan,stok_minimal,
                 estimasi_kadaluarsa_hari,batas_peringatan_hari,deskripsi,resep,status,
                 kategori_produk, kategori_produk_enum:enum_kategori_produk!kategori_produk(id,nilai),
                 batch_produk(id_batch,stok,kadaluarsa,status_stok,status_kadaluarsa,produksi(waktu))`).
      order("id_produk");
      if (search.trim()) q = q.ilike("nama_produk", `%${search.trim()}%`);
      const { data, error: err } = await q;
      if (err) throw err;
      if (fetchToken.current !== token) return;
      const processed = processProduk(data ?? []);
      setSemuaProduk(processed);
      setStats({ habis: processed.filter((p) => p.statusStok === "Habis").length, kadaluarsa: processed.filter((p) => p.adaKadaluarsa === "Ya").length });
      setLastUpdated(new Date());
    } catch (e) {if (fetchToken.current === token) setError(e.message);} finally
    {if (fetchToken.current === token) setLoading(false);}

  }, []);

  useEffect(() => {fetchProduk(false);return () => {fetchToken.current++;};}, [fetchProduk]);
  useRealtimeRefresh("produk-manajemen", WATCHED, useCallback(() => fetchProduk(true), [fetchProduk]));



  async function uploadGambar(file) {
    if (!file) return null;


    const token = await getFreshAccessToken();
    if (!token) throw new Error("Sesi tidak valid. Silakan masuk ulang.");

    const signRes = await fetch("/.netlify/functions/cloudinary-sign", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({})
    });
    const sign = await signRes.json().catch(() => ({}));
    if (!signRes.ok) throw new Error(sign?.error ?? `Gagal menyiapkan upload gambar (HTTP ${signRes.status}).`);


    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sign.apiKey);
    form.append("timestamp", String(sign.timestamp));
    form.append("signature", sign.signature);
    form.append("folder", sign.folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
      method: "POST",
      body: form
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message ?? "Upload gambar gagal");
    }
    const data = await res.json();
    const rawUrl = data.secure_url;
    if (!rawUrl) throw new Error("URL gambar tidak diterima dari Cloudinary");

    return rawUrl.replace("/upload/", "/upload/f_webp,q_auto,w_1200/");
  }



  async function deleteGambarLama(url) {
    if (!url || !url.includes("res.cloudinary.com")) return;
    try {
      const token = await getFreshAccessToken();
      if (!token) return;
      await fetch("/.netlify/functions/cloudinary-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url })
      });
    } catch {}
  }


  async function resolveKategoriId(kategori_produk) {
    if (!kategori_produk) return null;
    const list = await fetchEnumKategoriProduk();
    const found = list.find((k) => k.nilai === kategori_produk);
    if (!found) throw new Error(`Kategori produk "${kategori_produk}" tidak ditemukan`);
    return found.id;
  }


  async function tambahProduk(payload) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const gambarUrl = await uploadGambar(payload.gambarFile);
      const kategoriId = await resolveKategoriId(payload.kategori_produk);
      const { error } = await supabase.from("produk").insert({
        nama_produk: payload.nama_produk, kategori_produk: kategoriId,
        harga_satuan: payload.harga_satuan, stok_minimal: payload.stok_minimal,
        estimasi_kadaluarsa_hari: payload.estimasi_kadaluarsa_hari,
        batas_peringatan_hari: payload.batas_peringatan_hari,
        deskripsi: payload.deskripsi || null, resep: payload.resep || null,
        gambar: gambarUrl, status: "Aktif"
      });
      if (error) throw error;
      await fetchProduk(true);
    } finally {submittingRef.current = false;}
  }


  async function editProduk(payload) {
    const { data: sebelum } = await supabase.from("produk").
    select("*, kategori_enum:enum_kategori_produk!kategori_produk(nilai)").
    eq("id_produk", payload.id_produk).single();
    const gambarUrl = payload.gambarFile ? await uploadGambar(payload.gambarFile) : undefined;
    const kategoriId = await resolveKategoriId(payload.kategori_produk);
    const upd = {
      nama_produk: payload.nama_produk, kategori_produk: kategoriId,
      harga_satuan: payload.harga_satuan, stok_minimal: payload.stok_minimal,
      estimasi_kadaluarsa_hari: payload.estimasi_kadaluarsa_hari,
      batas_peringatan_hari: payload.batas_peringatan_hari,
      deskripsi: payload.deskripsi || null, resep: payload.resep || null, status: payload.status
    };
    if (gambarUrl !== undefined) upd.gambar = gambarUrl;
    const { error: pErr } = await supabase.from("produk").update(upd).eq("id_produk", payload.id_produk);
    if (pErr) throw pErr;


    if (gambarUrl !== undefined && sebelum?.gambar && sebelum.gambar !== gambarUrl) {
      await deleteGambarLama(sebelum.gambar);
    }




    const PRODUK_LABELS = {
      nama_produk: "Nama Produk", kategori_produk: "Kategori", harga_satuan: "Harga Satuan",
      stok_minimal: "Stok Minimal", estimasi_kadaluarsa_hari: "Est. Kadaluarsa (hari)",
      batas_peringatan_hari: "Batas Peringatan (hari)", deskripsi: "Deskripsi",
      resep: "Resep", status: "Status"
    };
    const namaProduk = sebelum?.nama_produk ?? String(payload.id_produk);

    const sebelumResolved = { ...sebelum, kategori_produk: sebelum?.kategori_enum?.nilai ?? sebelum?.kategori_produk };
    for (const [k, label] of Object.entries(PRODUK_LABELS)) {
      const valBefore = sebelumResolved?.[k] ?? null;
      const valAfter = payload[k] ?? null;
      if (String(valBefore ?? "") !== String(valAfter ?? "")) {
        await logActivity({ aktivitas: "UPDATE", modul: "produk",
          detail: { field: label, id_produk: payload.id_produk, nama_produk: namaProduk },
          sebelum: valBefore, sesudah: valAfter });
      }
    }
    for (const b of payload.batches ?? []) {
      const stok = Number(b.stok);

      const { data: batchBefore } = await supabase.from("batch_produk").
      select("stok, kadaluarsa").eq("id_batch", b.id_batch).single();
      await supabase.from("batch_produk").update({
        stok, kadaluarsa: b.kadaluarsa,
        status_stok: computeStatusStok(stok, payload.stok_minimal),
        status_kadaluarsa: computeStatusKdl(b.kadaluarsa, payload.batas_peringatan_hari)
      }).eq("id_batch", b.id_batch);
      const BATCH_FIELDS = { stok: "Stok", kadaluarsa: "Kadaluarsa" };
      for (const [k, label] of Object.entries(BATCH_FIELDS)) {
        const vBefore = batchBefore?.[k] ?? null;
        const vAfter = k === "stok" ? stok : b[k] || null;
        if (String(vBefore ?? "") !== String(vAfter ?? "")) {
          await logActivity({ aktivitas: "UPDATE", modul: "batch_produk",
            detail: { field: label, id_batch: b.id_batch, nama_produk: namaProduk },
            sebelum: vBefore, sesudah: vAfter });
        }
      }
    }

    await checkAndNotifStokProduk({
      id_produk: payload.id_produk,
      nama_produk: namaProduk,
      stok_minimal: payload.stok_minimal
    });
    await fetchProduk(true);
  }


  async function tambahProduksi(payload) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const session = await getFreshSession();const user = session?.user;
      if (!user) throw new Error("Tidak terautentikasi.");
      const { data: produk, error: pErr } = await supabase.from("produk").
      select("estimasi_kadaluarsa_hari,batas_peringatan_hari,stok_minimal").
      eq("id_produk", payload.id_produk).single();
      if (pErr) throw pErr;
      const today = new Date(),kdl = new Date(`${todayWIB()}T00:00:00+07:00`);
      kdl.setDate(kdl.getDate() + produk.estimasi_kadaluarsa_hari);
      const jumlah = Number(payload.jumlah);
      const tglKdl = fmtDateYMD(kdl);
      const { data: sesi, error: sErr } = await supabase.from("produksi").
      insert({ id_user: user.id, waktu: today.toISOString() }).select("id_produksi").single();
      if (sErr) throw sErr;


      const { error: bErr } = await supabase.from("batch_produk").insert({
        id_produk: payload.id_produk, id_produksi: sesi.id_produksi, stok: jumlah, jumlah_awal: jumlah, kadaluarsa: tglKdl,
        status_kadaluarsa: computeStatusKdl(tglKdl, produk.batas_peringatan_hari),
        status_stok: computeStatusStok(jumlah, produk.stok_minimal)
      });
      if (bErr) {

        await supabase.from("produksi").delete().eq("id_produksi", sesi.id_produksi);
        throw bErr;
      }
      await fetchProduk(true);
    } finally {submittingRef.current = false;}
  }


  async function laporMasalah(payload) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const session = await getFreshSession();const user = session?.user;
      if (!user) throw new Error("Tidak terautentikasi.");
      const jumlah = Number(payload.jumlah);
      const { data: batch } = await supabase.from("batch_produk").select("stok,id_produk").eq("id_batch", payload.id_batch).single();
      if (!batch) throw new Error("Batch tidak ditemukan.");
      if (jumlah > Number(batch.stok)) throw new Error(`Jumlah masalah (${jumlah}) melebihi stok batch saat ini (${batch.stok}).`);
      const { data: produk } = await supabase.from("produk").select("stok_minimal").eq("id_produk", batch.id_produk).single();
      const stokBaru = Math.max(0, batch.stok - jumlah);
      const { data: masalah, error } = await supabase.from("masalah_produk").insert({
        id_batch: payload.id_batch, id_user: user.id, nama_masalah: payload.nama_masalah,
        tanggal: new Date().toISOString(), jumlah, keterangan: payload.keterangan || null, stok_dikurangi: jumlah
      }).select("id_masalah").single();
      if (error) throw error;

      if (stokBaru <= 0) {
        const { error: bErr } = await supabase.from("batch_produk").
        update({ stok: 0, status_stok: "Habis" }).eq("id_batch", payload.id_batch);
        if (bErr) {
          await supabase.from("masalah_produk").delete().eq("id_masalah", masalah.id_masalah);
          throw bErr;
        }
      } else {
        const { error: bErr } = await supabase.from("batch_produk").
        update({ stok: stokBaru, status_stok: computeStatusStok(stokBaru, produk?.stok_minimal ?? 0) }).
        eq("id_batch", payload.id_batch);
        if (bErr) {
          await supabase.from("masalah_produk").delete().eq("id_masalah", masalah.id_masalah);
          throw bErr;
        }
      }
      await checkAndNotifStokProduk({
        id_produk: batch.id_produk,
        nama_produk: payload.nama_produk ?? `Produk #${batch.id_produk}`,
        stok_minimal: produk?.stok_minimal ?? 0
      });
      await logActivity({
        aktivitas: "CREATE", modul: "Masalah Produk",
        detail: { pesan: `${payload.nama_produk ?? `Produk #${batch.id_produk}`} - ${payload.nama_masalah}: ${payload.jumlah} unit dilaporkan${payload.keterangan ? ` (${payload.keterangan})` : ""}` }
      });
      await fetchProduk(true);
    } finally {submittingRef.current = false;}
  }


  async function toggleStatusProduk(id_produk, currentStatus) {
    const newStatus = currentStatus === "Aktif" ? "Tidak" : "Aktif";
    const { error } = await supabase.from("produk").
    update({ status: newStatus }).eq("id_produk", id_produk);
    if (error) throw error;
    const nama = produkList.find((p) => p.id_produk === id_produk)?.nama_produk ?? `Produk #${id_produk}`;
    await logActivity({
      aktivitas: "UPDATE", modul: "Produk",
      detail: { pesan: `${nama} - status diubah dari ${currentStatus} menjadi ${newStatus}` },
      sebelum: currentStatus, sesudah: newStatus
    });
    await fetchProduk(true);
  }

  async function addEnumValue(enumType, nilai) {
    const TABLE = { kategori_produk: "enum_kategori_produk" };
    const table = TABLE[enumType];
    if (!table) throw new Error(`Unknown enum type: ${enumType}`);
    const { data, error } = await supabase.from(table).insert({ nilai: nilai.trim() }).select("id,nilai").single();
    if (error) throw error;
    invalidateEnumsCache();
    return data;
  }

  async function editEnumValue(enumType, id, nilai) {
    const TABLE = { kategori_produk: "enum_kategori_produk" };
    const table = TABLE[enumType];
    if (!table) throw new Error(`Unknown enum type: ${enumType}`);
    const { error } = await supabase.from(table).update({ nilai: nilai.trim() }).eq("id", id);
    if (error) throw error;
    invalidateEnumsCache();
  }

  return { produkList, kategoriList, jenisMasalahList, stats, loading, error, lastUpdated,
    tambahProduk, editProduk, tambahProduksi, laporMasalah, toggleStatusProduk,
    addEnumValue, editEnumValue,
    refetch: () => fetchProduk(false) };
}