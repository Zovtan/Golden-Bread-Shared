import { supabase } from "../../lib/supabase";







export async function getFreshSession() {
  let { data: { session } } = await supabase.auth.getSession();
  const nearExpiry = session?.expires_at ? session.expires_at * 1000 < Date.now() + 60_000 : true;
  if (session && nearExpiry) {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data?.session) session = data.session;
  }
  return session;
}


export async function getFreshAccessToken() {
  const session = await getFreshSession();
  return session?.access_token ?? "";
}