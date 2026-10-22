import { CheckCircle2, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmailVerifiedBroadcast } from "@/components/profile/email-verification-sync";
import { Button } from "@/components/ui/button";
import { verifyEmailToken } from "@/server/auth/service";
import { getCurrentUser } from "@/server/auth/session";
import type { User } from "@/server/db/schema";
import { AuthCard } from "../auth-card";
import { ResendButton } from "./resend-button";

// Tokenul din URL nu trebuie trimis mai departe (resurse externe, analytics) și pagina nu se indexează.
export const metadata: Metadata = { title: "Confirmă emailul", robots: { index: false, follow: false }, referrer: "no-referrer" };

const LOGIN_TO_ONBOARDING = `/autentificare?next=${encodeURIComponent("/onboarding")}`;

function continueHref(user: User) {
  return user.onboardedAt ? "/panou" : "/onboarding";
}

function Notice({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div
      role={ok ? "status" : "alert"}
      className={
        ok
          ? "flex items-start gap-3 rounded-lg border border-success/25 bg-success/6 p-3.5 text-sm"
          : "flex items-start gap-3 rounded-lg border border-destructive/25 bg-destructive/6 p-3.5 text-sm"
      }
    >
      {ok ? <CheckCircle2 className="size-5 shrink-0 text-success" /> : <XCircle className="size-5 shrink-0 text-destructive" />}
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}

/** Succes. Fără sesiune (ex. linkul deschis pe telefon): contul e confirmat, utilizatorul intră în cont și continuă. */
function Confirmed({ user, message, otherAccount = false }: { user: User | null; message: string; otherAccount?: boolean }) {
  return (
    <AuthCard title={user ? "Email confirmat" : "Email confirmat — intră în cont"}>
      <EmailVerifiedBroadcast />
      <div className="space-y-4">
        <Notice ok>{message}</Notice>
        {otherAccount && user && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Linkul era pentru alt cont decât cel cu care ești conectat acum ({user.email}).
          </p>
        )}
        {user ? (
          <Button asChild size="lg" className="w-full">
            <Link href={continueHref(user)}>Continuă</Link>
          </Button>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">Intră în cont ca să continui de unde ai rămas. Datele tale sunt salvate.</p>
            <Button asChild size="lg" className="w-full">
              <Link href={LOGIN_TO_ONBOARDING}>Intră în cont</Link>
            </Button>
          </>
        )}
      </div>
    </AuthCard>
  );
}

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string; confirmat?: string }> }) {
  const { token, confirmat } = await searchParams;
  const user = await getCurrentUser();

  if (!token) {
    if (user?.emailVerifiedAt) return <Confirmed user={user} message="Emailul tău este deja confirmat. Nu mai trebuie să faci nimic." />;
    // După confirmare, tokenul e scos din URL (`?confirmat=1`); la reîncărcare arătăm tot succesul.
    if (!user && confirmat) return <Confirmed user={null} message="Adresa ta de email este confirmată." />;
    return (
      <AuthCard title="Confirmă adresa de email" description={user ? `Am trimis un link la ${user.email}.` : undefined}>
        <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
          <p>Deschide emailul și apasă pe „Confirmă adresa de email”. Verifică și folderul Spam / Promoții.</p>
          {user ? (
            <ResendButton />
          ) : (
            <Button asChild variant="outline" className="w-full">
              <Link href={`/autentificare?next=${encodeURIComponent("/verifica-email")}`}>Intră în cont ca să primești un link nou</Link>
            </Button>
          )}
        </div>
      </AuthCard>
    );
  }

  // Idempotent: scannerele de linkuri din email pot deschide linkul înaintea ta; clicul tău vede tot succesul.
  const result = await verifyEmailToken(token);
  const otherAccount = Boolean(user && result.userId && result.userId !== user.id);
  if (result.status === "verified") {
    return <Confirmed user={user} otherAccount={otherAccount} message="Mulțumim! Adresa ta de email este confirmată. Poți publica proiecte și aplica la oportunități." />;
  }
  if (result.status === "already") {
    return <Confirmed user={user} otherAccount={otherAccount} message="Emailul tău este deja confirmat. Nu mai trebuie să faci nimic." />;
  }
  // Link expirat/invalid, dar contul cu care ești conectat e deja confirmat (ex. ai deschis un email vechi).
  if (user?.emailVerifiedAt && !otherAccount) {
    return <Confirmed user={user} message="Emailul tău este deja confirmat. Nu mai trebuie să faci nimic." />;
  }

  const expired = result.status === "expired";
  const canResend = Boolean(user && !user.emailVerifiedAt);
  return (
    <AuthCard title={expired ? "Linkul a expirat" : "Link invalid"}>
      <div className="space-y-4">
        <Notice ok={false}>
          {expired
            ? "Linkul de confirmare era valabil 48 de ore și a expirat."
            : "Linkul de confirmare nu este valid. Verifică să fi deschis linkul complet din email."}{" "}
          {canResend ? "Îți trimitem unul nou cu butonul de mai jos." : user ? "" : "Intră în cont și îți trimitem un link nou."}
        </Notice>
        {canResend && <ResendButton />}
        <Button asChild size="lg" className="w-full" variant={canResend ? "ghost" : "default"}>
          <Link href={user ? continueHref(user) : `/autentificare?next=${encodeURIComponent("/verifica-email")}`}>{user ? "Continuă" : "Intră în cont"}</Link>
        </Button>
      </div>
    </AuthCard>
  );
}
