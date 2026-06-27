
import ResetPasswordForm from "../components/ResetPasswordForm";
import AuthDecoPanel from "../components/AuthDecoPanel";

export default function ResetPasswordPage({ onSuccess }) {
  return (
    <div className="min-h-screen flex">
      <AuthDecoPanel />
      <div className="flex-1 bg-white overflow-y-auto flex flex-col justify-center px-10 sm:px-16 lg:px-24">
        <ResetPasswordForm onSuccess={onSuccess} />
      </div>
    </div>);

}