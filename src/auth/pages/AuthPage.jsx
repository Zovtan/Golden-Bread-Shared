
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "../hooks/AuthContext";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import ForgotPasswordForm from "../components/ForgotPasswordForm";
import CheckEmailInfo from "../components/CheckEmailInfo";
import AuthDecoPanel from "../components/AuthDecoPanel";


const VIEWS = { LOGIN: "login", REGISTER: "register", FORGOT: "forgot", INFO: "info" };


export default function AuthPage() {
  const { session, loading } = useAuthContext();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [view, setView] = useState(() =>
  params.get("view") === "register" ? VIEWS.REGISTER : VIEWS.LOGIN
  );
  const [infoEmail, setInfoEmail] = useState("");


  const [infoRetryView, setInfoRetryView] = useState(VIEWS.FORGOT);

  useEffect(() => {
    if (!loading && session) navigate("/", { replace: true });
  }, [loading, session, navigate]);

  if (loading || session) return null;

  const isRegister = view === VIEWS.REGISTER;

  return (
    <div className="min-h-screen flex">
      {}
      <AuthDecoPanel />

      {}
      <div
        className={[
        "flex-1 bg-white overflow-y-auto flex flex-col",
        isRegister ? "justify-start py-16 px-10 sm:px-16 lg:px-24" : "justify-center px-10 sm:px-16 lg:px-24"].
        join(" ")}>
        
        {view === VIEWS.LOGIN &&
        <LoginForm
          notice={params.get("verified") ? "Email berhasil diverifikasi. Silakan masuk dengan akun Anda." : ""}
          onSuccess={() => navigate("/", { replace: true })}
          onRegister={() => setView(VIEWS.REGISTER)}
          onForgot={() => setView(VIEWS.FORGOT)} />

        }
        {view === VIEWS.REGISTER &&
        <RegisterForm
          onSuccess={(email) => {setInfoEmail(email);setInfoRetryView(VIEWS.REGISTER);setView(VIEWS.INFO);}}
          onLogin={() => setView(VIEWS.LOGIN)} />

        }
        {view === VIEWS.FORGOT &&
        <ForgotPasswordForm
          onSuccess={(email) => {setInfoEmail(email);setInfoRetryView(VIEWS.FORGOT);setView(VIEWS.INFO);}}
          onLogin={() => setView(VIEWS.LOGIN)} />

        }
        {view === VIEWS.INFO &&
        <CheckEmailInfo
          email={infoEmail}
          onLogin={() => setView(VIEWS.LOGIN)}
          onRetry={() => setView(infoRetryView)} />

        }
      </div>
    </div>);

}