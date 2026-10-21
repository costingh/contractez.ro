import { ArrowRight, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cssVars } from "@/components/home/css-vars";
import { areaLabel, cities, citiesBySlug, cityServices, isCityPageIndexedByDefault } from "@/content/cities";
import { cityFacts } from "@/content/city-facts";
import { getCatalog } from "@/server/catalog/taxonomy";
import { env } from "@/server/env";
import { categoryDemand } from "@/server/insights";

type Params = Promise<{ oras: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return cities.map((c) => ({ oras: c.slug }));
}

function hasIndexedServices(citySlug: string) {
  const city = citiesBySlug.get(citySlug);
  return Boolean(city && Object.keys(cityServices).some((s) => isCityPageIndexedByDefault(s, city)));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { oras } = await params;
  const city = citiesBySlug.get(oras);
  if (!city) return {};
  const title = `Meseriași și prestatori în ${city.name}`;
  const description = `Electricieni, instalatori, firme de renovări, curățenie, mutări și alte servicii în ${city.name}. Publici gratuit și primești până la 5 oferte verificate.`;
  return {
    title,
    description,
    alternates: { canonical: `/orase/${oras}` },
    openGraph: { title, description, url: `/orase/${oras}` },
    robots: hasIndexedServices(oras) ? undefined : { index: false, follow: true },
  };
}

export default async function CityHubPage({ params }: { params: Params }) {
  const { oras } = await params;
  const city = citiesBySlug.get(oras);
  if (!city) notFound();
  const [catalog, demand] = await Promise.all([getCatalog(), categoryDemand(city.countyCode)]);
  const groups = catalog.tree
    .map((root) => ({ root, services: root.children.filter((c) => cityServices[c.slug]) }))
    .filter((g) => g.services.length > 0);
  const demandByRoot = new Map(demand.map((d) => [d.categoryId, d]));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Acasă", item: `${env.APP_URL}/` },
      { "@type": "ListItem", position: 2, name: "Orașe", item: `${env.APP_URL}/orase` },
      { "@type": "ListItem", position: 3, name: city.name, item: `${env.APP_URL}/orase/${city.slug}` },
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
            <Link href="/orase" className="hover:text-foreground">
              Orașe
            </Link>
          </nav>
          <h1 className="enter display-lg mt-5 max-w-3xl" style={cssVars({ i: 1 })}>
            Meseriași și prestatori în <span className="serif-em text-gradient">{city.name}</span>
          </h1>
          <p className="enter mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-muted-foreground" style={cssVars({ i: 2 })}>
            Alege serviciul de care ai nevoie în {areaLabel(city)}. Publici gratuit proiectul și primești până la 5 oferte de la
            prestatori verificați, fără comision.
          </p>
          {cityFacts[city.slug]?.neighborhoods.length ? (
            <p className="enter mt-4 flex max-w-2xl gap-2 text-sm text-muted-foreground" style={cssVars({ i: 2 })}>
              <MapPin className="mt-0.5 size-4 shrink-0" />
              <span>Inclusiv în cartierele {cityFacts[city.slug].neighborhoods.join(", ")}.</span>
            </p>
          ) : null}
          <Link
            href="/proiecte/nou"
            className="enter mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-[0.9375rem] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            style={cssVars({ i: 3 })}
          >
            Publică un proiect în {city.name} <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      <div className="container-page mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {groups.map(({ root, services }, n) => {
          const d = demandByRoot.get(root.id);
          return (
            <section key={root.id} className="reveal rounded-2xl border bg-card p-5 shadow-xs" style={cssVars({ i: n })}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-semibold tracking-[-0.01em]">{root.name}</h2>
                {d && d.providers > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {d.providers} {d.providers === 1 ? "prestator" : "prestatori"} în județ
                  </span>
                )}
              </div>
              <ul className="mt-3 space-y-0.5">
                {services.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/categorii/${c.slug}/${city.slug}`}
                      className="-mx-2 flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-foreground/85 transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {cityServices[c.slug].noun} în {city.name}
                      <ArrowRight className="size-3.5 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <section className="container-page mt-16">
        <h2 className="eyebrow mb-3 flex items-center gap-1.5">
          <MapPin className="size-3.5" /> Alte orașe
        </h2>
        <div className="flex flex-wrap gap-2">
          {cities
            .filter((c) => c.slug !== city.slug)
            .map((c) => (
              <Link
                key={c.slug}
                href={`/orase/${c.slug}`}
                className="rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:border-border-strong hover:bg-muted"
              >
                {c.name}
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
