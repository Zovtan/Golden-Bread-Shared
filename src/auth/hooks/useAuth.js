

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { logActivity } from "../../shared/utils/logActivity";

const LOGIN_EXPIRES_KEY = "gb_login_expires";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 1 * 24 * 60 * 60 * 1000;



function isSessionExpired() {
  const exp = localStorage.getItem(LOGIN_EXPIRES_KEY);
  if (!exp) return false;
  return Date.now() > Number(exp);
}


export function useAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileRef = useRef(null);
  const initializedRef = useRef(false);



  const fetchProfile = useCallback(async (userId, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      const { data, error } = await supabase.
      from("profiles").select("*").eq("id", userId).single();
      if (!error) return data;
      console.warn(`[useAuth] fetchProfile attempt ${i + 1} failed:`, error.message);
      if (i < retries - 1) await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
    console.error("[useAuth] fetchProfile gagal setelah", retries, "percobaan");
    return null;
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        if (event === "TOKEN_REFRESHED") {
          setSession(s);
          return;
        }



        if (event === "PASSWORD_RECOVERY") return;
        if (event === "INITIAL_SESSION" && initializedRef.current) {
          if (s?.access_token !== (profileRef.current ? undefined : null)) setSession(s);
          return;
        }


        if (event === "INITIAL_SESSION" && s && isSessionExpired()) {
          await supabase.auth.signOut();
          localStorage.removeItem(LOGIN_EXPIRES_KEY);
          return;
        }

        if (event === "SIGNED_OUT") {
          profileRef.current = null;
          setSession(null);
          setProfile(null);
          setLoading(false);
          localStorage.removeItem(LOGIN_EXPIRES_KEY);
          localStorage.removeItem("gb_admin_page");
          localStorage.removeItem("gb_kasir_page");
          localStorage.removeItem("gb_produksi_page");
          return;
        }

        setSession(s);

        if (s) {
          if (profileRef.current && initializedRef.current) {
            fetchProfile(s.user.id).then((p) => {
              if (p) {profileRef.current = p;setProfile(p);}
            });
            return;
          }

          const p = await fetchProfile(s.user.id);
          if (p) {profileRef.current = p;setProfile(p);}
        } else {
          profileRef.current = null;
          setProfile(null);
        }

        initializedRef.current = true;
        setLoading(false);
      }
    );
    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  return { session, profile, loading };
}


export async function signIn(email, password, remember = false) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    await logActivity({ aktivitas: "LOGIN_FAILED", modul: "Authentication", detail: { pesan: `Login gagal: ${error.message}`, email } });
    throw error;
  }
  const { data: profile, error: profErr } = await supabase.
  from("profiles").select("*").eq("id", data.user.id).single();
  if (profErr) throw profErr;


  if (profile.status === "Tidak_Aktif") {
    await supabase.auth.signOut();
    throw new Error("Akun Anda dinonaktifkan. Hubungi administrator.");
  }

  const expiry = Date.now() + (remember ? THIRTY_DAYS_MS : ONE_DAY_MS);
  localStorage.setItem(LOGIN_EXPIRES_KEY, String(expiry));
  await logActivity({ aktivitas: "LOGIN", modul: "Authentication", detail: { pesan: "Login berhasil", email } });
  return { session: data.session, profile };
}



export async function signUpPelanggan({ email, password, nama_lengkap, no_telp, nama_toko, jenis_pelanggan, alamat }) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: {
      data: { nama_lengkap, no_telp: no_telp || "", role: "Pelanggan", nama_toko: nama_toko || null, jenis_pelanggan: jenis_pelanggan || "Reguler", alamat: alamat || null },
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });
  if (error) throw error;
  return data;
}


export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback` });
  if (error) throw error;
}


export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}