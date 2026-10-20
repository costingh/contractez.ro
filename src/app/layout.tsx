import type { Metadata, Viewport } from "next";
import { Geist_Mono, Instrument_Sans, Instrument_Serif } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { site } from "@/config/site";
import "./globals.css";

const instrumentSans = Instrument_Sans({ variable: "--font-sans", subsets: ["latin", "latin-ext"], axes: ["wdth"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "latin-ext"] });
/** Serif italic pentru cuvintele evidențiate din titluri (hero, secțiuni de marketing). */
const instrumentSerif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin", "latin-ext"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: `${site.name} — servicii la un click distanță`, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: { type: "website", locale: "ro_RO", siteName: site.name },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
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
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
