import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { features } from "@/server/env";
import { safeNext } from "@/lib/safe-next";
import { AuthCard } from "../auth-card";
import { GoogleButton } from "../google-button";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Intră în cont" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; eroare?: string; cont?: string }> }) {
  const { next, eroare } = await searchParams;
  if (await getCurrentUser()) redirect(safeNext(next) ?? "/panou");
  return (
    <AuthCard
      headline={
        <>
          Proiectele, ofertele și mesajele tale te <span className="serif-em text-gradient-ink">așteaptă</span>.
        </>
      }
      title="Bine ai revenit"
      description="Intră în cont ca să vezi ofertele, mesajele și recomandările."
      footer={
        <>
          Nu ai cont? <Link href="/inregistrare" className="font-medium text-brand underline-offset-4 hover:underline">Creează unul gratuit</Link>
        </>
      }
    >
      {eroare && (
        <div role="alert" className="mb-5 rounded-lg border border-destructive/25 bg-destructive/6 px-3.5 py-2.5 text-sm text-destructive">
          {eroare.slice(0, 200)}
        </div>
      )}
      <GoogleButton enabled={features.google} params={{ next }} />
      <LoginForm next={next} />
    </AuthCard>
  );
}
