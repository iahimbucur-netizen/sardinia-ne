// POST /api/toggle  body { id, value }  -> read-modify-write pe KV
// Scriere protejată cu TOKEN (header x-trip-token). Toggle per-id, ca să nu se
// calce device-urile între ele. Întoarce starea nouă completă.

const TRIP_ID = "sardinia-ne";

// TOKEN: simplu, pentru un singur utilizator. Citește din env (Pages secret
// "TRIP_TOKEN") dacă există, altfel folosește constanta de mai jos.
// IMPORTANT: aceeași valoare trebuie pusă în public/app.js (const TOKEN).
const DEFAULT_TOKEN = "sardinia-posada-2026";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-trip-token",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...CORS,
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request, env }) {
  const token = env.TRIP_TOKEN || DEFAULT_TOKEN;
  if (request.headers.get("x-trip-token") !== token) {
    return json({ error: "unauthorized" }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const { id, value } = body || {};
  if (typeof id !== "string" || !id) {
    return json({ error: "missing id" }, 400);
  }

  const key = `state:${TRIP_ID}`;
  const raw = await env.TRIP_STATE.get(key);
  const state = raw ? JSON.parse(raw) : { checked: {}, updatedAt: null };
  if (!state.checked || typeof state.checked !== "object") state.checked = {};

  if (value) state.checked[id] = true;
  else delete state.checked[id];

  state.updatedAt = new Date().toISOString();

  await env.TRIP_STATE.put(key, JSON.stringify(state));
  return json(state);
}
