import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { freePlan } from "@/config/site";
import { getCurrentUser } from "@/server/auth/session";
import { features } from "@/server/env";
import { AuthCard } from "../auth-card";
import { GoogleButton } from "../google-button";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Creează cont" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ rol?: string; ref?: string }> }) {
  const { rol, ref } = await searchParams;
  if (await getCurrentUser()) redirect("/panou");
  const provider = rol === "prestator";
  return (
    <AuthCard
      headline={
        provider ? (
          <>
            Proiectele potrivite <span className="serif-em text-gradient-ink">vin la tine</span>.
          </>
        ) : (
          <>
            Publici o dată. Primești doar oferte <span className="serif-em text-gradient-ink">potrivite</span>.
          </>
        )
      }
      title={provider ? "Creează profilul de prestator" : "Creează un cont gratuit"}
      description={
        provider
          ? `Începi gratuit: ${freePlan.monthlyApplications} aplicări în fiecare lună, chat nelimitat cu clienții.`
          : "Publici gratuit proiecte și primești oferte de la prestatori compatibili."
      }
      footer={
        <>
          Ai deja cont? <Link href="/autentificare" className="font-medium text-brand underline-offset-4 hover:underline">Intră în cont</Link>
        </>
      }
    >
      <GoogleButton enabled={features.google} params={{ rol, ref }} label="Înregistrează-te cu Google" />
      <SignupForm role={rol} referral={ref} />
    </AuthCard>
  );
}
