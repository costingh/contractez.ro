import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { emailPreviews } from "@/server/email/previews";
import { EmailFrame } from "./email-frame";

export const metadata: Metadata = { title: "Previzualizare emailuri" };

/** Aplică stilurile de mod întunecat ale emailului (cum le vede Apple Mail), indiferent de tema browserului. */
function forceDark(html: string) {
  return html.replace("@media (prefers-color-scheme:dark){", "@media all{");
}

type Search = { tema?: string; latime?: string; sablon?: string };

function href(current: Search, patch: Partial<Search>) {
  const next = { ...current, ...patch };
  const qs = new URLSearchParams(Object.entries(next).filter((e): e is [string, string] => Boolean(e[1])));
  const s = qs.toString();
  return `/admin/emailuri/previzualizare${s ? `?${s}` : ""}`;
}

function Toggle({ options, active, current, param }: { options: { value: string; label: string }[]; active: string; current: Search; param: keyof Search }) {
  return (
    <div className="inline-flex rounded-lg border bg-card p-0.5 text-sm shadow-xs">
      {options.map((o) => (
        <Link
          key={o.value}
          href={href(current, { [param]: o.value })}
          scroll={false}
          aria-current={o.value === active ? "true" : undefined}
          className={cn("rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground", o.value === active && "bg-muted font-medium text-foreground")}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}

export default async function EmailPreviewsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const dark = sp.tema === "intunecat";
  const width = sp.latime === "375" ? 375 : 640;
  const list = sp.sablon ? emailPreviews.filter((p) => p.id === sp.sablon) : emailPreviews;
  const rendered = list.map((p) => ({ ...p, email: p.render() }));

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/emailuri">
          <ArrowLeft /> Înapoi la emailuri
        </Link>
      </Button>
      <PageHeader
        title="Previzualizare emailuri"
        description={`Toate cele ${emailPreviews.length} șabloane, randate cu date de test prin aceleași funcții folosite la trimitere.`}
        className="pt-0"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Toggle
          param="tema"
          current={sp}
          active={dark ? "intunecat" : "luminos"}
          options={[
            { value: "luminos", label: "Luminos" },
            { value: "intunecat", label: "Întunecat" },
          ]}
        />
        <Toggle
          param="latime"
          current={sp}
          active={String(width === 375 ? 375 : 640)}
          options={[
            { value: "640", label: "Desktop" },
            { value: "375", label: "Mobil" },
          ]}
        />
        {sp.sablon && (
          <Link href={href(sp, { sablon: undefined })} className="text-sm text-brand underline-offset-4 hover:underline">
            Toate șabloanele
          </Link>
        )}
      </div>

      {!sp.sablon && (
        <nav aria-label="Șabloane" className="flex flex-wrap gap-1.5">
          {emailPreviews.map((p) => (
            <a key={p.id} href={`#${p.id}`} className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground shadow-xs hover:text-foreground">
              {p.label}
            </a>
          ))}
        </nav>
      )}

      <div className="space-y-10">
        {rendered.map((p) => (
          <section key={p.id} id={p.id} className="scroll-mt-24 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight">{p.label}</h2>
              <Link href={href(sp, { sablon: p.id })} className="font-mono text-xs text-muted-foreground hover:text-foreground">
                {p.id}
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">{p.when}</p>
            <dl className="grid gap-x-4 gap-y-1 rounded-xl border bg-card p-4 text-sm shadow-xs sm:grid-cols-[110px_minmax(0,1fr)]">
              <dt className="text-muted-foreground">Subiect</dt>
              <dd className="font-medium">{p.email.subject}</dd>
              <dt className="text-muted-foreground">Preheader</dt>
              <dd>{p.email.preheader ?? <span className="text-muted-foreground">—</span>}</dd>
            </dl>
            <div className={cn("overflow-x-auto rounded-2xl border p-3 sm:p-5", dark ? "bg-[#070c17]" : "bg-muted/40")}>
              <EmailFrame key={`${p.id}-${width}-${dark}`} html={dark ? forceDark(p.email.html) : p.email.html} title={p.label} width={width} />
            </div>
            <details className="rounded-xl border bg-card text-sm shadow-xs">
              <summary className="cursor-pointer px-4 py-2.5 text-muted-foreground hover:text-foreground">Varianta text</summary>
              <pre className="overflow-x-auto border-t px-4 py-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">{p.email.text}</pre>
            </details>
          </section>
        ))}
      </div>
    </div>
  );
}
