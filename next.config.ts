import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
