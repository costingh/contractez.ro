import { ArrowRight, Ban, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { cssVars } from "@/components/home/css-vars";
import { Faq } from "@/components/marketing/faq";
import { plans, rules, site } from "@/config/site";
import { aboutDefinition, clientSteps, notDoing, providerSteps, verificationFacts } from "@/content/about";
import { posts } from "@/content/blog/posts";
import { cities } from "@/content/cities";
import { pluralRo } from "@/lib/text";
import { env } from "@/server/env";
import { taxonomy } from "../../../db/seed-data/taxonomy";

const title = `Despre ${site.name}: ce este și cum funcționează`;
const description = `${site.name} este o platformă românească de servicii: publici gratuit un proiect și primești cel mult ${rules.defaultMaxApplications} oferte de la prestatori verificați, fără comision.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/despre" },
  openGraph: { title, description, url: "/despre" },
};

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3">
      {items.map((s, i) => (
        <li key={s} className="flex gap-3 text-[0.9375rem] leading-relaxed text-foreground/85">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand tabular-nums">{i + 1}</span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  );
}

function Bullets({ items, icon: Icon }: { items: string[]; icon: typeof ShieldCheck }) {
  return (
    <ul className="space-y-3">
      {items.map((s) => (
        <li key={s} className="flex gap-3 text-[0.9375rem] leading-relaxed text-foreground/85">
          <Icon className="mt-1 size-4 shrink-0 text-brand" />
          <span>{s}</span>
        </li>
      ))}
    </ul>
  );
}

function Section({ id, eyebrow, heading, children }: { id: string; eyebrow: string; heading: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titlu`} className="reveal grid scroll-mt-24 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2 id={`${id}-titlu`} className="display-md mt-3">
          {heading}
        </h2>
      </div>
      <div className="max-w-prose min-w-0">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  const base = env.APP_URL;
  const host = new URL(base).host;
  const max = rules.defaultMaxApplications;

  const facts: [string, React.ReactNode][] = [
    ["Nume", site.name],
    ["Site", host],
    ["Ce este", "Platformă online de servicii (marketplace) pentru clienți și prestatori din România"],
    ["Lansare", site.launched.label],
    ["Operator", site.operator],
    [
      "Contact",
      <>
        <a href={`mailto:${site.supportEmail}`} className="text-brand underline-offset-4 hover:underline">
          {site.supportEmail}
        </a>{" "}
        ·{" "}
        <Link href="/contact" className="text-brand underline-offset-4 hover:underline">
          formular de contact
        </Link>
      </>,
    ],
    ["Acoperire", `România, cu pagini dedicate pentru ${pluralRo(cities.length, "oraș", "orașe")}`],
    ["Model de business", "Abonamente opționale pentru prestatori; fără comision din lucrare, gratuit pentru clienți"],
  ];

  const org = {
    "@type": "Organization",
    "@id": `${base}/#org`,
    name: site.name,
    alternateName: host,
    url: base,
    logo: { "@type": "ImageObject", url: `${base}/icon-512.png` },
    email: site.supportEmail,
    foundingDate: site.launched.iso,
    founder: { "@type": "Person", name: site.founder },
    areaServed: { "@type": "Country", name: "România", identifier: "RO" },
    description: aboutDefinition,
    knowsAbout: [...new Set(taxonomy.flatMap((c) => [c.name, ...c.subs.map((s) => s.name)]))],
    contactPoint: { "@type": "ContactPoint", email: site.supportEmail, contactType: "customer support", availableLanguage: "ro", areaServed: "RO" },
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": `${base}/despre`,
        url: `${base}/despre`,
        name: title,
        description,
        inLanguage: "ro-RO",
        about: { "@id": `${base}/#org` },
        mainEntity: { "@id": `${base}/#org` },
        isPartOf: { "@id": `${base}/#website` },
      },
      org,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Acasă", item: `${base}/` },
          { "@type": "ListItem", position: 2, name: `Despre ${site.name}`, item: `${base}/despre` },
        ],
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
            Despre
          </nav>
          <h1 className="enter display-lg mt-5 max-w-3xl" style={cssVars({ i: 1 })}>
            Despre <span className="serif-em text-gradient">{site.name}</span>
          </h1>
          <p className="enter mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-foreground/85" style={cssVars({ i: 2 })}>
            {aboutDefinition}
          </p>
        </div>
      </header>

      <div className="container-page mt-12 space-y-20">
        <section aria-label="Date de identificare" className="reveal">
          <dl className="grid overflow-hidden rounded-2xl border bg-card shadow-xs sm:grid-cols-2">
            {facts.map(([k, v]) => (
              <div key={k} className="border-b px-5 py-4 sm:odd:border-r">
                <dt className="text-xs font-medium text-muted-foreground">{k}</dt>
                <dd className="mt-1 text-[0.9375rem] font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <Section id="clienti" eyebrow="Pentru clienți" heading="Cum funcționează pentru clienți">
          <Steps items={clientSteps} />
        </Section>

        <Section id="prestatori" eyebrow="Pentru prestatori" heading="Cum funcționează pentru prestatori">
          <Steps items={providerSteps} />
        </Section>

        <Section id="preturi" eyebrow="Prețuri" heading="Cât costă">
          <p className="mb-5 text-[0.9375rem] leading-relaxed text-foreground/85">
            Pentru clienți, {site.name} este gratuit. Prestatorii aleg un abonament lunar după câte aplicări au nevoie; limita include aplicările manuale
            și pe cele automate.
          </p>
          <div className="overflow-x-auto rounded-2xl border bg-card shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Plan
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium whitespace-nowrap">
                    Preț
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Aplicări pe lună
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Include
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {plans.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3.5 align-top font-semibold">{p.name}</td>
                    <td className="px-5 py-3.5 align-top whitespace-nowrap tabular-nums">{p.priceLei === 0 ? "0 lei" : `${p.priceLei} lei/lună`}</td>
                    <td className="px-5 py-3.5 align-top tabular-nums">{p.monthlyApplications}</td>
                    <td className="px-5 py-3.5 align-top text-muted-foreground">{p.features.join("; ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm">
            <Link href="/preturi" className="font-medium text-brand underline-offset-4 hover:underline">
              Detalii despre abonamente și Auto Bid
            </Link>
          </p>
        </Section>

        <Section id="verificare" eyebrow="Încredere" heading="Cum verificăm prestatorii și clienții">
          <Bullets items={verificationFacts} icon={ShieldCheck} />
        </Section>

        <Section id="ce-nu-face" eyebrow="Limite" heading={`Ce nu face ${site.name}`}>
          <Bullets items={notDoing} icon={Ban} />
        </Section>

        <Section id="acoperire" eyebrow="Acoperire" heading="Unde funcționează">
          <p className="text-[0.9375rem] leading-relaxed text-foreground/85">
            În toată România: serviciile la distanță (IT, design, traduceri, contabilitate) se potrivesc fără limită de distanță, iar cele la fața
            locului țin cont de localitatea clientului și de raza în care se deplasează prestatorul. Avem pagini dedicate pentru{" "}
            {pluralRo(cities.length, "oraș", "orașe")}:
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {cities.map((c) => (
              <li key={c.slug}>
                <Link href={`/orase/${c.slug}`} className="inline-block rounded-full border bg-card px-3.5 py-1.5 text-sm font-medium shadow-xs transition-colors hover:border-border-strong hover:bg-muted">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="ghiduri" eyebrow="Ghiduri" heading="Prețuri și ghiduri pentru servicii">
          <p className="text-[0.9375rem] leading-relaxed text-foreground/85">
            Fiecare categorie are un ghid cu ce include serviciul, prețuri orientative, ce influențează prețul și cum alegi prestatorul. Toate prețurile
            sunt adunate în{" "}
            <Link href="/ghid-preturi" className="font-medium text-brand underline-offset-4 hover:underline">
              Ghidul de prețuri 2026
            </Link>
            .
          </p>
          <ul className="mt-5 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {taxonomy.map((c) => (
              <li key={c.slug}>
                <Link href={`/categorii/${c.slug}`} className="inline-flex items-center gap-1.5 text-foreground/85 hover:text-brand">
                  <ArrowRight className="size-3.5 text-muted-foreground" /> {c.name}
                </Link>
              </li>
            ))}
          </ul>
          <h3 className="mt-8 font-semibold">Articole</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {posts.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="text-foreground/85 underline-offset-4 hover:text-brand hover:underline">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="intrebari" eyebrow="Întrebări frecvente" heading={`Despre ${site.name}, pe scurt`}>
          <Faq
            items={[
              { q: `Cât costă ${site.name} pentru clienți?`, a: `Nimic. Publicarea unui proiect și ofertele primite sunt gratuite. Primești cel mult ${max} oferte, iar dacă vrei mai multe poți extinde selecția până la ${rules.maxApplicationsCap}.` },
              { q: `Ia ${site.name} comision din lucrare?`, a: "Nu. Prețul și plata le stabilesc direct clientul și prestatorul. Platforma nu intermediază plata și nu reține niciun procent." },
              {
                q: "Cât plătește un prestator?",
                a: plans.map((p) => `${p.name}: ${p.priceLei === 0 ? "gratuit" : `${p.priceLei} lei/lună`}, ${pluralRo(p.monthlyApplications, "aplicare", "aplicări")} pe lună`).join("; ") + ".",
              },
              { q: `Cine operează ${site.name}?`, a: `${site.name} este operat de ${site.operator}, și a fost lansat în ${site.launched.label}. Ne poți scrie la ${site.supportEmail}.` },
            ]}
          />
        </Section>
      </div>
    </div>
  );
}
