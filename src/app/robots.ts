import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
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
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
