


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Memverifikasi…");

  useEffect(() => {
    let resolved = false;




    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (resolved) return;
      if (event === "PASSWORD_RECOVERY") {
        resolved = true;
        navigate("/auth/reset-password", { replace: true });
      } else if (event === "SIGNED_IN" && session) {




        resolved = true;
        await supabase.auth.signOut();
        navigate("/auth?verified=1", { replace: true });
      }
    });

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setMsg("Link tidak valid atau sudah kadaluarsa.");
      }
    }, 6000);

    return () => {clearTimeout(timer);subscription.unsubscribe();};
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-amber-700">
      {msg}
    </div>);

}