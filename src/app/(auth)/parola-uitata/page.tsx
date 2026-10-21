import Link from "next/link";
import { AuthCard } from "../auth-card";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Ai uitat parola?"
      description="Îți trimitem un link pentru a seta o parolă nouă."
      footer={<Link href="/autentificare" className="font-medium text-foreground underline-offset-4 hover:underline">← Înapoi la autentificare</Link>}
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
