# Ghid de implementare (convenții pentru cod)

Platformă marketplace de servicii pentru România. Planul de business complet: `docs/chatgpt-plan.md`.
Nume: **Contractez** (domeniu: contractez.ro), din `src/config/site.ts` → `site.name`.

## Stack
- Next.js **16.4** App Router, React 19, TypeScript strict, Tailwind v4, shadcn/ui (stil radix-nova).
  - ⚠️ Next 16 diferă de ce știi: `params` și `searchParams` sunt **Promise** (`await`), `middleware` se numește `proxy` (`src/proxy.ts`).
    Dacă nu ești sigur de un API, citește `node_modules/next/dist/docs/01-app/...`.
  - `cacheComponents: false` → modelul clasic: paginile care citesc cookies/DB sunt dinamice automat. Nu folosi `"use cache"`.
  - `forbidden()` / `notFound()` / `redirect()` din `next/navigation` sunt disponibile (authInterrupts activ).
- Drizzle ORM + Postgres (PostGIS) — schema în `src/server/db/schema.ts`, client `db` din `@/server/db`.
- Redis + BullMQ (`src/server/queue`), worker separat (`src/worker/index.ts`).
- OpenAI (opțional), Resend (opțional), Stripe test mode (opțional, `features.payments`).

## Structură
```
src/config/site.ts        reguli de business, planuri (Gratuit/Pro/Business), etichete RO (labels.*)
src/lib/                  utilitare comune client+server: format.ts, text.ts, action.ts, utils.ts (cn)
src/server/               TOATĂ logica de business (nu pune logică în pagini)
  auth/                   session.ts (getCurrentUser), guards.ts (requireUser/requireOnboardedUser/requireProvider/requireAdmin), service.ts
  billing/                plans.ts (plan activ, limită lunară, planuri oferite), stripe.ts
  applications/service.ts aplicări (applyToProject, hire, reject, shortlist, refund...)
  projects/service.ts     saveProject/publishProject/closeProject/approve/remove/getOrCreateShareText
  providers/service.ts    profil prestator, servicii, portofoliu
  search/projects.ts      searchProjects + parseProjectFilters (filtre din URL)
  search/providers.ts     searchProviders + parseProviderFilters + suggestRelaxations
  matching/               score.ts (scor determinist), run.ts (recommendProjectsForProvider)
  autobid/engine.ts       Auto Bid (activeSubscription, confirmProposal, declineProposal)
  chat/service.ts         conversații și mesaje
  trust/service.ts        colaborări, recenzii, raportări, ban
  notifications/index.ts  notify(), listNotifications, markAllRead
  ai/features.ts          buildProjectDraft, checkProjectQuality, parseProviderSearch, parseProjectSearch,
                          draftProposal, compareApplications, generateShareText (toate au fallback fără AI)
  insights.ts             categoryDemand (cerere/ofertă), providerStats, adminMetrics, publicStats
  catalog/                taxonomy.ts (getCatalog), localities.ts, options.ts (categoryOptions pentru UI)
  uploads.ts              saveUpload(file, scope, "image"|"document") → { path } servit la /api/files/<path>
src/components/ui/        shadcn, restilizate pentru design system (vezi docs/DESIGN.md)
src/components/shared/    LocalityCombobox, CategorySelect, NativeSelect, PageHeader, EmptyState, Pagination, ScoreBadge
src/components/forms/     SubmitButton, FormMessage, FieldError, Field
src/components/projects/  ProjectCard
src/components/providers/ ProviderCard
src/components/layout/    header/footer (NU modifica — doar agentul principal)
```

Componente shadcn disponibile: alert, avatar, badge, button, card, checkbox, command, dialog, dropdown-menu, input, input-group,
label, popover, progress, radio-group, scroll-area, select, separator, sheet, skeleton, slider, sonner (toast din `sonner`),
switch, table, tabs, textarea, tooltip. Iconițe: `lucide-react`. Pentru select-uri în formulare server preferă `NativeSelect`.

## Pattern pentru mutații (Server Actions)
- Fiecare zonă are `actions.ts` cu `"use server"` lângă paginile ei.
- Semnătura pentru formulare: `async function xAction(prev: ActionState, fd: FormData): Promise<ActionState>`.
- Mereu: verifică utilizatorul cu guard-urile din `@/server/auth/guards` (autorizare pe resursă e în servicii),
  apelează serviciul din `src/server`, apoi `revalidatePath(...)`, întoarce `{ ok: true, message }`.
- Erorile: `catch (err) { return toActionError(err); }` (gestionează DomainError, ZodError, re-aruncă redirect).
- Client: `const [state, action] = useActionState(xAction, null)` + `<FormMessage state={state} />` + `<SubmitButton>`.
- Pentru acțiuni simple fără formular (butoane), poți folosi acțiuni care primesc argumente și `useTransition` + `toast` din `sonner`.
- Exemplu complet: `src/app/(auth)/actions.ts` + `src/app/(auth)/autentificare/login-form.tsx`.

## Reguli UI
- Tot textul în **română, cu diacritice** (ă, â, î, ș, ț). Ton prietenos, clar, „tu”.
- Mobile-first, layout cu `container-page` (max-w-6xl + padding). Carduri cu `rounded-xl border bg-card shadow-xs`.
- Design system „Cerneală & hârtie” (docs/DESIGN.md): `primary` (navy), `brand` (cobalt: linkuri, focus, AI), `success` (DOAR semnale de verificare), `warning`, `destructive`, `brand-soft`, `surface`, `border-strong`, clasa `.eyebrow`. Badge-uri: variantele `success`/`warning`/`brand`. Nu hardcoda culori hex; dark mode prin clasa `.dark` (next-themes).
- Stări goale cu `EmptyState`, titluri cu `PageHeader`. Date formatate cu `src/lib/format.ts` (`timeAgo`, `describeBudget`, `formatLei`...).
- Etichetele enum-urilor sunt în `labels` din `@/config/site` (workMode, invoice, urgency, applicationStatus etc.).
- Imaginile încărcate: `<img src={"/api/files/" + path}>` (images.unoptimized).
- Nu adăuga dependențe noi fără motiv serios.

## Reguli de business importante (vezi și `rules` în site.ts)
- Publicarea proiectelor e gratuită; clientul trebuie să aibă email confirmat ca să publice.
- Prestatorii aplică în limita lunară a planului (`getPlanUsage`); limita = aplicări trimise în perioadă, fără cele `refunded`.
  Max 5 locuri/proiect (max 2 pentru Auto Bid); chat gratuit după aplicare. Clienții nu plătesc nimic.
- Auto Bid doar pe planurile cu `autoBid`; ofertele Pro/Business sunt evidențiate automat; Business = profil promovat (`syncPlanPerks`).
- Plățile reale sunt dezactivate până la lansare (`features.payments`); afișează mesaj „beta”. Planurile oferite (`grantCompPlan`) merg și fără Stripe.
- Recenzii doar după colaborare confirmată; autorul poate fi ascuns public („Client verificat”).
- Promovarea (din planuri) e etichetată „Promovat” și nu modifică scorul.
- Scorul de compatibilitate este calculat determinist (nu de AI) — afișează motivele (`reasons`).

## Verificare
- `npx tsc --noEmit` trebuie să treacă. `pnpm lint` ideal fără erori.
- Serverul de dev rulează pe http://localhost:3000 (nu porni altul). Verifică paginile cu `curl -s -o /dev/null -w "%{http_code}"`.
- Teste: `pnpm test` (Vitest + DB de test). Postgres: localhost:5442, Redis: localhost:6392.
- Utilizatori de test: `pnpm db:seed-demo` (după ce există scriptul) sau creează prin UI; linkurile de verificare email apar în consola serverului de dev și în tabela `email_log`.
