import { ArrowRight, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideAdvice, GuideJsonLd, GuidePrices } from "@/components/categories/category-guide";
import { cssVars } from "@/components/home/css-vars";
import { Faq } from "@/components/marketing/faq";
import { ProjectCard } from "@/components/projects/project-card";
import { ProviderCard } from "@/components/providers/provider-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { site } from "@/config/site";
import { getCategoryGuide } from "@/content/category-guides";
import { cities, citiesBySlug, cityServices, isCityPageIndexedByDefault, powerRelatedServices } from "@/content/cities";
import { findLocalityByName, nearbyLocalities } from "@/server/catalog/localities";
import { getCatalog } from "@/server/catalog/taxonomy";
import { env } from "@/server/env";
import { projectFiltersSchema, searchProjects } from "@/server/search/projects";
import { providerFiltersSchema, searchProviders } from "@/server/search/providers";

/** Raza în care căutăm prestatori și proiecte în jurul orașului (km). */
const RADIUS_KM = 40;

type Params = Promise<{ slug: string; oras: string }>;

async function resolve(slug: string, oras: string) {
  const city = citiesBySlug.get(oras);
  const service = cityServices[slug];
  if (!city || !service) return null;
  const catalog = await getCatalog();
  const category = catalog.bySlug.get(slug);
  if (!category?.parentId) return null;
  const root = catalog.byId.get(category.parentId);
  const locality = await findLocalityByName(city.name, city.countyCode);
  if (!locality) return null;
  return { city, service, category, root, locality, guide: getCategoryGuide(slug) };
}

async function localData(categoryId: number, localityId: number) {
  const [providers, projects] = await Promise.all([
    searchProviders(providerFiltersSchema.parse({ cat: String(categoryId), loc: String(localityId), r: String(RADIUS_KM), onsite: "1", sort: "rating" })),
    searchProjects(projectFiltersSchema.parse({ cat: String(categoryId), loc: String(localityId), r: String(RADIUS_KM), mode: "on_site,hybrid" })),
  ]);
  return { providers, projects };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, oras } = await params;
  const r = await resolve(slug, oras);
  if (!r) return { title: "Pagină inexistentă" };
  const { city, service, category } = r;
  const { providers, projects } = await localData(category.id, r.locality.id);
  const indexable = isCityPageIndexedByDefault(slug, city) || providers.total > 0 || projects.total > 0;
  const base = `${service.noun} ${city.name}: prețuri și oferte`;
  const title = base.length <= 46 ? `${base} verificate` : base;
  const description = `Cauți ${service.noun.toLowerCase()} în ${city.name}? Publică gratuit proiectul și primești până la 5 oferte de la ${service.plural} verificați din ${city.name} și împrejurimi.`;
  return {
    title,
    description,
    alternates: { canonical: `/categorii/${slug}/${oras}` },
    openGraph: { title, description, url: `/categorii/${slug}/${oras}` },
    robots: indexable ? undefined : { index: false, follow: true },
  };
}

export default async function CityCategoryPage({ params }: { params: Params }) {
  const { slug, oras } = await params;
  const r = await resolve(slug, oras);
  if (!r) notFound();
  const { city, service, category, root, locality, guide } = r;
  const [{ providers, projects }, nearby] = await Promise.all([localData(category.id, locality.id), nearbyLocalities(locality, 30, 8)]);

  const nounLower = service.noun.toLowerCase();
  const firstPrice = guide?.prices?.[0];
  const faq = [
    {
      q: `Cât costă ${nounLower} în ${city.name}?`,
      a: firstPrice
        ? `Ca reper, „${firstPrice.item.toLowerCase()}” costă de obicei ${firstPrice.range}${firstPrice.note ? ` (${firstPrice.note})` : ""}. ${
            city.highPrices
              ? `În ${city.name} prețurile tind spre partea de sus a intervalului, pentru că cererea e mare.`
              : `În ${city.name} prețurile sunt de regulă în zona de mijloc a intervalului.`
          } Prețul exact îl afli din ofertele primite pentru proiectul tău.`
        : `Depinde de complexitatea lucrării. Publică proiectul gratuit și compari ofertele primite de la ${service.plural} din ${city.name}.`,
    },
    {
      q: `Cum găsesc ${service.plural} de încredere în ${city.name}?`,
      a: `Descrie lucrarea pe ${site.name}, gratuit. Primești cel mult 5 oferte de la ${service.plural} compatibili cu cererea ta, care lucrează în ${city.name} și în jur. Vezi profilul, portofoliul și recenziile fiecăruia; recenziile pot fi lăsate doar după o colaborare confirmată.`,
    },
    ...(nearby.length
      ? [
          {
            q: `Lucrează prestatorii și în afara orașului?`,
            a: `Da. Mulți ${service.plural} din ${city.name} acceptă lucrări și în localitățile din apropiere, cum ar fi ${nearby.slice(0, 4).join(", ")}. Fiecare prestator își setează raza de deplasare, iar platforma îți arată doar ofertele celor care ajung la tine.`,
          },
        ]
      : []),
    ...(guide?.faq.slice(0, 2) ?? []),
  ];

  const crumbs = [
    { name: "Acasă", path: "/" },
    ...(root ? [{ name: root.name, path: `/categorii/${root.slug}` }] : []),
    { name: category.name, path: `/categorii/${category.slug}` },
    { name: city.name, path: `/categorii/${category.slug}/${city.slug}` },
  ];
  const otherCities = cities.filter((c) => c.slug !== city.slug);
  const catalog = await getCatalog();
  const siblings = (catalog.tree.find((t) => t.id === root?.id)?.children ?? []).filter((c) => c.slug !== slug && cityServices[c.slug]);

  return (
    <div className="pb-16">
      <GuideJsonLd guide={guide ? { ...guide, faq } : undefined} baseUrl={env.APP_URL} crumbs={crumbs} />
      <section className="px-2 pt-2 sm:px-3 sm:pt-3">
        <div className="ink-panel rounded-[1.75rem] sm:rounded-[2.25rem]">
          <div aria-hidden className="aurora aurora-a -top-48 -left-24 size-[560px]" />
          <div aria-hidden className="aurora aurora-b -right-40 -bottom-56 size-[520px] opacity-40" />
          <div className="container-page grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div>
              <nav className="enter text-sm text-white/50" style={cssVars({ i: 0 })}>
                <Link href="/" className="hover:text-white">
                  Acasă
                </Link>
                <span className="mx-2 text-white/25">/</span>
                <Link href={`/categorii/${category.slug}`} className="hover:text-white">
                  {category.name}
                </Link>
                <span className="mx-2 text-white/25">/</span>
                <span className="text-white/70">{city.name}</span>
              </nav>
              <h1 className="enter display-lg mt-5 text-white" style={cssVars({ i: 1 })}>
                {service.noun} în {city.name}
              </h1>
              <p className="enter mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-white/65" style={cssVars({ i: 2 })}>
                Publici gratuit ce ai nevoie și primești până la 5 oferte de la {service.plural} verificați din {city.name} și județul {city.county}.
                Compari prețurile și alegi direct, fără comision.
              </p>
              <div className="enter mt-8 flex flex-col gap-3 sm:flex-row" style={cssVars({ i: 3 })}>
                <Link
                  href="/proiecte/nou"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-[0.9375rem] font-semibold text-[#0b1426] transition-colors hover:bg-[#eef1fc]"
                >
                  Cere oferte în {city.name} <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/inregistrare?rol=prestator"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.05] px-5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-white/[0.1]"
                >
                  Lucrez în {city.name}
                </Link>
              </div>
            </div>
            <div className="enter grid grid-cols-2 gap-3" style={cssVars({ i: 3 })}>
              {[
                { v: providers.total, l: `${service.plural} în raza de ${RADIUS_KM} km` },
                { v: projects.total, l: `proiecte deschise în zona ${city.name}` },
              ].map((x, n) => (
                <div key={x.l} className="glass rounded-2xl p-5">
                  <div className="text-[2.5rem] leading-none font-semibold tracking-[-0.04em] text-white tabular-nums">
                    <span aria-hidden className="count-in" style={cssVars({ to: x.v, i: n })} />
                    <span className="sr-only">{x.v}</span>
                  </div>
                  <div className="mt-2 text-xs leading-snug text-white/55">{x.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container-page space-y-16 pt-12">
        <section className="reveal grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="eyebrow">
              {category.name} · {city.name}
            </div>
            <h2 className="display-md mt-3">Cum găsești {service.plural} în {city.name}</h2>
          </div>
          <div className="max-w-prose space-y-4 text-[0.9375rem] leading-[1.75] text-foreground/85">
            {guide?.intro[0] && <p>{guide.intro[0]}</p>}
            <p>
              Pe Contractez descrii lucrarea cu cuvintele tale și alegi localitatea. Proiectul ajunge doar la {service.plural} care lucrează în{" "}
              {city.name} sau acceptă deplasarea până la tine, iar datele tale de contact rămân ascunse până alegi tu o ofertă.
            </p>
            {powerRelatedServices.has(slug) && (
              <p>
                Dacă lucrarea are nevoie de aviz, branșament nou sau mărirea puterii aprobate, dosarul se depune la operatorul de distribuție din
                zonă; în {city.name} acesta este {city.powerDistributor}. Un electrician autorizat ANRE te poate ajuta cu documentația și cu
                măsurătorile PRAM.
              </p>
            )}
            {slug === "topografie-cadastru" && (
              <p>
                Documentația cadastrală întocmită de un expert autorizat ANCPI se depune la OCPI {city.county} (Oficiul de Cadastru și Publicitate
                Imobiliară), care face și înscrierea în cartea funciară.
              </p>
            )}
            {nearby.length > 0 && (
              <p className="flex gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>
                  Acoperim și împrejurimile: {nearby.join(", ")}.
                </span>
              </p>
            )}
          </div>
        </section>

        <section className="space-y-5">
          <div className="reveal flex items-end justify-between gap-2">
            <h2 className="display-md">
              {service.plural.charAt(0).toUpperCase() + service.plural.slice(1)} din {city.name}
            </h2>
            <Link
              href={`/prestatori?cat=${category.id}&loc=${locality.id}&r=${RADIUS_KM}&onsite=1`}
              className="text-sm font-medium text-brand underline-offset-4 hover:underline"
            >
              Toți ({providers.total})
            </Link>
          </div>
          {providers.rows.length === 0 ? (
            <EmptyState
              title={`Încă nu avem ${service.plural} listați în ${city.name}`}
              description={`Publică proiectul oricum: îl trimitem prestatorilor care se înscriu în zonă. Ești din domeniu? Primești toate proiectele noi din ${city.name}.`}
              action={
                <Button asChild variant="outline">
                  <Link href="/inregistrare?rol=prestator">Creează profil gratuit</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4">
              {providers.rows.slice(0, 6).map((row) => (
                <ProviderCard key={row.profile.userId} data={row} />
              ))}
            </div>
          )}
        </section>

        {projects.rows.length > 0 && (
          <section className="space-y-5">
            <h2 className="reveal display-md">Proiecte deschise în zona {city.name}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {projects.rows.slice(0, 4).map((row) => (
                <ProjectCard key={row.project.id} data={row} />
              ))}
            </div>
          </section>
        )}

        {guide && <GuidePrices guide={guide} name={`${category.name} în ${city.name}`} />}
        {guide && <GuideAdvice guide={guide} />}

        <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="reveal">
            <div className="eyebrow">Întrebări frecvente</div>
            <h2 className="display-md mt-3">
              {service.noun} în {city.name}
            </h2>
          </div>
          <Faq items={faq} />
        </section>

        {siblings.length > 0 && (
          <section className="reveal space-y-3">
            <h2 className="eyebrow">Alte servicii în {city.name}</h2>
            <div className="flex flex-wrap gap-2">
              {siblings.map((c) => (
                <Link
                  key={c.slug}
                  href={`/categorii/${c.slug}/${city.slug}`}
                  className="rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:border-border-strong hover:bg-muted"
                >
                  {cityServices[c.slug].noun}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="reveal space-y-3">
          <h2 className="eyebrow">{service.noun} în alte orașe</h2>
          <div className="flex flex-wrap gap-2">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                href={`/categorii/${category.slug}/${c.slug}`}
                className="rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:border-border-strong hover:bg-muted"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
