import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { cssVars } from "@/components/home/css-vars";
import { site } from "@/config/site";
import { getCategoryGuide, guidesUpdated } from "@/content/category-guides";
import { pageTitle } from "@/lib/seo";
import { pluralRo } from "@/lib/text";
import { getCatalog } from "@/server/catalog/taxonomy";
import { env } from "@/server/env";

const title = "Toate categoriile de servicii, cu prețuri orientative";
const description =
  "Peste 80 de servicii, de la renovări, instalații și mutări la IT, contabilitate și evenimente. Vezi prețurile orientative și cere gratuit până la 5 oferte.";

export const metadata: Metadata = {
  title: pageTitle(title),
  description,
  alternates: { canonical: "/categorii" },
  openGraph: { title, description, url: "/categorii" },
};

/** Hub-ul tuturor categoriilor: fiecare subcategorie cu primul preț orientativ din ghidul ei. */
export default async function CategoriesPage() {
  const catalog = await getCatalog();
  const subcount = catalog.tree.reduce((n, r) => n + r.children.length, 0);
  const base = env.APP_URL;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${base}/categorii`,
        url: `${base}/categorii`,
        name: title,
        description,
        inLanguage: "ro-RO",
        isPartOf: { "@id": `${base}/#website` },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: catalog.tree.length,
          itemListElement: catalog.tree.map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.name, url: `${base}/categorii/${r.slug}` })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Acasă", item: `${base}/` },
          { "@type": "ListItem", position: 2, name: "Categorii", item: `${base}/categorii` },
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
          </nav>
          <h1 className="enter display-lg mt-5 max-w-3xl" style={cssVars({ i: 1 })}>
            Toate <span className="serif-em text-gradient">serviciile</span>, într-un loc.
          </h1>
          <p className="enter mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-muted-foreground" style={cssVars({ i: 2 })}>
            Pe {site.name} găsești prestatori pentru {pluralRo(subcount, "serviciu", "servicii")} grupate în{" "}
            {pluralRo(catalog.tree.length, "categorie", "categorii")}. Fiecare pagină are prețuri orientative actualizate în {guidesUpdated},
            sfaturi pentru alegerea prestatorului și întrebări frecvente. Publici gratuit proiectul și primești până la 5 oferte.
          </p>
          <Link
            href="/ghid-preturi"
            className="enter mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand underline-offset-4 hover:underline"
            style={cssVars({ i: 3 })}
          >
            Toate prețurile pe o pagină: Ghid de prețuri 2026 <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </header>

      <div className="container-page mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {catalog.tree.map((root, n) => (
          <section key={root.id} className="reveal rounded-2xl border bg-card p-5 shadow-xs" style={cssVars({ i: n })}>
            <h2 className="font-semibold tracking-[-0.01em]">
              <Link href={`/categorii/${root.slug}`} className="underline-offset-4 hover:underline">
                {root.name}
              </Link>
            </h2>
            {root.description && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{root.description}</p>}
            <ul className="mt-3 space-y-0.5">
              {root.children.map((c) => {
                const price = getCategoryGuide(c.slug)?.prices?.[0];
                return (
                  <li key={c.id}>
                    <Link
                      href={`/categorii/${c.slug}`}
                      className="-mx-2 flex items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 text-sm text-foreground/85 transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <span>{c.name}</span>
                      {price && (
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums" title={price.item}>
                          {price.range}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
