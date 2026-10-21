import { ArrowRight, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideAdvice, GuideFaq, GuideIntro, GuideJsonLd, GuidePrices } from "@/components/categories/category-guide";
import { ProjectCard } from "@/components/projects/project-card";
import { ProviderCard } from "@/components/providers/provider-card";
import { EmptyState } from "@/components/shared/empty-state";
import { cssVars } from "@/components/home/css-vars";
import { Button } from "@/components/ui/button";
import { labels } from "@/config/site";
import { postsForCategory } from "@/content/blog/posts";
import { getCategoryGuide } from "@/content/category-guides";
import { cities, cityServices, isCityPageIndexedByDefault } from "@/content/cities";
import { getCatalog } from "@/server/catalog/taxonomy";
import { env } from "@/server/env";
import { categoryDemand } from "@/server/insights";
import { projectFiltersSchema, searchProjects } from "@/server/search/projects";
import { providerFiltersSchema, searchProviders } from "@/server/search/providers";

async function resolve(slug: string) {
  const catalog = await getCatalog();
  const category = catalog.bySlug.get(slug);
  if (!category) return null;
  const root = category.parentId ? catalog.tree.find((t) => t.id === category.parentId) : catalog.tree.find((t) => t.id === category.id);
  return { catalog, category, root };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolve(slug);
  if (!r) return { title: "Categorie" };
  const guide = getCategoryGuide(slug);
  const title = guide?.seoTitle ?? `${r.category.name} — prestatori și proiecte`;
  const description =
    guide?.metaDescription ??
    r.category.description ??
    `Găsește prestatori pentru ${r.category.name.toLowerCase()} sau proiecte deschise în această categorie.`;
  return {
    title,
    description,
    alternates: { canonical: `/categorii/${slug}` },
    openGraph: { title, description, url: `/categorii/${slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await resolve(slug);
  if (!r) notFound();
  const { category, root } = r;
  const isRoot = !category.parentId;
  const guide = getCategoryGuide(category.slug);
  const crumbs = [
    { name: "Acasă", path: "/" },
    ...(!isRoot && root ? [{ name: root.name, path: `/categorii/${root.slug}` }] : []),
    { name: category.name, path: `/categorii/${category.slug}` },
  ];

  const [projects, providers, demand] = await Promise.all([
    searchProjects(projectFiltersSchema.parse({ cat: String(category.id) })),
    searchProviders(providerFiltersSchema.parse({ cat: String(category.id), sort: "rating" })),
    categoryDemand(),
  ]);
  const d = demand.find((x) => x.categoryId === root?.id);
  const siblings = isRoot ? (root?.children ?? []) : (root?.children.filter((c) => c.id !== category.id) ?? []);

  return (
    <div className="pb-16">
      <GuideJsonLd guide={guide} baseUrl={env.APP_URL} crumbs={crumbs} />
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
                {!isRoot && root && (
                  <>
                    <span className="mx-2 text-white/25">/</span>
                    <Link href={`/categorii/${root.slug}`} className="hover:text-white">
                      {root.name}
                    </Link>
                  </>
                )}
              </nav>
              <h1 className="enter display-lg mt-5 text-white" style={cssVars({ i: 1 })}>
                {category.name}
              </h1>
              <p className="enter mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-white/65" style={cssVars({ i: 2 })}>
                {category.description ?? root?.description ?? "Servicii profesionale, de la prestatori verificați."}
              </p>
              <div className="enter mt-8 flex flex-col gap-3 sm:flex-row" style={cssVars({ i: 3 })}>
                <Link
                  href="/proiecte/nou"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-[0.9375rem] font-semibold text-[#0b1426] transition-colors hover:bg-[#eef1fc]"
                >
                  Am nevoie de {category.name.toLowerCase()} <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/inregistrare?rol=prestator"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.05] px-5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-white/[0.1]"
                >
                  Ofer servicii în acest domeniu
                </Link>
              </div>
              <p className="enter mt-5 text-xs text-white/45" style={cssVars({ i: 4 })}>
                Mod de lucru tipic: {labels.workMode[category.typicalWorkMode]}
              </p>
            </div>

            {d && (
              <div className="enter grid grid-cols-2 gap-3" style={cssVars({ i: 3 })}>
                {d.label !== "Fără date" && (
                  <div className="glass col-span-2 flex items-center gap-3 rounded-2xl p-4">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-white/10">
                      <TrendingUp className="size-4 text-[#9fb5ff]" />
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white">{d.label}</div>
                      <div className="text-xs text-white/55">
                        {d.label === "Cerere mare" ? "Ești prestator în domeniu? Acum e momentul să-ți faci profil." : `Cerere și ofertă în ${root?.name}`}
                      </div>
                    </div>
                  </div>
                )}
                {[
                  { v: d.projects30d, l: "proiecte noi în 30 de zile" },
                  { v: d.providers, l: `prestatori activi în ${root?.name}` },
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
            )}
          </div>
        </div>
      </section>

      <div className="container-page space-y-16 pt-12">
        {siblings.length > 0 && (
          <section className="reveal space-y-3">
            <h2 className="eyebrow">{isRoot ? "Subcategorii" : `Alte servicii din ${root?.name}`}</h2>
            <div className="flex flex-wrap gap-2">
              {siblings.map((s) => (
                <Link key={s.id} href={`/categorii/${s.slug}`} className="rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:border-border-strong hover:bg-muted">
                  {s.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {cityServices[category.slug] && cities.some((c) => isCityPageIndexedByDefault(category.slug, c)) && (
          <section className="reveal space-y-3">
            <h2 className="eyebrow">{cityServices[category.slug].noun} în orașul tău</h2>
            <div className="flex flex-wrap gap-2">
              {cities.filter((c) => isCityPageIndexedByDefault(category.slug, c)).map((c) => (
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
        )}

        {guide && (
          <>
            <GuideIntro guide={guide} name={category.name} />
            <GuidePrices guide={guide} name={category.name} />
          </>
        )}

        <section className="space-y-5">
          <div className="reveal flex items-end justify-between gap-2">
            <h2 className="display-md">Proiecte deschise</h2>
            <Link href={`/proiecte?cat=${category.id}`} className="text-sm font-medium text-brand underline-offset-4 hover:underline">
              Toate ({projects.total})
            </Link>
          </div>
          {projects.rows.length === 0 ? (
            <EmptyState title="Niciun proiect deschis momentan" description="Prestatorii înscriși sunt anunțați imediat ce apare un proiect nou." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.rows.slice(0, 6).map((row) => (
                <ProjectCard key={row.project.id} data={row} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-5">
          <div className="reveal flex items-end justify-between gap-2">
            <h2 className="display-md">
              Prestatori <span className="serif-em text-gradient">recomandați</span>
            </h2>
            <Link href={`/prestatori?cat=${category.id}`} className="text-sm font-medium text-brand underline-offset-4 hover:underline">
              Toți ({providers.total})
            </Link>
          </div>
          {providers.rows.length === 0 ? (
            <EmptyState
              title="Încă nu avem prestatori aici"
              description="Fii primul prestator din această categorie și primește toate proiectele noi."
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

        {postsForCategory(category.slug).length > 0 && (
          <section className="reveal space-y-4">
            <h2 className="eyebrow">Ghiduri utile</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {postsForCategory(category.slug).map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="rounded-2xl border bg-card p-5 shadow-xs transition-colors hover:border-border-strong">
                  <p className="font-semibold leading-snug tracking-[-0.01em]">{p.title}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {guide && (
          <>
            <GuideAdvice guide={guide} />
            <GuideFaq guide={guide} name={category.name} />
          </>
        )}
      </div>
    </div>
  );
}
