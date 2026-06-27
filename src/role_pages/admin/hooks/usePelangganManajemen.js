import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "../../../lib/supabase";
import { fmtDateTime } from "../../../shared/utils/format";
import { useEnums, sel } from "../../../shared/hooks/useEnums";



export function usePelangganManajemen(search = "") {
  const [semuaPelanggan, setSemuaPelanggan] = useState([]);

  const pelangganList = useMemo(() => {
    if (!search.trim()) return semuaPelanggan;
    const q = search.trim().toLowerCase();
    return semuaPelanggan.filter((p) =>
    p.nama_lengkap?.toLowerCase().includes(q) ||
    p.nama_toko?.toLowerCase().includes(q) ||
    p.email?.toLowerCase().includes(q) ||
    p.no_telp?.toLowerCase().includes(q) ||
    p.alamat?.toLowerCase().includes(q)
    );
  }, [semuaPelanggan, search]);
  const [stats, setStats] = useState({ total: 0, totalTransaksi: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { enums } = useEnums();
  const fetchToken = useRef(0);
  const submittingRef = useRef(false);


  const fetchPelanggan = useCallback(async (bg = false) => {
    if (!bg) setLoading(true);
    setError(null);
    const token = ++fetchToken.current;
    try {
      let q = supabase.
      from("profiles").
      select(`
          id, nama_lengkap, no_telp, nama_toko, jenis_pelanggan,
          alamat, status, created_at,
          pesanan_online!id_pelanggan(id_pesanan, status, detail_pesanan_online(qty, harga_satuan))
        `).
      eq("role", "Pelanggan").
      order("created_at", { ascending: true });
      if (search.trim()) q = q.ilike("nama_lengkap", `%${search.trim()}%`);
      const { data, error: err } = await q;
      if (err) throw err;
      if (fetchToken.current !== token) return;


      const { data: emailRows } = await supabase.rpc("get_user_emails");
      const emailMap = Object.fromEntries((emailRows ?? []).map((r) => [r.id, r.email]));


      const processed = (data ?? []).map((p) => {
        const pesanans = p.pesanan_online ?? [];
        const totalTrx = pesanans.length;
        const totalNilai = pesanans.reduce(
          (s, o) => s + (o.detail_pesanan_online ?? []).reduce((sub, d) => sub + Number(d.qty) * Number(d.harga_satuan), 0), 0
        );
        return {
          ...p,
          email: emailMap[p.id] ?? "-",
          displayId: String(p.id),
          totalTrx,
          totalNilai
        };
      });

      const totalTrxAll = processed.reduce((s, p) => s + p.totalTrx, 0);
      setSemuaPelanggan(processed);
      setStats({ total: processed.length, totalTransaksi: totalTrxAll });
      setLastUpdated(new Date());
    } catch (e) {if (fetchToken.current === token) setError(e.message);} finally
    {if (fetchToken.current === token) setLoading(false);}

  }, []);

  useEffect(() => {
    fetchPelanggan(false);
    return () => {fetchToken.current++;};
  }, [fetchPelanggan]);





  async function tambahPelanggan(payload) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const { data: userId, error: rpcErr } = await supabase.rpc("create_app_user", {
        p_email: payload.email,
        p_password: payload.password,
        p_nama_lengkap: payload.nama_lengkap,
        p_no_telp: payload.no_telp || "",
        p_role: "Pelanggan",
        p_jenis_pelanggan: payload.jenis_pelanggan || "Reguler",
        p_nama_toko: payload.nama_toko || null,
        p_alamat: payload.alamat || null
      });
      if (rpcErr) throw rpcErr;
      if (!userId) throw new Error("Gagal membuat akun pelanggan.");
      await fetchPelanggan(true);
    } finally {submittingRef.current = false;}
  }


  async function editPelanggan(payload) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const { error: profErr } = await supabase.from("profiles").update({
        nama_lengkap: payload.nama_lengkap,
        no_telp: payload.no_telp || "",
        nama_toko: payload.nama_toko || null,
        jenis_pelanggan: payload.jenis_pelanggan,
        alamat: payload.alamat || null,
        status: payload.status ?? "Aktif",
        updated_at: new Date().toISOString()
      }).eq("id", payload.id);
      if (profErr) throw profErr;
      await fetchPelanggan(true);
    } finally {submittingRef.current = false;}
  }


  async function fetchRiwayat(id_pelanggan) {
    const { data, error: err } = await supabase.
    from("pesanan_online").
    select(`
        id_pesanan, tanggal, waktu_antar, status,
        detail_pesanan_online(qty, harga_satuan, produk(nama_produk))
      `).
    eq("id_pelanggan", id_pelanggan).
    order("tanggal", { ascending: false }).
    limit(50);
    if (err) throw err;
    return (data ?? []).map((o) => ({
      id_pesanan: o.id_pesanan,
      tanggal: fmtDateTime(o.tanggal),
      tanggal_raw: o.tanggal,
      waktu_antar: o.waktu_antar ?
      fmtDateTime(o.waktu_antar) :
      "Segera antar",
      items: (o.detail_pesanan_online ?? []).map((d) => `${d.produk?.nama_produk ?? "?"} × ${d.qty}`),
      total: (o.detail_pesanan_online ?? []).reduce((s, d) => s + d.qty * Number(d.harga_satuan), 0),
      status: o.status
    }));
  }

  return {
    pelangganList, stats, loading, error, lastUpdated,
    jenisPelangganList: sel.jenisPelanggan(enums),
    tambahPelanggan, editPelanggan, fetchRiwayat,
    refetch: () => fetchPelanggan(false)
  };
}