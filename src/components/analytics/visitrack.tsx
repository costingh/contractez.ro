import { cookies } from "next/headers";
import Script from "next/script";
import { CONSENT_COOKIE, parseConsent } from "@/components/consent/consent";
import { CookieBanner } from "@/components/consent/cookie-banner";
import { getCurrentUser } from "@/server/auth/session";
import { getPlanUsage } from "@/server/billing/plans";
import { env } from "@/server/env";
import { VisitrackIdentify } from "./visitrack-identify";
import { VisitrackRelay } from "./visitrack-relay";

/**
 * Analiză VisitTrack (doar dacă VISITRACK_SITE_ID e setat) + bara de cookie-uri.
 * Fără acord: modul fără cookie-uri (nimic salvat în browser). Cu acord: id anonim persistent și legarea contului.
 */
export async function Visitrack() {
  const consent = parseConsent((await cookies()).get(CONSENT_COOKIE)?.value);
  if (!env.VISITRACK_SITE_ID) return <CookieBanner initial={consent} />;
  const full = consent === "all";
  const user = full ? await getCurrentUser() : null;
  const usage = user?.isProvider ? await getPlanUsage(user.id) : null;
  const role = user ? (user.isProvider && user.isClient ? "ambele" : user.isProvider ? "prestator" : user.isClient ? "client" : "nou") : null;
  return (
    <>
      <Script
        key={full ? "full" : "cookieless"}
        defer
        data-site={env.VISITRACK_SITE_ID}
        data-cookieless={full ? undefined : ""}
        src="https://visitrack.app/tracker.js"
        strategy="afterInteractive"
      />
      <VisitrackRelay />
      {user && role && (
        <VisitrackIdentify
          userId={user.id}
          knownVisitorId={user.vtVisitorId}
          traits={{ role, plan: usage?.plan.id ?? "client", signedUpAt: user.createdAt.toISOString() }}
        />
      )}
      <CookieBanner initial={consent} />
    </>
  );
}
