# Conturi de test (doar pentru dezvoltare locală)

Aplicația: **http://localhost:3000** · Autentificare: **http://localhost:3000/autentificare**

Parola pentru toate conturile: **`parola123`**

| Email | Rol | Ce poți testa |
|---|---|---|
| `admin@demo.ro` | **Administrator** + client | Panou admin: http://localhost:3000/admin (indicatori, moderare proiecte, utilizatori, raportări, emailuri, plăți) |
| `client@demo.ro` | Client (Cluj-Napoca, telefon verificat) | `/panou`, `/proiecte/nou`, `/proiectele-mele`, oferte primite, chat, colaborări |
| `client2@demo.ro` | Client (București) | Proiecte de renovare și SEO |
| `dev@demo.ro` | Prestator — dezvoltare web (Cluj, PFA), **plan Pro** (oferit) | `/panou`, `/recomandari`, `/aplicarile-mele`, `/abonament`, `/auto-bid`, `/profil`, card QR |
| `designer@demo.ro` | Prestator — design (Iași, persoană fizică), **plan Pro** | Profil fără firmă, Auto Bid |
| `seo@demo.ro` | Prestator — SEO & reclame (București, SRL), **plan Business** | Profil promovat, recomandări remote |
| `instalator@demo.ro` | Prestator — instalații (Cluj, la fața locului, 40 km), **plan Gratuit** | Matching după distanță, limita de 5 aplicări |
| `electrician@demo.ro` | Prestator — electrician (Florești CJ, 30 km) | Matching după distanță |
| `renovari@demo.ro` | **Ambele roluri** (client + prestator) | Panou cu două tab-uri |

## Utile
- **Emailurile** (confirmare cont, resetare parolă, alerte) nu se trimit real fără cheie Resend. Le vezi în **http://localhost:3000/admin/emailuri** (cont admin), cu linkurile clicabile.
- **Cod SMS** pentru verificarea telefonului: apare în consola serverului (`pnpm dev`).
- **Planuri:** plățile sunt oprite în beta, dar poți oferi oricui Pro sau Business din `/admin/utilizatori` → Detalii → „Oferă planul”.
- **Resetare date demo:** `pnpm db:seed-demo` (refă conturile și proiectele; nu șterge ce ai creat tu).
- Dacă primești „Prea multe încercări”, limita de login e 10 încercări / 5 minute pe IP. Resetare:
  `docker compose exec redis sh -c "redis-cli --scan --pattern 'rl:*' | xargs -r redis-cli del"`

> ⚠️ Aceste conturi nu trebuie create în producție. Pe VPS nu rula `pnpm db:seed-demo`.

## Login cu Google
Butonul „Continuă cu Google” apare doar după ce setezi `GOOGLE_CLIENT_ID` și `GOOGLE_CLIENT_SECRET` în `.env` (pași în README → „Autentificare cu Google”). Dacă te loghezi cu Google pe un email care există deja aici, contul se leagă automat.
