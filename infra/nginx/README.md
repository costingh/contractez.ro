# nginx pe VPS (contractez.ro)

Copiile versionate ale configurației nginx de pe VPS (`draftly-vps`, nginx 1.24, host partajat cu alte proiecte).
Pe server, sursa de adevăr rămâne `/etc/nginx/`; fișierele de aici se copiază manual.

| Fișier aici | Pe VPS |
|---|---|
| `contractez-cache.conf` | `/etc/nginx/conf.d/contractez-cache.conf` (context `http`) |
| `contractez.ro.conf` | `/etc/nginx/sites-available/contractez.ro` (link în `sites-enabled`) |
| `cloudflare-realip.conf` | `/etc/nginx/snippets/cloudflare-realip.conf` (inclus doar în serverul contractez.ro) |

## Ce face cache-ul

- **`/_next/static/`**: fișierele de build (cu hash în nume, imutabile) rămân 30 de zile în cache-ul nginx, fără drum până la Node.
- **Microcache 60 s** pentru paginile publice de conținut (`/`, `/categorii/**`, `/orase/**`, `/blog/**`, `/ghid-preturi`, `/despre`,
  `/cum-functioneaza`, `/preturi`, `/termeni`, `/confidentialitate`, `/contact`, `llms*.txt`, `sitemap.xml`, `robots.txt`),
  **doar** pentru cererile fără niciun cookie și care nu vin de la crawlere. Expirarea se reîmprospătează în fundal
  (`proxy_cache_background_update`), deci vizitatorul primește mereu răspunsul din cache.

Ce **nu** intră în cache, intenționat:
- orice cerere cu cookie (sesiune, acord cookie-uri, VisitTrack, Crisp): răspuns personalizat;
- crawlerele (Googlebot, GPTBot, ClaudeBot…): `src/proxy.ts` le raportează la VisitTrack, deci trebuie să ajungă la aplicație;
- profilurile de prestatori și proiectele (`/prestatori/*`, `/proiecte/*`): numără vizualizările la randare;
- orice răspuns cu `Set-Cookie`, orice metodă în afară de GET/HEAD, orice cod în afară de 200/404.

## Aplicare

```sh
scp infra/nginx/contractez-cache.conf draftly-vps:/etc/nginx/conf.d/contractez-cache.conf
scp infra/nginx/contractez.ro.conf draftly-vps:/etc/nginx/sites-available/contractez.ro
ssh draftly-vps 'cp /etc/nginx/sites-available/contractez.ro /root/contractez.ro.nginx.bak.$(date +%F) 2>/dev/null; mkdir -p /var/cache/nginx/contractez && nginx -t && systemctl reload nginx'
```

(Fă backup-ul înainte de `scp` dacă vrei să păstrezi versiunea veche.) `nginx -t` validează tot serverul, inclusiv celelalte site-uri;
dacă eșuează, nu se face reload și site-urile rămân neatinse.

## Verificare

```sh
curl -sI https://contractez.ro/blog | grep -i x-cache               # MISS, apoi HIT
curl -sI -H 'Cookie: a=b' https://contractez.ro/blog | grep -i x-cache   # BYPASS
curl -sI -A Googlebot https://contractez.ro/blog | grep -i x-cache       # BYPASS
```

Golirea cache-ului (de exemplu după o schimbare urgentă de conținut, deși expiră singur în 60 s):
`ssh draftly-vps 'rm -rf /var/cache/nginx/contractez/* && systemctl reload nginx'`.
