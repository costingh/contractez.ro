import Script from "next/script";
import { getCurrentUser } from "@/server/auth/session";
import { getPlanUsage } from "@/server/billing/plans";
import { env } from "@/server/env";
import { VisitrackIdentify } from "./visitrack-identify";

/** Scriptul VisitTrack (doar dacă VISITRACK_SITE_ID e setat) și legarea contului logat. */
export async function Visitrack() {
  if (!env.VISITRACK_SITE_ID) return null;
  const user = await getCurrentUser();
  const usage = user?.isProvider ? await getPlanUsage(user.id) : null;
  const role = user ? (user.isProvider && user.isClient ? "ambele" : user.isProvider ? "prestator" : user.isClient ? "client" : "nou") : null;
  return (
    <>
      <Script defer data-site={env.VISITRACK_SITE_ID} src="https://visitrack.app/tracker.js" strategy="afterInteractive" />
      {user && role && (
        <VisitrackIdentify
          userId={user.id}
          knownVisitorId={user.vtVisitorId}
          traits={{ role, plan: usage?.plan.id ?? "client", signedUpAt: user.createdAt.toISOString() }}
        />
      )}
    </>
  );
}
