import { describe, expect, it } from "vitest";
import { env } from "@/server/env";
import { emailLogoUrl, renderEmail, type EmailBlock } from "@/server/email/layout";
import { emailPreviews } from "@/server/email/previews";
import * as t from "@/server/email/templates";

const LOGO = `${env.APP_URL}/brand/email-logo.png`;
const XSS = `<script>alert("x")</script>`;

function expectWellFormed(email: { subject: string; html: string; text: string }) {
  expect(email.subject.trim()).not.toBe("");
  expect(email.html).toContain(`src="${LOGO}"`);
  expect(email.html).toMatch(/alt="Contractez"/);
  expect(email.html).not.toMatch(/data:image|src="data:/i);
  expect(email.html).toContain('name="color-scheme" content="light dark"');
  expect(email.html).toContain(`${env.APP_URL}/setari`);
  expect(email.html).toContain(`${env.APP_URL}/termeni`);
  expect(email.html).toContain(`${env.APP_URL}/confidentialitate`);
  expect(email.html).not.toMatch(/<script/i);
  expect(email.text.trim().length).toBeGreaterThan(50);
}

describe("șabloane email", () => {
  it("logo-ul este un URL https/absolut, nu base64", () => {
    expect(emailLogoUrl()).toBe(LOGO);
    expect(emailLogoUrl()).toMatch(/^https?:\/\//);
  });

  it.each(emailPreviews.map((p) => [p.id, p] as const))("%s se randează corect", (_id, p) => {
    const email = p.render();
    expectWellFormed(email);
    expect(email.text).not.toMatch(/<[a-z][^>]*>/i); // fără HTML în varianta text
    expect(email.preheader?.trim()).toBeTruthy();
    // Varianta text conține toate linkurile din butoane.
    const buttons = [...email.html.matchAll(/href="([^"]+)" target="_blank" class="btn-primary"/g)].map((m) => m[1].replaceAll("&amp;", "&"));
    expect(buttons.length).toBe(1); // un singur CTA principal
    for (const href of buttons) expect(email.text).toContain(href);
  });

  it("are câte o previzualizare pentru fiecare șablon, cu id-uri unice", () => {
    const ids = emailPreviews.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const templateFns = Object.keys(t).filter((k) => k.endsWith("Template"));
    expect(templateFns.length).toBeGreaterThanOrEqual(16);
  });

  it("escapează datele introduse de utilizatori", () => {
    const emails = [
      t.renderNotificationEmail({
        title: XSS,
        link: "/proiectele-mele/x",
        email: t.applicationNewTemplate({ providerName: XSS, projectTitle: XSS, message: XSS, isAuto: false, used: 1, max: 5 }),
      }),
      t.renderNotificationEmail({ title: "x", link: "/mesaje/x", email: t.messageNewTemplate({ senderName: XSS, text: XSS }) }),
      t.renderNotificationEmail({ title: "x", email: t.projectNoApplicationsTemplate({ projectTitle: XSS, tips: [XSS] }) }),
      t.matchDigestTemplate({ frequency: "daily", allHref: `${env.APP_URL}/recomandari`, matches: [{ title: XSS, href: `${env.APP_URL}/p/"x`, score: 80, budget: XSS, excerpt: XSS }] }),
      t.verifyEmailTemplate({ firstName: XSS, link: `${env.APP_URL}/verifica-email?token="><script>` }),
    ];
    for (const e of emails) {
      expectWellFormed(e);
      expect(e.html).toContain("&lt;script&gt;");
      expect(e.subject + e.text).toContain("<script>"); // subiectul și textul sunt text simplu
    }
  });

  it("emailurile de notificare primesc butonul către link (absolut) și motivul în footer", () => {
    const e = t.renderNotificationEmail({ title: "Titlu", body: "Corp", link: "/colaborari", email: t.applicationHiredTemplate({ projectTitle: "Proiect" }) });
    expect(e.html).toContain(`href="${env.APP_URL}/colaborari"`);
    expect(e.html).toContain("Confirmă colaborarea");
    expect(e.text).toContain(`Confirmă colaborarea: ${env.APP_URL}/colaborari`);
    expect(e.html).toContain(t.footerReason("applications"));
    // Fără heading/preheader în șablon, se folosesc titlul și corpul notificării.
    const fallback = t.renderNotificationEmail({ title: "Titlul notificării", body: "Corpul notificării", email: { kind: "system", subject: "S", blocks: [] } });
    expect(fallback.html).toContain("Titlul notificării");
    expect(fallback.preheader).toBe("Corpul notificării");
  });

  it("blocurile vechi rămân compatibile, iar cele noi apar și în varianta text", () => {
    const blocks: EmailBlock[] = [
      { type: "p", text: "Paragraf" },
      { type: "muted", text: "Discret" },
      { type: "code", text: "123456" },
      { type: "button", text: "Principal", href: "https://contractez.ro/a" },
      { type: "button", text: "Secundar", href: "https://contractez.ro/b", variant: "secondary" },
      { type: "card", title: "Card", meta: "Meta", lines: ["Linie"], href: "https://contractez.ro/c" },
      { type: "callout", tone: "warning", title: "Atenție", text: "Mesaj" },
      { type: "list", items: ["Unu", "Doi"] },
      { type: "stats", items: [{ value: "12", label: "proiecte" }, { value: "92%", label: "potrivire" }] },
      { type: "divider" },
      { type: "quote", author: "Ana", text: "Salut" },
      { type: "signature" },
    ];
    const { html, text } = renderEmail({ heading: "Titlu", eyebrow: "Eyebrow", preheader: "Pre", blocks });
    expect(html).toContain("v:roundrect"); // buton VML pentru Outlook
    expect(html).toContain("letter-spacing:10px"); // codul OTP
    expect(html).toContain("prefers-color-scheme:dark");
    for (const s of ["EYEBROW", "Titlu", "123456", "Principal: https://contractez.ro/a", "Secundar: https://contractez.ro/b", "Atenție: Mesaj", "- Unu", "12 proiecte", "> Salut", "Echipa Contractez", "---"]) {
      expect(text).toContain(s);
    }
  });
});
