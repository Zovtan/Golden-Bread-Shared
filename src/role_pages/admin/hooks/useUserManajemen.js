import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "../../../lib/supabase";
import { fmtDateTime } from "../../../shared/utils/format";
import { useEnums, sel } from "../../../shared/hooks/useEnums";



export function useUserManajemen(search = "") {
  const [semuaUser, setSemuaUser] = useState([]);

  const userList = useMemo(() => {
    if (!search.trim()) return semuaUser;
    const q = search.trim().toLowerCase();
    return semuaUser.filter((u) =>
    u.nama_lengkap?.toLowerCase().includes(q) ||
    u.email?.toLowerCase().includes(q) ||
    u.role?.toLowerCase().includes(q)
    );
  }, [semuaUser, search]);
  const [stats, setStats] = useState({ total: 0, aktif: 0, tidakAktif: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { enums } = useEnums();
  const fetchToken = useRef(0);
  const submittingRef = useRef(false);


  const fetchUsers = useCallback(async (bg = false) => {
    if (!bg) setLoading(true);
    setError(null);
    const token = ++fetchToken.current;
    try {
      let q = supabase.
      from("profiles").
      select("id, nama_lengkap, no_telp, role, status, created_at, updated_at").
      not("role", "eq", "Pelanggan").
      order("created_at", { ascending: true });
      if (search.trim()) q = q.ilike("nama_lengkap", `%${search.trim()}%`);
      const { data, error: err } = await q;
      if (err) throw err;
      if (fetchToken.current !== token) return;


      const { data: emailRows } = await supabase.rpc("get_user_emails");
      const emailMap = Object.fromEntries((emailRows ?? []).map((r) => [r.id, r.email]));
      const lastLoginMap = Object.fromEntries((emailRows ?? []).map((r) => [r.id, r.last_sign_in]));

      const processed = (data ?? []).map((u) => ({
        ...u,
        email: emailMap[u.id] ?? "-",
        displayId: u.id,
        statusLabel: u.status === "Tidak_Aktif" ? "Tidak Aktif" : "Aktif",
        lastLogin: lastLoginMap[u.id] ?
        fmtDateTime(lastLoginMap[u.id]) :
        "-"
      }));

      setSemuaUser(processed);
      setStats({
        total: processed.length,
        aktif: processed.filter((u) => u.status === "Aktif").length,
        tidakAktif: processed.filter((u) => u.status === "Tidak_Aktif").length
      });
      setLastUpdated(new Date());
    } catch (e) {if (fetchToken.current === token) setError(e.message);} finally
    {if (fetchToken.current === token) setLoading(false);}

  }, []);

  useEffect(() => {
    fetchUsers(false);
    return () => {fetchToken.current++;};
  }, [fetchUsers]);






  async function tambahUser(payload) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const { data: userId, error: rpcErr } = await supabase.rpc("create_app_user", {
        p_email: payload.email,
        p_password: payload.password,
        p_nama_lengkap: payload.nama_lengkap,
        p_no_telp: payload.no_telp || "",
        p_role: payload.role
      });
      if (rpcErr) throw rpcErr;
      if (!userId) throw new Error("Gagal membuat user.");
      await fetchUsers(true);
    } finally {submittingRef.current = false;}
  }


  async function editUser(payload) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const { error: profErr } = await supabase.from("profiles").update({
        nama_lengkap: payload.nama_lengkap,
        no_telp: payload.no_telp || "",
        role: payload.role,
        status: payload.status,
        updated_at: new Date().toISOString()
      }).eq("id", payload.id);
      if (profErr) throw profErr;
      await fetchUsers(true);
    } finally {submittingRef.current = false;}
  }

  return {
    userList, stats, loading, error, lastUpdated,
    roleList: sel.roleUser(enums),
    statusList: sel.statusAkun(enums),
    tambahUser, editUser,
    refetch: () => fetchUsers(false)
  };
}