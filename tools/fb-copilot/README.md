# Contractez Copilot (extensie Chrome, locală)

Un **asistent**, nu un bot. Extensia:

- **citește** postările și comentariile din grupurile Facebook pe care **tu** le-ai derulat deja pe ecran (sau le-ai deschis);
- le **trimite** în loturi serverului Contractez (`/api/outreach/ingest`), unde sunt clasificate de AI;
- **afișează** un chip mic pe fiecare postare/comentariu („Client 82”, „Prestator 64”, „Irelevant”, „Contactat”…);
- **verifică** în Messenger dacă ai mai vorbit cu persoana și îți arată un banner.

Extensia **nu** dă click pe nimic (nici pe „Vezi mai mult”, nici pe „Vezi mai multe comentarii”), **nu** derulează,
**nu** navighează, **nu** scrie și **nu** trimite mesaje. Nu lucrează pe tab-uri pe care nu le vezi. Mesajul îl
copiezi din `/admin/leads`, îl lipești în Messenger și apeși tu „Trimite”.

Contractul cu serverul: [`docs/OUTREACH.md`](../../docs/OUTREACH.md).

---

## 1. Instalare

1. Deschide `chrome://extensions`.
2. Activează **Developer mode** (dreapta-sus).
3. **Load unpacked** → alege folderul `tools/fb-copilot/` din acest repo.
4. Fixează extensia în bară (iconița de puzzle → pin la „Contractez Copilot”).

La prima instalare se deschide automat pagina de **Opțiuni**.

După ce modifici fișierele extensiei: `chrome://extensions` → butonul ⟳ de pe card, apoi **refresh (F5)** pe tab-urile
Facebook deschise. (Altfel panoul arată „Extensia a fost reîncărcată — dă refresh paginii”.)

## 2. Configurare

1. Pe server, în mediul aplicației, setează `OUTREACH_TOKEN` (minim 24 de caractere), de ex.:
   ```sh
   openssl rand -hex 32
   ```
   Fără `OUTREACH_TOKEN`, API-ul `/api/outreach/*` răspunde **503**.
2. În extensie → **Opțiuni**:
   - **URL de bază**: `https://contractez.ro` (implicit) sau `http://localhost:3000` pentru dezvoltare.
     Alte origini nu merg fără a le adăuga în `host_permissions` din `manifest.json`.
   - **Token**: valoarea `OUTREACH_TOKEN`. Rămâne doar în acest browser (`chrome.storage.local`, nu se sincronizează).
   - **Testează conexiunea** → trebuie să vezi „Conectat… Tokenul este valid”.

## 3. Fluxul zilnic

1. Deschide un grup Facebook (`facebook.com/groups/...`). În stânga-jos apare panoul **Contractez Copilot**.
   - Dacă ai intrat în grup din altă pagină Facebook (feed, notificări) și panoul nu apare, apasă **F5** o dată:
     Chrome injectează extensia doar la încărcarea unei pagini de grup.
2. **Derulează normal.** Tot ce ajunge pe ecran e citit și trimis în loturi (max 50, la ~3 s). Panoul arată:
   **Citite** / **Trimise noi** / **Duplicate** pentru sesiunea curentă și ultima eroare.
3. Ca să incluzi și comentariile, deschide tu postarea / „Vezi mai multe comentarii”. Extensia nu le deschide singură.
   Postările trunchiate („… Vezi mai mult”) sunt ținute ~15 s: dacă apeși tu „Vezi mai mult”, se trimite textul complet;
   altfel se trimite ce e vizibil.
4. Chip-urile se actualizează la ~10 s. Ce înseamnă:

   | Chip | Semnificație |
   |---|---|
   | `În coadă…` / `Se trimite…` / `Aștept textul…` | încă netrimis la server |
   | `Nou…` | primit, așteaptă clasificarea AI |
   | `Client 82` (verde) | caută prestator — scor 82/100 |
   | `Prestator 64` (albastru) | oferă servicii |
   | `Irelevant` / `Ignorat` / `Anonim` (gri) | nu e de contactat |
   | `Contactat` (mov) | i-ai scris prin copilot |
   | `Deja contactat` / `… · contactat` (portocaliu) | persoana a mai fost contactată |
   | `A răspuns`, `Înscris` | progres după contact |

   Click pe chip → deschide `/admin/leads` într-un tab nou.
5. Deschide **`/admin/leads`**, alege lead-urile cu scor bun, copiază mesajul personalizat.
6. Deschide conversația Messenger cu persoana (`facebook.com/messages/t/...`). Extensia verifică istoricul:
   - banner **roșu** „Ai mai vorbit cu această persoană — nu trimite mesajul de outreach” → **nu trimite**;
   - banner discret „Prima conversație” → lipește mesajul și trimite-l **tu**;
   - banner galben „Nu am putut verifica istoricul” → derulează conversația și verifică manual.
7. Marchează lead-ul „contactat” în `/admin/leads` **înainte** de a redeschide conversația
   (altfel, la redeschidere, serverul vede istoric și marchează persoana „already_contacted”).

**Pauză**: din panou sau din popup (click pe iconița extensiei). În pauză extensia nu citește și nu trimite nimic
(badge `II`).

## 4. Limite și reguli de siguranță

- **Max ~20 de mesaje pe zi** (limita serverului `OUTREACH_DAILY_CAP`, implicit 20). Nu trimite în rafală;
  lasă minute între mesaje și personalizează-le.
- Nu trimite niciodată mesaj cuiva cu banner roșu sau chip „Deja contactat”.
- Extensia **nu** automatizează nimic pe Facebook; dacă vreodată vezi că face click, derulează sau scrie singură,
  dezactiveaz-o — e un bug. (Testul `test/manifest.test.mjs` verifică static că nu există `click()`,
  `dispatchEvent`, `scrollTo`, `execCommand`, `focus()` etc. în content scripts.)
- Date trimise: doar de pe paginile de grup și din conversațiile Messenger (service worker-ul respinge mesajele venite
  din alte URL-uri). Doar ce e deja randat pe ecran.
- Nu rulează pe tab-uri ascunse; fiecare scanare e limitată (throttle ~1,2 s, `requestIdleCallback`, max 30 articole/scanare).
- Chip-urile, panoul și bannerul folosesc **shadow DOM** — nu ating stilurile Facebook. Chip-ul e inserat inline după
  numele autorului; panoul și bannerul sunt `position: fixed`, în afara arborelui Facebook.

### Decizii de comportament

- **Postări anonime** („Anonim…”, „Participant anonim”, „Anonymous participant”): **sunt trimise** fără
  `authorProfileUrl`, iar serverul le marchează `skipped` (chip „Anonim”). Așa nu sunt recitite.
- **Postări fără autor găsit** (dar nu anonime) sau **fără id / text**: **nu sunt trimise**. Probabil selectorii sunt
  depășiți; dacă le-am trimite, serverul le-ar marca definitiv `skipped`. După reparare, vor fi citite corect.
- **Cache local**: ultimele ~20.000 de `fbItemId` trimise (LRU în `chrome.storage.local`) nu se mai retrimit între
  sesiuni. „Golește cache-ul” din Opțiuni le retrimite (serverul le numără ca duplicate).
- **groupId**: id-ul numeric din permalinkuri, dacă îl găsim; altfel segmentul din URL (slug-ul grupului).
- **Messenger**: raportează o singură dată per conversație per încărcare de pagină, doar când e sigur
  (conversația încărcată și goală ≥ 2,5 s = fără istoric; orice rând de mesaj = istoric). Dacă nu e sigur, nu raportează.

## 5. Când Facebook schimbă DOM-ul

Toată „cunoașterea” DOM-ului e în **`extract.js`** (grupuri) și în blocul `MSEL` / `INTRO_*` din
**`content-messenger.js`** (Messenger).

1. **Diagnostic.** Pe o pagină de grup, deschide DevTools → Console → în lista de contexte (sus, „top”) alege
   **Contractez Copilot**. Rulează:
   ```js
   const X = ContractezExtract;
   X.findArticles(document.querySelectorAll(X.SEL.roots)).map(({ el, kind }) => {
     const snap = X.snapshotArticle(el, { kind, groupAliases: [location.pathname.split('/')[2]] });
     return { kind, result: X.buildItem(snap), snap };
   });
   ```
   Vezi pentru fiecare articol fie `item`, fie `skip: 'no-id' | 'no-author' | 'no-text'`, plus instantaneul citit.
2. **Unde repari:**
   - nu se găsește niciun articol → `SEL.roots` / `SEL.article` (azi: `[role="feed"]`, `[role="dialog"]`,
     `[role="article"]`, `[aria-posinset]`);
   - `no-id` → `parsePostLink` / `parseCommentLink` (formele de permalink: `/groups/<gid>/posts/<id>`,
     `/permalink/<id>`, `story_fbid=`, `set=gm.<id>`, `/posts/pfbid…`, `comment_id=`, `reply_comment_id=`);
   - `no-author` → `parseProfileUrl`, `SEL.heading`, `RESERVED_PATHS`;
   - `no-text` → `SEL.message` (`[data-ad-preview="message"]`, `[data-ad-comet-preview="message"]`,
     `[data-ad-rendering-role="story_message"]`), `SEL.autoText`, `UI_NOISE`;
   - comentarii tratate ca postări → `RE.commentLabel` (aria-label „Comment by …” / „Comentariu de la …”) și
     `isCommentElement`;
   - timp / nr. comentarii → `TIME_PATTERNS`, `RE.commentCount`.
3. **Adaugă un test** în `test/extract.test.mjs` cu noul format (instantaneu sau URL), apoi:
   ```sh
   cd tools/fb-copilot && node --test
   ```
4. `chrome://extensions` → ⟳ pe extensie → F5 pe Facebook.

Messenger: dacă bannerul rămâne pe „Verific…” sau apare galben, verifică `MSEL.composer` (câmpul de scris = conversația
s-a încărcat) și `MSEL.rows` / `MSEL.messageList`. Dacă o conversație goală e raportată ca având istoric, ajustează
`INTRO_STRONG` (rândurile „de sistem” din antetul unei conversații noi).

## 6. Fișiere

| Fișier | Rol |
|---|---|
| `manifest.json` | MV3: `storage`, host-uri `facebook.com`, `contractez.ro`, `localhost:3000` |
| `background.js` | service worker: loturi, cache LRU, apeluri API cu `Authorization: Bearer`, badge/erori |
| `extract.js` | heuristici DOM + helperi puri (testabili în Node) |
| `content-group.js` | observă grupurile, chip-uri, panoul plutitor |
| `content-messenger.js` | detectează istoricul conversației, banner |
| `popup.html/.js` | conexiune, contoarele zilei, pauză, link `/admin/leads` |
| `options.html/.js` | URL de bază, token, test conexiune, golire cache |
| `icons/` | generate cu `sips` din `public/brand/contractez-mark-1024.png` |
| `test/` | `node --test`: extracție (fără DOM; jsdom nu e în proiect) + validare manifest/reguli de siguranță |
