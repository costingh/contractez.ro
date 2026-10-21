// Creează (sau actualizează, idempotent după nume) obiectivele și funnel-urile din VisitTrack.
// Rulare: VISITRACK_API_KEY=... node scripts/visitrack-setup.mjs
// Cheia trebuie creată în VisitTrack → Settings → API / MCP, cu „Allow configuring goals & funnels”.
// Numele evenimentelor vin din src/server/analytics.ts (track → „.” devine „_”, user.signed_up → signup),
// din src/components/analytics/* și din scriptul VisitTrack (payment, form_submit etc.).

const key = process.env.VISITRACK_API_KEY;
if (!key) {
  console.error("Lipsește VISITRACK_API_KEY");
  process.exit(1);
}

const goals = [
  { name: "Înscriere", matchType: "event", matchValue: "signup", isPrimary: true },
  { name: "Email confirmat", matchType: "event", matchValue: "user_email_verified" },
  { name: "Onboarding finalizat", matchType: "event", matchValue: "user_onboarded" },
  { name: "Proiect publicat", matchType: "event", matchValue: "project_published" },
  { name: "Aplicare trimisă", matchType: "event", matchValue: "application_submitted" },
  { name: "Prestator ales", matchType: "event", matchValue: "application_hired" },
  { name: "Colaborare finalizată", matchType: "event", matchValue: "collaboration_completed" },
  { name: "Checkout pornit", matchType: "event", matchValue: "checkout_started" },
  { name: "Abonament activat", matchType: "event", matchValue: "plan_activated" },
  { name: "Plată (întoarcere din Stripe)", matchType: "event", matchValue: "payment" },
  { name: "Click Publică proiect", matchType: "event", matchValue: "cta_publish_project" },
  { name: "Click Devino prestator", matchType: "event", matchValue: "cta_become_provider" },
  { name: "Click Creează cont", matchType: "event", matchValue: "cta_signup" },
  { name: "Click Google", matchType: "event", matchValue: "google_auth_click" },
  { name: "Click plan Pro", matchType: "event", matchValue: "plan_click_pro" },
  { name: "Click plan Business", matchType: "event", matchValue: "plan_click_business" },
  { name: "Căutare prestatori", matchType: "event", matchValue: "search_providers" },
  { name: "Căutare proiecte", matchType: "event", matchValue: "search_projects" },
  { name: "Articol citit până la final", matchType: "event", matchValue: "blog_read_end" },
  { name: "Tabel de prețuri văzut", matchType: "event", matchValue: "price_table_seen" },
  { name: "Planuri văzute (/preturi)", matchType: "event", matchValue: "pricing_plans_seen" },
  { name: "Vizită pagina de prețuri", matchType: "page", matchValue: "/preturi" },
  { name: "Vizită formular proiect nou", matchType: "page", matchValue: "/proiecte/nou" },
  { name: "Acord cookie-uri", matchType: "event", matchValue: "cookie_consent" },
  { name: "Click contact (tel/mail)", matchType: "event", matchValue: "contact_click" },
];

const funnels = [
  {
    name: "Client: vizită → proiect → prestator ales",
    windowDays: 30,
    steps: [
      { type: "event", value: "cta_publish_project" },
      { type: "page", value: "/proiecte/nou" },
      { type: "event", value: "signup" },
      { type: "event", value: "project_published" },
      { type: "event", value: "application_hired" },
    ],
  },
  {
    name: "Prestator: înscriere → aplicare → abonament",
    windowDays: 60,
    steps: [
      { type: "event", value: "cta_become_provider" },
      { type: "event", value: "signup" },
      { type: "event", value: "user_onboarded" },
      { type: "event", value: "application_submitted" },
      { type: "event", value: "checkout_started" },
      { type: "event", value: "plan_activated" },
    ],
  },
  {
    name: "Prețuri → plată",
    windowDays: 14,
    steps: [
      { type: "page", value: "/preturi" },
      { type: "event", value: "pricing_plans_seen" },
      { type: "event", value: "checkout_started" },
      { type: "event", value: "payment" },
    ],
  },
  {
    name: "Blog → proiect publicat",
    windowDays: 30,
    steps: [
      { type: "event", value: "blog_read_end" },
      { type: "event", value: "cta_publish_project" },
      { type: "event", value: "project_published" },
    ],
  },
  {
    name: "Pagină de categorie/oraș → proiect publicat",
    windowDays: 30,
    steps: [
      { type: "event", value: "price_table_seen" },
      { type: "event", value: "cta_publish_project" },
      { type: "event", value: "signup" },
      { type: "event", value: "project_published" },
    ],
  },
  {
    name: "Înscriere → activare",
    windowDays: 14,
    steps: [
      { type: "event", value: "signup" },
      { type: "event", value: "user_email_verified" },
      { type: "event", value: "user_onboarded" },
    ],
  },
];

async function post(path, body) {
  const res = await fetch(`https://visitrack.app/api/v1/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} „${body.name}”: HTTP ${res.status} ${JSON.stringify(json)}`);
  console.log(`${path}: ${json.result ?? "ok"} — ${body.name}${json.warnings ? ` (${json.warnings.join("; ")})` : ""}`);
  // 30 de scrieri pe minut per cheie
  await new Promise((r) => setTimeout(r, 2100));
}

for (const g of goals) await post("goals", g);
for (const f of funnels) await post("funnels", f);
console.log("Gata.");
