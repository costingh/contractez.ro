import { ArrowRight, Sparkles, UserSearch } from "lucide-react";
import type { Metadata } from "next";
import { TrackOnMount } from "@/components/analytics/track-on-mount";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProviderCard } from "@/components/providers/provider-card";
import { FilterChips, type Chip } from "@/components/public-search/filter-chips";
import { MobileFilters } from "@/components/public-search/mobile-filters";
import { flattenParams, toQuery, type RawParams } from "@/components/public-search/params";
import { LANGUAGES, ProviderFiltersForm } from "@/components/public-search/provider-filters-form";
import { ruleParseQuery } from "@/components/public-search/rule-parse";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchHero } from "@/components/marketing/search-hero";
import { Pagination } from "@/components/shared/pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { parseProviderSearch } from "@/server/ai/features";
import { getCurrentUser } from "@/server/auth/session";
import { findLocalityByName, getLocality } from "@/server/catalog/localities";
import { categoryOptions } from "@/server/catalog/options";
import { getCatalog } from "@/server/catalog/taxonomy";
import { parseProviderFilters, searchProviders, suggestRelaxations, type ProviderFilters } from "@/server/search/providers";

export const metadata: Metadata = {
  alternates: { canonical: "/prestatori" },
  title: "Prestatori",
  description: "Găsește prestatori verificați din toată România: meseriași, programatori, designeri, contabili și mulți alții. Filtrează după zonă, factură, tarif și rating.",
};

const SORTS: { value: ProviderFilters["sort"]; label: string }[] = [
  { value: "relevance", label: "Relevanță" },
  { value: "rating", label: "Rating" },
  { value: "rate", label: "Tarif mic" },
  { value: "distance", label: "Distanță" },
  { value: "response", label: "Răspuns rapid" },
  { value: "experience", label: "Experiență" },
];

async function handleAiSearch(text: string, userId: string | null) {
  const parsed = await parseProviderSearch(text, userId);
  if (!parsed) {
    const r = await ruleParseQuery(text);
    redirect(
      `/prestatori?${toQuery({
        cat: r.cat,
        loc: r.loc,
        r: r.loc ? 30 : undefined,
        inv: r.invoice ? "yes" : undefined,
        le: r.legal,
        rate: r.rate,
        budget: r.rate ? undefined : r.budgetMax,
        remote: r.remote ? "1" : undefined,
        q: r.cat ? undefined : r.keywords,
        aiexp: "Interpretare automată simplă (AI indisponibil). Ajustează filtrele dacă e nevoie.",
      })}`,
    );
  }
  const catalog = await getCatalog();
  const loc = parsed.localityName ? await findLocalityByName(parsed.localityName, parsed.countyCode ?? undefined) : null;
  redirect(
    `/prestatori?${toQuery({
      q: parsed.keywords ?? undefined,
      cat: parsed.categorySlug ? catalog.bySlug.get(parsed.categorySlug)?.id : undefined,
      loc: loc?.id,
      r: loc ? (parsed.radiusKm ?? 30) : undefined,
      inv: parsed.issuesInvoice === true ? "yes" : undefined,
      le: parsed.legalEntity === "srl" ? "srl" : parsed.legalEntity ? "pfa" : undefined,
      rate: parsed.maxHourlyRate ?? undefined,
      budget: parsed.maxBudget ?? undefined,
      remote: parsed.remote ? "1" : undefined,
      onsite: parsed.onSite ? "1" : undefined,
      rating: parsed.minRating ?? undefined,
      avail: parsed.availableOnly ? "1" : undefined,
      lang: parsed.languages?.find((l) => l !== "ro"),
      aiexp: parsed.explanation,
    })}`,
  );
}

export default async function ProvidersPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const raw = flattenParams(await searchParams);
  const user = await getCurrentUser();
  if (raw.ai && raw.ai.trim().length > 2) await handleAiSearch(raw.ai.trim(), user?.id ?? null);

  const filters = parseProviderFilters(raw);
  const [results, cats, catalog, loc] = await Promise.all([
    searchProviders(filters),
    categoryOptions(),
    getCatalog(),
    filters.loc ? getLocality(filters.loc) : null,
  ]);
  const relaxations = results.total === 0 ? await suggestRelaxations(filters) : [];

  const chips: Chip[] = [];
  if (filters.q) chips.push({ key: "q", label: `„${filters.q}”` });
  if (filters.cat) chips.push({ key: "cat", label: catalog.byId.get(filters.cat)?.name ?? "Serviciu" });
  if (loc) chips.push({ key: "loc", label: `${loc.name}${filters.r ? ` · ${filters.r} km` : ""}` });
  if (filters.onsite) chips.push({ key: "onsite", label: "La fața locului" });
  if (filters.remote) chips.push({ key: "remote", label: "Remote" });
  if (filters.inv) chips.push({ key: "inv", label: filters.inv === "yes" ? "Emite factură" : "Fără factură" });
  if (filters.le)
    chips.push({ key: "le", label: { company: "Firmă/PFA", pfa: "PFA/II", srl: "SRL", none: "Persoană fizică" }[filters.le] });
  if (filters.rate) chips.push({ key: "rate", label: `max. ${filters.rate} lei/oră` });
  if (filters.budget) chips.push({ key: "budget", label: `buget ${filters.budget.toLocaleString("ro-RO")} lei` });
  if (filters.rating) chips.push({ key: "rating", label: `${filters.rating}★+` });
  if (filters.avail) chips.push({ key: "avail", label: "Disponibil acum" });
  if (filters.lang) chips.push({ key: "lang", label: LANGUAGES.find((l) => l.code === filters.lang)?.name ?? filters.lang });
  if (filters.portfolio) chips.push({ key: "portfolio", label: "Cu portofoliu" });
  if (filters.done) chips.push({ key: "done", label: "Cu colaborări" });
  if (filters.fast) chips.push({ key: "fast", label: "Răspuns rapid" });
  if (filters.anaf) chips.push({ key: "anaf", label: "Verificat ANAF" });

  const params = Object.fromEntries(Object.entries(raw).filter(([k]) => k !== "ai")) as Record<string, string | undefined>;
  const linkWith = (patch: Record<string, string | number | undefined>) => {
    const next: Record<string, string | number | undefined> = { ...params, page: undefined, aiexp: undefined };
    for (const [k, v] of Object.entries(patch)) next[k] = v;
    return `/prestatori?${toQuery(next)}`;
  };
  const form = (
    <ProviderFiltersForm
      filters={filters}
      categories={cats}
      locality={loc ? { id: loc.id, name: loc.name, county: loc.county, countyCode: loc.countyCode } : null}
    />
  );

  return (
    <div className="pb-16">
      {(filters.q || filters.cat || filters.loc) && (
        <TrackOnMount
          name="search_providers"
          props={{ q: filters.q, category: filters.cat ? catalog.byId.get(filters.cat)?.slug : undefined, locality: loc?.name, results: results.total }}
        />
      )}
      <SearchHero
        eyebrow="Pentru clienți"
        title={
          <>
            Prestatori <span className="serif-em text-gradient-ink">verificați</span>, din toată țara.
          </>
        }
        description="Tarife, zonă de deplasare și recenzii doar după colaborări confirmate. Spune ce cauți, în cuvintele tale."
        searchAction="/prestatori"
        placeholder="Ex: o firmă din București cu factură, SEO pentru hoteluri, max 150 lei/oră"
        action={
          <Link
            href="/proiecte/nou"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 text-sm font-medium text-white transition-colors hover:bg-white/[0.1]"
          >
            Publică un proiect gratuit <ArrowRight className="size-4" />
          </Link>
        }
      />

      <div className="container-page pt-8">
      {raw.aiexp && (
        <Alert variant="info" className="mb-6">
          <Sparkles />
          <AlertTitle>Cum am interpretat căutarea</AlertTitle>
          <AlertDescription>
            <p>{raw.aiexp}</p>
            {chips.length > 0 && <p className="text-xs">Poți elimina orice filtru de mai jos dacă nu se potrivește.</p>}
          </AlertDescription>
        </Alert>
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
                {results.total === 1 ? "1 prestator" : `${results.total.toLocaleString("ro-RO")} prestatori`}
              </span>
            </div>
            <div className="flex max-w-full gap-0.5 overflow-x-auto rounded-lg border bg-muted/60 p-0.5" role="navigation" aria-label="Sortare">
              {SORTS.filter((s) => s.value !== "distance" || filters.loc).map((s) => (
                <Link
                  key={s.value}
                  href={linkWith({ sort: s.value })}
                  aria-current={filters.sort === s.value ? "true" : undefined}
                  className={`shrink-0 rounded-md px-2.5 py-1 text-xs whitespace-nowrap transition-colors ${filters.sort === s.value ? "bg-card font-medium text-foreground shadow-xs dark:bg-input" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>

          <FilterChips chips={chips} params={params} basePath="/prestatori" />

          {results.promoted.length > 0 && (
            <div className="space-y-3 rounded-xl border bg-surface p-3 dark:bg-muted/30">
              <div className="eyebrow px-1">Promovat</div>
              {results.promoted.map((r) => (
                <ProviderCard key={`promo-${r.profile.userId}`} data={r} promoted />
              ))}
            </div>
          )}

          {results.rows.length === 0 ? (
            <EmptyState
              icon={UserSearch}
              title="Niciun prestator nu corespunde tuturor filtrelor"
              description={
                relaxations.length > 0 ? (
                  <span className="space-y-2">
                    <span className="block">Am găsit rezultate dacă relaxezi un filtru:</span>
                    <span className="flex flex-wrap justify-center gap-2">
                      {relaxations.map((r) => (
                        <Link
                          key={r.label}
                          href={linkWith(r.params as Record<string, string | number | undefined>)}
                          className="rounded-md border bg-card px-3 py-1 text-xs font-medium text-foreground shadow-xs hover:border-border-strong"
                        >
                          {r.label} · {r.count}
                        </Link>
                      ))}
                    </span>
                  </span>
                ) : (
                  "Publică proiectul gratuit: îl trimitem prestatorilor compatibili, inclusiv celor care se înscriu de acum încolo."
                )
              }
              action={
                <Button asChild variant="outline">
                  <Link href="/proiecte/nou">Publică proiectul</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4">
              {results.rows.map((r) => (
                <ProviderCard key={r.profile.userId} data={r} />
              ))}
            </div>
          )}
          <Pagination page={results.page} pages={results.pages} params={params} basePath="/prestatori" />
        </section>
      </div>
      </div>
    </div>
  );
}
