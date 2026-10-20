import { sql } from "drizzle-orm";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Progress } from "@/components/ui/progress";
import { formatLei } from "@/lib/format";
import { db } from "@/server/db";
import { adminMetrics } from "@/server/insights";
import { Stat } from "./_components/stat";

type DayRow = { day: string; signups: number; projects: number; applications: number };

async function dailySeries(): Promise<DayRow[]> {
  const rows = (await db.execute(sql`
    SELECT to_char(d, 'YYYY-MM-DD') AS day,
      (SELECT count(*)::int FROM users u WHERE u.created_at >= d AND u.created_at < d + interval '1 day') AS signups,
      (SELECT count(*)::int FROM projects p WHERE p.published_at >= d AND p.published_at < d + interval '1 day') AS projects,
      (SELECT count(*)::int FROM applications a WHERE a.created_at >= d AND a.created_at < d + interval '1 day') AS applications
    FROM generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day') AS d
    ORDER BY d
  `)) as unknown as DayRow[];
  return rows;
}

function pct(a: number, b: number) {
  if (!b) return "—";
  return `${Math.round((a / b) * 100)}%`;
}

const SERIES = [
  { key: "signups", label: "Conturi noi", color: "bg-chart-1" },
  { key: "projects", label: "Proiecte publicate", color: "bg-chart-2" },
  { key: "applications", label: "Aplicări", color: "bg-chart-4" },
] as const;

export default async function AdminDashboard() {
  const [m, days] = await Promise.all([adminMetrics(), dailySeries()]);
  const max = Math.max(1, ...days.flatMap((d) => [d.signups, d.projects, d.applications]));

  const funnel = [
    { label: "Conturi create", value: m.users },
    { label: "Email confirmat", value: m.verified_users },
    { label: "Proiecte publicate", value: m.published_projects },
    { label: "Aplicări trimise", value: m.applications },
    { label: "Aplicări citite de client", value: m.applications_viewed },
    { label: "Conversații cu răspuns de la client", value: m.conversations_with_reply },
    { label: "Colaborări confirmate", value: m.collaborations },
    { label: "Utilizatori care au plătit", value: m.paying_users },
  ];
  const funnelMax = Math.max(1, ...funnel.map((f) => f.value));

  const targets = [
    { label: "Prestatori verificați", value: m.providers, target: 100 },
    { label: "Proiecte reale publicate", value: m.published_projects, target: 30 },
    { label: "Colaborări confirmate", value: m.collaborations, target: 10 },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Privire de ansamblu" description="Validarea marketplace-ului: lichiditate, conversie și primele venituri." className="pt-0" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Stat label="Proiecte deschise" value={m.open_projects} />
        <Stat
          label="În așteptare (moderare)"
          value={<Link href="/admin/proiecte" className="underline-offset-4 hover:underline">{m.pending_review}</Link>}
          className={m.pending_review > 0 ? "border-warning/40 bg-warning/5" : undefined}
        />
        <Stat
          label="Raportări deschise"
          value={<Link href="/admin/rapoarte" className="underline-offset-4 hover:underline">{m.open_reports}</Link>}
          className={m.open_reports > 0 ? "border-destructive/30 bg-destructive/5" : undefined}
        />
        <Stat label="Apeluri AI (24h)" value={m.ai_calls_24h} />
        <Stat label="Prestatori" value={m.providers} />
        <Stat label="Clienți" value={m.clients} />
        <Stat label="Abonați plătitori" value={m.paying_users} hint={`${m.comp_plans} planuri oferite de echipă`} />
        <Stat label="Venit lunar recurent" value={formatLei(m.mrr_lei)} hint="din abonamentele active" />
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
        <h2 className="text-base font-semibold tracking-[-0.01em]">Ținte pentru primele 30 de zile</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Din planul de lansare: nu cumpărăm trafic până nu demonstrăm că fluxul funcționează.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {targets.map((t) => (
            <div key={t.label} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span>{t.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {t.value} / {t.target}
                </span>
              </div>
              <Progress value={Math.min(100, (t.value / t.target) * 100)} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
        <h2 className="text-base font-semibold tracking-[-0.01em]">Semnalul de business</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Întrebarea-cheie: după ce ating limita planului Gratuit, prestatorii plătesc un abonament?
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
          <Stat label="Au atins limita Gratuit luna aceasta" value={m.hit_free_limit} />
          <Stat label="Abonați plătitori" value={m.paying_users} />
          <Stat label="Rată de conversie" value={pct(m.paying_users, m.hit_free_limit)} hint="abonați / prestatori care au atins limita" />
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
        <h2 className="text-base font-semibold tracking-[-0.01em]">Funnel</h2>
        <div className="mt-5 space-y-3">
          {funnel.map((f, i) => (
            <div key={f.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[240px_minmax(0,1fr)_auto]">
              <div className="text-sm">{f.label}</div>
              <div className="order-last col-span-2 h-2 overflow-hidden rounded-full bg-muted dark:bg-secondary sm:order-none sm:col-span-1">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-brand" style={{ width: `${(f.value / funnelMax) * 100}%` }} />
              </div>
              <div className="text-right text-sm tabular-nums">
                {f.value}
                {i > 0 && <span className="ml-2 text-xs text-muted-foreground">{pct(f.value, funnel[i - 1].value)}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold tracking-[-0.01em]">Ultimele 14 zile</h2>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {SERIES.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5">
                <span className={`size-2.5 rounded-sm ${s.color}`} /> {s.label}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-5 flex h-40 items-end gap-1 overflow-x-auto border-b sm:gap-2">
          {days.map((d) => (
            <div key={d.day} className="flex min-w-6 flex-1 flex-col items-center gap-1">
              <div className="flex h-32 w-full items-end justify-center gap-px">
                {SERIES.map((s) => (
                  <div
                    key={s.key}
                    className={`w-1/3 rounded-t-sm ${s.color}`}
                    style={{ height: `${(d[s.key] / max) * 100}%`, minHeight: d[s.key] ? 2 : 0 }}
                    title={`${s.label}: ${d[s.key]}`}
                  />
                ))}
              </div>
              <div className="text-[10px] text-muted-foreground tabular-nums">{d.day.slice(8)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
