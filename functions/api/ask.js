// POST /api/ask  body { message, context?, history?, stops? }
// Chat cu Claude (Haiku). Tools:
//   - adauga_loc        -> adaugă un loc custom în state.custom
//   - noteaza_cheltuiala -> setează/adună o cheltuială pe un loc sau categorie generală
// Protejat cu TOKEN. Cheia Anthropic = secretul CLAUDE_API_KEY (server-side).

const TRIP_ID = "sardinia-ne";
const DEFAULT_TOKEN = "sardinia-posada-2026";
const MODEL = "claude-haiku-4-5";
const CATS = ["beach", "view", "sight", "boat", "food", "drive"];

// categorii generale de cheltuieli (id-uri identice cu cele din app.js)
const GENERAL = [
  { id: "gen-benzina", label: "Benzină", re: /benzin|carburant|motorin|\bgas\b|fuel/ },
  { id: "gen-cazare", label: "Cazare", re: /cazar|hotel|airbnb|apartament|\bbnb\b|noapt/ },
  { id: "gen-masina", label: "Mașină închiriată", re: /masin|inchir|rent|rent-a-car/ },
  { id: "gen-cumparaturi", label: "Cumpărături", re: /cumparatur|supermarket|market|magazin|aliment|cumparat/ },
  { id: "gen-diverse", label: "Diverse", re: /divers|altele|alta|bilet|parcar|taxa/ },
];

// Bază de plaje curată (din cunoștințe, rating orientativ) — N / NV / NE Sardinia.
// Folosită ca referință de recomandare în chat. acces: da / limitat / nu (cu mașina).
const BEACHES = `PLAJE CURATE (rating orientativ pe 5). Coloane: nume (zonă, ~timp de la bază) — ★rating — mașină — spectaculoasă/notă.

NE — San Teodoro / Tavolara / Posada / Siniscola / Orosei (zona bazei Posada, zilele 2–4):
- La Cinta (San Teodoro) ★4.5 — mașină: da, parcare — 3,5 km nisip alb, Tavolara în zare.
- Cala Brandinchi (San Teodoro) ★4.3 — da — „Micul Tahiti"; rezervare vara.
- Lu Impostu (San Teodoro) ★4.4 — da — lagună fină; rezervare vara.
- Capo Coda Cavallo ★4.5 — da (drum scurt de pământ) — sălbatică, snorkeling top.
- Cala Girgolu (Capo Coda Cavallo) ★4.4 — da, parcare aproape — mică, turcoaz, ~15 min de La Cinta.
- Cala d'Ambra (San Teodoro) ★4.2 — da, în oraș — comodă, familii.
- Porto Istana (Olbia) ★4.4 — da, parcare — vedere directă spre Tavolara.
- Berchida (Siniscola, ~20–25 min de Posada) ★4.7 — da (drum + parcare) — superbă: nisip alb, dune, pini; sălbatică, fără mult comerț.
- Capo Comino (Siniscola, ~15 min de Posada) ★4.4 — da — far, dune albe, sălbatică.
- Bidderosa (Siniscola, ~25 min de Posada) ★4.7 — limitat (taxă + nr. limitat de mașini/zi, rezervă din timp) — 5 calanci în rezervație, spectaculoasă.
- Cala Liberotto / Cala Ginepro (Orosei, ~30 min de Posada) ★4.4 — da, pini, parcare — familii.
- Spiaggia di Posada / Su Tiriarzu (Posada) ★4.2 — da, chiar lângă bază — comodă.
- Budoni ★4.3 — da — nisip lung, familii.

N — Costa Smeralda / Gallura / Santa Teresa / Palau (ziua 4 = Costa Smeralda):
- Spiaggia del Principe (Costa Smeralda) ★4.5 — da (parcare ~12€ + 15 min mers) — granit roz, apă smarald.
- Capriccioli (Costa Smeralda) ★4.4 — da, parcare — golfuri, familii.
- Liscia Ruja / Long Beach (Costa Smeralda) ★4.4 — da, parcare — cea mai întinsă din CS.
- Rena Bianca (Santa Teresa Gallura) ★4.5 — da, în oraș — vedere spre Corsica.
- Porto Pollo / Isuledda (Palau) ★4.4 — da, parcare — kitesurf, lagună.
- Cala Coticcio „Tahiti" (Caprera) ★4.7 — mașină: NU (drum pe jos ~45 min + permis) — spectaculoasă, dar greu accesibilă.
- Spiaggia Rosa (Budelli) — mașină: NU (doar cu barca, zonă protejată) — celebră, dar inaccesibilă cu mașina.

NV — Alghero / Stintino / Bosa (zilele 1 și 5, baza Alghero):
- La Pelosa (Stintino) ★4.6 — limitat (parcare plătită + taxă/nr. limitat vara) — spectaculoasă, aspect caraibic; e în NV, departe de Posada.
- Le Bombarde (Alghero) ★4.4 — da, parcare — pini, apă turcoaz.
- Lazzaretto (Alghero) ★4.4 — da — golfuleț turcoaz, apă mică.
- Spiaggia di Maria Pia (Alghero) ★4.3 — da, lângă oraș — pini.
- Mugoni (Porto Conte) ★4.4 — da, parcare — golf adăpostit, bun pentru familii.
- Cala Dragunara (Capo Caccia) ★4.3 — da — mică, sub falezele de la Capo Caccia.
- Porto Ferro ★4.5 — da — nisip roșcat-auriu, sălbatică, valuri (surf).
- Bosa Marina (Bosa) ★4.2 — da — comodă, lângă orășelul colorat.`;

const VIEWS = `BELVEDERE / PUNCTE PANORAMICE CURATE (rating orientativ):
NE (Posada / San Teodoro / Olbia):
- Castello della Fava (Posada) ★4.4 — mașină da + urcat scurt pe jos — panoramă peste vale și mare.
- Belvedere spre Tavolara (Porto San Paolo / Capo Ceraso) ★4.5 — mașină da — vedere spre insula-munte Tavolara.
- Capo Figari (Golfo Aranci) ★4.6 — mașină până la bază + drumeție — vedere amplă, mufloni.
N (Costa Smeralda / Gallura):
- Chiesa Stella Maris (Porto Cervo) ★4.5 — mașină da, parcare — priveliște peste Costa Smeralda.
- Capo Testa (Santa Teresa Gallura) ★4.7 — mașină da + plimbare — stânci de granit sculptate, far.
NV (Alghero):
- Capo Caccia (Alghero) ★4.7 — mașină da — faleze uriașe, apus peste insula Foradada.
- Bastioni Alghero ★4.6 — mașină da (parcare în oraș) — zidurile pe mare, apus, aperitivo.`;

const FOOD = `RESTAURANTE CURATE (rating orientativ — la mâncare verifică oricum pe Maps, se schimbă des):
NE (San Teodoro / Posada / Olbia):
- Bellavista (San Teodoro) ★4.2 — vedere spre golful Capo Coda Cavallo, apus.
- Da Nardino (San Teodoro) ★4.2 — pește: branzino în crustă de sare, fregola; rezervă.
- La Taverna degli Artisti (San Teodoro) ★4.1 — spaghetti allo scoglio, fructe de mare.
- Marco & Caterina (Posada) ★4.4 — fregola cu fructe de mare, lângă castel.
N (Costa Smeralda / San Pantaleo):
- Casa Bohème Bistro (San Pantaleo) ★4.4 — plates de împărțit, cocktailuri, vibe bun.
NV (Alghero): în orașul vechi sunt multe trattorii de pește. Specialitatea locală: aragosta alla catalana (homar) și paella catalană. Caută pe Maps un loc 4.3+ în centro storico și rezervă seara.`;

const SIGHTS = `VIZITE / SITURI / LOCURI INTERESANTE CURATE (rating orientativ; toate cu mașina, mai puțin Tavolara = cu barca):
NV (Alghero): Centro Storico Alghero ★4.6 (oraș catalan, coral); Grotta di Nettuno ★4.5 (peșteră marină, 654 trepte sau barcă, ~14€); Nuraghe di Palmavera ★4.3 (sat nuragic); Bosa ★4.6 (orășel colorat pe râu + castel Malaspina).
N: Castelsardo ★4.6 (borgo medieval pe stâncă + castel + împletituri); Nuraghe La Prisgiona + Tomba dei Giganti Coddu Vecchiu, Arzachena ★4.5 (situri nuragice, bilet combinat ~7€); San Pantaleo ★4.4 (sat de granit, artizani, piațetă); Porto Cervo (port de yacht-uri, La Passeggiata).
NE: Castello della Fava, Posada ★4.4 (castel + borg medieval); Isola di Tavolara (insula-munte, doar cu barca); Stagno di San Teodoro (lagună cu flamingo dimineața); Basilica San Simplicio, Olbia ★4.4 (romanică).`;

function buildRefs(lc, addPlace) {
  const beach = /plaj|beach|baie|snorkel|nisip/.test(lc);
  const view = /belveder|priveli|panoram|apus|\bvedere\b|\bpunct/.test(lc);
  const food = /restaurant|m[aâ]nc|cin[aă]|pr[aâ]nz|pizz|pe[șs]te|trattoria|aperitivo/.test(lc);
  const sight = /atrac[tț]i|de v[aă]zut|\bsit\b|nurag|biseric|\bsat\b|ora[șs]|muzeu|vizit|castel|grot/.test(lc);
  const generic = (addPlace || /recomand|sugest/.test(lc)) && !beach && !view && !food && !sight;
  const parts = [];
  if (beach || generic) parts.push(BEACHES);
  if (view || generic) parts.push(VIEWS);
  if (food || generic) parts.push(FOOD);
  if (sight || generic) parts.push(SIGHTS);
  return parts.join("\n\n");
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-trip-token",
};
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...CORS },
  });
}
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

const TOOLS = [
  {
    name: "adauga_loc",
    description: "Adaugă un loc (restaurant, plajă, atracție, belvedere, oprire) în programul unei zile, pe categoria potrivită. Folosește DOAR când utilizatorul cere explicit să adaugi/pui ceva în program.",
    input_schema: {
      type: "object",
      properties: {
        zi: { type: "integer", description: "Numărul zilei, 1-5 (1=Du 14 iun ... 5=Jo 18 iun)" },
        nume: { type: "string" },
        categorie: { type: "string", enum: CATS, description: "beach=plajă, view=belvedere, sight=vizită/sit, boat=pe mare, food=restaurant, drive=drum" },
        ora: { type: "string", description: "Oră aproximativă HH:MM" },
        notita: { type: "string", description: "Descriere scurtă utilă (rating, de ce, parcare/acces)" },
        rating: { type: "number", description: "Rating aproximativ 0–5 (Google Maps), pentru afișare pe card. Dă o estimare rezonabilă dacă o cunoști." },
      },
      required: ["zi", "nume", "categorie"],
    },
  },
  {
    name: "noteaza_cheltuiala",
    description: "Înregistrează o cheltuială. Folosește când utilizatorul spune că a cheltuit/plătit/dat o sumă (la un restaurant, plajă, atracție, sau pe benzină/cazare/cumpărături etc.).",
    input_schema: {
      type: "object",
      properties: {
        nume: { type: "string", description: "Unde a cheltuit: numele unui loc din program, SAU o categorie generală (benzină, cazare, mașină, cumpărături, diverse)." },
        suma: { type: "number", description: "Suma în EURO." },
        operatie: { type: "string", enum: ["seteaza", "aduna"], description: "seteaza = cheltuiala la acel loc ESTE suma asta (implicit); aduna = adaugă la totalul existent (ex: încă o alimentare la benzină)." },
        zi: { type: "integer", description: "Ziua 1-5, DOAR dacă locul nu e deja în program și vrei să-l creezi odată cu cheltuiala." },
        categorie: { type: "string", enum: CATS, description: "Categoria, doar dacă locul trebuie creat nou." },
      },
      required: ["nume", "suma"],
    },
  },
];

function sysPrompt(context, refs) {
  return `Ești asistentul de călătorie al unui sejur în Sardinia: sosire și plecare din Alghero, cazare în Posada, 14–18 iunie 2026. Răspunde SCURT, în română, prietenos și concret. NU inventa prețuri, orare exacte sau rezervări.
Zilele: 1=Duminică 14 iun (sosire Alghero 08:00), 2=Luni 15, 3=Marți 16, 4=Miercuri 17, 5=Joi 18 (plecare, avion 15:00 din Alghero).
Categorii: beach, view, sight, boat, food, drive.
- Dacă utilizatorul cere să ADAUGI un loc → apelează adauga_loc.
- REGULĂ STRICTĂ: ori de câte ori utilizatorul menționează o sumă pe care a cheltuit-o / plătit-o / dat-o (la un loc SAU pe benzină / cazare / mașină / cumpărături / diverse), TREBUIE să apelezi tool-ul noteaza_cheltuiala. NU spune în text că ai notat decât DUPĂ ce ai apelat efectiv tool-ul. Categoriile generale (benzină etc.) sunt ținte perfect valide — apelează tool-ul cu nume="benzină" etc. Folosește operatie="aduna" pentru lucruri repetate (ex: încă o alimentare). Dacă locul nu e în program și are sens, dă și zi+categorie ca să-l creezi.
Confirmă scurt în text DOAR ce ai făcut efectiv prin tool-uri.

Cum alegi un loc când recomanzi/adaugi (mai ales plaje). Întâi FILTRE obligatorii, apoi ratingul alege:
- FILTRU 1 (mașină): utilizatorul ajunge cu mașina închiriată — exclude locurile accesibile doar cu barca sau cu drum lung pe jos; preferă unde se poate parca aproape.
- FILTRU 2 (zonă): locul TREBUIE să fie în ACEEAȘI zonă/coastă cu opririle zilei, la max ~40 min cu mașina de ele. NU propune un loc de pe altă coastă, oricât de faimos sau bine cotat. Exemplu de GREȘEALĂ de evitat: dacă ziua e în zona San Teodoro / Tavolara / Posada (coasta de NE), NU propune Pelosa/Stintino sau Costa Smeralda — alege plaje din zona San Teodoro / Budoni / Siniscola (ex: Cala d'Ambra, Cala Girgolu, Berchida, Bidderosa). Pentru zilele din Alghero (1 și 5), alege din NV (Bombarde, Lazzaretto, Maria Pia, Mugoni).
- ALEGE apoi, dintre cele care trec filtrele, pe cea cu RATING cât mai mare (și mai spectaculoasă).
Dacă locul apare în „LISTELE CURATE" de mai jos (plaje, belvedere, restaurante, situri), alege DOAR din ele: ia numele, ratingul și zona EXACT de acolo, nu inventa. Exclude cele cu mașină „NU"; „limitat" se poate, dar menționează condiția (taxă/rezervare). Potrivește zona locului cu zona zilei. La restaurante ratingurile sunt mai aproximative — sugerează verificarea pe Maps.
Nu duplica un loc deja în program; dacă cel evident e deja acolo, alege ALTUL din liste. Spune scurt ratingul și motivul (ex: „~4.7, la ~20 min de Posada, parcare aproape") și pune valoarea în câmpul rating.
${refs ? "\n" + refs + "\n" : ""}
Itinerariul curent:
${context || "(necunoscut)"}`;
}

async function callAnthropic(key, body) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) { const t = await r.text(); throw new Error("anthropic " + r.status + " " + t.slice(0, 200)); }
  return await r.json();
}
function textOf(content) {
  return (content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}
function norm(s) {
  const d = String(s || "").normalize("NFD");
  let a = "";
  for (let i = 0; i < d.length; i++) { if (d.charCodeAt(i) < 128) a += d[i]; }
  return a.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
// rezolvă ținta unei cheltuieli: id loc existent / categorie generală / loc nou creat
function resolveTarget(nume, zi, categorie, dir, state, added) {
  const n = norm(nume);
  if (n) {
    for (const g of GENERAL) if (g.re.test(n)) return { id: g.id, name: g.label };
  }
  let best = null;
  dir.forEach((e) => {
    const en = norm(e.name);
    if (!en || !n) return;
    if (en.includes(n) || n.includes(en)) {
      const score = Math.min(en.length, n.length);
      if (!best || score > best.score) best = { id: e.id, name: e.name, score };
    }
  });
  if (best) return { id: best.id, name: best.name };
  // niciun match: dacă avem zi, creăm un loc nou; altfel Diverse
  if (zi) {
    const cat = CATS.indexOf(categorie) >= 0 ? categorie : "food";
    const stop = {
      id: "c-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36),
      day: Math.min(5, Math.max(1, parseInt(zi, 10) || 1)) - 1,
      name: String(nume).slice(0, 120), category: cat, time: "", note: "", addedBy: "ai",
    };
    state.custom.push(stop); dir.push({ id: stop.id, name: stop.name, day: stop.day }); added.push(stop);
    return { id: stop.id, name: stop.name };
  }
  return { id: "gen-diverse", name: "Diverse" };
}

export async function onRequestPost({ request, env }) {
  const token = env.TRIP_TOKEN || DEFAULT_TOKEN;
  if (request.headers.get("x-trip-token") !== token) return json({ error: "unauthorized" }, 401);
  const key = env.CLAUDE_API_KEY || env.ANTHROPIC_API_KEY;
  if (!key) return json({ reply: "Chatul AI nu e activat încă (lipsește cheia pe server)." });

  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400); }
  const message = String((body && body.message) || "").slice(0, 2000);
  const context = String((body && body.context) || "").slice(0, 7000);
  if (!message) return json({ error: "missing message" }, 400);

  // detectează o cheltuială raportată clar (verb la persoana I trecut + sumă) -> forțăm tool-ul
  const lc = message.toLowerCase();
  const hasAmount = /\d/.test(message);
  const spendIntent = /\bam (dat|cheltuit|pl[aă]tit|pus|alimentat|achitat|scos)\b|m[-\s]?a costat|ne[-\s]?a costat|costat[- ]?\w*\s*\d/.test(lc);
  const forceSpend = hasAmount && spendIntent;
  // cerere clară de adăugare a unui loc (fără sumă) -> forțăm tool-ul de adăugare
  const addPlace = !hasAmount && /adaug|[îi]n program|bag[ăa]\b|pune[- ]?o\b/.test(lc);

  const dir = [];
  if (Array.isArray(body && body.stops)) {
    body.stops.slice(0, 200).forEach((s) => { if (s && s.id && s.name) dir.push({ id: String(s.id), name: String(s.name), day: Number(s.day) }); });
  }

  const msgs = [];
  if (Array.isArray(body && body.history)) {
    body.history.slice(-8).forEach((h) => {
      if (h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string") msgs.push({ role: h.role, content: h.content.slice(0, 1500) });
    });
  }
  msgs.push({ role: "user", content: message });

  const system = sysPrompt(context, buildRefs(lc, addPlace));
  let resp;
  try {
    // la cheltuieli forțăm direct; la adăugare lăsăm modelul să raționeze (alege cel mai bun din listă)
    const tool_choice = forceSpend ? { type: "tool", name: "noteaza_cheltuiala" } : undefined;
    resp = await callAnthropic(key, { model: MODEL, max_tokens: 1024, system, tools: TOOLS, tool_choice, messages: msgs });
    // dacă a cerut clar o adăugare dar modelul doar a vorbit (n-a apelat niciun tool), forțăm adăugarea
    if (addPlace && !forceSpend && !(resp.content || []).some((b) => b.type === "tool_use")) {
      resp = await callAnthropic(key, { model: MODEL, max_tokens: 1024, system, tools: TOOLS, tool_choice: { type: "tool", name: "adauga_loc" }, messages: msgs });
    }
  } catch (e) {
    return json({ reply: "Eroare la AI: " + e.message });
  }

  const toolUses = (resp.content || []).filter((b) => b.type === "tool_use" && (b.name === "adauga_loc" || b.name === "noteaza_cheltuiala"));
  let reply = textOf(resp.content);
  const added = [];
  const spends = [];

  if (toolUses.length) {
    const kvKey = `state:${TRIP_ID}`;
    const raw = await env.TRIP_STATE.get(kvKey);
    const state = raw ? JSON.parse(raw) : { checked: {}, spent: {}, custom: [], updatedAt: null };
    if (!state.checked || typeof state.checked !== "object") state.checked = {};
    if (!state.spent || typeof state.spent !== "object") state.spent = {};
    if (!Array.isArray(state.custom)) state.custom = [];
    // include custom existente în directorul de potrivire
    state.custom.forEach((c) => dir.push({ id: c.id, name: c.name, day: c.day }));

    const toolResults = [];
    for (const tu of toolUses) {
      const inp = tu.input || {};
      if (tu.name === "adauga_loc") {
        const zi = Math.min(5, Math.max(1, parseInt(inp.zi, 10) || 1));
        const cat = CATS.indexOf(inp.categorie) >= 0 ? inp.categorie : "sight";
        const nm = norm(inp.nume || "");
        if (nm && dir.some((e) => e.day === (zi - 1) && (norm(e.name).includes(nm) || nm.includes(norm(e.name))))) {
          toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: `„${String(inp.nume).slice(0, 80)}" e deja în ziua ${zi} — nu l-am dublat.` });
          continue;
        }
        const rating = (typeof inp.rating === "number" && inp.rating > 0 && inp.rating <= 5) ? Math.round(inp.rating * 10) / 10 : null;
        const stop = {
          id: "c-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36),
          day: zi - 1, name: String(inp.nume || "Loc nou").slice(0, 120), category: cat,
          time: String(inp.ora || "").slice(0, 5), note: String(inp.notita || "").slice(0, 400), rating, addedBy: "ai",
        };
        state.custom.push(stop); dir.push({ id: stop.id, name: stop.name, day: stop.day }); added.push(stop);
        toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: `Adăugat „${stop.name}" în ziua ${zi}.` });
      } else {
        let amount = Number(inp.suma);
        if (!Number.isFinite(amount) || amount < 0) amount = 0;
        const t = resolveTarget(inp.nume, inp.zi, inp.categorie, dir, state, added);
        const cur = Number(state.spent[t.id]) || 0;
        // categoriile generale (benzină, cumpărături...) se cumulează în mod implicit;
        // un loc anume se setează (re-spunerea nu dublează)
        const op = (t.id.indexOf("gen-") === 0) ? "aduna" : (inp.operatie === "aduna" ? "aduna" : "seteaza");
        let val = (op === "aduna") ? cur + amount : amount;
        val = Math.round(val * 100) / 100;
        if (val > 0) state.spent[t.id] = val; else delete state.spent[t.id];
        spends.push({ name: t.name, amount: val });
        toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: `Notat: ${val}€ la „${t.name}".` });
      }
    }
    state.updatedAt = new Date().toISOString();
    await env.TRIP_STATE.put(kvKey, JSON.stringify(state));

    try {
      const resp2 = await callAnthropic(key, {
        model: MODEL, max_tokens: 512, system, tools: TOOLS, tool_choice: { type: "none" },
        messages: [...msgs, { role: "assistant", content: resp.content }, { role: "user", content: toolResults }],
      });
      const t2 = textOf(resp2.content);
      if (t2) reply = t2;
    } catch { /* păstrăm reply din prima rundă */ }
    if (!reply) {
      const parts = [];
      if (added.length) parts.push("am adăugat: " + added.map((a) => a.name).join(", "));
      if (spends.length) parts.push("am notat: " + spends.map((s) => `${s.amount}€ la ${s.name}`).join(", "));
      reply = "Gata, " + (parts.join("; ") || "ok") + ".";
    }
    return json({ reply, added, spends, state });
  }

  if (!reply) reply = "(fără răspuns)";
  return json({ reply, added, spends, state: null });
}
