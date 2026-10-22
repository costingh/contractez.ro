import { XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { checkPasswordResetToken, type PasswordResetTokenState } from "@/server/auth/service";
import { AuthCard } from "../auth-card";
import { ResetForm } from "./reset-form";

// Tokenul din URL nu trebuie trimis mai departe (resurse externe, analytics) și pagina nu se indexează.
export const metadata: Metadata = { title: "Setează o parolă nouă", robots: { index: false, follow: false }, referrer: "no-referrer" };

const PROBLEMS: Record<Exclude<PasswordResetTokenState, "valid">, { title: string; text: string }> = {
  used: {
    title: "Linkul a fost deja folosit",
    text: "Acest link de resetare a fost deja folosit sau a fost înlocuit de unul mai nou. Cere un link nou dacă vrei să schimbi parola.",
  },
  expired: { title: "Linkul a expirat", text: "Linkul de resetare era valabil o oră și a expirat. Cere unul nou, durează câteva secunde." },
  invalid: { title: "Link invalid", text: "Linkul de resetare nu este valid sau nu este complet. Deschide-l din nou din email sau cere unul nou." },
};

function ResetLinkProblem({ state }: { state: Exclude<PasswordResetTokenState, "valid"> }) {
  const p = PROBLEMS[state];
  return (
    <div className="space-y-4">
      <div role="alert" className="flex items-start gap-3 rounded-lg border border-destructive/25 bg-destructive/6 p-3.5 text-sm">
        <XCircle className="size-5 shrink-0 text-destructive" />
        <p className="leading-relaxed">{p.text}</p>
      </div>
      <Button asChild size="lg" className="w-full">
        <Link href="/parola-uitata">Cere un link nou</Link>
      </Button>
    </div>
  );
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  // Verificăm linkul înainte de a afișa formularul: un link folosit/expirat nu mai cere o parolă degeaba.
  const state = await checkPasswordResetToken(typeof token === "string" ? token : null);
  if (state !== "valid") {
    return (
      <AuthCard title={PROBLEMS[state].title}>
        <ResetLinkProblem state={state} />
      </AuthCard>
    );
  }
  return (
    <AuthCard title="Setează o parolă nouă" description="Alege o parolă pe care nu o folosești pe alte site-uri.">
      <ResetForm token={token!} />
    </AuthCard>
  );
}
