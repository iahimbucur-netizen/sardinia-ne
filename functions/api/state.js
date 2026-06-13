// GET /api/state  -> întoarce starea curentă a trip-ului din KV
// Citire publică (fără token). Forma: { checked: {...}, updatedAt: <ISO|null> }

const TRIP_ID = "sardinia-ne";

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

export async function onRequestGet({ env }) {
  const empty = { checked: {}, spent: {}, updatedAt: null };
  try {
    const raw = await env.TRIP_STATE.get(`state:${TRIP_ID}`);
    return json(raw ? JSON.parse(raw) : empty);
  } catch (e) {
    // dacă bindingul lipsește sau KV pică, întoarcem starea goală ca să nu blocăm UI-ul
    return json(empty);
  }
}
