import { ArrowRight, CircleCheck, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { Faq } from "@/components/marketing/faq";
import { site } from "@/config/site";
import { guidesUpdated, guidesUpdatedIso, type CategoryGuide } from "@/content/category-guides";
import { parsePriceRange } from "@/content/category-guides/price-spec";

/** Ce este serviciul și cum funcționează pe platformă. */
export function GuideIntro({ guide, name }: { guide: CategoryGuide; name: string }) {
  return (
    <section className="reveal grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <div className="eyebrow">Despre serviciu</div>
        <h2 className="display-md mt-3">{name}: ce trebuie să știi</h2>
      </div>
      <div className="max-w-prose space-y-4 text-[0.9375rem] leading-[1.75] text-foreground/85">
        {guide.intro.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </section>
  );
}

/** Tabelul de prețuri orientative (pagina de categorie și /ghid-preturi). */
export function PriceTable({ rows, caption }: { rows: NonNullable<CategoryGuide["prices"]>; caption?: string }) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card shadow-xs">
      <table className="w-full text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-muted/60 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium sm:px-5">
              Lucrare
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium whitespace-nowrap sm:px-5">
              Preț orientativ
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.item}>
              <td className="px-4 py-3.5 align-top sm:px-5">
                <div className="font-medium">{row.item}</div>
                {row.note && <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{row.note}</div>}
              </td>
              <td className="px-4 py-3.5 text-right align-top font-semibold whitespace-nowrap tabular-nums sm:px-5">{row.range}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GuidePrices({ guide, name }: { guide: CategoryGuide; name: string }) {
  if (!guide.prices?.length) return null;
  return (
    <section className="reveal space-y-5" data-vt-scroll="price_table_seen">
      <div>
        <div className="eyebrow">Prețuri orientative</div>
        <h2 className="display-md mt-3">Cât costă: {name}</h2>
      </div>
      <PriceTable rows={guide.prices} caption={`Prețuri orientative: ${name}`} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Prețuri orientative pentru România, actualizate în {guidesUpdated}, adunate din oferte publice. Prețul final depinde de proiect și îl
          stabilești direct cu prestatorul. Toate prețurile, pe o pagină:{" "}
          <Link href="/ghid-preturi" className="underline underline-offset-2 transition-colors hover:text-foreground">
            Ghid de prețuri 2026
          </Link>
          .
        </p>
        <Link
          href="/proiecte/nou"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-brand underline-offset-4 hover:underline"
        >
          Primește oferte gratuite <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}

export function GuideAdvice({ guide }: { guide: CategoryGuide }) {
  const blocks = [
    { title: "Ce influențează prețul", icon: SlidersHorizontal, items: guide.priceFactors },
    { title: "Cum alegi prestatorul", icon: CircleCheck, items: guide.checklist },
  ].filter((b) => b.items?.length);
  if (blocks.length === 0) return null;
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {blocks.map((b) => (
        <div key={b.title} className="reveal rounded-2xl border bg-card p-6 shadow-xs">
          <h2 className="flex items-center gap-2.5 text-lg font-semibold tracking-[-0.01em]">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <b.icon className="size-4" />
            </span>
            {b.title}
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-foreground/85">
            {b.items!.map((item) => (
              <li key={item} className="flex gap-2.5">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand/60" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

export function GuideFaq({ guide, name }: { guide: CategoryGuide; name: string }) {
  if (!guide.faq.length) return null;
  return (
    <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="reveal">
        <div className="eyebrow">Întrebări frecvente</div>
        <h2 className="display-md mt-3">{name}: răspunsuri rapide</h2>
      </div>
      <Faq items={guide.faq} />
    </section>
  );
}

/** Date structurate: pagina (cu data actualizării), serviciul cu prețurile orientative, firimituri și întrebări frecvente. */
export function GuideJsonLd({
  guide,
  baseUrl,
  crumbs,
  service,
}: {
  guide: CategoryGuide | undefined;
  baseUrl: string;
  crumbs: { name: string; path: string }[];
  /** Serviciul descris de pagină; `city` restrânge aria deservită la oraș. */
  service?: { name: string; description?: string; city?: string };
}) {
  const url = `${baseUrl}${crumbs[crumbs.length - 1]?.path ?? "/"}`;
  const graph: object[] = [
    {
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${baseUrl}${c.path}` })),
    },
  ];
  if (service) {
    const offers = (guide?.prices ?? []).flatMap((p) => {
      const spec = parsePriceRange(p.range);
      if (!spec) return [];
      return [
        {
          "@type": "Offer",
          name: p.item,
          ...(p.note ? { description: p.note } : {}),
          priceCurrency: "RON",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            priceCurrency: "RON",
            minPrice: spec.min,
            ...(spec.max !== null ? { maxPrice: spec.max } : {}),
            ...(spec.unit ? { unitText: spec.unit } : {}),
          },
        },
      ];
    });
    graph.push(
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: service.city ? `${service.name} în ${service.city}` : service.name,
        inLanguage: "ro-RO",
        isPartOf: { "@id": `${baseUrl}/#website` },
        about: { "@id": `${url}#service` },
        ...(guide ? { dateModified: guidesUpdatedIso } : {}),
      },
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: service.name,
        serviceType: service.name,
        ...(service.description ? { description: service.description } : {}),
        url,
        // Contractez pune în legătură clienții cu prestatorii; nu prestează el serviciul.
        broker: { "@type": "Organization", "@id": `${baseUrl}/#org`, name: site.name, url: baseUrl },
        areaServed: service.city
          ? { "@type": "City", name: service.city, containedInPlace: { "@type": "Country", name: "România" } }
          : { "@type": "Country", name: "România" },
        ...(offers.length ? { offers } : {}),
      },
    );
  }
  if (guide?.faq.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: guide.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c") }}
    />
  );
}
