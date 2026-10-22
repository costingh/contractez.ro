import { CheckCircle2, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { confirmEmailChange } from "@/server/auth/service";
import { getCurrentUser } from "@/server/auth/session";
import { AuthCard } from "../auth-card";

// Tokenul din URL nu trebuie trimis mai departe (resurse externe, analytics) și pagina nu se indexează.
export const metadata: Metadata = { title: "Confirmă noua adresă de email", robots: { index: false, follow: false }, referrer: "no-referrer" };

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
      <p className="min-w-0 leading-relaxed [overflow-wrap:anywhere]">{children}</p>
    </div>
  );
}

const FAILURES = {
  expired: { title: "Linkul a expirat", text: "Linkul de confirmare era valabil 24 de ore. Cere unul nou din Setări." },
  taken: { title: "Adresa este deja folosită", text: "Între timp, adresa a fost folosită de alt cont. Contul tău a rămas pe adresa de până acum." },
  invalid: {
    title: "Link invalid",
    text: "Linkul nu este valid sau a fost înlocuit de unul mai nou. Deschide ultimul email primit sau cere un link nou din Setări.",
  },
} as const;

export default async function ConfirmEmailChangePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  // Idempotent: scannerele de linkuri pot deschide linkul înaintea ta; clicul tău vede tot succesul.
  const result = await confirmEmailChange(token ?? "");
  const user = await getCurrentUser();

  if (result.status === "changed" || result.status === "already") {
    return (
      <AuthCard title="Adresa de email a fost schimbată">
        <div className="space-y-4">
          <Notice ok>
            De acum, contul tău folosește adresa <span className="font-medium">{result.email}</span>. Te autentifici cu ea și primești emailurile acolo.
          </Notice>
          <Button asChild size="lg" className="w-full">
            <Link href={user ? "/setari" : `/autentificare?next=${encodeURIComponent("/setari")}`}>{user ? "Înapoi la setări" : "Intră în cont"}</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  const failure = FAILURES[result.status];
  return (
    <AuthCard title={failure.title}>
      <div className="space-y-4">
        <Notice ok={false}>{failure.text}</Notice>
        <Button asChild size="lg" className="w-full">
          <Link href={user ? "/setari#email" : `/autentificare?next=${encodeURIComponent("/setari#email")}`}>{user ? "Mergi la setări" : "Intră în cont"}</Link>
        </Button>
      </div>
    </AuthCard>
  );
}
