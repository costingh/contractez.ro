import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { verifyEmailToken } from "@/server/auth/service";
import { getCurrentUser } from "@/server/auth/session";
import { isDomainError } from "@/server/errors";
import { AuthCard } from "../auth-card";
import { ResendButton } from "./resend-button";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const user = await getCurrentUser();

  if (!token) {
    return (
      <AuthCard title="Confirmă adresa de email" description={user ? `Am trimis un link la ${user.email}.` : undefined}>
        <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
          <p>Deschide emailul și apasă pe „Confirmă emailul”. Verifică și folderul Spam / Promoții.</p>
          {user && !user.emailVerifiedAt && <ResendButton />}
        </div>
      </AuthCard>
    );
  }

  let error: string | null = null;
  try {
    await verifyEmailToken(token);
  } catch (err) {
    error = isDomainError(err) ? err.message : "Nu am putut confirma emailul.";
  }

  return (
    <AuthCard title={error ? "Link invalid" : "Email confirmat"}>
      <div className="space-y-4">
        <div className={error ? "flex items-start gap-3 rounded-lg border border-destructive/25 bg-destructive/6 p-3.5 text-sm" : "flex items-start gap-3 rounded-lg border border-success/25 bg-success/6 p-3.5 text-sm"}>
          {error ? <XCircle className="size-5 shrink-0 text-destructive" /> : <CheckCircle2 className="size-5 shrink-0 text-success" />}
          <p className="leading-relaxed">{error ?? "Mulțumim! Contul tău este verificat. Poți publica proiecte și aplica la oportunități."}</p>
        </div>
        {error && user && !user.emailVerifiedAt && <ResendButton />}
        <Button asChild size="lg" className="w-full">
          <Link href={user ? (user.onboardedAt ? "/panou" : "/onboarding") : "/autentificare"}>Continuă</Link>
        </Button>
      </div>
    </AuthCard>
  );
}
