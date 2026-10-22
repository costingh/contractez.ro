import type { MetadataRoute } from "next";

// APP_URL vine din mediu la rulare, nu la build.
export const dynamic = "force-dynamic";

/** Zonele private (cont, panou, plăți) și paginile fără valoare în căutare. */
const disallow = [
  "/api/",
  "/admin",
  "/panou",
  "/onboarding",
  "/proiectele-mele",
  "/proiecte/nou",
  "/aplicarile-mele",
  "/recomandari",
  "/mesaje",
  "/notificari",
  "/abonament",
  "/portofel",
  "/auto-bid",
  "/promovare",
  "/profil",
  "/setari",
  "/colaborari",
  "/verifica-email",
  "/resetare-parola",
  "/schimba-email",
];

/**
 * Crawlerele AI și de căutare, permise explicit (unele nu se bazează doar pe regula `*`).
 * Au aceleași restricții ca restul.
 */
const aiCrawlers = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Bingbot",
  "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: aiCrawlers, allow: "/", disallow },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
