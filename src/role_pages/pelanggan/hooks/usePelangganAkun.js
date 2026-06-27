import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";




export function usePelangganAkun() {
  const [email, setEmail] = useState("Memuat…");


  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data?.user?.email ?? "-"));
  }, []);



  async function updateProfil({ nama_lengkap, no_telp, alamat, nama_toko = null, kata_sandi = "" }) {
    const { error: e1 } = await supabase.rpc("pelanggan_update_profil", {
      p_nama_lengkap: nama_lengkap,
      p_no_telp: no_telp,
      p_alamat: alamat,
      p_nama_toko: nama_toko
    });
    if (e1) throw e1;

    if (kata_sandi) {
      const { error: e2 } = await supabase.auth.updateUser({ password: kata_sandi });
      if (e2) throw e2;
    }
  }

  return { email, updateProfil };
}