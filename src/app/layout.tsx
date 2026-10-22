import type { Metadata, Viewport } from "next";
import { Geist_Mono, Instrument_Sans, Instrument_Serif } from "next/font/google";
import { Visitrack } from "@/components/analytics/visitrack";
import { SiteFooter } from "@/components/layout/site-footer";
import { SupportChat } from "@/components/support/support-chat";
import { SiteHeader } from "@/components/layout/site-header";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { site } from "@/config/site";
import "./globals.css";

// Fără axa `wdth` (nu folosim font-stretch): fișierul latin scade de la ~57 KB la ~30 KB.
const instrumentSans = Instrument_Sans({ variable: "--font-sans", subsets: ["latin", "latin-ext"] });
// Monospace apare doar în câteva etichete mici: nu îl preîncărcăm, ca să nu concureze cu resursele critice.
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "latin-ext"], preload: false });
/** Serif italic pentru cuvintele evidențiate din titluri (hero, secțiuni de marketing); varianta dreaptă nu e folosită. */
const instrumentSerif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin", "latin-ext"], weight: "400", style: "italic" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: `${site.name} — servicii la un click distanță`, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: { type: "website", locale: "ro_RO", siteName: site.name },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  // Pe iPhone, pagina ocupă tot ecranul; barele lipite jos folosesc env(safe-area-inset-bottom) ca să stea deasupra barei Home.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f18" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${instrumentSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-background">
        <ThemeProvider>
          <TooltipProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <Toaster position="top-center" />
            <Visitrack />
            <SupportChat />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
