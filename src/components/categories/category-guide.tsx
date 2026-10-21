import { ArrowRight, CircleCheck, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { Faq } from "@/components/marketing/faq";
import { guidesUpdated, type CategoryGuide } from "@/content/category-guides";

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
    <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
      <table className="w-full text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-muted/60 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-5 py-3 font-medium">
              Lucrare
            </th>
            <th scope="col" className="px-5 py-3 text-right font-medium whitespace-nowrap">
              Preț orientativ
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.item}>
              <td className="px-5 py-3.5 align-top">
                <div className="font-medium">{row.item}</div>
                {row.note && <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{row.note}</div>}
              </td>
              <td className="px-5 py-3.5 text-right align-top font-semibold whitespace-nowrap tabular-nums">{row.range}</td>
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

/** Date structurate: firimituri de navigare și întrebări frecvente. */
export function GuideJsonLd({
  guide,
  baseUrl,
  crumbs,
}: {
  guide: CategoryGuide | undefined;
  baseUrl: string;
  crumbs: { name: string; path: string }[];
}) {
  const graph: object[] = [
    {
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${baseUrl}${c.path}` })),
    },
  ];
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
