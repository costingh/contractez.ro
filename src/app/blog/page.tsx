import { ArrowRight, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { cssVars } from "@/components/home/css-vars";
import { site } from "@/config/site";
import { posts } from "@/content/blog/posts";
import { env } from "@/server/env";

export const metadata: Metadata = {
  title: "Ghiduri și prețuri pentru servicii",
  description: "Cât costă o lucrare, cum alegi meseriașul potrivit și ce trebuie să știi înainte să angajezi un prestator. Ghiduri practice, cu prețuri orientative.",
  alternates: { canonical: "/blog" },
};

const dateFmt = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", year: "numeric" });

export default function BlogIndexPage() {
  const sorted = [...posts].sort((a, b) => (b.updated ?? b.date).localeCompare(a.updated ?? a.date));
  const base = env.APP_URL;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${base}/blog`,
    url: `${base}/blog`,
    name: `Blog ${site.name}: ghiduri și prețuri pentru servicii`,
    inLanguage: "ro-RO",
    publisher: { "@id": `${base}/#org` },
    blogPost: sorted.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.summary ?? p.description,
      url: `${base}/blog/${p.slug}`,
      datePublished: p.date,
      dateModified: p.updated ?? p.date,
    })),
  };
  return (
    <div className="pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="border-b">
        <div className="container-page py-14 sm:py-20">
          <div className="enter eyebrow" style={cssVars({ i: 0 })}>
            Blog
          </div>
          <h1 className="enter display-lg mt-4 max-w-3xl" style={cssVars({ i: 1 })}>
            Ghiduri și prețuri, <span className="serif-em text-gradient">fără surprize</span>.
          </h1>
          <p className="enter mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-muted-foreground" style={cssVars({ i: 2 })}>
            Cât costă o lucrare, cum alegi omul potrivit și ce verifici înainte să plătești.
          </p>
          <p className="enter mt-4 text-sm text-muted-foreground" style={cssVars({ i: 3 })}>
            Cauți doar cifrele? Toate prețurile orientative sunt pe o singură pagină:{" "}
            <Link href="/ghid-preturi" className="font-medium text-brand underline-offset-4 hover:underline">
              Ghid de prețuri 2026
            </Link>
            .
          </p>
        </div>
      </header>
      <div className="container-page mt-10 grid gap-5 md:grid-cols-2">
        {sorted.map((p, n) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="reveal group flex flex-col rounded-2xl border bg-card p-6 shadow-xs transition-colors hover:border-border-strong"
            style={cssVars({ i: n })}
          >
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <time dateTime={p.updated ?? p.date}>{dateFmt.format(new Date(p.updated ?? p.date))}</time>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" /> {p.readingMinutes} min
              </span>
            </div>
            <h2 className="mt-3 text-xl leading-snug font-semibold tracking-[-0.02em]">{p.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
              Citește <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
