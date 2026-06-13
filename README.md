# Sardinia NE · Posada — PWA itinerariu

Aplicație web (PWA) pentru telefon, **offline-first**, cu itinerariu pe zile și **bife salvate în cloud** (Cloudflare KV), ca să le vezi pe toate device-urile tale.

- Frontend: vanilla (fără build) — `public/`
- Backend: Cloudflare Pages Functions — `functions/api/` (`GET /api/state`, `POST /api/toggle`)
- Stocare: Cloudflare Workers **KV**, namespace `TRIP_STATE`, cheia `state:sardinia-ne`

```
sardinia-ne/
├─ public/                 ← ce se vede în browser (static)
│  ├─ index.html  app.js  styles.css  sw.js  manifest.webmanifest  icon.svg
├─ functions/api/          ← mini-API (rulează pe Cloudflare)
│  ├─ state.js   (GET /api/state)
│  └─ toggle.js  (POST /api/toggle)
└─ wrangler.toml           ← config Cloudflare (aici pui ID-ul de KV)
```

---

## Separare totală de celelalte proiecte

Acest proiect e **complet independent** de aplicația de inventar cofetării, de cea de evenimente sau de orice altceva. Concret:

- **Git:** folder propriu (`Desktop/sardinia-ne`) cu repo `git` propriu și **fără niciun remote** spre alt proiect. Când îl pui pe GitHub, **creează un repo NOU** — nu împinge în unul existent (vezi mai jos).
- **Cloudflare Pages:** proiect nou cu nume unic `sardinia-ne`. ⚠️ La **primul** `wrangler pages deploy`, când te întreabă, alege **„Create a new project"** — NU selecta un proiect existent. Astfel nu atinge app-urile tale deja publicate.
- **Stocare KV:** namespace dedicat (`TRIP_STATE`, titlu `sardinia-ne-TRIP_STATE`), separat de orice KV folosit de alte app-uri.
- Contul Cloudflare e același (ai unul singur), dar proiectul + KV-ul sunt separate — exact cum coexistă deja app-ul de evenimente cu cel de cofetărie.

### Repo separat pe GitHub (opțional, când vrei)
```powershell
cd "C:\Users\Mihai Bucur\Desktop\sardinia-ne"
git config user.name  "Numele tău"          # identitate locală DOAR pentru acest repo
git config user.email "email@tau"
git add .
git commit -m "Sardinia NE - itinerariu PWA"
# apoi creează un repo NOU gol pe github.com și:
git remote add origin https://github.com/<user>/sardinia-ne.git
git branch -M main
git push -u origin main
```

---

## Ce trebuie o singură dată

Ai nevoie de: **un cont Cloudflare** (gratuit) și **Node** (deja instalat). Toate comenzile se dau în PowerShell, **din folderul `sardinia-ne`**.

> Nu trebuie să instalezi nimic global — folosim `npx` care ia automat unealta `wrangler` de la Cloudflare.

### 1) Autentificare la Cloudflare
```powershell
npx wrangler login
```
Se deschide browserul → aprobi. (O singură dată pe calculatorul ăsta.)

### 2) Creează spațiul de stocare (KV)
```powershell
npx wrangler kv namespace create TRIP_STATE
```
Comanda îți afișează ceva de forma:
```
[[kv_namespaces]]
binding = "TRIP_STATE"
id = "a1b2c3d4...."
```
**Copiază valoarea `id`** și pune-o în `wrangler.toml`, în loc de `INLOCUIESTE_CU_ID_UL_KV`.

*(dacă vrei și testare locală cu date separate, opțional:)*
```powershell
npx wrangler kv namespace create TRIP_STATE --preview
```
și pui `preview_id`-ul afișat pe linia `preview_id` din `wrangler.toml` (decomenteaz-o).

> Notă: pe wrangler mai vechi comanda e cu două puncte: `npx wrangler kv:namespace create TRIP_STATE`.

### 3) (Opțional) Schimbă parola de scriere (TOKEN)
Scrierile sunt protejate cu un token simplu. Implicit e `sardinia-posada-2026`.
Dacă vrei altul, schimbă **aceeași valoare în două locuri** ca să coincidă:
- `functions/api/toggle.js` → `const DEFAULT_TOKEN = "...";`
- `public/app.js` → `const TOKEN = "...";`

> E o protecție ușoară (un singur utilizator, datele nu sunt sensibile — doar bife de plajă). Tokenul din `app.js` e vizibil în browser; e ok pentru scopul ăsta. Dacă vrei să-l ții doar pe server, poți seta după primul deploy `npx wrangler pages secret put TRIP_TOKEN` — dar atunci `TOKEN` din `app.js` trebuie să aibă tot aceeași valoare (clientul îl trimite în header).

---

## Testare locală (opțional, dar util)
```powershell
npx wrangler pages dev
```
Deschide URL-ul afișat (ex. `http://localhost:8788`). KV-ul e **simulat local** (datele rămân în folderul `.wrangler/`), deci poți bifa fără să atingi cloud-ul real. Aici merge și `GET /api/state` / `POST /api/toggle`.

---

## Publicare (deploy)
```powershell
npx wrangler pages deploy
```
- Prima dată te întreabă numele proiectului (apasă Enter pentru `sardinia-ne`) și branch-ul de producție (`main`).
- La final îți dă un link `https://sardinia-ne.pages.dev` (sau similar). **Ăla e link-ul pe care îl deschizi pe telefon.**
- Pentru update-uri ulterioare: schimbi fișierele și dai din nou `npx wrangler pages deploy`.

> ID-ul de KV din `wrangler.toml` face ca API-ul publicat să scrie în KV-ul real. Dacă l-ai pus corect la pasul 2, e gata.

### Instalare pe telefon (PWA)
Deschide link-ul în Chrome (Android) sau Safari (iPhone) → meniu → **„Adaugă la ecranul principal"**. Se comportă ca o aplicație și merge offline după prima deschidere.

---

## Verificări rapide (acceptance)
- **Cloud:** bifezi ceva → deschizi `https://<site>/api/state` în browser; trebuie să vezi `{"checked":{"d1-castello":true,...},"updatedAt":"..."}`. Pe alt telefon, aceeași bifă apare.
- **Offline:** în Chrome DevTools → Network → *Offline*; bifezi → UI se taie imediat, indicatorul devine „offline · în așteptare (N)". Revii online → se trimite singur, devine „✓ sincronizat".
- **Progres:** bara „X/Y" se schimbă pe ziua curentă; ai și totalul „X/Y pe tot sejurul".
- **Navigare:** 🧭 Direcții pornește din locația ta (cere GPS); 🍽️/⛽ deschid căutarea în jurul opririi; „lângă mine" din header folosește GPS-ul curent.
- **Offline shell:** după prima încărcare, închizi netul și reîncarci — aplicația tot pornește.

---

## Cum funcționează sincronizarea (pe scurt)
- Starea locală e oglindită în `localStorage` (`tripState`) — UI-ul citește instant din ea.
- La pornire: încarcă local → `GET /api/state`; dacă cloud-ul e mai nou, îl adoptă; altfel împinge localul spre cloud.
- La bifare: actualizează UI + local imediat, apoi `POST /api/toggle`. Dacă ești offline, pune id-ul într-o coadă (`pendingToggles`) și reîncearcă automat la revenirea netului și la următoarea pornire.
- `/api/*` nu se cache-uiește niciodată (service worker = network-only); doar „carcasa" aplicației (HTML/CSS/JS/icon) e cache-uită cache-first.
