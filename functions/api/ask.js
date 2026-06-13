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
        notita: { type: "string", description: "Descriere scurtă utilă" },
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

function sysPrompt(context) {
  return `Ești asistentul de călătorie al unui sejur în Sardinia: sosire și plecare din Alghero, cazare în Posada, 14–18 iunie 2026. Răspunde SCURT, în română, prietenos și concret. NU inventa prețuri, orare exacte sau rezervări.
Zilele: 1=Duminică 14 iun (sosire Alghero 08:00), 2=Luni 15, 3=Marți 16, 4=Miercuri 17, 5=Joi 18 (plecare, avion 15:00 din Alghero).
Categorii: beach, view, sight, boat, food, drive.
- Dacă utilizatorul cere să ADAUGI un loc → apelează adauga_loc.
- REGULĂ STRICTĂ: ori de câte ori utilizatorul menționează o sumă pe care a cheltuit-o / plătit-o / dat-o (la un loc SAU pe benzină / cazare / mașină / cumpărături / diverse), TREBUIE să apelezi tool-ul noteaza_cheltuiala. NU spune în text că ai notat decât DUPĂ ce ai apelat efectiv tool-ul. Categoriile generale (benzină etc.) sunt ținte perfect valide — apelează tool-ul cu nume="benzină" etc. Folosește operatie="aduna" pentru lucruri repetate (ex: încă o alimentare). Dacă locul nu e în program și are sens, dă și zi+categorie ca să-l creezi.
Confirmă scurt în text DOAR ce ai făcut efectiv prin tool-uri.

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

  const system = sysPrompt(context);
  let resp;
  try {
    const tool_choice = forceSpend ? { type: "tool", name: "noteaza_cheltuiala" } : undefined;
    resp = await callAnthropic(key, { model: MODEL, max_tokens: 1024, system, tools: TOOLS, tool_choice, messages: msgs });
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
        const stop = {
          id: "c-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36),
          day: zi - 1, name: String(inp.nume || "Loc nou").slice(0, 120), category: cat,
          time: String(inp.ora || "").slice(0, 5), note: String(inp.notita || "").slice(0, 400), addedBy: "ai",
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
