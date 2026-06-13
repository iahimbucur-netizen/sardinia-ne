// POST /api/custom  body { op:"add"|"remove", stop?, id? }
// Adaugă/șterge un loc custom în state.custom (KV). Protejat cu TOKEN.

const TRIP_ID = "sardinia-ne";
const DEFAULT_TOKEN = "sardinia-posada-2026";
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

export async function onRequestPost({ request, env }) {
  const token = env.TRIP_TOKEN || DEFAULT_TOKEN;
  if (request.headers.get("x-trip-token") !== token) return json({ error: "unauthorized" }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400); }
  const op = body && body.op;

  const kvKey = `state:${TRIP_ID}`;
  const raw = await env.TRIP_STATE.get(kvKey);
  const state = raw ? JSON.parse(raw) : { checked: {}, spent: {}, custom: [], updatedAt: null };
  if (!state.checked || typeof state.checked !== "object") state.checked = {};
  if (!state.spent || typeof state.spent !== "object") state.spent = {};
  if (!Array.isArray(state.custom)) state.custom = [];

  let added = null;
  if (op === "add") {
    const s = (body && body.stop) || {};
    const zi = Math.min(5, Math.max(1, parseInt(s.day != null ? s.day + 1 : s.zi, 10) || 1));
    const cat = CATS.indexOf(s.category) >= 0 ? s.category : "sight";
    added = {
      id: "c-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36),
      day: zi - 1,
      name: String(s.name || "Loc nou").slice(0, 120),
      category: cat,
      time: String(s.time || "").slice(0, 5),
      note: String(s.note || "").slice(0, 400),
      addedBy: "manual",
    };
    state.custom.push(added);
  } else if (op === "remove") {
    const id = body && body.id;
    if (typeof id !== "string" || !id) return json({ error: "missing id" }, 400);
    state.custom = state.custom.filter((c) => c.id !== id);
    delete state.checked[id];
    delete state.spent[id];
  } else {
    return json({ error: "bad op" }, 400);
  }

  state.updatedAt = new Date().toISOString();
  await env.TRIP_STATE.put(kvKey, JSON.stringify(state));
  return json(added ? { ...state, added } : state);
}
