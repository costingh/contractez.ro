import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Livrarea reală prin Resend (mock): verificăm ce pleacă efectiv către furnizor.
const sent: { to: string; html: string; text?: string }[] = [];
vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: async (payload: { to: string; html: string; text?: string }) => {
        sent.push(payload);
        return { data: { id: `msg-${sent.length}` }, error: null };
      },
    };
  },
}));

process.env.RESEND_API_KEY = "re_test_redaction";

let send: typeof import("@/server/email/send");
let db: typeof import("@/server/db").db;
let emailLog: typeof import("@/server/db/schema").emailLog;
let auth: typeof import("@/server/auth/service");
let createTestUser: typeof import("./helpers").createTestUser;

beforeAll(async () => {
  send = await import("@/server/email/send");
  ({ db } = await import("@/server/db"));
  ({ emailLog } = await import("@/server/db/schema"));
  auth = await import("@/server/auth/service");
  ({ createTestUser } = await import("./helpers"));
});

beforeEach(() => {
  sent.length = 0;
});

async function row(id: string) {
  const [r] = await db.select().from(emailLog).where(eq(emailLog.id, id));
  return r;
}

describe("tokenurile din email_log sunt ascunse, dar emailul livrat are linkul real", () => {
  it("redactSecrets ascunde valorile `token=` din linkuri (și în HTML, cu &amp;)", () => {
    expect(send.redactSecrets("https://x.ro/resetare-parola?token=abc_DEF-123")).toBe("https://x.ro/resetare-parola?token=[ascuns]");
    expect(send.redactSecrets('<a href="https://x.ro/a?x=1&amp;token=abc">')).toBe('<a href="https://x.ro/a?x=1&amp;token=[ascuns]">');
    expect(send.redactSecrets("https://x.ro/a?token=abc&next=/panou")).toBe("https://x.ro/a?token=[ascuns]&next=/panou");
    expect(send.redactSecrets("Fără linkuri secrete: https://x.ro/proiecte?q=token")).toBe("Fără linkuri secrete: https://x.ro/proiecte?q=token");
  });

  it("resetarea parolei: adminul vede linkul ascuns, Resend primește linkul funcțional, apoi secretul dispare", async () => {
    const u = await createTestUser();
    await auth.requestPasswordReset(u.email);
    const [stored] = await db.select().from(emailLog).where(eq(emailLog.userId, u.id));
    expect(stored.template).toBe("password-reset");
    expect(stored.html).toContain("resetare-parola?token=[ascuns]");
    expect(stored.text).toContain("resetare-parola?token=[ascuns]");
    expect(stored.html).not.toMatch(/token=(?!\[ascuns\])/);
    expect(stored.secret).toBeTruthy();
    expect(stored.secret).not.toContain("resetare-parola");

    await send.deliverEmail(stored.id);
    expect(sent).toHaveLength(1);
    const token = sent[0].text?.match(/resetare-parola\?token=([\w-]+)/)?.[1];
    expect(token).toBeTruthy();
    expect(token).not.toBe("[ascuns]");
    expect(sent[0].html).toContain(`resetare-parola?token=${token}`);
    expect(sent[0].to).toBe(u.email);
    // Linkul livrat chiar funcționează.
    expect(await auth.checkPasswordResetToken(token!)).toBe("valid");

    const after = await row(stored.id);
    expect(after.status).toBe("sent");
    expect(after.secret).toBeNull();
    expect(after.html).toContain("token=[ascuns]");

    // Idempotent: nu retrimite.
    await send.deliverEmail(stored.id);
    expect(sent).toHaveLength(1);
  });

  it("emailurile fără linkuri secrete se salvează și se livrează neschimbate", async () => {
    const id = await send.queueEmail({ to: "a@example.com", subject: "S", html: "<p>https://x.ro/proiecte</p>", text: "https://x.ro/proiecte", template: "test" });
    const stored = await row(id!);
    expect(stored.secret).toBeNull();
    await send.deliverEmail(id!);
    expect(sent[0]).toMatchObject({ html: "<p>https://x.ro/proiecte</p>", text: "https://x.ro/proiecte" });
  });

  it("un secret care nu mai poate fi decriptat nu trimite un email cu linkul ascuns", async () => {
    const id = await send.queueEmail({ to: "b@example.com", subject: "S", html: "<a href='https://x.ro/r?token=abc'>x</a>", template: "password-reset" });
    await db.update(emailLog).set({ secret: "corupt" }).where(eq(emailLog.id, id!));
    await send.deliverEmail(id!);
    expect(sent).toHaveLength(0);
    expect((await row(id!)).status).toBe("failed");
  });

  it("criptarea face round-trip și mentenanța șterge secretele vechi", async () => {
    const enc = send.encryptEmailSecret({ html: "<p>h</p>", text: "t" });
    expect(send.decryptEmailSecret(enc)).toEqual({ html: "<p>h</p>", text: "t" });
    const id = await send.queueEmail({ to: "c@example.com", subject: "S", html: "https://x.ro/v?token=abc", template: "verify-email" });
    await db.update(emailLog).set({ createdAt: new Date(Date.now() - 4 * 86_400_000) }).where(eq(emailLog.id, id!));
    await send.purgeEmailSecrets();
    expect((await row(id!)).secret).toBeNull();
  });
});
