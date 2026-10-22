import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectEditor } from "@/components/project-form/project-editor";
import type { ProjectFormValues } from "@/components/project-form/types";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { labels } from "@/config/site";
import { requireOnboardedUser } from "@/server/auth/guards";
import { getLocality } from "@/server/catalog/localities";
import { categoryOptions } from "@/server/catalog/options";
import { db } from "@/server/db";
import { projectSkills, projects, skills } from "@/server/db/schema";
import { REPORT_LOCK_MESSAGE } from "@/server/projects/service";
import { isUuid } from "@/lib/ids";

export const metadata: Metadata = { title: "Editează proiectul" };

const EDITABLE = ["draft", "pending_review", "open"];

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireOnboardedUser(`/proiecte/${id}/editeaza`);
  if (!isUuid(id)) notFound();
  const [p] = await db.select().from(projects).where(eq(projects.id, id));
  if (!p || p.clientId !== user.id) notFound();

  if (p.moderationLock) {
    return (
      <div className="container-page max-w-3xl pb-16">
        <PageHeader title="Proiectul este în verificare" description={REPORT_LOCK_MESSAGE} />
        <Button asChild variant="outline">
          <Link href={`/proiectele-mele/${p.id}`}>Înapoi la proiect</Link>
        </Button>
      </div>
    );
  }

  if (!EDITABLE.includes(p.status)) {
    return (
      <div className="container-page max-w-3xl pb-16">
        <PageHeader title="Proiectul nu mai poate fi editat" description={`Status: ${labels.projectStatus[p.status]}.`} />
        <Button asChild variant="outline">
          <Link href={`/proiectele-mele/${p.id}`}>Înapoi la proiect</Link>
        </Button>
      </div>
    );
  }

  const [categories, skillRows, loc] = await Promise.all([
    categoryOptions(),
    db.select({ name: skills.name }).from(projectSkills).innerJoin(skills, eq(skills.id, projectSkills.skillId)).where(eq(projectSkills.projectId, p.id)),
    p.localityId ? getLocality(p.localityId) : Promise.resolve(null),
  ]);

  const initial: ProjectFormValues = {
    title: p.title,
    description: p.description,
    categoryId: p.categoryId,
    skills: skillRows.map((s) => s.name),
    attributes: p.attributes ?? {},
    budgetType: p.budgetType,
    budgetMin: p.budgetMin ? String(p.budgetMin) : "",
    budgetMax: p.budgetMax ? String(p.budgetMax) : "",
    estimatedHours: p.estimatedHours ? String(p.estimatedHours) : "",
    workMode: p.workMode,
    locality: loc ? { id: loc.id, name: loc.name, county: loc.county, countyCode: loc.countyCode } : null,
    radiusKm: p.radiusKm,
    invoice: p.invoice,
    urgency: p.urgency,
    startDate: p.startDate ? p.startDate.toISOString().slice(0, 10) : "",
    durationText: p.durationText ?? "",
    allowAutoBids: p.allowAutoBids,
    source: p.source === "import" ? "import" : "web",
    sourceText: p.sourceText,
  };

  return (
    <div className="container-page max-w-3xl pb-16">
      <PageHeader
        title="Editează proiectul"
        description={
          p.status === "open"
            ? "Proiectul este publicat. Modificările se văd imediat, iar prestatorii nu sunt notificați din nou. Dacă schimbi titlul sau descrierea, le verificăm din nou automat."
            : `Status: ${labels.projectStatus[p.status]}.`
        }
        actions={
          <Button asChild variant="ghost">
            <Link href={`/proiectele-mele/${p.id}`}>Renunță</Link>
          </Button>
        }
      />
      <ProjectEditor
        categories={categories}
        initial={initial}
        projectId={p.id}
        status={p.status}
        quality={p.quality ? { ...p.quality } : null}
        emailVerified={Boolean(user.emailVerifiedAt)}
      />
    </div>
  );
}
