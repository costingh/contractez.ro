import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/guards";
import { AdminNav } from "./_components/admin-nav";

export const metadata: Metadata = { title: "Administrare", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="container-page grid grid-cols-1 gap-6 pt-6 pb-16 lg:grid-cols-[208px_minmax(0,1fr)] lg:gap-10 lg:pt-10">
      <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
        <div className="eyebrow mb-3 hidden lg:block">Administrare</div>
        <AdminNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
