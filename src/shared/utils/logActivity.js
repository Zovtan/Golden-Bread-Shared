


import { supabase } from "../../lib/supabase";


export async function logActivity({ aktivitas, modul, detail = {}, sebelum = null, sesudah = null }) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user && aktivitas !== "LOGIN_FAILED") return;

    let role = "Admin";
    if (user) {

      const { data: profile } = await supabase.
      from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (profile?.role) role = profile.role;
    }

    await supabase.rpc("insert_log_aktivitas", {
      p_id_user: user?.id ?? "00000000-0000-0000-0000-000000000000",
      p_role: role,
      p_aktivitas: aktivitas,
      p_modul: modul,


      p_detail: detail.pesan ?? (
      detail.field ? `${detail.field} diubah` : null) ?? (
      detail.nama_produk ? `Edit produk: ${detail.nama_produk}` : null) ?? (
      detail.nama_bahan ? `Edit bahan: ${detail.nama_bahan}` : null) ??
      `${aktivitas} ${modul}`,
      p_detail_json: Object.keys(detail).length ? detail : null,
      p_data_sebelum: sebelum ?? null,
      p_data_sesudah: sesudah ?? null,
      p_timestamp: new Date().toISOString()
    });
  } catch (err) {

    console.warn("[logActivity] gagal menulis log:", err.message);
  }
}