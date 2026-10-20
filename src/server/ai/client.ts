import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod";
import { db } from "../db";
import { aiUsage } from "../db/schema";
import { env, features } from "../env";
import { rateLimit } from "../rate-limit";

let client: OpenAI | null = null;
function getClient() {
  client ??= new OpenAI({ apiKey: env.OPENAI_API_KEY, timeout: 25_000, maxRetries: 1 });
  return client;
}

export class AiUnavailableError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "AiUnavailableError";
  }
}

/** Limite zilnice per utilizator, per funcție (protejează bugetul OpenAI). */
const DAILY_LIMITS: Record<string, number> = {
  "project-builder": 30,
  "quality-check": 60,
  "search-parse": 120,
  "proposal-draft": 40,
  "share-text": 30,
  "compare-applications": 30,
  "autobid-personalize": 300,
  "provider-skills": 20,
  "project-enrich": 200,
};

type CallOpts = { feature: string; userId?: string | null; maxOutputTokens?: number };

async function guard(opts: CallOpts) {
  if (!features.ai) throw new AiUnavailableError("AI dezactivat (lipsește OPENAI_API_KEY)");
  const limit = DAILY_LIMITS[opts.feature] ?? 50;
  const key = `ai:${opts.feature}:${opts.userId ?? "system"}`;
  const ok = await rateLimit(key, opts.userId ? limit : limit * 50, 86_400);
  if (!ok) throw new AiUnavailableError("Ai atins limita zilnică pentru această funcție AI");
}

async function logUsage(opts: CallOpts, usage: { input_tokens?: number; output_tokens?: number } | undefined, ok: boolean) {
  try {
    await db.insert(aiUsage).values({
      userId: opts.userId ?? null,
      feature: opts.feature,
      model: env.OPENAI_MODEL,
      inputTokens: usage?.input_tokens ?? 0,
      outputTokens: usage?.output_tokens ?? 0,
      ok,
    });
  } catch {
    /* logarea nu trebuie să blocheze funcția */
  }
}

function reasoningParams() {
  const effort = process.env.OPENAI_REASONING_EFFORT ?? "low";
  return effort === "none" ? {} : { reasoning: { effort: effort as "low" | "medium" | "high" | "minimal" } };
}

/** Apel cu răspuns structurat, validat cu Zod. */
export async function aiStructured<S extends z.ZodType>(
  opts: CallOpts & { schema: S; system: string; user: string },
): Promise<z.infer<S>> {
  await guard(opts);
  try {
    const res = await getClient().responses.parse({
      model: env.OPENAI_MODEL,
      input: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      text: { format: zodTextFormat(opts.schema, "result") },
      max_output_tokens: opts.maxOutputTokens ?? 2_000,
      ...reasoningParams(),
    });
    await logUsage(opts, res.usage, true);
    if (!res.output_parsed) throw new Error("Răspuns AI gol");
    return res.output_parsed as z.infer<S>;
  } catch (err) {
    await logUsage(opts, undefined, false);
    throw err;
  }
}

/** Apel text simplu. */
export async function aiText(opts: CallOpts & { system: string; user: string }): Promise<string> {
  await guard(opts);
  try {
    const res = await getClient().responses.create({
      model: env.OPENAI_MODEL,
      input: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      max_output_tokens: opts.maxOutputTokens ?? 1_200,
      ...reasoningParams(),
    });
    await logUsage(opts, res.usage, true);
    return res.output_text.trim();
  } catch (err) {
    await logUsage(opts, undefined, false);
    throw err;
  }
}

/** Moderare (spam/abuz). Fără cheie AI, nu marcăm nimic. */
export async function aiModerate(text: string): Promise<{ flagged: boolean; categories: string[] }> {
  if (!features.ai) return { flagged: false, categories: [] };
  try {
    const res = await getClient().moderations.create({ model: "omni-moderation-latest", input: text.slice(0, 8_000) });
    const r = res.results[0];
    const cats = Object.entries(r?.categories ?? {})
      .filter(([, v]) => v)
      .map(([k]) => k);
    return { flagged: Boolean(r?.flagged), categories: cats };
  } catch {
    return { flagged: false, categories: [] };
  }
}

/** Rulează varianta AI, iar la orice eroare revine la fallback-ul determinist. */
export async function withFallback<T>(ai: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
  if (!features.ai) return fallback();
  try {
    return await ai();
  } catch (err) {
    if (!(err instanceof AiUnavailableError)) console.error("[ai] fallback:", (err as Error).message);
    return fallback();
  }
}
