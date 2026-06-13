// POST /api/spend  body { id, amount }  -> read-modify-write pe KV
// Setează/șterge spent[id]. Protejat cu TOKEN (header x-trip-token).

const TRIP_ID = "sardinia-ne";
const DEFAULT_TOKEN = "sardinia-posada-2026";

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

  const { id } = body || {};
  let amount = Number(body && body.amount);
  if (typeof id !== "string" || !id) return json({ error: "missing id" }, 400);
  if (!Number.isFinite(amount) || amount < 0) amount = 0;
  amount = Math.round(amount * 100) / 100;

  const key = `state:${TRIP_ID}`;
  const raw = await env.TRIP_STATE.get(key);
  const state = raw ? JSON.parse(raw) : { checked: {}, spent: {}, updatedAt: null };
  if (!state.checked || typeof state.checked !== "object") state.checked = {};
  if (!state.spent || typeof state.spent !== "object") state.spent = {};

  if (amount > 0) state.spent[id] = amount; else delete state.spent[id];
  state.updatedAt = new Date().toISOString();

  await env.TRIP_STATE.put(key, JSON.stringify(state));
  return json(state);
}
