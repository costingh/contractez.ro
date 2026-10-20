import { Flag, Mail, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="container-page max-w-4xl pb-16">
      <PageHeader
        eyebrow="Suport"
        title={
          <>
            Vorbește cu <span className="serif-em text-gradient">echipa</span>.
          </>
        }
        description="Suntem aici pentru întrebări, sugestii sau probleme cu un proiect ori un utilizator."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="reveal lift rounded-2xl border bg-card p-7 shadow-xs">
          <span className="flex size-9 items-center justify-center rounded-lg border bg-muted/60">
            <Mail className="size-4 text-foreground" strokeWidth={1.75} />
          </span>
          <div className="mt-4 text-lg font-semibold tracking-[-0.015em]">Scrie-ne</div>
          <a href={`mailto:${site.supportEmail}`} className="mt-1 inline-block text-[1.0625rem] font-medium text-brand underline-offset-4 hover:underline">
            {site.supportEmail}
          </a>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Răspundem de obicei în cel mult o zi lucrătoare.</p>
        </div>
        <div className="reveal lift rounded-2xl border bg-card p-7 shadow-xs" style={{ "--i": 1 } as React.CSSProperties}>
          <span className="flex size-9 items-center justify-center rounded-lg border bg-muted/60">
            <Flag className="size-4 text-foreground" strokeWidth={1.75} />
          </span>
          <div className="mt-4 text-lg font-semibold tracking-[-0.015em]">Raportează un proiect sau un profil</div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Folosește butonul „Raportează” de pe pagina proiectului sau a profilului. Raportările sunt confidențiale și ajung direct la moderatori.
          </p>
        </div>
      </div>
      <div className="reveal mt-6 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/8 p-6 text-sm">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" />
        <div className="space-y-2">
          <div className="font-semibold">Sfaturi de siguranță</div>
          <ul className="list-disc space-y-1.5 pl-5 leading-relaxed text-muted-foreground">
            <li>Nu plăti avansuri mari înainte de a stabili clar lucrarea, în scris.</li>
            <li>Nu trimite date de card sau coduri primite prin SMS altor utilizatori.</li>
            <li>Păstrează discuțiile în chat-ul platformei: ne ajută dacă apare o problemă.</li>
          </ul>
        </div>
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        Vezi și{" "}
        <Link href="/termeni" className="font-medium text-brand underline-offset-4 hover:underline">
          termenii
        </Link>{" "}
        și{" "}
        <Link href="/confidentialitate" className="font-medium text-brand underline-offset-4 hover:underline">
          politica de confidențialitate
        </Link>
        .
      </p>
    </div>
  );
}
