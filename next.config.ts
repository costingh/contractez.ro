import createMDX from "@next/mdx";
import type { NextConfig } from "next";

/**
 * Headere de securitate pentru toate rutele. Fără CSP strict: site-ul încarcă scripturi de la VisitTrack,
 * Crisp, Stripe și Google; păstrăm doar `frame-ancestors 'none'` (echivalentul modern al X-Frame-Options).
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // HSTS doar în producție (pe localhost ar forța https pentru toate porturile).
  ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Aplicația este aproape integral dinamică (sesiuni, credite, chat), așa că
  // folosim modelul clasic de randare în loc de Cache Components.
  cacheComponents: false,
  serverExternalPackages: ["bullmq", "ioredis", "postgres", "qrcode"],
  images: { unoptimized: true },
  // Variantele markdown ale articolelor citesc sursa .mdx de pe disc (src/content/blog/markdown.ts).
  outputFileTracingIncludes: {
    "/llms-full.txt": ["./src/content/blog/*.mdx"],
    "/blog/*/md": ["./src/content/blog/*.mdx"],
  },
  experimental: {
    // Fișierele au maximum 5 MB (rules.maxUploadBytes, verificat și în browser); restul e marjă pentru multipart.
    serverActions: { bodySizeLimit: "6mb" },
    authInterrupts: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// Articolele de blog (src/content/blog/*.mdx). Plugin-urile se dau ca nume (șiruri) pentru Turbopack.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: ["rehype-slug"],
  },
});

export default withMDX(nextConfig);
