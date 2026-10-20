import { AuthCard } from "../auth-card";
import { ResetForm } from "./reset-form";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthCard title="Setează o parolă nouă" description="Alege o parolă pe care nu o folosești pe alte site-uri.">
      {token ? <ResetForm token={token} /> : <p className="text-sm text-muted-foreground">Linkul nu este complet. Deschide-l din nou din email.</p>}
    </AuthCard>
  );
}
