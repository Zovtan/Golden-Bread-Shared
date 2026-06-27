
import { supabase } from "../../lib/supabase";
import { logActivity } from "./logActivity";



export async function logout() {
  logActivity({ aktivitas: "LOGOUT", modul: "Authentication", detail: { pesan: "Logout berhasil" } });
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}