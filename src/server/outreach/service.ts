import { and, asc, desc, eq, inArray, ne, notInArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { outreachLeads, type OutreachLead } from "../db/schema";
import { env } from "../env";
import { DomainError } from "../errors";
import { enqueue } from "../queue";
import { isAnonymousAuthor, personKey, personKeyFromThread } from "./person-key";

export type LeadStatus = OutreachLead["status"];

/** Statusuri care înseamnă „persoana a primit deja un mesaj” (prin copilot). */
export const SENT_STATES = ["contacted", "replied", "signed_up"] as const satisfies LeadStatus[];
/** Statusuri pentru care persoana nu mai trebuie contactată. */
export const CONTACTED_STATES = [...SENT_STATES, "already_contacted"] as const satisfies LeadStatus[];

/* -------------------------------------------------------------------------- */
/*                                  Validare                                  */
/* -------------------------------------------------------------------------- */

const MAX_TEXT = 5_000;
const optStr = (max: number) =>
  z
    .string()
    .max(max)
    .nullish()
    .transform((v) => (v?.trim() ? v.trim() : null));

const itemSchema = z.object({
  fbItemId: z.string().trim().min(3).max(150),
  kind: z.enum(["post", "comment"]),
  parentPostId: optStr(100),
  authorName: optStr(200),
  authorProfileUrl: optStr(2_000),
  authorFbId: z
    .union([z.string().trim().max(30), z.number().int().nonnegative()])
    .nullish()
    .transform((v) => (v === null || v === undefined || v === "" ? null : String(v))),
  // Postările lungi sunt trunchiate (nu respingem tot lotul pentru una singură).
  text: z
    .string()
    .max(50_000)
    .nullish()
    .transform((v) => (v ?? "").trim().slice(0, MAX_TEXT)),
  permalink: optStr(2_000),
  postedAtText: optStr(100),
  commentCount: z.number().int().min(0).max(1_000_000).nullish().transform((v) => v ?? null),
});

export const ingestSchema = z.object({
  groupId: z.string().trim().min(1).max(64),
  groupName: optStr(300),
  items: z.array(itemSchema).min(1).max(50),
});

export const statusIdsSchema = z.array(z.string().trim().min(3).max(150)).min(1).max(100);

export const threadSchema = z.object({
  threadUrl: optStr(2_000),
  authorFbId: z
    .union([z.string().trim().max(30), z.number().int().nonnegative()])
    .nullish()
    .transform((v) => (v === null || v === undefined || v === "" ? null : String(v))),
  authorProfileUrl: optStr(2_000),
  hasHistory: z.boolean().default(false),
});

export type IngestInput = z.infer<typeof ingestSchema>;
export type ThreadInput = z.infer<typeof threadSchema>;

/* -------------------------------------------------------------------------- */
/*                                  Ingestie                                  */
/* -------------------------------------------------------------------------- */

type LeadSummary = { fbItemId: string; status: LeadStatus; type: OutreachLead["type"]; score: number | null };

async function contactedPersons(keys: string[]): Promise<Set<string>> {
  if (keys.length === 0) return new Set();
  const rows = await db
    .selectDistinct({ personKey: outreachLeads.personKey })
    .from(outreachLeads)
    .where(and(inArray(outreachLeads.personKey, keys), inArray(outreachLeads.status, [...CONTACTED_STATES])));
  return new Set(rows.map((r) => r.personKey!).filter(Boolean));
}

/** Salvează itemii noi; cei existenți (după `fbItemId`) nu sunt atinși niciodată. */
export async function ingestLeads(input: IngestInput) {
  const unique = new Map<string, IngestInput["items"][number]>();
  for (const it of input.items) if (!unique.has(it.fbItemId)) unique.set(it.fbItemId, it);
  const ids = [...unique.keys()];

  const existing = new Set(
    (await db.select({ fbItemId: outreachLeads.fbItemId }).from(outreachLeads).where(inArray(outreachLeads.fbItemId, ids))).map((r) => r.fbItemId),
  );
  const fresh = [...unique.values()].filter((it) => !existing.has(it.fbItemId));
  const keyed = fresh.map((it) => ({ it, key: personKey(it.authorProfileUrl, it.authorFbId) }));
  const contacted = await contactedPersons([...new Set(keyed.map((k) => k.key).filter((k): k is string => Boolean(k)))]);

  let inserted: { status: LeadStatus }[] = [];
  if (keyed.length > 0) {
    inserted = await db
      .insert(outreachLeads)
      .values(
        keyed.map(({ it, key }) => {
          const anonymous = isAnonymousAuthor(it.authorName) || !it.authorProfileUrl || !key;
          const status: LeadStatus = anonymous ? "skipped" : contacted.has(key) ? "already_contacted" : "new";
          return {
            fbItemId: it.fbItemId,
            kind: it.kind,
            parentPostId: it.parentPostId,
            groupId: input.groupId,
            groupName: input.groupName,
            authorName: it.authorName,
            authorProfileUrl: it.authorProfileUrl,
            authorFbId: it.authorFbId,
            personKey: anonymous ? null : key,
            text: it.text,
            permalink: it.permalink,
            postedAtText: it.postedAtText,
            commentCount: it.commentCount,
            status,
            reason: anonymous ? "Autor anonim sau fără profil." : status === "already_contacted" ? "Persoană deja contactată." : null,
          };
        }),
      )
      .onConflictDoNothing({ target: outreachLeads.fbItemId })
      .returning({ status: outreachLeads.status });
  }

  if (inserted.some((r) => r.status === "new")) await enqueueClassification();

  const rows = await db
    .select({ fbItemId: outreachLeads.fbItemId, status: outreachLeads.status, type: outreachLeads.type, score: outreachLeads.score })
    .from(outreachLeads)
    .where(inArray(outreachLeads.fbItemId, ids));
  const byId = new Map(rows.map((r) => [r.fbItemId, r]));
  const leads: LeadSummary[] = ids.map((id) => byId.get(id)).filter((r): r is LeadSummary => Boolean(r));
  return { accepted: inserted.length, duplicates: input.items.length - inserted.length, leads };
}

/** Un singur job de clasificare în coadă/rulare odată; sweep-ul periodic prinde ce rămâne. */
export async function enqueueClassification() {
  await enqueue("ai", { kind: "outreach-classify" }, { deduplication: { id: "outreach-classify" } });
}

/** Sweep periodic: lead-uri rămase `new` (ex: Redis indisponibil la ingestie sau job deduplicat cât rula). */
export async function sweepPendingLeads() {
  const pending = await pendingLeads(1);
  if (pending.length > 0) await enqueueClassification();
  return { pending: pending.length > 0 };
}

/* -------------------------------------------------------------------------- */
/*                                Status & thread                             */
/* -------------------------------------------------------------------------- */

export async function leadStatuses(ids: string[]) {
  const rows = await db
    .select({
      fbItemId: outreachLeads.fbItemId,
      status: outreachLeads.status,
      type: outreachLeads.type,
      score: outreachLeads.score,
      personKey: outreachLeads.personKey,
    })
    .from(outreachLeads)
    .where(inArray(outreachLeads.fbItemId, [...new Set(ids)]));
  const contacted = await contactedPersons([...new Set(rows.map((r) => r.personKey).filter((k): k is string => Boolean(k)))]);
  return {
    leads: rows.map((r) => ({
      fbItemId: r.fbItemId,
      status: r.status,
      type: r.type,
      score: r.score,
      personContacted: r.personKey ? contacted.has(r.personKey) : false,
    })),
  };
}

/**
 * Utilizatorul a deschis o conversație Messenger. Dacă există deja mesaje (`hasHistory`) și persoana nu a fost
 * contactată prin copilot, toate lead-urile ei devin `already_contacted`.
 */
export async function threadOpened(input: ThreadInput) {
  const key = personKey(input.authorProfileUrl, input.authorFbId) ?? personKeyFromThread(input.threadUrl);
  if (!key) return { known: false, personKey: null, status: null, leadId: null };
  const leads = await db
    .select({ id: outreachLeads.id, status: outreachLeads.status })
    .from(outreachLeads)
    .where(eq(outreachLeads.personKey, key))
    .orderBy(sql`${outreachLeads.contactedAt} DESC NULLS LAST`, sql`${outreachLeads.score} DESC NULLS LAST`, desc(outreachLeads.createdAt));
  if (leads.length === 0) return { known: false, personKey: key, status: null, leadId: null };

  const sent = leads.find((l) => (SENT_STATES as readonly string[]).includes(l.status));
  if (sent) return { known: true, personKey: key, status: sent.status, leadId: sent.id };
  if (input.hasHistory) {
    await db
      .update(outreachLeads)
      .set({ status: "already_contacted" })
      .where(and(eq(outreachLeads.personKey, key), ne(outreachLeads.status, "already_contacted")));
    return { known: true, personKey: key, status: "already_contacted" as LeadStatus, leadId: leads[0].id };
  }
  return { known: true, personKey: key, status: leads[0].status, leadId: leads[0].id };
}

/* -------------------------------------------------------------------------- */
/*                            Acțiuni admin (manuale)                          */
/* -------------------------------------------------------------------------- */

/** Mesaje marcate „trimis” azi (ora României). */
export async function sentToday(): Promise<number> {
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(outreachLeads)
    .where(
      sql`${outreachLeads.contactedAt} >= (date_trunc('day', now() AT TIME ZONE 'Europe/Bucharest') AT TIME ZONE 'Europe/Bucharest')`,
    );
  return r?.n ?? 0;
}

export function dailyCap() {
  return env.OUTREACH_DAILY_CAP;
}

/** Celelalte lead-uri ale persoanei (încă necontactate) devin `already_contacted`. */
async function markPersonContacted(tx: Pick<typeof db, "update">, key: string | null, exceptId: string) {
  if (!key) return 0;
  const rows = await tx
    .update(outreachLeads)
    .set({ status: "already_contacted" })
    .where(and(eq(outreachLeads.personKey, key), ne(outreachLeads.id, exceptId), notInArray(outreachLeads.status, [...CONTACTED_STATES])))
    .returning({ id: outreachLeads.id });
  return rows.length;
}

/** „Am trimis”: omul a trimis mesajul din Messenger. Nu trimite nimic automat. */
export async function markLeadSent(leadId: string, opts: { message?: string | null; override?: boolean } = {}) {
  const sent = await sentToday();
  const cap = dailyCap();
  if (sent >= cap && !opts.override) {
    throw new DomainError("cap", `Ai atins limita zilnică (${sent}/${cap}). Bifează „Peste limită” dacă vrei totuși să marchezi.`);
  }
  return db.transaction(async (tx) => {
    const [lead] = await tx.select().from(outreachLeads).where(eq(outreachLeads.id, leadId)).for("update");
    if (!lead) throw new DomainError("not_found", "Lead inexistent.");
    if ((CONTACTED_STATES as readonly string[]).includes(lead.status)) {
      throw new DomainError("already", "Persoana a fost deja contactată.");
    }
    if (lead.personKey) {
      const [other] = await tx
        .select({ id: outreachLeads.id })
        .from(outreachLeads)
        .where(and(eq(outreachLeads.personKey, lead.personKey), ne(outreachLeads.id, leadId), inArray(outreachLeads.status, [...SENT_STATES])))
        .limit(1);
      if (other) throw new DomainError("already", "Persoana a fost deja contactată printr-un alt lead.");
    }
    const message = opts.message?.trim() ? opts.message.trim().slice(0, 3_000) : lead.message;
    await tx.update(outreachLeads).set({ status: "contacted", contactedAt: new Date(), message }).where(eq(outreachLeads.id, leadId));
    const others = await markPersonContacted(tx, lead.personKey, leadId);
    return { others };
  });
}

/** „Sari peste” / „A răspuns” / „S-a înscris”. */
export async function setLeadStatus(leadId: string, status: "skipped" | "replied" | "signed_up") {
  return db.transaction(async (tx) => {
    const [lead] = await tx.select().from(outreachLeads).where(eq(outreachLeads.id, leadId)).for("update");
    if (!lead) throw new DomainError("not_found", "Lead inexistent.");
    if (status === "skipped" && (SENT_STATES as readonly string[]).includes(lead.status)) {
      throw new DomainError("sent", "Mesajul a fost deja trimis; nu mai poate fi sărit.");
    }
    await tx.update(outreachLeads).set({ status }).where(eq(outreachLeads.id, leadId));
    if (status !== "skipped") await markPersonContacted(tx, lead.personKey, leadId);
  });
}

/** Lead-urile care așteaptă clasificarea, cele mai vechi primele. */
export async function pendingLeads(limit: number) {
  return db.select().from(outreachLeads).where(eq(outreachLeads.status, "new")).orderBy(asc(outreachLeads.createdAt)).limit(limit);
}

/**
 * Coada „mod rapid”: următorul lead de contactat — scorat, cu persoană identificabilă (link Messenger),
 * fără ca persoana să fi fost contactată vreodată. Clienții (au nevoie acum de cineva) înaintea prestatorilor la scor egal.
 */
export async function nextQueueLead(opts: { type?: "client" | "provider" | null; minScore?: number; excludeIds?: string[] }) {
  const where = [
    eq(outreachLeads.status, "scored"),
    inArray(outreachLeads.type, opts.type ? [opts.type] : ["client", "provider"]),
    sql`${outreachLeads.personKey} IS NOT NULL`,
    sql`coalesce(${outreachLeads.score}, 0) >= ${opts.minScore ?? 0}`,
    sql`NOT EXISTS (
      SELECT 1 FROM outreach_leads o2
      WHERE o2.person_key = ${outreachLeads.personKey} AND o2.id <> ${outreachLeads.id}
        AND o2.status IN ('contacted', 'replied', 'signed_up', 'already_contacted'))`,
  ];
  if (opts.excludeIds?.length) where.push(notInArray(outreachLeads.id, opts.excludeIds));
  const [lead] = await db
    .select()
    .from(outreachLeads)
    .where(and(...where))
    .orderBy(sql`${outreachLeads.score} DESC NULLS LAST`, sql`(${outreachLeads.type} = 'client') DESC`, desc(outreachLeads.createdAt))
    .limit(1);
  const [{ n: remaining }] = await db
    .select({ n: sql<number>`count(DISTINCT ${outreachLeads.personKey})::int` })
    .from(outreachLeads)
    .where(and(...where));
  return { lead: lead ?? null, remaining };
}
