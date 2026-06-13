"use strict";

/* ============================================================
   Sardinia NE · Posada — PWA itinerariu offline-first
   Sosire & plecare din Alghero, bază în Posada.
   Bife + cheltuieli persistate în Cloudflare KV; oglindă locală
   în localStorage; coadă de retrimitere când revine netul.
   ============================================================ */

const TRIP_ID = "sardinia-ne";
// Trebuie să fie identic cu TOKEN-ul din functions/api/*.js
const TOKEN = "sardinia-posada-2026";

const BASE = { name: "Posada (cazare)", lat: 40.6300, lng: 9.7150 };

// Căutare Maps după nume (pin fiabil pentru locuri cunoscute fără CID)
const q = (name) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(name);

const DATA = [
  {
    day: "Duminică", date: "14 iun", title: "Sosire Alghero & Riviera del Corallo",
    subtitle: "Aterizezi la Alghero. Cât apuci depinde de oră — orașul vechi + apus la Capo Caccia, apoi drum la Posada (~2h30, seara).",
    center: { lat: 40.5585, lng: 8.3163 },
    stops: [
      { id: "d1-aeroport", name: "Aeroport Alghero-Fertilia (AHO)", category: "drive",
        time: "—", driveFromBase: "sosire", rating: null,
        note: "Aterizare + ridici mașina închiriată. De aici pleci spre oraș (~10 min) sau direct spre Capo Caccia.",
        lat: 40.6320, lng: 8.2906, mapsUrl: q("Aeroporto di Alghero-Fertilia"), nearby: [] },
      { id: "d1-centro", name: "Centro Storico Alghero (Bastioni + Catedrala)", category: "sight",
        time: "12:00", driveFromBase: "10 min din aeroport", rating: 4.6,
        note: "Orașul vechi catalan: ziduri de apărare pe mare (bastioni), Catedrala Santa Maria, bijuterii din coral roșu. Plimbare + prânz.",
        lat: 40.5585, lng: 8.3163, mapsUrl: q("Alghero Centro Storico Bastioni"), nearby: [] },
      { id: "d1-bombarde", name: "Spiaggia Le Bombarde", category: "beach",
        time: "15:00", driveFromBase: "15 min din Alghero", rating: 4.4,
        note: "Apă turcoaz, nisip fin, încadrată de pini. Cea mai ușoară baie lângă Alghero.",
        lat: 40.5849, lng: 8.2447, mapsUrl: q("Spiaggia Le Bombarde Alghero"),
        nearby: [
          { name: "Spiaggia del Lazzaretto",
            blurb: "Golfuleț cu apă mică turcoaz, la 1 min de Bombarde — bun dacă e aglomerat.",
            mapsUrl: q("Spiaggia del Lazzaretto Alghero"), website: null }
        ] },
      { id: "d1-nettuno", name: "Grotta di Nettuno", category: "sight",
        time: "17:00", driveFromBase: "25 min din Alghero", rating: 4.5,
        note: "Peșteră marină spectaculoasă în Capo Caccia: stalactite, lac subteran. Cobori 654 trepte (Escala del Cabirol) sau ajungi cu barca din port. ~14€, rezervă online. Suspendată pe mare agitată — sună înainte.",
        lat: 40.5606, lng: 8.1581, mapsUrl: q("Grotta di Nettuno"),
        reservation: { required: true, label: "Rezervă online (~14€)", url: "https://grottadinettuno.it/en/" },
        nearby: [] },
      { id: "d1-capocaccia", name: "Capo Caccia (belvedere & apus)", category: "view",
        time: "18:45", driveFromBase: "25 min din Alghero", rating: 4.7,
        note: "Faleze uriașe deasupra mării. Apusul peste insula Foradada e printre cele mai frumoase din Sardinia.",
        lat: 40.5610, lng: 8.1672, mapsUrl: q("Capo Caccia Alghero"),
        nearby: [
          { name: "Nuraghe di Palmavera",
            blurb: "Complex nuragic din Epoca Bronzului pe drumul spre Porto Conte — dacă ai timp dimineața.",
            mapsUrl: q("Nuraghe di Palmavera"), website: null }
        ] },
      { id: "d1-transfer", name: "Transfer Alghero → Posada (cazare)", category: "drive",
        time: "20:00", driveFromBase: "~2h30", rating: null,
        note: "Drum spre baza din Posada (coasta de NE). Pe SS131 + SS129. Ajungi seara — cină ușoară la sosire.",
        lat: 40.6300, lng: 9.7150, mapsUrl: q("Posada Sardegna"), nearby: [] },
      { id: "d1-marco", name: "Marco & Caterina (Posada)", category: "food",
        time: "21:30", driveFromBase: "5 min", rating: 4.4,
        note: "Cină de sosire lângă castel — fregola cu fructe de mare. (Sau orice deschis în Posada, dacă ajungi târziu.)",
        lat: 40.6367796, lng: 9.725594, mapsUrl: "https://maps.google.com/?cid=2887425309595092167", nearby: [] }
    ]
  },
  {
    day: "Luni", date: "15 iun", title: "Capo Coda Cavallo & San Teodoro",
    subtitle: "Cele mai spectaculoase plaje din zonă, ~25 min din Posada. Brandinchi/Lu Impostu cer rezervare.",
    center: { lat: 40.834, lng: 9.686 },
    stops: [
      { id: "d2-castello", name: "Castello della Fava (Posada)", category: "sight",
        time: "09:00", driveFromBase: "5 min", rating: 4.4,
        note: "Urci pe ulițele de piatră ale borgului medieval până la castel (4€). Panoramă peste vale și mare.",
        lat: 40.6381382, lng: 9.7239156, mapsUrl: "https://maps.google.com/?cid=9107459291129127808", nearby: [] },
      { id: "d2-brandinchi", name: "Cala Brandinchi", category: "beach",
        time: "10:00", driveFromBase: "25 min", rating: 4.2,
        note: "„Micul Tahiti”, apă mică turcoaz. Ajungi înainte de 10:00 și mergi spre nord pentru loc.",
        lat: 40.8347189, lng: 9.6858305, mapsUrl: "https://maps.google.com/?cid=8338057865545315826",
        reservation: { required: true, label: "Rezervare obligatorie", url: "https://www.santeodorospiagge.it/" }, nearby: [] },
      { id: "d2-luimpostu", name: "Spiaggia di Lu Impostu", category: "beach",
        time: "13:00", driveFromBase: "25 min", rating: 4.4,
        note: "Lângă Brandinchi, aceeași parcare. Lagună + nisip fin.",
        lat: 40.826357, lng: 9.6809525, mapsUrl: "https://maps.google.com/?cid=6263060510312342630",
        reservation: { required: true, label: "Rezervare obligatorie", url: "https://www.santeodorospiagge.it/" }, nearby: [] },
      { id: "d2-codacavallo", name: "Spiaggia di Capo Coda Cavallo", category: "beach",
        time: "14:30", driveFromBase: "30 min", rating: 4.5,
        note: "Golf sălbatic, fără rezervare, snorkeling excelent. Ultim drum de pământ scurt.",
        lat: 40.8408214, lng: 9.7233979, mapsUrl: "https://maps.google.com/?cid=4617979726807287825",
        nearby: [
          { name: "Isola di Tavolara",
            blurb: "Munte-insulă de calcar de ~565 m care domină tot golful — peisaj dramatic, vizibil din toată zona.",
            mapsUrl: "https://www.google.com/maps/search/?api=1&query=Isola%20di%20Tavolara&query_place_id=ChIJxTBmCoYy2RIRTDT0vPcjRAI", website: null }
        ] },
      { id: "d2-bellavista", name: "Bellavista San Teodoro", category: "food",
        time: "19:30", driveFromBase: "30 min", rating: 4.2,
        note: "Cină pe deal cu vedere spre golful Capo Coda Cavallo. Apus superb.",
        lat: 40.8408268, lng: 9.7156546, mapsUrl: "https://maps.google.com/?cid=12453858698099672247", nearby: [] }
    ]
  },
  {
    day: "Marți", date: "16 iun", title: "Tavolara pe mare",
    subtitle: "Ziua „misto”: Aria Marină Protejată Tavolara-Molara. Turul cu velier cere rezervare din timp.",
    center: { lat: 40.882, lng: 9.637 },
    stops: [
      { id: "d3-sailing", name: "Sailing San Paolo (Porto San Paolo)", category: "boat",
        time: "09:00", driveFromBase: "35 min", rating: 4.9,
        note: "Tur cu velier de epocă: piscinele Molara, Tavolara, snorkeling, aperitivo la bord.",
        lat: 40.8822272, lng: 9.6367887, mapsUrl: "https://maps.google.com/?cid=10666500192853509207",
        reservation: { required: true, label: "Rezervă din timp", url: "https://www.sailingsanpaolo.it/" },
        nearby: [
          { name: "Isola di Tavolara",
            blurb: "Destinația turului — insula-munte cu plaje sălbatice, hiking și 3 restaurante.",
            mapsUrl: "https://www.google.com/maps/search/?api=1&query=Isola%20di%20Tavolara&query_place_id=ChIJxTBmCoYy2RIRTDT0vPcjRAI", website: null }
        ] },
      { id: "d3-lacinta", name: "Spiaggia La Cinta (San Teodoro)", category: "beach",
        time: "17:00", driveFromBase: "20 min", rating: 4.5,
        note: "3,5 km de nisip alb cu Tavolara în fundal. Fără rezervare. Baie de după-amiază dacă te întorci devreme de pe mare.",
        lat: 40.7917039, lng: 9.6699855, mapsUrl: "https://maps.google.com/?cid=4419791207345060262",
        nearby: [
          { name: "Stagno di San Teodoro (flamingo)",
            blurb: "Lagună chiar în spatele plajei — flamingo roz și stârci, mai ales dimineața.",
            mapsUrl: "https://www.google.com/maps/search/?api=1&query=Stagno%20di%20San%20Teodoro", website: null }
        ] },
      { id: "d3-nardino", name: "Da Nardino (San Teodoro)", category: "food",
        time: "20:00", driveFromBase: "20 min", rating: 4.2,
        note: "Cină de pește în San Teodoro — branzino în crustă de sare, fregola. Două ture, rezervă.",
        lat: 40.770711, lng: 9.6723137, mapsUrl: "https://maps.google.com/?cid=12728264857103385735", nearby: [] }
    ]
  },
  {
    day: "Miercuri", date: "17 iun", title: "Costa Smeralda",
    subtitle: "Singura zi mai lungă (~75 km / 1h15 dus din Posada). Pleacă devreme.",
    center: { lat: 41.10, lng: 9.52 },
    stops: [
      { id: "d4-principe", name: "Spiaggia del Principe", category: "beach",
        time: "10:00", driveFromBase: "1h15", rating: 4.5,
        note: "Granit roz + apă smarald. Parcare ~12€/zi, 15 min mers. Adu apă, nu sunt facilități.",
        lat: 41.0891685, lng: 9.5615816, mapsUrl: "https://maps.google.com/?cid=3507079248398036999",
        nearby: [
          { name: "Nuraghe La Prisgiona",
            blurb: "Sat nuragic din Epoca Bronzului, ~90 colibe, lângă Arzachena. Bilet combinat ~7€ cu tomba.",
            mapsUrl: "https://www.google.com/maps/search/?api=1&query=Nuraghe%20La%20Prisgiona", website: "https://www.gesecoarzachena.it/" },
          { name: "Tomba dei Giganti di Coddu Vecchiu",
            blurb: "Mormânt megalitic cu stela de 4,4 m — cea mai înaltă cunoscută. La ~700 m de La Prisgiona.",
            mapsUrl: "https://www.google.com/maps/search/?api=1&query=Tomba%20dei%20Giganti%20Coddu%20Vecchiu", website: "https://www.gesecoarzachena.it/" }
        ] },
      { id: "d4-portocervo", name: "Porto Cervo", category: "sight",
        time: "14:00", driveFromBase: "1h20", rating: null,
        note: "Plimbare prin port + La Passeggiata, vibe de yacht-uri.",
        lat: 41.1315336, lng: 9.535745, mapsUrl: "https://maps.google.com/?cid=14342356208876400881",
        nearby: [
          { name: "Chiesa Stella Maris",
            blurb: "Bisericuță din anii '60 cu una dintre cele mai frumoase priveliști peste Costa Smeralda; parcare gratuită.",
            mapsUrl: "https://www.google.com/maps/search/?api=1&query=Chiesa%20Stella%20Maris%20Porto%20Cervo", website: null }
        ] },
      { id: "d4-sanpantaleo", name: "San Pantaleo", category: "sight",
        time: "16:30", driveFromBase: "1h", rating: null,
        note: "Sat de granit cu ateliere de artizani, pe drumul de întoarcere. Piațeta cu bisericuța albă.",
        lat: 41.0460696, lng: 9.4679621, mapsUrl: "https://maps.google.com/?cid=14231113222283553258", nearby: [] },
      { id: "d4-boheme", name: "Casa Bohème Bistro (San Pantaleo)", category: "food",
        time: "18:30", driveFromBase: "1h", rating: 4.4,
        note: "Cină cool — plates de împărțit, cocktailuri, muzică bună.",
        lat: 41.0471181, lng: 9.466937, mapsUrl: "https://maps.google.com/?cid=14973468448274587085", nearby: [] }
    ]
  },
  {
    day: "Joi", date: "18 iun", title: "Plecare — Posada → Alghero",
    subtitle: "Avion 15:00 de la Alghero. Drumul e ~2h30, deci pleci devreme din Posada.",
    center: { lat: 40.5585, lng: 8.3163 },
    stops: [
      { id: "d5-plecare", name: "Plecare devreme din Posada", category: "drive",
        time: "08:30", driveFromBase: "start", rating: null,
        note: "Cca 2h30 până la aeroportul Alghero (SS131). Plecând la 08:30 ai tampon confortabil pentru zborul de 15:00.",
        lat: 40.6300, lng: 9.7150, mapsUrl: q("Posada Sardegna"), nearby: [] },
      { id: "d5-pranz", name: "Oprire scurtă în Alghero / Fertilia", category: "food",
        time: "11:30", driveFromBase: "—", rating: null,
        note: "Cafea sau prânz rapid dacă ai tampon — ultima plimbare pe bastioni sau lângă aeroport în Fertilia.",
        lat: 40.5585, lng: 8.3163, mapsUrl: q("Alghero Bastioni"), nearby: [] },
      { id: "d5-aeroport", name: "Aeroport Alghero-Fertilia — check-in", category: "drive",
        time: "13:00", driveFromBase: "10 min din Alghero", rating: null,
        note: "Fii la aeroport cu ~2h înainte de zborul de 15:00. Predai mașina închiriată întâi.",
        lat: 40.6320, lng: 8.2906, mapsUrl: q("Aeroporto di Alghero-Fertilia"), nearby: [] }
    ]
  }
];

/* Cheltuieli generale (nelegate de un spot) */
const GENERAL_EXPENSES = [
  { id: "gen-benzina", label: "Benzină", icon: "⛽" },
  { id: "gen-cazare", label: "Cazare", icon: "🛏️" },
  { id: "gen-masina", label: "Mașină închiriată", icon: "🚗" },
  { id: "gen-cumparaturi", label: "Cumpărături", icon: "🛒" },
  { id: "gen-diverse", label: "Diverse", icon: "🎟️" }
];

/* ---------- URL builders (formele exacte cerute) ---------- */
function directionsUrl(dest, origin /* {lat,lng} | null */) {
  const base = "https://www.google.com/maps/dir/?api=1";
  const tail = `&destination=${dest.lat},${dest.lng}&travelmode=driving`;
  return origin ? `${base}&origin=${origin.lat},${origin.lng}${tail}` : base + tail;
}
function placeUrl(p) {
  return p.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
}
function nearbyUrl(query, point) {
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${point.lat},${point.lng},14z`;
}

/* ---------- Categorii ---------- */
const CATEGORIES = [
  { key: "drive", label: "Drum & logistică", icon: "🚗" },
  { key: "sight", label: "Vizite & situri", icon: "🏛️" },
  { key: "view", label: "Belvedere", icon: "👁️" },
  { key: "beach", label: "Plaje", icon: "🏖️" },
  { key: "boat", label: "Pe mare", icon: "⛵" },
  { key: "food", label: "Restaurante", icon: "🍽️" }
];
const CAT_BY_KEY = {};
CATEGORIES.forEach((c, i) => { CAT_BY_KEY[c.key] = { ...c, order: i }; });
function catInfo(key) { return CAT_BY_KEY[key] || { label: "Altele", icon: "📍", order: 99 }; }

const DAY_ABBR = {
  "Duminică": "D", "Luni": "L", "Marți": "Ma", "Miercuri": "Mi",
  "Joi": "J", "Vineri": "V", "Sâmbătă": "S"
};

const LS = { state: "tripState", pending: "pendingToggles", tab: "lastTab", banner: "bannerDismissed" };

/* ---------- Stare ---------- */
let state = { checked: {}, spent: {}, updatedAt: null };
let pending = [];          // [{kind:'check'|'spend', id, value}]
let currentView = 0;       // index zi (0..n-1) sau "expenses"
let flushing = false;
let lastCloudOk = true;

/* index rapid: stopId -> {dayIndex, stop} */
const STOP_INDEX = {};
DATA.forEach((d, di) => d.stops.forEach((s) => { STOP_INDEX[s.id] = { dayIndex: di, stop: s }; }));

/* ---------- DOM refs ---------- */
const $ = (id) => document.getElementById(id);
const el = {
  sync: $("sync"), quickRow: $("quickRow"), quickHint: $("quickHint"),
  tabs: $("tabs"), progressLabel: $("progressLabel"), progressTotal: $("progressTotal"),
  progressFill: $("progressFill"), banner: $("banner"), dayHead: $("dayHead"),
  cards: $("cards"), resetDay: $("resetDay")
};

/* ---------- Storage ---------- */
function normalize(s) {
  s = s || {};
  return {
    checked: (s.checked && typeof s.checked === "object") ? s.checked : {},
    spent: (s.spent && typeof s.spent === "object") ? s.spent : {},
    updatedAt: s.updatedAt || null
  };
}
function loadLocal() {
  try { state = normalize(JSON.parse(localStorage.getItem(LS.state))); }
  catch { state = { checked: {}, spent: {}, updatedAt: null }; }
  try { pending = JSON.parse(localStorage.getItem(LS.pending)) || []; }
  catch { pending = []; }
}
function saveLocal() { localStorage.setItem(LS.state, JSON.stringify(state)); }
function savePending() { localStorage.setItem(LS.pending, JSON.stringify(pending)); }
function enqueue(kind, id, value) {
  pending = pending.filter((p) => !(p.kind === kind && p.id === id));
  pending.push({ kind, id, value });
  savePending();
}

/* ---------- API ---------- */
async function apiGet() {
  const r = await fetch("/api/state", { cache: "no-store" });
  if (!r.ok) throw new Error("GET state " + r.status);
  return await r.json();
}
async function apiPost(path, body) {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-trip-token": TOKEN },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error("POST " + path + " " + r.status);
  return await r.json();
}

/* ---------- Sincronizare ---------- */
async function syncFromCloud() {
  try {
    const cloud = normalize(await apiGet());
    lastCloudOk = true;
    const lu = state.updatedAt ? Date.parse(state.updatedAt) : 0;
    const cu = cloud.updatedAt ? Date.parse(cloud.updatedAt) : 0;
    if (pending.length === 0 && cu > lu) {
      state = cloud; saveLocal(); renderAll();
    } else if (lu > cu) {
      pushLocalDiff(cloud);
    }
  } catch { lastCloudOk = false; }
  updateSync();
}
function pushLocalDiff(cloud) {
  const cc = cloud.checked || {}, lc = state.checked || {};
  new Set([...Object.keys(cc), ...Object.keys(lc)]).forEach((id) => {
    if (!!lc[id] !== !!cc[id]) enqueue("check", id, !!lc[id]);
  });
  const cs = cloud.spent || {}, ls = state.spent || {};
  new Set([...Object.keys(cs), ...Object.keys(ls)]).forEach((id) => {
    if ((Number(ls[id]) || 0) !== (Number(cs[id]) || 0)) enqueue("spend", id, Number(ls[id]) || 0);
  });
  flushQueue();
}
async function flushQueue() {
  if (flushing) return;
  if (pending.length === 0) { updateSync(); return; }
  flushing = true;
  updateSync("syncing");
  while (pending.length) {
    const item = pending[0];
    try {
      const newState = item.kind === "spend"
        ? await apiPost("/api/spend", { id: item.id, amount: item.value })
        : await apiPost("/api/toggle", { id: item.id, value: item.value });
      pending.shift(); savePending();
      if (newState && newState.updatedAt) { state.updatedAt = newState.updatedAt; saveLocal(); }
      lastCloudOk = true;
    } catch { flushing = false; updateSync(); return; }
  }
  flushing = false; updateSync();
}

/* ---------- Acțiuni stare ---------- */
function toggleCheck(id, value) {
  if (value) state.checked[id] = true; else delete state.checked[id];
  state.updatedAt = new Date().toISOString();
  saveLocal(); enqueue("check", id, value);
  renderProgress(); renderBanner(); refreshTabsState();
  flushQueue();
}
function setSpend(id, amount) {
  amount = Math.round((Number(amount) || 0) * 100) / 100;
  if (amount > 0) state.spent[id] = amount; else delete state.spent[id];
  state.updatedAt = new Date().toISOString();
  saveLocal(); enqueue("spend", id, amount);
  renderProgress();
  if (currentView === "expenses") renderExpenses();
  flushQueue();
}

/* ---------- Indicator sync ---------- */
function updateSync(force) {
  const e = el.sync; e.className = "sync";
  if (force === "syncing") { e.textContent = "↻ se sincronizează…"; e.classList.add("is-syncing"); }
  else if (pending.length > 0) { e.textContent = `offline · în așteptare (${pending.length})`; e.classList.add("is-offline"); }
  else if (!lastCloudOk) { e.textContent = "offline"; e.classList.add("is-offline"); }
  else { e.textContent = "✓ sincronizat"; e.classList.add("is-synced"); }
}

/* ---------- Geolocație ---------- */
function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("no-geo")); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
    );
  });
}
function openTab(url) { window.open(url, "_blank", "noopener"); }
function showQuickRow() { el.quickRow.hidden = false; el.quickHint.hidden = true; }
function hideQuickRow() { el.quickRow.hidden = true; el.quickHint.hidden = false; }
async function initGeoUI() {
  if (!navigator.geolocation) { el.quickRow.hidden = true; el.quickHint.hidden = true; return; }
  showQuickRow();
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const st = await navigator.permissions.query({ name: "geolocation" });
      if (st.state === "denied") hideQuickRow();
      st.onchange = () => (st.state === "denied" ? hideQuickRow() : showQuickRow());
    } catch { /* ignore */ }
  }
}
async function onQuickClick(query) {
  try { openTab(nearbyUrl(query, await getPosition())); }
  catch (err) { if (err && err.code === 1) hideQuickRow(); else openTab("https://www.google.com/maps/search/" + encodeURIComponent(query)); }
}
async function onDirections(stop) {
  try { openTab(directionsUrl(stop, await getPosition())); }
  catch { openTab(directionsUrl(stop, null)); }
}

/* ---------- Calcule ---------- */
function dayCounts(day) {
  let done = 0; day.stops.forEach((s) => { if (state.checked[s.id]) done++; });
  return { done, total: day.stops.length };
}
function overallCounts() {
  let done = 0, total = 0;
  DATA.forEach((d) => d.stops.forEach((s) => { total++; if (state.checked[s.id]) done++; }));
  return { done, total };
}
function fmtEur(n) {
  n = Number(n) || 0;
  return (Number.isInteger(n) ? n.toString() : n.toFixed(2)) + " €";
}
function dayExpense(day) {
  return day.stops.reduce((sum, s) => sum + (Number(state.spent[s.id]) || 0), 0);
}
function grandExpense() {
  return Object.values(state.spent).reduce((sum, v) => sum + (Number(v) || 0), 0);
}
function expenseByCategory() {
  const map = {}; // label -> {icon, total}
  // spoturi
  Object.keys(state.spent).forEach((id) => {
    const amt = Number(state.spent[id]) || 0;
    if (amt <= 0) return;
    const idx = STOP_INDEX[id];
    if (idx) {
      const c = catInfo(idx.stop.category);
      map[c.label] = map[c.label] || { icon: c.icon, total: 0 };
      map[c.label].total += amt;
    }
  });
  // generale
  GENERAL_EXPENSES.forEach((g) => {
    const amt = Number(state.spent[g.id]) || 0;
    if (amt > 0) { map[g.label] = map[g.label] || { icon: g.icon, total: 0 }; map[g.label].total += amt; }
  });
  return Object.entries(map).map(([label, v]) => ({ label, icon: v.icon, total: v.total }))
    .sort((a, b) => b.total - a.total);
}

/* ---------- Randare: taburi ---------- */
function buildTabs() {
  el.tabs.innerHTML = "";
  DATA.forEach((d, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tab" + (currentView === i ? " active" : "");
    b.innerHTML = `<span class="tab-day">${DAY_ABBR[d.day] || d.day.slice(0, 2)}</span><span class="tab-date">${d.date}</span>`;
    b.addEventListener("click", () => switchView(i));
    el.tabs.appendChild(b);
  });
  const eb = document.createElement("button");
  eb.type = "button";
  eb.className = "tab tab-exp" + (currentView === "expenses" ? " active" : "");
  eb.innerHTML = `<span class="tab-day">💶</span><span class="tab-date">cost</span>`;
  eb.addEventListener("click", () => switchView("expenses"));
  el.tabs.appendChild(eb);
  refreshTabsState();
}
function refreshTabsState() {
  const kids = [...el.tabs.children];
  kids.forEach((b, i) => {
    if (i < DATA.length) {
      const c = dayCounts(DATA[i]);
      b.classList.toggle("complete", c.total > 0 && c.done === c.total);
      b.classList.toggle("active", currentView === i);
    } else {
      b.classList.toggle("active", currentView === "expenses");
    }
  });
}

/* ---------- Randare: progres ---------- */
function renderProgress() {
  if (currentView === "expenses") {
    el.progressLabel.textContent = "💶 Cheltuieli";
    el.progressFill.style.width = "100%";
    el.progressTotal.textContent = "Total " + fmtEur(grandExpense());
    return;
  }
  const c = dayCounts(DATA[currentView]);
  el.progressLabel.textContent = `${c.done}/${c.total}`;
  el.progressFill.style.width = c.total ? (c.done / c.total) * 100 + "%" : "0%";
  const o = overallCounts();
  const spent = dayExpense(DATA[currentView]);
  el.progressTotal.textContent = `${o.done}/${o.total} sejur · azi ${fmtEur(spent)}`;
}

/* ---------- Randare: banner rezervări ---------- */
function renderBanner() {
  if (currentView === "expenses") { el.banner.hidden = true; return; }
  const dismissed = localStorage.getItem(LS.banner) === "1";
  const pendingResv = [];
  DATA.forEach((d) => d.stops.forEach((s) => {
    if (s.reservation && s.reservation.required && !state.checked[s.id]) pendingResv.push(s);
  }));
  if (dismissed || pendingResv.length === 0) { el.banner.hidden = true; el.banner.innerHTML = ""; return; }
  const items = pendingResv.map((s) =>
    `<li><a href="${s.reservation.url}" target="_blank" rel="noopener">${s.name}</a> — ${s.reservation.label}</li>`).join("");
  el.banner.innerHTML =
    `<button class="banner-dismiss" type="button" id="bannerX" aria-label="Închide">×</button>` +
    `<h3>🔖 De rezolvat — rezervări</h3><ul>${items}</ul>`;
  el.banner.hidden = false;
  $("bannerX").addEventListener("click", () => { localStorage.setItem(LS.banner, "1"); renderBanner(); });
}

/* ---------- Randare: card oprire ---------- */
function cardEl(stop) {
  const art = document.createElement("article");
  art.className = "card" + (state.checked[stop.id] ? " done" : "");
  art.dataset.id = stop.id;
  const icon = catInfo(stop.category).icon;
  const metaBits = [];
  if (stop.time && stop.time !== "—") metaBits.push(`⏰ ${stop.time}`);
  if (stop.driveFromBase) metaBits.push(`🚗 ${stop.driveFromBase}`);
  if (stop.rating) metaBits.push(`<span class="star">★ ${stop.rating}</span>`);
  const spentVal = state.spent[stop.id] != null ? state.spent[stop.id] : "";

  let html =
    `<div class="card-head">
       <div style="flex:1 1 auto;min-width:0">
         <div class="card-name">${icon} ${stop.name}</div>
         <div class="card-meta">${metaBits.map((m) => `<span>${m}</span>`).join("")}</div>
       </div>
       <label class="done-toggle"><span>Făcut</span><input type="checkbox" ${state.checked[stop.id] ? "checked" : ""}></label>
     </div>
     <p class="card-note">${stop.note}</p>`;

  if (stop.reservation && stop.reservation.required) {
    html += `<a class="resv" href="${stop.reservation.url}" target="_blank" rel="noopener">🔖 ${stop.reservation.label}</a>`;
  }
  if (stop.nearby && stop.nearby.length) {
    const ns = stop.nearby.map((n) =>
      `<div class="nearby-item"><div class="nearby-name">${n.name}</div>
         <div class="nearby-blurb">${n.blurb}</div>
         <div class="nearby-links"><a href="${n.mapsUrl}" target="_blank" rel="noopener">📍 Maps</a>
           ${n.website ? `<a href="${n.website}" target="_blank" rel="noopener">🔗 Site</a>` : ""}</div></div>`).join("");
    html += `<div class="nearby"><div class="nearby-title">În apropiere</div>${ns}</div>`;
  }
  html +=
    `<div class="actions">
       <button class="act primary" type="button" data-act="dir">🧭 Direcții</button>
       <a class="act" href="${placeUrl(stop)}" target="_blank" rel="noopener">📍 Hartă</a>
       <a class="act" href="${nearbyUrl("restaurants", stop)}" target="_blank" rel="noopener">🍽️ Restaurante</a>
       <a class="act" href="${nearbyUrl("gas station", stop)}" target="_blank" rel="noopener">⛽ Benzinării</a>
     </div>
     <label class="spend"><span>💶 Cât ai cheltuit aici</span>
       <span class="spend-in"><input type="number" inputmode="decimal" min="0" step="1" placeholder="0" value="${spentVal}"> €</span>
     </label>`;

  art.innerHTML = html;
  const cb = art.querySelector(".done-toggle input");
  cb.addEventListener("change", () => { art.classList.toggle("done", cb.checked); toggleCheck(stop.id, cb.checked); });
  art.querySelector('[data-act="dir"]').addEventListener("click", () => onDirections(stop));
  const sp = art.querySelector(".spend input");
  sp.addEventListener("change", () => setSpend(stop.id, sp.value));
  return art;
}

/* ---------- Randare: zi ---------- */
function renderDay(idx, withFade) {
  const day = DATA[idx];
  el.dayHead.innerHTML =
    `<h2>${day.day}, ${day.date} — ${day.title}</h2><p>${day.subtitle}</p>` +
    `<div class="zone-row">
       <span class="zone-label">📍 Ce e în zonă:</span>
       <a class="zone-btn" href="${nearbyUrl("spiagge", day.center)}" target="_blank" rel="noopener">🏖️ Plaje</a>
       <a class="zone-btn" href="${nearbyUrl("ristoranti", day.center)}" target="_blank" rel="noopener">🍽️ Restaurante</a>
       <a class="zone-btn" href="${nearbyUrl("cosa vedere", day.center)}" target="_blank" rel="noopener">🏛️ Atracții</a>
       <a class="zone-btn" href="${nearbyUrl("gas station", day.center)}" target="_blank" rel="noopener">⛽ Benzinării</a>
     </div>`;
  el.cards.innerHTML = "";

  // grupare pe categorii (în ordinea CATEGORIES), iar în cadrul categoriei după oră
  const groups = {};
  day.stops.forEach((s) => { (groups[s.category] = groups[s.category] || []).push(s); });
  CATEGORIES.forEach((cat) => {
    const list = groups[cat.key];
    if (!list || !list.length) return;
    list.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    const h = document.createElement("div");
    h.className = "cat-head";
    h.innerHTML = `${cat.icon} ${cat.label} <span class="cat-count">${list.length}</span>`;
    el.cards.appendChild(h);
    list.forEach((s) => el.cards.appendChild(cardEl(s)));
  });

  el.resetDay.hidden = day.stops.length === 0;
  if (withFade) { el.cards.classList.remove("fade"); void el.cards.offsetWidth; el.cards.classList.add("fade"); }
}

/* ---------- Randare: cheltuieli ---------- */
function renderExpenses() {
  el.dayHead.innerHTML = `<h2>💶 Cheltuieli sejur</h2><p>Adaugi pe fiecare spot „cât ai cheltuit"; aici vezi totalurile. Plus cheltuieli generale (benzină, cazare…).</p>`;
  el.resetDay.hidden = true;
  const grand = grandExpense();

  const perDay = DATA.map((d, i) => ({ i, label: `${d.day} ${d.date}`, total: dayExpense(d) }))
    .filter((x) => x.total > 0);
  const perCat = expenseByCategory();

  const genRows = GENERAL_EXPENSES.map((g) => {
    const v = state.spent[g.id] != null ? state.spent[g.id] : "";
    return `<label class="gen-row"><span>${g.icon} ${g.label}</span>
      <span class="spend-in"><input type="number" inputmode="decimal" min="0" step="1" placeholder="0" value="${v}" data-gen="${g.id}"> €</span></label>`;
  }).join("");

  el.cards.innerHTML =
    `<div class="exp-grand">Total sejur<strong>${fmtEur(grand)}</strong></div>

     <div class="exp-card">
       <div class="exp-card-title">Cheltuieli generale</div>
       ${genRows}
     </div>

     <div class="exp-card">
       <div class="exp-card-title">Pe categorie</div>
       ${perCat.length ? perCat.map((c) =>
         `<div class="exp-line"><span>${c.icon} ${c.label}</span><b>${fmtEur(c.total)}</b></div>`).join("")
         : `<div class="exp-empty">Încă nimic. Completează sumele pe spoturi sau mai sus.</div>`}
     </div>

     <div class="exp-card">
       <div class="exp-card-title">Pe zile</div>
       ${perDay.length ? perDay.map((d) =>
         `<div class="exp-line"><span>${d.label}</span><b>${fmtEur(d.total)}</b></div>`).join("")
         : `<div class="exp-empty">Încă nicio cheltuială pe spoturi.</div>`}
     </div>`;

  el.cards.querySelectorAll("input[data-gen]").forEach((inp) => {
    inp.addEventListener("change", () => setSpend(inp.dataset.gen, inp.value));
  });
}

/* ---------- Render orchestrare ---------- */
function renderMain(withFade) {
  if (currentView === "expenses") renderExpenses();
  else renderDay(currentView, withFade);
}
function renderAll() {
  buildTabs();
  renderMain();
  renderProgress();
  renderBanner();
}
function switchView(v) {
  if (v === currentView) return;
  currentView = v;
  localStorage.setItem(LS.tab, String(v));
  refreshTabsState();
  renderMain(true);
  renderProgress();
  renderBanner();
}

function resetDay() {
  if (currentView === "expenses") return;
  const day = DATA[currentView];
  const done = day.stops.filter((s) => state.checked[s.id]);
  if (done.length === 0) return;
  if (!confirm(`Debifezi toate cele ${done.length} opriri din ziua „${day.day}”? (cheltuielile rămân)`)) return;
  done.forEach((s) => { delete state.checked[s.id]; enqueue("check", s.id, false); });
  state.updatedAt = new Date().toISOString();
  saveLocal(); renderDay(currentView); renderProgress(); renderBanner(); refreshTabsState();
  flushQueue();
}

/* ---------- Service worker ---------- */
function registerSW() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
  }
}

/* ---------- Init ---------- */
function init() {
  loadLocal();
  const saved = localStorage.getItem(LS.tab);
  if (saved === "expenses") currentView = "expenses";
  else {
    const n = parseInt(saved, 10);
    currentView = Number.isInteger(n) && n >= 0 && n < DATA.length ? n : 0;
  }
  renderAll();
  initGeoUI();
  updateSync();
  syncFromCloud().then(() => flushQueue());

  el.quickRow.addEventListener("click", (e) => {
    const btn = e.target.closest(".quick-btn");
    if (btn) onQuickClick(btn.dataset.near);
  });
  el.resetDay.addEventListener("click", resetDay);
  window.addEventListener("online", () => { updateSync(); flushQueue(); syncFromCloud(); });
  window.addEventListener("offline", () => { lastCloudOk = false; updateSync(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) syncFromCloud(); });
  registerSW();
}

init();
