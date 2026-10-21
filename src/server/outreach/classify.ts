import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { truncate } from "@/lib/text";
import { aiStructured, withFallback } from "../ai/client";
import { SYSTEM_BASE } from "../ai/features";
import { getCatalog } from "../catalog/taxonomy";
import { db } from "../db";
import { outreachLeads, type OutreachLead } from "../db/schema";
import { ruleCategories, ruleClassify, type LeadType, type RuleCategory } from "./rules";
import { pendingLeads } from "./service";
import { MESSAGE_GUIDELINES, OUTREACH_TEMPLATES, outreachLink, templateMessage, type OutreachAudience } from "./templates";

const BATCH = 20;
const LINK_PLACEHOLDER = "{LINK}";

const aiSchema = z.object({
  items: z.array(
    z.object({
      fbItemId: z.string(),
      type: z.enum(["client", "provider", "irrelevant"]),
      categorySlug: z.string().nullable().describe("Slug-ul subcategoriei din listă sau null"),
      locality: z.string().nullable().describe("Orașul/localitatea dacă apare explicit, altfel null"),
      score: z.number().describe("0-100"),
      reason: z.string().describe("Motiv scurt, în română, max 120 caractere"),
      message: z.string().nullable().describe("Mesajul personalizat sau null pentru irrelevant"),
    }),
  ),
});

type Classified = {
  type: LeadType;
  categorySlug: string | null;
  locality: string | null;
  score: number;
  reason: string;
  message: string | null;
};

/** Linkul UTM e obligatoriu și trebuie să fie exact al grupului. */
export function finalizeMessage(raw: string | null, audience: OutreachAudience, groupId: string): string {
  const link = outreachLink(audience, groupId);
  let msg = (raw ?? "").trim();
  if (!msg) return templateMessage(audience, groupId);
  msg = msg.replaceAll(LINK_PLACEHOLDER, link);
  if (!msg.includes(link)) {
    const replaced = msg.replace(/https?:\/\/(www\.)?contractez\.ro[^\s)]*/i, link);
    msg = replaced.includes(link) ? replaced : `${msg} ${link}`;
  }
  return msg.slice(0, 1_000);
}

async function catalogContext() {
  const catalog = await getCatalog();
  const subs = catalog.tree.flatMap((t) => t.children);
  const cats: RuleCategory[] = ruleCategories(
    subs.map((c) => ({ slug: c.slug, name: c.name, skills: catalog.skills.filter((s) => s.categoryId === c.id).map((s) => s.name) })),
  );
  const list = catalog.tree.map((t) => `${t.name}: ${t.children.map((c) => `${c.slug} (${c.name})`).join(", ")}`).join("\n");
  return { catalog, cats, list };
}

function firstName(name: string | null) {
  const n = name?.trim().split(/\s+/)[0];
  return n && n.length > 1 ? n : null;
}

async function aiClassify(leads: OutreachLead[], parents: Map<string, string>, list: string): Promise<Map<string, Classified>> {
  const payload = leads.map((l) => ({
    fbItemId: l.fbItemId,
    kind: l.kind,
    group: l.groupName ?? l.groupId,
    authorFirstName: firstName(l.authorName),
    postedAt: l.postedAtText,
    comments: l.commentCount,
    text: truncate(l.text, 1_500),
    parentPost: l.parentPostId ? truncate(parents.get(l.parentPostId) ?? "", 600) || null : null,
  }));
  const res = await aiStructured({
    feature: "outreach-classify",
    schema: aiSchema,
    maxOutputTokens: 9_000,
    system:
      `${SYSTEM_BASE}\n` +
      "Analizezi postări și comentarii din grupuri românești de Facebook pentru Contractez, o platformă nouă de servicii. " +
      "Pentru fiecare item decizi:\n" +
      "- type: „client” dacă autorul caută un prestator/serviciu; „provider” dacă autorul oferă servicii (inclusiv comentarii de tip „te pot ajuta”, „PM”, „interesat” la cererea altcuiva); „irrelevant” altfel (spam, glume, discuții, joburi full-time de angajat, autopromovare fără legătură cu servicii).\n" +
      "- categorySlug: subcategoria potrivită din listă (sau null).\n" +
      "- score 0-100: cât de bun e lead-ul — prospețime (postedAt), claritatea nevoii/ofertei, buget menționat, potrivirea cu categoriile platformei. Clienții cu nevoie clară și recentă primesc cel mai mult.\n" +
      "- reason: o frază scurtă în română.\n" +
      `- message (null pentru irrelevant): un mesaj privat în română. Folosește exact textul ${LINK_PLACEHOLDER} în locul linkului (îl înlocuim noi cu linkul corect).\n` +
      `Reguli pentru mesaj:\n- ${MESSAGE_GUIDELINES}\n` +
      `Dacă știi prenumele, îl poți folosi în salut (nu e obligatoriu).\n\n` +
      `Șablon pentru prestatori:\n${OUTREACH_TEMPLATES.provider.replace("https://contractez.ro", LINK_PLACEHOLDER)}\n\n` +
      `Șablon pentru clienți:\n${OUTREACH_TEMPLATES.client.replace("https://contractez.ro", LINK_PLACEHOLDER)}\n\n` +
      `Subcategorii disponibile:\n${list}`,
    user: `Itemi (JSON):\n${JSON.stringify(payload)}`,
  });
  return new Map(res.items.map((i) => [i.fbItemId, i]));
}

/** Clasifică un lot de lead-uri `new` (AI, cu fallback pe reguli) și le marchează `scored` / `irrelevant`. */
export async function classifyLeads(leads: OutreachLead[]) {
  if (leads.length === 0) return 0;
  const { catalog, cats, list } = await catalogContext();

  const parentIds = [...new Set(leads.map((l) => l.parentPostId).filter((p): p is string => Boolean(p)))];
  const parentRows = parentIds.length
    ? await db
        .select({ fbItemId: outreachLeads.fbItemId, text: outreachLeads.text })
        .from(outreachLeads)
        .where(inArray(outreachLeads.fbItemId, parentIds.map((p) => `post:${p}`)))
    : [];
  const parents = new Map(parentRows.map((r) => [r.fbItemId.slice("post:".length), r.text]));

  const ai = await withFallback<Map<string, Classified>>(
    () => aiClassify(leads, parents, list),
    () => new Map(),
  );

  let n = 0;
  for (const lead of leads) {
    const rules = ruleClassify({ text: lead.text, kind: lead.kind, parentText: lead.parentPostId ? parents.get(lead.parentPostId) : null }, cats);
    const r: Classified = ai.get(lead.fbItemId) ?? { ...rules, message: null };
    const category = r.categorySlug ? catalog.bySlug.get(r.categorySlug) : undefined;
    const relevant = r.type !== "irrelevant";
    const updated = await db
      .update(outreachLeads)
      .set({
        status: relevant ? "scored" : "irrelevant",
        type: r.type,
        categoryId: category?.id ?? null,
        locality: r.locality?.trim().slice(0, 120) || null,
        score: Math.max(0, Math.min(100, Math.round(r.score))),
        reason: truncate(r.reason.trim(), 300) || null,
        message: relevant ? finalizeMessage(r.message, r.type as OutreachAudience, lead.groupId) : null,
      })
      // Nu suprascriem o decizie luată între timp (ex: thread → already_contacted).
      .where(and(eq(outreachLeads.id, lead.id), eq(outreachLeads.status, "new")))
      .returning({ id: outreachLeads.id });
    n += updated.length;
  }
  return n;
}

/** Procesează tot ce așteaptă, în loturi de ~20 (job BullMQ + sweep periodic). */
export async function classifyPendingLeads(maxBatches = 10) {
  let processed = 0;
  for (let i = 0; i < maxBatches; i++) {
    const batch = await pendingLeads(BATCH);
    if (batch.length === 0) break;
    processed += await classifyLeads(batch);
    if (batch.length < BATCH) break;
  }
  return { processed };
}
