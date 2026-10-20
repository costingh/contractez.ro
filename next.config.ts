import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Aplicația este aproape integral dinamică (sesiuni, credite, chat), așa că
  // folosim modelul clasic de randare în loc de Cache Components.
  cacheComponents: false,
  serverExternalPackages: ["bullmq", "ioredis", "postgres", "qrcode"],
  images: { unoptimized: true },
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

export default nextConfig;
