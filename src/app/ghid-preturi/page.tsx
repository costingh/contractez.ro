import { ArrowRight, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PriceTable } from "@/components/categories/category-guide";
import { cssVars } from "@/components/home/css-vars";
import { rules, site } from "@/config/site";
import { guidesUpdated, guidesUpdatedIso } from "@/content/category-guides";
import { priceGuideGroups, priceGuideStats } from "@/content/price-guide";
import { pageTitle } from "@/lib/seo";
import { pluralRo } from "@/lib/text";
import { env } from "@/server/env";

const title = "Ghid de prețuri 2026: cât costă serviciile în România";
const description =
  "Prețuri orientative 2026 pentru renovări, instalații, mutări, IT, evenimente, contabilitate și alte servicii din România, pe o singură pagină.";

export const metadata: Metadata = {
  title: pageTitle(title),
  description,
  alternates: { canonical: "/ghid-preturi" },
  openGraph: { title, description, url: "/ghid-preturi" },
};

export default function PriceGuidePage() {
  const groups = priceGuideGroups();
  const stats = priceGuideStats(groups);
  const url = `${env.APP_URL}/ghid-preturi`;
  const answer = `Prețuri orientative în lei pentru ${pluralRo(stats.services, "serviciu", "servicii")} din ${pluralRo(stats.groups, "domeniu", "domenii")}, de la renovări și instalații la IT, evenimente și servicii juridice: ${pluralRo(stats.rows, "lucrare", "lucrări")}, fiecare cu intervalul tipic de preț și ce include.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Acasă", item: `${env.APP_URL}/` },
          { "@type": "ListItem", position: 2, name: "Ghid de prețuri 2026", item: url },
        ],
      },
      {
        "@type": "Dataset",
        "@id": `${url}#dataset`,
        name: "Ghid de prețuri 2026 pentru servicii în România",
        description: `${answer} Intervalele sunt orientative, adunate din oferte și liste de prețuri publice, și au fost actualizate în ${guidesUpdated}.`,
        url,
        inLanguage: "ro-RO",
        isAccessibleForFree: true,
        dateModified: guidesUpdatedIso,
        temporalCoverage: "2026",
        spatialCoverage: { "@type": "Place", name: "România" },
        keywords: groups.map((g) => g.name),
        variableMeasured: "Preț orientativ în lei (manoperă sau preț total, după cum e precizat la fiecare lucrare)",
        measurementTechnique: "Intervale orientative stabilite din oferte și liste de prețuri publice din România",
        creator: { "@type": "Organization", "@id": `${env.APP_URL}/#org`, name: site.name, url: env.APP_URL },
        publisher: { "@type": "Organization", "@id": `${env.APP_URL}/#org`, name: site.name, url: env.APP_URL },
      },
    ],
  };

  return (
    <div className="pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="border-b">
        <div className="container-page py-14 sm:py-20">
          <nav className="enter text-sm text-muted-foreground" style={cssVars({ i: 0 })}>
            <Link href="/" className="hover:text-foreground">
              Acasă
            </Link>
            <span className="mx-2 text-border-strong">/</span>
            Ghid de prețuri
          </nav>
          <h1 className="enter display-lg mt-5 max-w-3xl" style={cssVars({ i: 1 })}>
            Ghid de prețuri 2026: <span className="serif-em text-gradient">cât costă</span> serviciile în România
          </h1>
          <p className="enter mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-muted-foreground" style={cssVars({ i: 2 })}>
            {answer}
          </p>
          <p className="enter mt-4 text-sm font-medium" style={cssVars({ i: 3 })}>
            Prețuri actualizate: <time dateTime={guidesUpdatedIso}>{guidesUpdated}</time>
          </p>
        </div>
      </header>

      <div className="container-page mt-10 space-y-14">
        <aside className="reveal flex max-w-3xl gap-3 rounded-2xl border bg-card p-5 text-sm leading-relaxed text-muted-foreground shadow-xs">
          <Info className="mt-0.5 size-4.5 shrink-0 text-brand" />
          <div className="space-y-2">
            <p className="font-semibold text-foreground">Cum am stabilit prețurile</p>
            <p>
              Intervalele sunt orientative și provin din oferte și liste de prețuri publice din România, verificate în {guidesUpdated}. Nu sunt tarife
              oficiale. Nota de sub fiecare lucrare spune ce include prețul, de exemplu doar manopera sau și materialele. În orașele mari prețurile tind
              spre capătul de sus al intervalului. Prețul final îl stabilești direct cu prestatorul, după ce vede lucrarea.
            </p>
          </div>
        </aside>

        <nav aria-label="Domenii" className="reveal flex flex-wrap gap-2">
          {groups.map((g) => (
            <a
              key={g.slug}
              href={`#${g.slug}`}
              className="rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:border-border-strong hover:bg-muted"
            >
              {g.name}
            </a>
          ))}
        </nav>

        {groups.map((g) => (
          <section key={g.slug} id={g.slug} aria-labelledby={`${g.slug}-titlu`} className="scroll-mt-24 space-y-6">
            <div className="reveal flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b pb-4">
              <div>
                <h2 id={`${g.slug}-titlu`} className="display-md">
                  Prețuri {g.name}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">{g.description}</p>
              </div>
              <Link href={`/categorii/${g.slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand underline-offset-4 hover:underline">
                Ghidul pentru {g.name} <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {g.general.length > 0 && (
                <div className="reveal space-y-3">
                  <h3 className="font-semibold tracking-[-0.01em]">
                    <Link href={`/categorii/${g.slug}`} className="hover:text-brand">
                      {g.name}: repere generale
                    </Link>
                  </h3>
                  <PriceTable rows={g.general} caption={`Prețuri orientative: ${g.name}`} />
                </div>
              )}
              {g.subs.map((t) => (
                <div key={t.slug} className="reveal space-y-3">
                  <h3 className="font-semibold tracking-[-0.01em]">
                    <Link href={`/categorii/${t.slug}`} className="hover:text-brand">
                      {t.name}
                    </Link>
                  </h3>
                  <PriceTable rows={t.rows} caption={`Prețuri orientative: ${t.name}`} />
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="ink-panel reveal rounded-2xl p-7 sm:p-9">
          <p className="text-xl font-semibold tracking-[-0.015em] text-white">Vrei prețul exact pentru lucrarea ta?</p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">
            Publici gratuit proiectul și primești cel mult {rules.defaultMaxApplications} oferte de la prestatori verificați, compatibili cu cerința ta. {site.name} nu ia comision din
            lucrare.
          </p>
          <Link
            href="/proiecte/nou"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#0b1426] transition-colors hover:bg-[#eef1fc]"
          >
            Publică un proiect gratuit <ArrowRight className="size-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
