# Contractez — marketplace de servicii pentru România

> Nume provizoriu. Se schimbă din `APP_NAME` (`.env`) și `src/config/site.ts`.

Platformă în care **clienții publică gratuit proiecte**, iar **prestatorii** (programatori, instalatori, designeri,
meseriași, profesori etc., din toate categoriile) primesc doar oportunitățile compatibile. Prestatorii aplică în limita lunară a
**abonamentului** (Gratuit, Pro sau Business), iar AI-ul ajută ambele părți: structurează cererile, verifică dacă brief-ul e clar,
caută în limbaj natural, scrie propuneri și compară ofertele.

Planul de business și deciziile de produs sunt în [`docs/chatgpt-plan.md`](docs/chatgpt-plan.md). Convențiile de cod sunt în
[`docs/IMPLEMENTATION.md`](docs/IMPLEMENTATION.md).

## Funcționalități

- **Conturi**: email + parolă, confirmare email, resetare parolă, verificare telefon prin SMS (opțional), ambele roluri pe același cont.
- **Onboarding** separat pentru client și prestator: servicii, competențe, tarif, zonă de deplasare (rază km), factură/PFA/SRL.
- **Proiecte**: AI Project Builder (text liber sau postare de Facebook → proiect structurat), verificare de calitate, detectare
  duplicate, moderare automată, ascunderea datelor de contact, link și text de distribuire.
- **Matching** în 3 straturi: filtre obligatorii (categorie, remote/local, rază PostGIS, factură) → scor determinist și explicat →
  distribuție echitabilă (locuri rezervate profilurilor noi). Notificări instant sau digest zilnic/săptămânal.
- **Abonamente pentru prestatori**: Gratuit (5 aplicări/lună), Pro (49 lei, 40 aplicări, Auto Bid, oferte evidențiate),
  Business (149 lei, 200 aplicări, profil promovat). Limita se calculează din aplicările trimise în perioada curentă, cu verificare
  serializată per prestator; aplicările la proiecte frauduloase se restituie. Clienții nu plătesc nimic.
- **Aplicări**: max. 5 locuri per proiect, fără aplicări duble, statusuri vizibile (trimisă → citită → listă scurtă → aleasă/respinsă).
- **Auto Bid** (Pro și Business): reguli (categorii, buget, distanță, cuvinte cheie, limită zilnică), mod „propune, eu confirm” sau automat,
  max. 2 locuri automate per proiect, fereastră de 30 de minute rezervată aplicărilor manuale.
- **Chat** între client și prestator după aplicare (cu atașamente), notificări în aplicație și pe email.
- **Reputație**: recenzii doar după colaborare confirmată, autor ascuns public la cerere, raportări și moderare.
- **Căutare** cu filtre pentru ambele părți (buget, ore, localitate + rază, factură, formă juridică, rating, disponibilitate...)
  și căutare AI în limbaj natural.
- **Promovare inclusă în planuri**: ofertă evidențiată (Pro), profil promovat + „Recomandat” (Business); etichetate, nu modifică scorul.
- **Admin**: funnel de validare, ținte de lansare, moderare, utilizatori, planuri oferite, raportări, emailuri, abonamente.

## Stack

| Componentă | Tehnologie |
|---|---|
| Web + API | Next.js 16 (App Router, Server Actions), React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui |
| Bază de date | PostgreSQL 17 + PostGIS, Drizzle ORM |
| Cozi & cache | Redis + BullMQ (proces `worker` separat) |
| AI | OpenAI API (opțional) |
| Email | Resend (opțional) |
| Plăți | Stripe Checkout + Billing cu **Managed Payments** (Stripe/Link e vânzătorul: TVA, facturi, dispute) |
| Deploy | Docker Compose + Caddy (HTTPS automat) pe VPS |

## Rulare locală

Conturi de test: vezi [`docs/CONTURI-TEST.md`](docs/CONTURI-TEST.md).


Cerințe: Node 22+, pnpm, Docker.

```bash
pnpm install
cp .env.example .env                 # completează APP_SECRET (openssl rand -hex 32)
pnpm services:up                     # Postgres (localhost:5442) + Redis (localhost:6392) în Docker
pnpm db:migrate                      # migrări + categorii + 13.000 de localități
pnpm db:seed-demo                    # opțional: conturi și proiecte demo (parola: parola123)
pnpm dev                             # http://localhost:3000
pnpm worker                          # într-un alt terminal: matching, emailuri, Auto Bid, digest-uri
```

Conturi demo: `admin@demo.ro`, `client@demo.ro`, `dev@demo.ro`, `instalator@demo.ro`, `renovari@demo.ro` etc.

Fără Resend, emailurile (inclusiv linkurile de confirmare) sunt salvate în **`/admin/emailuri`** și afișate în consola `pnpm dev`.
Codurile SMS apar în consolă în modul dezvoltare.

### Comenzi utile

| Comandă | Ce face |
|---|---|
| `pnpm test` | teste Vitest (abonamente, aplicări, concurență) pe o bază de date de test separată |
| `pnpm typecheck` | verificare TypeScript |
| `pnpm db:generate` | generează o migrare după modificarea `src/server/db/schema.ts` |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm build:scripts` | împachetează worker-ul și scriptul de migrare în `dist/` (folosit în Docker) |

## Variabile de mediu

Toate sunt documentate în [`.env.example`](.env.example). Pe scurt:

| Variabilă | Rol |
|---|---|
| `APP_URL`, `APP_NAME`, `APP_SECRET` | URL public (linkuri în emailuri), numele platformei, secret intern |
| `ADMIN_EMAILS` | emailurile care primesc rol de admin la înregistrare |
| `DATABASE_URL`, `REDIS_URL` | conexiunile (în Docker sunt setate automat de `compose.yml`) |
| `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_REASONING_EFFORT` | AI; fără cheie se folosesc reguli simple |
| `RESEND_API_KEY`, `EMAIL_FROM` | emailuri; fără cheie sunt doar salvate în admin |
| `PAYMENTS_ENABLED`, `STRIPE_*` | plăți Stripe; rămân dezactivate în beta |
| `SMS_WEBHOOK_URL`, `SMS_WEBHOOK_TOKEN` | gateway HTTP pentru SMS (POST `{to, text}`) |
| `DOMAIN`, `POSTGRES_PASSWORD` | producție: domeniul pentru Caddy și parola bazei de date |

### Integrări opționale (cu fallback)

- **OpenAI**: fără cheie, builder-ul de proiecte, verificarea de calitate și propunerile folosesc reguli deterministe. Scorul de
  compatibilitate nu depinde niciodată de AI. Există limite zilnice per utilizator și per funcție (tabela `ai_usage`).
- **Resend**: verifică domeniul în Resend, apoi setează `RESEND_API_KEY` și `EMAIL_FROM`.
- **Stripe**: abonamentele se activează **doar din webhook**, niciodată din pagina de succes. Evenimentele sunt procesate o singură dată.
- **SMS**: orice furnizor (SMSLink, SMSO, Twilio printr-un mic adaptor) care primește POST JSON `{ "to": "+407…", "text": "…" }`.

### Autentificare cu Google („Continuă cu Google”)

Butonul apare automat pe paginile de login și înregistrare când sunt setate `GOOGLE_CLIENT_ID` și `GOOGLE_CLIENT_SECRET`.

1. [Google Cloud Console](https://console.cloud.google.com/) → creează un proiect → **APIs & Services → OAuth consent screen**: tip *External*, numele aplicației, emailul de suport, domeniul. Scopes: `openid`, `email`, `profile` (nu necesită verificare Google).
2. **Credentials → Create credentials → OAuth client ID** → *Web application*.
3. **Authorized redirect URIs**: `http://localhost:3000/api/auth/google/callback` (local) și `https://DOMENIUL-TAU/api/auth/google/callback` (producție).
4. Copiază Client ID și Client secret în `.env`, apoi repornește `pnpm dev` / containerele.
5. Cât timp aplicația e în modul *Testing* în consola Google, doar emailurile adăugate la *Test users* se pot autentifica; apasă *Publish app* pentru toată lumea.

Comportament: contul nou are emailul deja confirmat și merge la onboarding; un cont existent cu același email este legat automat (Google a verificat adresa); conturile create cu Google își pot seta o parolă din Setări.

### Stripe în test mode

```bash
# în .env: STRIPE_SECRET_KEY=sk_test_… (sau o cheie restricționată rk_test_…), PAYMENTS_ENABLED=true
stripe listen --forward-to localhost:3000/api/stripe/webhook
# copiază secretul whsec_… afișat în STRIPE_WEBHOOK_SECRET și repornește `pnpm dev`
```

Card de test: `4242 4242 4242 4242`, orice dată viitoare, orice CVC. În producție, adaugă endpoint-ul
`https://DOMENIU/api/stripe/webhook` în Dashboard cu evenimentele: `checkout.session.completed`,
`checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`,
`charge.refunded`, `customer.deleted`, `customer.subscription.created|updated|deleted`, `invoice.paid`.

### Managed Payments (Stripe = vânzătorul oficial)

Cu `STRIPE_MANAGED_PAYMENTS=true`, fiecare Checkout e creat cu `managed_payments.enabled`. Stripe, prin Link, devine
*merchant of record*: calculează și virează TVA-ul, trimite clienților chitanța și factura (PDF), gestionează disputele și
suportul pentru plăți. Tu primești plățile nete (minus comisioane și TVA reținut) pe contul PFA-ului.

1. Contul Stripe se deschide pe PFA (tip „sole proprietor”, CUI-ul PFA).
2. Activează și cere acces în Dashboard → **Settings → Managed Payments** (produsul e în *private preview*, Stripe aprobă contul).
3. Produsele create din aplicație primesc automat codul fiscal `STRIPE_TAX_CODE` (implicit `txcd_10103001`, SaaS – business use)
   și prețuri cu **TVA inclus** (`tax_behavior: inclusive`): 49 lei înseamnă 49 lei plătiți de prestator.
4. Ca prestatorii să poată schimba planul (Pro ↔ Business) din portalul de facturare, creează în Dashboard două prețuri lunare
   recurente, cu TVA inclus și cod fiscal marcat „Eligible for Managed Payments”, pune-le în `STRIPE_PRICE_PRO` / `STRIPE_PRICE_BUSINESS`
   și activează schimbarea planului în Settings → Billing → Customer portal.
5. În Dashboard → Settings → Checkout adaugă linkurile către `/termeni` și `/confidentialitate`; în Business details, emailul de suport.
6. Prestatorii își văd abonamentul și pe link.com. La ștergerea contului, abonamentul Stripe se anulează imediat.

Comision: în jur de 3,5% în plus față de procesarea standard. Pune `STRIPE_MANAGED_PAYMENTS=false` dacă treci pe facturare proprie
(atunci tu emiți facturile și trimiți în e-Factura). Cum facturezi relația PFA ↔ Stripe stabilești cu contabilul.

## Deploy pe VPS

Cerințe: Ubuntu/Debian cu Docker + Docker Compose, un domeniu cu înregistrare A către IP-ul VPS-ului. Recomandat: minimum 2 GB RAM
(limitele de memorie din `compose.yml` totalizează ~3 GB și pot fi reduse).

```bash
git clone <repo> /opt/prestio && cd /opt/prestio
cp .env.example .env
# editează .env: APP_URL=https://domeniu.ro, DOMAIN=domeniu.ro, APP_SECRET, POSTGRES_PASSWORD (puternică),
# ADMIN_EMAILS, eventual OPENAI_API_KEY / RESEND_API_KEY / STRIPE_*
docker compose up -d --build
docker compose logs -f web worker
```

Ce pornește:

- `postgres` (PostGIS) și `redis` — **fără porturi publice**, doar în rețeaua Docker;
- `migrate` — rulează migrările și datele de referință, apoi se oprește; `web` și `worker` pornesc după el;
- `web` — Next.js; `worker` — BullMQ (matching, emailuri, Auto Bid, digest-uri, mentenanță);
- `caddy` — HTTPS automat (Let's Encrypt) pe 80/443, reverse proxy către `web`.

Actualizare: `git pull && docker compose up -d --build`. Starea aplicației: `https://domeniu.ro/api/health`.

### Firewall

```bash
ufw default deny incoming && ufw default allow outgoing
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp
ufw enable
```

> Docker poate ocoli `ufw` pentru porturile publicate; din acest motiv doar Caddy publică porturi (80/443).

### Backup și restaurare

```bash
chmod +x infra/scripts/backup.sh
crontab -e
# 15 3 * * * cd /opt/prestio && ./infra/scripts/backup.sh >> /var/log/prestio-backup.log 2>&1
```

Scriptul face `pg_dump` (comprimat) și arhivează fișierele încărcate, păstrând ultimele 14 zile în `./backups`. Copiază periodic
directorul pe alt server (ex. `rclone` sau `rsync`).

**Testează restaurarea** (lunar):

```bash
docker compose exec postgres createdb -U prestio prestio_restore
gunzip -c backups/prestio-AAAA-LL-ZZ_HHMM.sql.gz | docker compose exec -T postgres psql -U prestio -d prestio_restore
docker compose exec postgres psql -U prestio -d prestio_restore -c "select count(*) from users;"
docker compose exec postgres dropdb -U prestio prestio_restore
```

## Reguli de business (rezumat)

Configurabile în `src/config/site.ts`:

| Regulă | Valoare |
|---|---|
| Publicare proiect | gratuit (email confirmat obligatoriu) |
| Planuri prestatori | Gratuit 0 lei (5 aplicări/lună) · Pro 49 lei (40, Auto Bid) · Business 149 lei (200, profil promovat) |
| Perioada limitei | luna calendaristică (Gratuit); perioada de facturare (Pro, Business) |
| Recomandare reușită | 30 de zile de Pro gratuit pentru cel care a recomandat |
| Locuri de aplicare / proiect | 5 (max. 2 automate), extensibil de client până la 15 |
| Fereastră doar-manual înainte de Auto Bid | 30 minute |
| Restituire aplicare | proiect fraudulos/eliminat; oferta nedeschisă de client în 7 zile |
| Recenzii | doar după colaborare confirmată |

Platforma **nu intermediază plata lucrărilor**: clientul și prestatorul își stabilesc direct condițiile.

## Structura proiectului

```
src/app/            pagini și Server Actions (rute în română: /proiecte, /prestatori, /panou, /admin …)
src/app/api/        rute API: localități, fișiere, webhook Stripe, health
src/components/     UI (shadcn în components/ui)
src/config/site.ts  reguli de business, prețuri, etichete
src/server/         logica de business: auth, billing, matching, applications, projects, autobid, chat, trust, ai, notifications
src/worker/         procesul BullMQ
src/scripts/        migrate, seed-reference, seed-demo
db/migrations/      migrări SQL (Drizzle)
db/seed-data/       taxonomie și localități
infra/              Caddyfile, init Postgres, script de backup
tests/              teste Vitest
```

## Teste

```bash
pnpm services:up
pnpm test
```

Testele creează automat baza `prestio_test` și verifică regulile de business: limita lunară a planurilor (inclusiv aplicări simultane),
restituiri, planuri oferite, sincronizarea abonamentelor din webhook, Managed Payments, limita de locuri la aplicări simultane,
Auto Bid doar pe planurile plătite și blocarea clienților neverificați.

Localitățile provin din [romania/localitati](https://github.com/romania/localitati) (licență WTFPL).
