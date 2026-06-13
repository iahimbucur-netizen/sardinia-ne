// POST /api/ask  body { message, context?, history? }
// Chat cu Claude (Haiku). Tool "adauga_loc" -> scrie un loc custom în state.custom (KV).
// Protejat cu TOKEN. Cheia Anthropic e secretul CLAUDE_API_KEY (server-side).

const TRIP_ID = "sardinia-ne";
const DEFAULT_TOKEN = "sardinia-posada-2026";
const MODEL = "claude-haiku-4-5";
const CATS = ["beach", "view", "sight", "boat", "food", "drive"];

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

const TOOLS = [{
  name: "adauga_loc",
  description: "Adaugă un loc (restaurant, plajă, atracție, belvedere, oprire) în programul unei zile, pe categoria potrivită. Folosește acest tool DOAR când utilizatorul cere explicit să adaugi/pui ceva în program.",
  input_schema: {
    type: "object",
    properties: {
      zi: { type: "integer", description: "Numărul zilei, 1-5 (1=Duminică 14 iun ... 5=Joi 18 iun)" },
      nume: { type: "string", description: "Numele locului" },
      categorie: { type: "string", enum: CATS, description: "beach=plajă, view=belvedere, sight=vizită/sit, boat=pe mare, food=restaurant, drive=drum" },
      ora: { type: "string", description: "Oră aproximativă HH:MM, potrivită față de programul zilei" },
      notita: { type: "string", description: "Descriere scurtă utilă (de ce / ce să comanzi sau vezi)" },
    },
    required: ["zi", "nume", "categorie"],
  },
}];

function sysPrompt(context) {
  return `Ești asistentul de călătorie al unui sejur în Sardinia: sosire și plecare din Alghero, cazare în Posada, 14–18 iunie 2026. Răspunde SCURT, în română, prietenos și concret. NU inventa prețuri, orare exacte sau rezervări — dacă nu ești sigur, spune-i să verifice.
Zilele: 1=Duminică 14 iun (sosire Alghero 08:00), 2=Luni 15, 3=Marți 16, 4=Miercuri 17, 5=Joi 18 (plecare, avion 15:00 din Alghero).
Categorii pentru locuri: beach, view, sight, boat, food, drive.
Când utilizatorul cere să ADAUGI un loc în program, apelează tool-ul adauga_loc cu ziua potrivită, categoria corectă și o oră rezonabilă față de program. Poți adăuga mai multe. După ce adaugi, confirmă scurt în text.

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

  const msgs = [];
  if (Array.isArray(body && body.history)) {
    body.history.slice(-8).forEach((h) => {
      if (h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string") {
        msgs.push({ role: h.role, content: h.content.slice(0, 1500) });
      }
    });
  }
  msgs.push({ role: "user", content: message });

  const system = sysPrompt(context);
  let resp;
  try {
    resp = await callAnthropic(key, { model: MODEL, max_tokens: 1024, system, tools: TOOLS, messages: msgs });
  } catch (e) {
    return json({ reply: "Eroare la AI: " + e.message });
  }

  const toolUses = (resp.content || []).filter((b) => b.type === "tool_use" && b.name === "adauga_loc");
  let reply = textOf(resp.content);
  const added = [];

  if (toolUses.length) {
    const kvKey = `state:${TRIP_ID}`;
    const raw = await env.TRIP_STATE.get(kvKey);
    const state = raw ? JSON.parse(raw) : { checked: {}, spent: {}, custom: [], updatedAt: null };
    if (!state.checked || typeof state.checked !== "object") state.checked = {};
    if (!state.spent || typeof state.spent !== "object") state.spent = {};
    if (!Array.isArray(state.custom)) state.custom = [];

    const toolResults = [];
    let seq = 0;
    for (const tu of toolUses) {
      const inp = tu.input || {};
      const zi = Math.min(5, Math.max(1, parseInt(inp.zi, 10) || 1));
      const cat = CATS.indexOf(inp.categorie) >= 0 ? inp.categorie : "sight";
      const stop = {
        id: "c-" + Date.now().toString(36) + "-" + (seq++) + "-" + Math.floor(Math.random() * 1e6).toString(36),
        day: zi - 1,
        name: String(inp.nume || "Loc nou").slice(0, 120),
        category: cat,
        time: String(inp.ora || "").slice(0, 5),
        note: String(inp.notita || "").slice(0, 400),
        addedBy: "ai",
      };
      state.custom.push(stop);
      added.push(stop);
      toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: `Adăugat „${stop.name}" în ziua ${zi}.` });
    }
    state.updatedAt = new Date().toISOString();
    await env.TRIP_STATE.put(kvKey, JSON.stringify(state));

    try {
      const resp2 = await callAnthropic(key, {
        model: MODEL, max_tokens: 512, system, tools: TOOLS,
        messages: [...msgs, { role: "assistant", content: resp.content }, { role: "user", content: toolResults }],
      });
      const t2 = textOf(resp2.content);
      if (t2) reply = t2;
    } catch { /* păstrăm reply din prima rundă */ }
    if (!reply) reply = "Gata, am adăugat: " + added.map((a) => a.name).join(", ") + ".";

    return json({ reply, added, state });
  }

  if (!reply) reply = "(fără răspuns)";
  return json({ reply, added, state: null });
}
