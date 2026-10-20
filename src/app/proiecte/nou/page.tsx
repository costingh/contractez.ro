import {
  MailWarning,
  PartyPopper,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { cssVars } from "@/components/home/css-vars";
import { DRAFT_COOKIE } from "@/components/home/draft";
import { ProjectBuilder } from "@/components/project-form/project-builder";
import { PageHeader } from "@/components/shared/page-header";
import { rules } from "@/config/site";
import { requireOnboardedUser } from "@/server/auth/guards";
import { categoryOptions } from "@/server/catalog/options";
import { features } from "@/server/env";

export const metadata: Metadata = { title: "Publică un proiect" };

function safeDecode(v: string) {
  try {
    return decodeURIComponent(v);
  } catch {
    return "";
  }
}

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; cerere?: string }>;
}) {
  const { welcome, cerere } = await searchParams;
  // Textul scris în caseta din pagina principală (păstrat și la autentificare).
  const fromCookie = (await cookies()).get(DRAFT_COOKIE)?.value;
  const raw =
    typeof cerere === "string" && cerere.trim()
      ? cerere
      : fromCookie
        ? safeDecode(fromCookie)
        : "";
  const initialText = raw.trim().slice(0, 6000);
  const user = await requireOnboardedUser(
    initialText
      ? `/proiecte/nou?cerere=${encodeURIComponent(initialText)}`
      : "/proiecte/nou",
  );
  const categories = await categoryOptions();

  return (
    <div className="container-page max-w-3xl pb-16">
      <PageHeader
        eyebrow="Gratuit · fără obligații"
        title={
          <>
            Publică un <span className="serif-em text-gradient">proiect</span>
          </>
        }
        description={`Descrii o dată, primești maximum ${rules.defaultMaxApplications} oferte relevante, de la prestatori compatibili. Durează cam 2 minute.`}
      />

      {welcome === "1" && (
        <div className="enter mb-6 flex gap-3.5 rounded-2xl border border-brand/20 bg-brand-soft p-4 sm:p-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-sm">
            <PartyPopper className="size-[1.125rem]" />
          </span>
          <div className="space-y-1 text-sm">
            <div className="font-medium">
              Bun venit, {user.name.split(" ")[0]}! Hai să publicăm primul tău
              proiect.
            </div>
            <p className="text-muted-foreground">
              Descrie pe scurt ce ai nevoie — noi îl structurăm, îl verificăm și
              îl trimitem doar prestatorilor potriviți. Durează cam 2 minute.
            </p>
          </div>
        </div>
      )}

      {!user.emailVerifiedAt && (
        <div className="enter mb-6 flex gap-3.5 rounded-2xl border border-warning/30 bg-warning/8 p-4 text-sm sm:p-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-warning/12 text-warning">
            <MailWarning className="size-[1.125rem]" />
          </span>
          <div>
            <div className="font-medium">
              Confirmă-ți emailul pentru a publica
            </div>
            <p className="text-muted-foreground">
              Poți pregăti și salva proiectul acum. Publicarea se activează după
              confirmare.{" "}
              <Link
                href="/verifica-email"
                className="text-foreground underline"
              >
                Nu ai primit emailul?
              </Link>
            </p>
          </div>
        </div>
      )}

      <ProjectBuilder
        initialText={initialText}
        categories={categories}
        emailVerified={Boolean(user.emailVerifiedAt)}
        aiEnabled={features.ai}
      />

      <div className="mt-10 grid gap-3 text-sm sm:grid-cols-3">
        {[
          {
            icon: Users,
            t: `Maximum ${rules.defaultMaxApplications} oferte`,
            d: "Ca să nu fii inundat. Poți redeschide selecția oricând.",
          },
          {
            icon: ShieldCheck,
            t: "Contactul rămâne privat",
            d: "Discuți cu prestatorii prin chat, fără să-ți dai numărul.",
          },
          {
            icon: Wallet,
            t: "Fără comision",
            d: "Publicarea e gratuită. Plata o stabilești direct cu prestatorul.",
          },
        ].map((x, n) => (
          <div
            key={x.t}
            className="reveal rounded-2xl border bg-card p-5 shadow-xs"
            style={cssVars({ i: n })}
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground/75">
              <x.icon className="size-4" strokeWidth={1.9} />
            </span>
            <div className="mt-3 font-semibold tracking-[-0.01em]">{x.t}</div>
            <p className="mt-1 leading-relaxed text-muted-foreground">{x.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
