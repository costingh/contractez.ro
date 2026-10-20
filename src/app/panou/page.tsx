import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { DashboardBanners } from "@/components/dashboard/banners";
import { ClientDashboard } from "@/components/dashboard/client-dashboard";
import { ProviderDashboard } from "@/components/dashboard/provider-dashboard";
import { WelcomeBand } from "@/components/dashboard/welcome-band";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireOnboardedUser } from "@/server/auth/guards";
import { getPlanUsage } from "@/server/billing/plans";
import { smsConfigured } from "@/server/auth/sms";
import { getLocality } from "@/server/catalog/localities";
import { db } from "@/server/db";
import { providerProfiles } from "@/server/db/schema";
import { env } from "@/server/env";

export const metadata: Metadata = { title: "Panou" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const user = await requireOnboardedUser("/panou");
  const [loc, profile, usage] = await Promise.all([
    user.localityId ? getLocality(user.localityId) : null,
    user.isProvider ? db.select({ id: providerProfiles.userId }).from(providerProfiles).where(eq(providerProfiles.userId, user.id)) : [],
    user.isProvider ? getPlanUsage(user.id) : null,
  ]);
  const countyCode = loc?.countyCode ?? null;
  const both = user.isProvider && user.isClient;
  const first = user.name.split(" ")[0];

  return (
    <div className="container-page space-y-6 pb-16">
      <WelcomeBand firstName={first} isProvider={user.isProvider} isClient={user.isClient} usage={usage} />
      <DashboardBanners
        email={user.email}
        emailVerified={Boolean(user.emailVerifiedAt)}
        phoneVerified={Boolean(user.phoneVerifiedAt)}
        isProvider={user.isProvider}
        hasProviderProfile={profile.length > 0}
        showPhone={smsConfigured || env.NODE_ENV !== "production"}
      />
      {both ? (
        <Tabs defaultValue={tab === "client" ? "client" : "prestator"}>
          <TabsList className="mt-2">
            <TabsTrigger value="prestator">Ca prestator</TabsTrigger>
            <TabsTrigger value="client">Ca client</TabsTrigger>
          </TabsList>
          <TabsContent value="prestator" className="pt-4">
            <ProviderDashboard userId={user.id} countyCode={countyCode} />
          </TabsContent>
          <TabsContent value="client" className="pt-4">
            <ClientDashboard userId={user.id} countyCode={countyCode} />
          </TabsContent>
        </Tabs>
      ) : user.isProvider ? (
        <ProviderDashboard userId={user.id} countyCode={countyCode} />
      ) : (
        <ClientDashboard userId={user.id} countyCode={countyCode} />
      )}
    </div>
  );
}
