# Roadmap blog și SEO: contractez.ro

Document viu: ce publicăm, când, ce urmărim după publicare. Cercetarea de bază e în [SEO-KEYWORDS.md](./SEO-KEYWORDS.md).

## 1. Ce e publicat

| Articol | Cuvânt cheie principal | Categoria legată | Publicat | De reîmprospătat |
|---|---|---|---|---|
| [verificare-iscir-revizie-centrala-termica](/blog/verificare-iscir-revizie-centrala-termica) | verificare ISCIR centrală termică | instalatii-termice | oct 2026 | sept 2027 (înainte de sezonul rece); imediat dacă ISCIR schimbă PT A1 / PT CR 2 |
| [cadastru-intabulare-acte-necesare-cost](/blog/cadastru-intabulare-acte-necesare-cost) | acte necesare cadastru și intabulare | topografie-cadastru | oct 2026 | la orice ordin ANCPI nou de tarife; verifică dacă e-Terra a revenit online |
| [model-contract-renovare-avans-mesterias](/blog/model-contract-renovare-avans-mesterias) | model contract renovare apartament | renovari-complete | oct 2026 | anual; revizuit de un avocat înainte de promovare |
| [cat-costa-refacere-instalatie-electrica-apartament](/blog/cat-costa-refacere-instalatie-electrica-apartament) | cât costă refacerea instalației electrice | instalatii-electrice | oct 2026 | ianuarie 2027 (prețuri) |
| platforme-freelancing-romania | platforme freelancing România | (prestatori) | oct 2026 | la 6 luni (comisioanele platformelor se schimbă des) |
| cat-costa-renovare-baie | cât costă renovarea unei băi | renovari-complete | oct 2026 | ianuarie 2027 |
| traducere-autorizata-vs-legalizata | traducere autorizată vs legalizată | traduceri | oct 2026 | anual; la orice schimbare privind apostila |
| cat-costa-o-mutare | cât costă o mutare | mutari | oct 2026 | martie 2027 (înainte de sezon) |
| cat-costa-montaj-centrala-termica | cât costă montajul unei centrale termice | instalatii-termice | oct 2026 | sept 2027; la schimbarea PT ISCIR (PT CR 2-2025) |
| pret-manopera-gresie-faianta-mp | preț manoperă gresie faianță mp | gresie-faianta | oct 2026 | ianuarie 2027 (prețuri) |
| cum-verifici-un-mester-inainte-sa-l-angajezi | cum verifici un meșter / o firmă | renovari-complete | oct 2026 | anual; la schimbări ONRC/ANAF/ANRE |
| pret-fotograf-nunta-2027 | cât costă un fotograf de nuntă 2027 | fotografie | oct 2026 | decembrie 2026 (înainte de vârful ian–mar); apoi `pret-fotograf-nunta-2028` |

## 2. Calendar editorial (următoarele articole)

Regulă: un articol pe săptămână în primele 3 luni, apoi 2 pe lună plus reîmprospătări. Publicăm **cu 6–8 săptămâni înainte de vârful sezonier**, ca Google să aibă timp să indexeze.

| Când publicăm | Subiect (slug propus) | De ce acum | Leagă la |
|---|---|---|---|
| dec 2026 | `pret-dj-nunta-2027` (fotograful e publicat) | rezervările de nuntă au vârf în ian–mar | muzica-dj |
| dec 2026 | `cat-costa-cadastru-teren` (separat de apartament) | cerere mare în rural/periurban | topografie-cadastru |
| ian 2027 | `barometru-preturi-renovari-2027` (date proprii din oferte) | link bait pentru presă, după primele 2–3 luni de date | renovari-complete |
| ian 2027 | `contabil-pfa-cat-costa` | început de an fiscal, declarația unică | contabilitate |
| feb 2027 | `cat-costa-zugravitul-unui-apartament` | renovări de primăvară | finisaje |
| mar 2027 | `cat-costa-montajul-aerului-conditionat` | vârf apr–iul | aer-conditionat + orașe |
| mar 2027 | `cat-costa-panouri-fotovoltaice-casa` (cu programul Casa Verde, dacă e activ) | sezon de montaj, programe de finanțare | panouri-solare |
| apr 2027 | `dezinsectie-bloc-asociatie-proprietari` | sezon de insecte; clienți B2B (asociații) | dezinsectie |
| apr 2027 | `cat-costa-curatenia-dupa-constructor` | sezon de renovări și mutări | curatenie |
| mai 2027 | `meditatii-pret-ora-evaluare-bac` | vârful meditațiilor înainte de examene | meditatii |
| iun 2027 | `cat-costa-un-site-de-prezentare` | cerere constantă, partea B2B | site-prezentare |

Idei de rezervă: renovare bucătărie, schimbare țevi bloc, termoizolație casă preț mp, acoperiș preț mp, montaj parchet, debarasare apartament, reparații mașini de spălat (cost vs. aparat nou), grădinărit abonament, dresaj câini preț.

## 3. Checklist pentru fiecare articol nou

1. **Cuvântul cheie**: verifică SERP-ul (cine rankează, cât de vechi sunt paginile). Scrie doar dacă poți face o pagină mai bună decât primele 3.
2. **Fișierul** `src/content/blog/<slug>.mdx`:
   - prima linie: `{/* SURSE: ... */}` cu sursele verificate (oficiale pentru orice afirmație legală);
   - primul paragraf răspunde direct la întrebare (2–3 propoziții), apoi detaliile;
   - un tabel de prețuri; prețurile **trebuie să fie compatibile** cu ghidul categoriei din `src/content/category-guides/`;
   - `## Întrebări frecvente` cu 5–6 întrebări reale („Cât costă…?”, „Cât durează…?”);
   - 2 × `<Cta>` și 2–3 × `<Callout>`;
   - linkuri interne: categoria principală, 2–3 pagini pe oraș indexate, 1 articol înrudit.
3. **Înregistrarea** în `src/content/blog/posts.ts` (titlu ≤ 62 caractere, descriere 130–155). Fără ea pagina dă 404.
4. **Verificare locală**: `pnpm dev`, deschide articolul pe desktop și mobil (tabelele derulează în interiorul chenarului).
5. **După deploy**: Search Console → Inspecție URL → „Solicită indexarea”. IndexNow (Bing) rulează automat la deploy.
6. **Distribuție**: un răspuns util pe un forum sau grup unde se pune exact întrebarea din articol (link la articol, nu la homepage).

## 4. Ce urmărim (lunar, în Search Console)

| Metrică | Unde | Ce facem cu ea |
|---|---|---|
| Afișări și poziție medie pe pagină | Performanță → Pagini | Paginile cu poziție 8–20 primesc prioritate la îmbunătățire (secțiuni noi, FAQ, linkuri interne) |
| Interogări noi pentru care apărem | Performanță → Interogări, filtrat pe pagină | Interogările reale devin întrebări în FAQ sau titluri `###` |
| CTR sub 2% cu poziție ≤ 10 | Performanță | Rescriem `title` și `description` în `posts.ts` sau în ghidul categoriei |
| Pagini excluse / „Accesată, neindexată” | Indexare → Pagini | Dacă apar paginile pe oraș: le îmbogățim sau le scoatem din `indexedCityPages` |
| Core Web Vitals | Experiență | Investigăm doar dacă apar URL-uri „slabe” |

Și în aplicație (`/admin`): câte proiecte vin din fiecare categorie și oraș. Paginile care aduc proiecte reale primesc linkuri interne în plus.

## 5. Paginile pe oraș: reguli de extindere

- Configurația e în `src/content/cities.ts`; combinațiile indexate din start sunt în `indexedCityPages`.
- **Valul 2 (22.10.2026)**: cadastru și centrale termice în toate cele 19 orașe din afara Bucureștiului, traduceri în 10 orașe mari.
  Fiecare are un bloc local concret și o întrebare frecventă locală: OCPI cu adresă (`city-facts.ts`), distribuitorul de gaze și
  inspecția teritorială ISCIR, curtea de apel pentru traducători (`city-authorities.ts`). Un test verifică că orice combinație indexată
  pentru aceste servicii are datele locale. Regula rămâne: **un serviciu nou intră în index pe toate orașele doar cu un fapt local verificat**.
- **Promovăm o combinație în index** când: are afișări în GSC deși e `noindex` (oamenii o caută), SAU are prestatori reali în zonă (se indexează automat), SAU putem adăuga informație locală reală (cartiere, distribuitor, OCPI).
- **Scoatem din index** o combinație care după 3 luni are 0 afișări și 0 prestatori.
- Valul 2 de orașe (după 3 luni): Alba Iulia, Deva, Râmnicu Vâlcea, Focșani, Piatra Neamț, Botoșani, Târgoviște, plus localitățile periurbane (Florești, Bragadiru, Chiajna, Dumbrăvița, Popești-Leordeni).
- București: pagini pe sectoare doar după ce există prestatori pe sectoare.

## 6. Reîmprospătare

- **Ianuarie, în fiecare an**: actualizăm prețurile din `src/content/category-guides/` și din articolele „cât costă”, plus `guidesUpdated`, `guidesUpdatedIso` (devine `lastmod` în sitemap și `dateModified` în JSON-LD) și câmpul `updated` din `posts.ts`.
- De verificat la reîmprospătarea din ianuarie 2027 (semnalate la scrierea articolelor din 22.10.2026): `fotografie` (pachetul de o zi ar putea urca la 8.000–9.000 lei), `filmare` (videograf nuntă 2.500–5.000 lei pare sub sondajul Fotografi-Cameramani.ro), `gresie-faianta` (demontarea plăcilor 25–45 lei/mp vs. 13–25 în alte surse; lipsesc rândurile pentru porțelanat rectificat și mozaic).
- **La schimbări legislative** (ISCIR, ANRE, ANCPI, prag cerere cu valoare redusă): actualizăm articolul în aceeași săptămână. Sunt tocmai subiectele unde concurența rămâne în urmă.
- După primele 3 luni de date reale: înlocuim treptat intervalele „din oferte publice” cu medianele din ofertele de pe Contractez (și o spunem explicit, e un avantaj de încredere).

## 7. Off-page (în paralel cu conținutul)

- [ ] Search Console: sitemap trimis; Bing Webmaster Tools: site importat din GSC
- [ ] Comunicat de lansare: StartupCafe, Start-up.ro, Wall-Street.ro, Profit.ro
- [ ] Directoare de firme (după ce există entitatea juridică): ListaFirme, Cylex, Pagini Aurii
- [ ] Răspunsuri utile pe forum.softpedia.com, avocatnet.ro, grupuri Facebook de renovări (cu link la articole)
- [ ] Badge „Prestator verificat pe Contractez” pentru site-urile prestatorilor
- [ ] Modelul de contract și în format DOCX/PDF descărcabil (link bait)
- [ ] Primul „Barometru al prețurilor” (ian 2027)
- Fără Google Business Profile pentru Contractez (afacere doar online, nepermis de Google)
