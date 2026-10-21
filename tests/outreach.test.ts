import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as ingestPOST } from "@/app/api/outreach/ingest/route";
import { GET as statusGET } from "@/app/api/outreach/status/route";
import { POST as threadPOST } from "@/app/api/outreach/thread/route";
import { db } from "@/server/db";
import { outreachLeads } from "@/server/db/schema";
import { env } from "@/server/env";
import { classifyPendingLeads } from "@/server/outreach/classify";
import { markLeadSent, sentToday, setLeadStatus } from "@/server/outreach/service";
import { outreachLink } from "@/server/outreach/templates";
import { NextRequest } from "next/server";

const TOKEN = "test-outreach-token-0123456789abcdef";
const initial = { token: env.OUTREACH_TOKEN, cap: env.OUTREACH_DAILY_CAP };
beforeEach(() => {
  env.OUTREACH_TOKEN = TOKEN;
  env.OUTREACH_DAILY_CAP = 1_000;
});
afterEach(() => {
  env.OUTREACH_TOKEN = initial.token;
  env.OUTREACH_DAILY_CAP = initial.cap;
});

const uid = () => String(100_000_000 + Math.floor(Math.random() * 899_999_999));

function item(overrides: Record<string, unknown> = {}) {
  const fbId = uid();
  return {
    fbItemId: `post:${randomUUID()}`,
    kind: "post",
    parentPostId: null,
    authorName: "Ion Popescu",
    authorProfileUrl: `https://www.facebook.com/groups/252706105062924/user/${fbId}/`,
    authorFbId: fbId,
    text: "Caut un social media manager pentru centrul nostru educațional din Iași, buget 1500 lei/lună.",
    permalink: "https://www.facebook.com/groups/252706105062924/posts/1/",
    postedAtText: "18 hours ago",
    commentCount: 7,
    ...overrides,
  };
}

function req(url: string, body?: unknown, token: string | null = TOKEN) {
  return new NextRequest(`http://localhost${url}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function ingest(items: unknown[], token: string | null = TOKEN) {
  const res = await ingestPOST(req("/api/outreach/ingest", { groupId: "252706105062924", groupName: "Freelancer Romania", items }, token));
  return { status: res.status, body: await res.json() };
}

async function leadOf(fbItemId: string) {
  const [l] = await db.select().from(outreachLeads).where(eq(outreachLeads.fbItemId, fbItemId));
  return l;
}

describe("autentificare /api/outreach", () => {
  it("503 fără OUTREACH_TOKEN configurat", async () => {
    env.OUTREACH_TOKEN = undefined;
    expect((await ingest([item()])).status).toBe(503);
    expect((await statusGET(req("/api/outreach/status?ids=post:1"))).status).toBe(503);
    expect((await threadPOST(req("/api/outreach/thread", { threadUrl: null, hasHistory: false }))).status).toBe(503);
  });

  it("401 fără token sau cu token greșit", async () => {
    expect((await ingest([item()], null)).status).toBe(401);
    expect((await ingest([item()], "gresit")).status).toBe(401);
    expect((await statusGET(req("/api/outreach/status?ids=post:1", undefined, null))).status).toBe(401);
    expect((await threadPOST(req("/api/outreach/thread", { hasHistory: true }, `${TOKEN}x`))).status).toBe(401);
  });

  it("400 pentru date invalide", async () => {
    expect((await ingest([])).status).toBe(400);
    expect((await ingest(Array.from({ length: 51 }, () => item()))).status).toBe(400);
    expect((await ingest([item({ kind: "story" })])).status).toBe(400);
    const ids = Array.from({ length: 101 }, (_, i) => `post:${i}`).join(",");
    expect((await statusGET(req(`/api/outreach/status?ids=${ids}`))).status).toBe(400);
  });
});

describe("POST /api/outreach/ingest", () => {
  it("nu reprocesează același fbItemId", async () => {
    const it1 = item();
    const first = await ingest([it1]);
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ accepted: 1, duplicates: 0, leads: [{ fbItemId: it1.fbItemId, status: "new", type: null, score: null }] });

    await db.update(outreachLeads).set({ status: "scored", score: 80 }).where(eq(outreachLeads.fbItemId, it1.fbItemId));
    const second = await ingest([{ ...it1, text: "Alt text" }, it1]);
    expect(second.body.accepted).toBe(0);
    expect(second.body.duplicates).toBe(2);
    expect(second.body.leads).toEqual([{ fbItemId: it1.fbItemId, status: "scored", type: null, score: 80 }]);
    expect((await leadOf(it1.fbItemId)).text).toContain("social media manager");
  });

  it("autorii anonimi sau fără profil sunt `skipped`", async () => {
    const anon = item({ authorName: "Anonymous participant", authorProfileUrl: "https://www.facebook.com/groups/1/user/0/", authorFbId: null });
    const noProfile = item({ authorName: "Maria", authorProfileUrl: null, authorFbId: null });
    const anonRo = item({ authorName: "Participant anonim" });
    const { body } = await ingest([anon, noProfile, anonRo]);
    expect(body.accepted).toBe(3);
    expect(body.leads.map((l: { status: string }) => l.status)).toEqual(["skipped", "skipped", "skipped"]);
    expect((await leadOf(anon.fbItemId)).personKey).toBeNull();
  });

  it("calculează personKey și trunchiază textele lungi", async () => {
    const it1 = item({ authorFbId: null, authorProfileUrl: "https://www.facebook.com/Ana.Pop?__tn__=R", text: "Caut ".repeat(2_000) });
    await ingest([it1]);
    const l = await leadOf(it1.fbItemId);
    expect(l.personKey).toBe("u:ana.pop");
    expect(l.text.length).toBeLessThanOrEqual(5_000);
  });

  it("persoanele deja contactate nu mai intră în coadă", async () => {
    const a = item();
    await ingest([a]);
    const lead = await leadOf(a.fbItemId);
    await db.update(outreachLeads).set({ status: "scored" }).where(eq(outreachLeads.id, lead.id));
    await markLeadSent(lead.id);
    const b = item({ authorFbId: a.authorFbId, authorProfileUrl: a.authorProfileUrl });
    const { body } = await ingest([b]);
    expect(body.leads[0].status).toBe("already_contacted");

    const res = await statusGET(req(`/api/outreach/status?ids=${a.fbItemId},${b.fbItemId},post:necunoscut`));
    const status = await res.json();
    expect(status.leads).toHaveLength(2);
    expect(status.leads.every((l: { personContacted: boolean }) => l.personContacted)).toBe(true);
  });
});

describe("POST /api/outreach/thread", () => {
  it("cu istoric → toate lead-urile persoanei devin already_contacted", async () => {
    const fbId = uid();
    const a = item({ authorFbId: fbId, authorProfileUrl: `https://www.facebook.com/profile.php?id=${fbId}` });
    const b = item({ fbItemId: `comment:${randomUUID()}`, kind: "comment", parentPostId: "1", authorFbId: null, authorProfileUrl: `https://www.facebook.com/groups/1/user/${fbId}/` });
    await ingest([a, b]);

    const noHistory = await threadPOST(req("/api/outreach/thread", { threadUrl: `https://www.facebook.com/messages/t/${fbId}`, authorFbId: null, authorProfileUrl: null, hasHistory: false }));
    expect(await noHistory.json()).toMatchObject({ known: true, personKey: `id:${fbId}`, status: "new" });

    const res = await threadPOST(req("/api/outreach/thread", { threadUrl: `https://www.facebook.com/messages/t/${fbId}`, authorFbId: fbId, authorProfileUrl: null, hasHistory: true }));
    const body = await res.json();
    expect(body).toMatchObject({ known: true, personKey: `id:${fbId}`, status: "already_contacted" });
    expect(typeof body.leadId).toBe("string");
    const rows = await db.select().from(outreachLeads).where(inArray(outreachLeads.fbItemId, [a.fbItemId, b.fbItemId]));
    expect(rows.map((r) => r.status)).toEqual(["already_contacted", "already_contacted"]);
  });

  it("nu schimbă nimic dacă persoana a fost contactată prin copilot", async () => {
    const a = item();
    await ingest([a]);
    const lead = await leadOf(a.fbItemId);
    await markLeadSent(lead.id);
    const res = await threadPOST(req("/api/outreach/thread", { threadUrl: null, authorFbId: a.authorFbId, hasHistory: true }));
    expect(await res.json()).toMatchObject({ known: true, status: "contacted", leadId: lead.id });
  });

  it("persoană necunoscută", async () => {
    const res = await threadPOST(req("/api/outreach/thread", { threadUrl: "https://www.facebook.com/messages/t/999999999999", hasHistory: true }));
    expect(await res.json()).toEqual({ known: false, personKey: "id:999999999999", status: null, leadId: null });
  });
});

describe("acțiuni admin", () => {
  it("„Am trimis” marchează celelalte lead-uri ale persoanei", async () => {
    const fbId = uid();
    const a = item({ authorFbId: fbId });
    const b = item({ authorFbId: fbId, text: "Mai caut și un fotograf" });
    const other = item();
    await ingest([a, b, other]);
    const la = await leadOf(a.fbItemId);

    const { others } = await markLeadSent(la.id, { message: "  Salut! Mesaj editat.  " });
    expect(others).toBe(1);
    const after = await leadOf(a.fbItemId);
    expect(after.status).toBe("contacted");
    expect(after.contactedAt).toBeInstanceOf(Date);
    expect(after.message).toBe("Salut! Mesaj editat.");
    expect((await leadOf(b.fbItemId)).status).toBe("already_contacted");
    expect((await leadOf(other.fbItemId)).status).toBe("new");

    await expect(markLeadSent(la.id)).rejects.toThrow(/deja contactat/);
    await expect(markLeadSent((await leadOf(b.fbItemId)).id)).rejects.toThrow(/deja contactat/);

    await setLeadStatus(la.id, "replied");
    expect((await leadOf(a.fbItemId)).status).toBe("replied");
    await expect(setLeadStatus(la.id, "skipped")).rejects.toThrow();
  });

  it("respectă limita zilnică, cu override", async () => {
    const a = item();
    await ingest([a]);
    const lead = await leadOf(a.fbItemId);
    env.OUTREACH_DAILY_CAP = Math.max(1, await sentToday());
    if ((await sentToday()) < env.OUTREACH_DAILY_CAP) {
      const filler = item();
      await ingest([filler]);
      await markLeadSent((await leadOf(filler.fbItemId)).id);
    }
    await expect(markLeadSent(lead.id)).rejects.toThrow(/limita zilnică/);
    await markLeadSent(lead.id, { override: true });
    expect((await leadOf(a.fbItemId)).status).toBe("contacted");
  });
});

describe("clasificare (fallback pe reguli, fără OpenAI)", () => {
  it("scored/irrelevant, categorie și mesaj cu link UTM", async () => {
    const client = item();
    const provider = item({ text: "Realizez site-uri de prezentare în WordPress, portofoliu în comentarii." });
    const junk = item({ text: "Ce părere aveți de noul algoritm Facebook?" });
    await ingest([client, provider, junk]);
    await classifyPendingLeads();

    const c = await leadOf(client.fbItemId);
    expect(c.status).toBe("scored");
    expect(c.type).toBe("client");
    expect(c.categoryId).not.toBeNull();
    expect(c.score).toBeGreaterThan(50);
    expect(c.message).toContain(outreachLink("client", "252706105062924"));

    const p = await leadOf(provider.fbItemId);
    expect(p).toMatchObject({ status: "scored", type: "provider" });
    expect(p.message).toContain(outreachLink("provider", "252706105062924"));

    const j = await leadOf(junk.fbItemId);
    expect(j).toMatchObject({ status: "irrelevant", type: "irrelevant", message: null });
  });
});
