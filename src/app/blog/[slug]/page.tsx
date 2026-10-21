import { ArrowRight, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cssVars } from "@/components/home/css-vars";
import { site } from "@/config/site";
import { posts, postsBySlug } from "@/content/blog/posts";
import { getCatalog } from "@/server/catalog/taxonomy";
import { env } from "@/server/env";

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

const dateFmt = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", year: "numeric" });

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = postsBySlug.get(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${slug}`, types: { "text/markdown": `/blog/${slug}/md` } },
    openGraph: { type: "article", title: post.title, description: post.description, publishedTime: post.date, modifiedTime: post.updated ?? post.date },
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = postsBySlug.get(slug);
  if (!post) notFound();
  const [{ default: Body }, catalog] = await Promise.all([import(`@/content/blog/${slug}.mdx`), getCatalog()]);
  const related = post.categories.map((s) => catalog.bySlug.get(s)).filter((c) => c !== undefined);
  const more = posts.filter((p) => p.slug !== slug).slice(0, 3);

  const url = `${env.APP_URL}/blog/${slug}`;
  const modified = post.updated ?? post.date;
  const org = { "@type": "Organization", "@id": `${env.APP_URL}/#org`, name: site.name, url: env.APP_URL };
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: post.title,
        description: post.summary ?? post.description,
        datePublished: post.date,
        dateModified: modified,
        mainEntityOfPage: url,
        url,
        inLanguage: "ro-RO",
        image: `${env.APP_URL}/opengraph-image.png`,
        author: org,
        publisher: { ...org, logo: { "@type": "ImageObject", url: `${env.APP_URL}/icon-512.png` } },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Acasă", item: `${env.APP_URL}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${env.APP_URL}/blog` },
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ],
      },
    ],
  };

  return (
    <div className="pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="border-b">
        <div className="container-page max-w-6xl py-12 sm:py-16">
          <nav className="enter text-sm text-muted-foreground" style={cssVars({ i: 0 })}>
            <Link href="/" className="hover:text-foreground">
              Acasă
            </Link>
            <span className="mx-2 text-border-strong">/</span>
            <Link href="/blog" className="hover:text-foreground">
              Blog
            </Link>
          </nav>
          <h1 className="enter display-lg mt-5" style={cssVars({ i: 1 })}>
            {post.title}
          </h1>
          <p className="enter mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-muted-foreground" style={cssVars({ i: 2 })}>
            {post.description}
          </p>
          <div className="enter mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground" style={cssVars({ i: 3 })}>
            <span>
              Actualizat: <time dateTime={modified}>{dateFmt.format(new Date(modified))}</time>
            </span>
            {post.updated && post.updated !== post.date && (
              <span>
                Publicat: <time dateTime={post.date}>{dateFmt.format(new Date(post.date))}</time>
              </span>
            )}
            <span>
              Autor:{" "}
              <Link href="/despre" className="underline-offset-4 hover:text-foreground hover:underline">
                {site.name}
              </Link>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" /> {post.readingMinutes} min de citit
            </span>
          </div>
        </div>
      </header>

      <div className="container-page mt-4 grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="min-w-0 max-w-[44rem] text-[1.0625rem]">
          {post.summary && (
            <section aria-labelledby="pe-scurt" className="mt-8 rounded-2xl border border-brand/25 bg-brand-soft p-5 sm:p-6">
              <h2 id="pe-scurt" className="eyebrow text-brand">
                Pe scurt
              </h2>
              <p className="mt-2.5 text-[1rem] leading-[1.75] text-foreground">{post.summary}</p>
            </section>
          )}
          <Body />
          <div aria-hidden data-vt-scroll="blog_read_end" />
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:mt-10 lg:self-start">
          {related.length > 0 && (
            <nav aria-label="Servicii legate" className="rounded-2xl border bg-card p-2 shadow-xs">
              <div className="eyebrow px-3 pt-2 pb-2">Servicii din articol</div>
              {related.map((c) => (
                <Link key={c.id} href={`/categorii/${c.slug}`} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted">
                  {c.name} <ArrowRight className="size-3.5 text-muted-foreground" />
                </Link>
              ))}
            </nav>
          )}
          <div className="rounded-2xl border bg-card p-5 shadow-xs">
            <p className="font-semibold">Ai un proiect?</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">Publici gratuit și primești până la 5 oferte de la prestatori verificați.</p>
            <Link href="/proiecte/nou" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand underline-offset-4 hover:underline">
              Publică un proiect <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </aside>
      </div>

      {more.length > 0 && (
        <section className="container-page mt-20 max-w-6xl">
          <h2 className="eyebrow mb-4">Citește și</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {more.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="rounded-2xl border bg-card p-5 shadow-xs transition-colors hover:border-border-strong">
                <p className="font-semibold leading-snug tracking-[-0.01em]">{p.title}</p>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
