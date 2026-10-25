# Outreach copilot (Facebook) — contract

Un asistent, NU un bot: extensia citește doar ce utilizatorul a derulat deja pe ecran, serverul clasifică și scrie
mesaje personalizate, iar **omul** lipește mesajul în Messenger și apasă Enter. Extensia nu scrie și nu trimite.
În tab-ul Messenger deschis din coadă: apasă „Începe conversația”, marchează lead-ul după ce omul trimite și mută
tab-ul la următorul lead (cu mesajul copiat în clipboard). Limită zilnică de mesaje (implicit 20). Limită zilnică de mesaje (implicit 20).

## Componente
- `tools/fb-copilot/` — extensie Chrome MV3, instalată local („Load unpacked”), nepublicată.
- Server (aplicația Next): tabel `outreach_leads`, API `/api/outreach/*`, worker care clasifică cu AI, pagina `/admin/leads`.

## Autentificare extensie → server
Header `Authorization: Bearer <OUTREACH_TOKEN>` (variabilă de mediu pe server; utilizatorul o lipește în pagina de
opțiuni a extensiei, împreună cu URL-ul de bază, implicit `https://contractez.ro`). Fără token valid → 401.
Cererile pleacă din service worker-ul extensiei (host_permissions pentru domeniu), nu din content script → fără CORS.

## Identitatea unei persoane (`personKey`)
Normalizată pe server din URL-ul profilului:
- `facebook.com/profile.php?id=123` → `id:123`
- `facebook.com/groups/<gid>/user/123/` → `id:123`
- `facebook.com/<username>` → `u:<username>` (lowercase, fără query)
Dacă extensia trimite `authorFbId`, are prioritate: `id:<authorFbId>`.

## Endpoint-uri

### POST /api/outreach/ingest
```json
{
  "groupId": "252706105062924",
  "groupName": "Freelancer Romania - Social Media Romania",
  "items": [
    {
      "fbItemId": "post:1234567890" ,
      "kind": "post",
      "parentPostId": null,
      "authorName": "Ion Popescu",
      "authorProfileUrl": "https://www.facebook.com/groups/252706105062924/user/1000123/",
      "authorFbId": "1000123",
      "text": "Caut un social media manager pentru ...",
      "permalink": "https://www.facebook.com/groups/252706105062924/posts/1234567890/",
      "postedAtText": "18 hours ago",
      "commentCount": 77
    }
  ]
}
```
- max 50 items/cerere; `kind` = `post` | `comment`; pentru comentarii `fbItemId` = `comment:<id>` și `parentPostId` = id-ul postării.
- Itemii existenți (după `fbItemId`) sunt ignorați — nu se reprocesează niciodată.
- Itemii anonimi („Anonim…”, „Anonymous participant”) sau fără `authorProfileUrl` sunt salvați cu `status = "skipped"`.
- Răspuns: `{ "accepted": 3, "duplicates": 12, "leads": [{ "fbItemId": "...", "status": "new", "type": null, "score": null }] }`

### GET /api/outreach/status?ids=post:1,comment:2,...
Max 100 id-uri. Răspuns: `{ "leads": [{ "fbItemId", "status", "type", "score", "personContacted": true|false }] }`
(pentru chip-urile afișate de extensie peste postări).

### POST /api/outreach/thread
```json
{ "threadUrl": "https://www.facebook.com/messages/t/1000123", "authorFbId": "1000123", "authorProfileUrl": null, "hasHistory": true }
```
Când utilizatorul deschide o conversație. Dacă `hasHistory` (există deja mesaje în conversație) și persoana nu e marcată
`contacted` prin copilot → toate lead-urile persoanei devin `already_contacted`.
Răspuns: `{ "known": true, "personKey": "id:1000123", "status": "already_contacted", "leadId": "..." }`

### Coada din extensie
- `GET /api/outreach/queue?type=client|provider&minScore=0..100` → `{ sent, cap, remaining, capReached, lead: { id, authorName, messengerUrl, message } | null }`
  (`lead` e null la limita zilnică sau cu coada goală).
- `POST /api/outreach/queue/sent { leadId }` → marchează trimis (ca „Am trimis”); 409 la limită / deja contactat, 404 lead inexistent.
- `POST /api/outreach/queue/skip { leadId }` → `skipped`.
- `POST /api/outreach/thread` primește și `leadId` (opțional) din tab-ul cozii: identifică persoana când URL-ul conversației
  nu o face (conversații criptate `/messages/e2ee/t/...`).

Pagina `/admin/leads/coada` vorbește cu extensia prin `window.postMessage` (`cz-ping`/`cz-pong`, `cz-open-lead`), prin
`content-queue.js`; fără extensie, tasta C deschide Messenger cu `window.open` ca înainte.

## Statusuri lead
`new` (așteaptă AI) → `scored` → `contacted` / `skipped` / `already_contacted` → `replied` → `signed_up`.
`irrelevant` = clasificat de AI ca fără legătură.

## Clasificare AI (worker, loturi de ~20)
Pentru fiecare item: `type` (`client` caută prestator / `provider` oferă servicii / `irrelevant`), `categorySlug` (din taxonomie),
`locality` (dacă apare), `score` 0–100 (prospețime, claritate, buget, potrivire cu categoriile cu prestatori), `reason` (scurt),
`message` — mesaj personalizat în română, pornind de la șabloanele din `src/server/outreach/templates.ts`, care face referire
concretă la postarea persoanei, cu link UTM (`utm_source=facebook&utm_medium=dm&utm_campaign=<groupId>`).
