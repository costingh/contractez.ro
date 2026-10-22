import { FolderSearch, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { TrackOnMount } from "@/components/analytics/track-on-mount";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProjectCard } from "@/components/projects/project-card";
import { aiExplanation, type AiExplanationCode } from "@/components/public-search/ai-explanation";
import { FilterChips, type Chip } from "@/components/public-search/filter-chips";
import { MobileFilters } from "@/components/public-search/mobile-filters";
import { cleanAiQuery, flattenParams, toQuery, type RawParams } from "@/components/public-search/params";
import { ruleParseQuery } from "@/components/public-search/rule-parse";
import { ProjectFiltersForm } from "@/components/public-search/project-filters-form";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchHero } from "@/components/marketing/search-hero";
import { Pagination } from "@/components/shared/pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { labels } from "@/config/site";
import { formatLei } from "@/lib/format";
import { parseProjectSearch } from "@/server/ai/features";
import { getCurrentUser } from "@/server/auth/session";
import { canUseAiSearch } from "@/server/search/ai-guard";
import { findLocalityByName, getLocality } from "@/server/catalog/localities";
import { categoryOptions } from "@/server/catalog/options";
import { getCatalog } from "@/server/catalog/taxonomy";
import { features } from "@/server/features";
import { parseProjectFilters, searchProjects, type ProjectFilters } from "@/server/search/projects";

export const metadata: Metadata = {
  alternates: { canonical: "/proiecte" },
  title: "Proiecte deschise",
  description: "Proiecte și cereri de servicii publicate de clienți din toată România. Filtrează după domeniu, buget, localitate și factură.",
};

const SORTS: { value: ProjectFilters["sort"]; label: string }[] = [
  { value: "newest", label: "Cele mai noi" },
  { value: "relevance", label: "Relevanță" },
  { value: "budget", label: "Buget mare" },
  { value: "distance", label: "Cele mai apropiate" },
  { value: "ending", label: "Expiră curând" },
];

async function handleAiSearch(text: string, userId: string | null) {
  // Vizitatorii anonimi peste limită primesc interpretarea simplă (fără AI), ca la AI indisponibil.
  const parsed = (await canUseAiSearch(userId)) ? await parseProjectSearch(text, userId) : null;
  if (!parsed) {
    const r = await ruleParseQuery(text);
    redirect(
      `/proiecte?${toQuery({
        cat: r.cat,
        min: r.budgetMin,
        max: r.budgetMax && r.budgetMin !== r.budgetMax ? r.budgetMax : undefined,
        mode: r.remote ? "remote" : undefined,
        loc: r.loc,
        r: r.loc ? 30 : undefined,
        inv: r.invoice ? "required" : undefined,
        urg: r.urgent ? "urgent" : undefined,
        q: r.cat ? undefined : r.keywords,
        aiexp: "simplu" satisfies AiExplanationCode,
      })}`,
    );
  }
  const catalog = await getCatalog();
  const loc = parsed.localityName ? await findLocalityByName(parsed.localityName) : null;
  redirect(
    `/proiecte?${toQuery({
      q: parsed.keywords ?? undefined,
      cat: parsed.categorySlug ? catalog.bySlug.get(parsed.categorySlug)?.id : undefined,
      min: parsed.minBudget ?? undefined,
      max: parsed.maxBudget ?? undefined,
      mode: parsed.workMode ?? undefined,
      loc: loc?.id,
      r: loc ? (parsed.radiusKm ?? 30) : undefined,
      inv: parsed.invoiceRequired ? "required" : undefined,
      urg: parsed.urgentOnly ? "urgent" : undefined,
      aiexp: "ai" satisfies AiExplanationCode,
    })}`,
  );
}

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const raw = flattenParams(await searchParams);
  const user = await getCurrentUser();
  const aiQuery = cleanAiQuery(raw.ai);
  if (aiQuery) await handleAiSearch(aiQuery, user?.id ?? null);

  const filters = parseProjectFilters(raw);
  const [results, cats, catalog, loc] = await Promise.all([
    searchProjects(filters),
    categoryOptions(),
    getCatalog(),
    filters.loc ? getLocality(filters.loc) : null,
  ]);

  const chips: Chip[] = [];
  if (filters.q) chips.push({ key: "q", label: `„${filters.q}”` });
  if (filters.cat) chips.push({ key: "cat", label: catalog.byId.get(filters.cat)?.name ?? "Categorie" });
  if (filters.min) chips.push({ key: "min", label: `min. ${formatLei(filters.min)}` });
  if (filters.max) chips.push({ key: "max", label: `max. ${formatLei(filters.max)}` });
  if (filters.bt) chips.push({ key: "bt", label: labels.budgetType[filters.bt] });
  if (filters.mode.length) chips.push({ key: "mode", label: filters.mode.map((m) => labels.workMode[m]).join(" / ") });
  if (loc) chips.push({ key: "loc", label: `${loc.name}${filters.r ? ` · ${filters.r} km` : ""}` });
  if (filters.inv) chips.push({ key: "inv", label: filters.inv === "required" ? "Cu factură obligatorie" : "Fără factură obligatorie" });
  if (filters.urg) chips.push({ key: "urg", label: labels.urgency[filters.urg] });
  if (filters.verified && features.phoneVerification) chips.push({ key: "verified", label: "Client cu telefon verificat" });
  if (filters.few) chips.push({ key: "few", label: "Puține oferte" });
  if (filters.days) chips.push({ key: "days", label: `Ultimele ${filters.days} zile` });

  const form = (
    <ProjectFiltersForm
      filters={filters}
      showVerifiedFilter={features.phoneVerification}
      categories={cats}
      locality={loc ? { id: loc.id, name: loc.name, county: loc.county, countyCode: loc.countyCode } : null}
    />
  );
  const paramsForLinks = Object.fromEntries(Object.entries(raw).filter(([k]) => k !== "ai")) as Record<string, string | undefined>;

  return (
    <div className="pb-16">
      {(filters.q || filters.cat || filters.loc) && (
        <TrackOnMount
          name="search_projects"
          props={{ q: filters.q, category: filters.cat ? catalog.byId.get(filters.cat)?.slug : undefined, locality: loc?.name, results: results.total }}
        />
      )}
      <SearchHero
        eyebrow="Pentru prestatori"
        stat={results.total === 1 ? "1 proiect deschis" : `${results.total.toLocaleString("ro-RO")} proiecte`}
        title={
          <>
            Proiecte <span className="serif-em text-gradient-ink">reale</span>, de la clienți verificați.
          </>
        }
        description="Fiecare client și-a confirmat emailul. Trimiți o ofertă scurtă, iar chat-ul cu clientul este gratuit."
        searchAction="/proiecte"
        placeholder="Ex: site-uri WordPress cu buget peste 2000 lei, remote"
      />

      <div className="container-page pt-8">
      {aiExplanation(raw.aiexp) && (
        <Alert variant="info" className="mb-6">
          <Sparkles />
          <AlertTitle>Cum am interpretat căutarea</AlertTitle>
          <AlertDescription>{aiExplanation(raw.aiexp)}</AlertDescription>
        </Alert>
      )}

      {user?.isProvider && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-brand/20 bg-brand-soft px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="leading-relaxed">Vrei doar proiectele compatibile cu profilul tău, cu scor explicat?</span>
          <Button asChild size="sm" variant="brand">
            <Link href="/recomandari">Vezi proiectele recomandate pentru tine</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[272px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-xl border bg-card p-5 shadow-xs">{form}</div>
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MobileFilters activeCount={chips.length}>{form}</MobileFilters>
              <span className="text-sm text-muted-foreground tabular-nums">
                {results.total === 1 ? "1 proiect" : `${results.total.toLocaleString("ro-RO")} proiecte`}
              </span>
            </div>
            <div className="no-scrollbar flex max-w-full touch-pan-x gap-0.5 overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-lg border bg-muted/60 p-0.5" role="navigation" aria-label="Sortare">
              {SORTS.filter((s) => s.value !== "distance" || filters.loc).map((s) => (
                <Link
                  key={s.value}
                  href={`/proiecte?${toQuery({ ...paramsForLinks, sort: s.value, page: undefined })}`}
                  aria-current={filters.sort === s.value ? "true" : undefined}
                  className={`flex shrink-0 items-center rounded-md px-2.5 py-1 text-xs whitespace-nowrap transition-colors pointer-coarse:min-h-9 ${filters.sort === s.value ? "bg-card font-medium text-foreground shadow-xs dark:bg-input" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>

          <FilterChips chips={chips} params={paramsForLinks} basePath="/proiecte" />

          {results.rows.length === 0 ? (
            <EmptyState
              icon={FolderSearch}
              title="Niciun proiect găsit"
              description={chips.length ? "Încearcă să elimini unele filtre sau să mărești raza." : "Nu există încă proiecte deschise. Revino curând!"}
              action={
                chips.length ? (
                  <Button asChild variant="outline">
                    <Link href="/proiecte">Vezi toate proiectele</Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-4">
              {results.rows.map((r) => (
                <ProjectCard key={r.project.id} data={r} />
              ))}
            </div>
          )}
          <Pagination page={results.page} pages={results.pages} params={paramsForLinks} basePath="/proiecte" />
        </section>
      </div>
      </div>
    </div>
  );
}
