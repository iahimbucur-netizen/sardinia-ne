"use strict";

/* ============================================================
   Sardinia NE · Posada — PWA itinerariu offline-first
   Bife persistate în Cloudflare KV prin /api. Oglindă locală
   în localStorage; coadă de retrimitere când revine netul.
   ============================================================ */

const TRIP_ID = "sardinia-ne";
// Trebuie să fie identic cu TOKEN-ul din functions/api/toggle.js
const TOKEN = "sardinia-posada-2026";

const BASE = { name: "Posada (cazare)", lat: 40.6300, lng: 9.7150 };

const DATA = [
  {
    day: "Duminică", date: "15 iun", title: "Sosire & Posada",
    subtitle: "Aclimatizare lejeră aproape de bază",
    stops: [
      { id: "d1-castello", name: "Castello della Fava (Posada)", kind: "sight",
        time: "17:30", driveFromBase: "5 min", rating: 4.4,
        note: "Urci pe ulițele de piatră ale borgului medieval până la castel (4€). Panoramă peste vale și mare.",
        lat: 40.6381382, lng: 9.7239156,
        mapsUrl: "https://maps.google.com/?cid=9107459291129127808",
        nearby: [] },
      { id: "d1-lacinta", name: "Spiaggia La Cinta", kind: "beach",
        time: "19:00", driveFromBase: "20 min", rating: 4.5,
        note: "3,5 km de nisip alb cu Tavolara în fundal. Fără rezervare. Baie de seară.",
        lat: 40.7917039, lng: 9.6699855,
        mapsUrl: "https://maps.google.com/?cid=4419791207345060262",
        nearby: [
          { name: "Stagno di San Teodoro (flamingo)",
            blurb: "Lagună chiar în spatele plajei — flamingo roz și stârci, mai ales dimineața.",
            mapsUrl: "https://www.google.com/maps/search/?api=1&query=Stagno%20di%20San%20Teodoro&query_place_id=ChIJ60ZcyyjM3hIRZHWxjlj1z_c",
            website: null }
        ] },
      { id: "d1-taverna", name: "La Taverna degli Artisti", kind: "food",
        time: "20:45", driveFromBase: "20 min", rating: 4.1,
        note: "Cină lângă La Cinta. Spaghetti allo scoglio, risotto cu fructe de mare. Rezervă.",
        lat: 40.7810211, lng: 9.6724071,
        mapsUrl: "https://maps.google.com/?cid=1892989426947872994",
        nearby: [] }
    ]
  },
  {
    day: "Luni", date: "16 iun", title: "Capo Coda Cavallo & „Micul Tahiti”",
    subtitle: "Cele mai spectaculoase plaje din zonă, ~25 min",
    stops: [
      { id: "d2-brandinchi", name: "Cala Brandinchi", kind: "beach",
        time: "09:30", driveFromBase: "25 min", rating: 4.2,
        note: "„Micul Tahiti”, apă mică turcoaz. Ajungi înainte de 10:00 și mergi spre nord pentru loc.",
        lat: 40.8347189, lng: 9.6858305,
        mapsUrl: "https://maps.google.com/?cid=8338057865545315826",
        reservation: { required: true, label: "Rezervare obligatorie", url: "https://www.santeodorospiagge.it/" },
        nearby: [] },
      { id: "d2-luimpostu", name: "Spiaggia di Lu Impostu", kind: "beach",
        time: "13:00", driveFromBase: "25 min", rating: 4.4,
        note: "Lângă Brandinchi, aceeași parcare. Lagună + nisip fin.",
        lat: 40.826357, lng: 9.6809525,
        mapsUrl: "https://maps.google.com/?cid=6263060510312342630",
        reservation: { required: true, label: "Rezervare obligatorie", url: "https://www.santeodorospiagge.it/" },
        nearby: [] },
      { id: "d2-codacavallo", name: "Spiaggia di Capo Coda Cavallo", kind: "beach",
        time: "14:30", driveFromBase: "30 min", rating: 4.5,
        note: "Golf sălbatic, fără rezervare, snorkeling excelent. Ultim drum de pământ scurt.",
        lat: 40.8408214, lng: 9.7233979,
        mapsUrl: "https://maps.google.com/?cid=4617979726807287825",
        nearby: [
          { name: "Isola di Tavolara",
            blurb: "Munte-insulă de calcar de ~565 m care domină tot golful — peisaj dramatic, vizibil din toată zona.",
            mapsUrl: "https://www.google.com/maps/search/?api=1&query=Isola%20di%20Tavolara&query_place_id=ChIJxTBmCoYy2RIRTDT0vPcjRAI",
            website: null }
        ] },
      { id: "d2-bellavista", name: "Bellavista San Teodoro", kind: "food",
        time: "19:30", driveFromBase: "30 min", rating: 4.2,
        note: "Cină pe deal cu vedere spre golful Capo Coda Cavallo. Apus superb.",
        lat: 40.8408268, lng: 9.7156546,
        mapsUrl: "https://maps.google.com/?cid=12453858698099672247",
        nearby: [] }
    ]
  },
  {
    day: "Marți", date: "17 iun", title: "Tavolara pe mare",
    subtitle: "Ziua „misto”: Aria Marină Protejată Tavolara-Molara",
    stops: [
      { id: "d3-sailing", name: "Sailing San Paolo (Porto San Paolo)", kind: "boat",
        time: "09:00", driveFromBase: "35 min", rating: 4.9,
        note: "Tur cu velier de epocă: piscinele Molara, Tavolara, snorkeling, aperitivo la bord.",
        lat: 40.8822272, lng: 9.6367887,
        mapsUrl: "https://maps.google.com/?cid=10666500192853509207",
        reservation: { required: true, label: "Rezervă din timp", url: "https://www.sailingsanpaolo.it/" },
        nearby: [
          { name: "Isola di Tavolara",
            blurb: "Destinația turului — insula-munte cu plaje sălbatice, hiking și 3 restaurante. Feribot ~16€ dus-întors dacă vrei doar pe insulă.",
            mapsUrl: "https://www.google.com/maps/search/?api=1&query=Isola%20di%20Tavolara&query_place_id=ChIJxTBmCoYy2RIRTDT0vPcjRAI",
            website: null }
        ] },
      { id: "d3-nardino", name: "Da Nardino", kind: "food",
        time: "20:00", driveFromBase: "20 min", rating: 4.2,
        note: "Cină de pește în San Teodoro — branzino în crustă de sare, fregola. Două ture, rezervă.",
        lat: 40.770711, lng: 9.6723137,
        mapsUrl: "https://maps.google.com/?cid=12728264857103385735",
        nearby: [] }
    ]
  },
  {
    day: "Miercuri", date: "18 iun", title: "Costa Smeralda",
    subtitle: "Singura zi mai lungă (~75 km / 1h15 dus). Pleacă devreme.",
    stops: [
      { id: "d4-principe", name: "Spiaggia del Principe", kind: "beach",
        time: "10:00", driveFromBase: "1h15", rating: 4.5,
        note: "Granit roz + apă smarald. Parcare ~12€/zi, 15 min mers. Adu apă, nu sunt facilități.",
        lat: 41.0891685, lng: 9.5615816,
        mapsUrl: "https://maps.google.com/?cid=3507079248398036999",
        nearby: [
          { name: "Nuraghe La Prisgiona",
            blurb: "Sat nuragic din Epoca Bronzului (sec. XIV–VIII î.Hr.), ~90 colibe, lângă Arzachena. Bilet combinat ~7€ cu tomba.",
            mapsUrl: "https://www.google.com/maps/search/?api=1&query=Nuraghe%20La%20Prisgiona&query_place_id=ChIJiVrzhxxQ2RIRdmrCilBrnXI",
            website: "https://www.gesecoarzachena.it/" },
          { name: "Tomba dei Giganti di Coddu Vecchiu",
            blurb: "Mormânt megalitic foarte bine păstrat, cu stela de 4,4 m — cea mai înaltă cunoscută. La ~700 m de La Prisgiona.",
            mapsUrl: "https://www.google.com/maps/search/?api=1&query=Tomba%20dei%20Giganti%20Coddu%20Vecchiu&query_place_id=ChIJlaioGBtQ2RIREN1PbsTXsS0",
            website: "https://www.gesecoarzachena.it/" }
        ] },
      { id: "d4-portocervo", name: "Porto Cervo", kind: "sight",
        time: "14:00", driveFromBase: "1h20", rating: null,
        note: "Plimbare prin port + La Passeggiata, vibe de yacht-uri.",
        lat: 41.1315336, lng: 9.535745,
        mapsUrl: "https://maps.google.com/?cid=14342356208876400881",
        nearby: [
          { name: "Chiesa Stella Maris",
            blurb: "Bisericuță din anii '60 cu una dintre cele mai frumoase priveliști peste Costa Smeralda; parcare gratuită.",
            mapsUrl: "https://www.google.com/maps/search/?api=1&query=Chiesa%20Stella%20Maris%20Porto%20Cervo&query_place_id=ChIJ0Qc7GwlB2RIRNtx0b5qng6o",
            website: null }
        ] },
      { id: "d4-sanpantaleo", name: "San Pantaleo", kind: "sight",
        time: "16:30", driveFromBase: "1h", rating: null,
        note: "Sat de granit cu ateliere de artizani, pe drumul de întoarcere.",
        lat: 41.0460696, lng: 9.4679621,
        mapsUrl: "https://maps.google.com/?cid=14231113222283553258",
        nearby: [
          { name: "Chiesa di San Pantaleo & piațeta",
            blurb: "Piațeta cu bisericuța albă, încadrată de stânci de granit; magazine de artizani. Atmosferă autentică.",
            mapsUrl: "https://www.google.com/maps/search/?api=1&query=Chiesa%20di%20San%20Pantaleo&query_place_id=ChIJv8vap6hI2RIRWR_p3o9825E",
            website: null }
        ] },
      { id: "d4-boheme", name: "Casa Bohème Bistro (San Pantaleo)", kind: "food",
        time: "18:30", driveFromBase: "1h", rating: 4.4,
        note: "Cină cool — plates de împărțit, cocktailuri, muzică bună.",
        lat: 41.0471181, lng: 9.466937,
        mapsUrl: "https://maps.google.com/?cid=14973468448274587085",
        nearby: [] }
    ]
  },
  {
    day: "Joi", date: "19 iun", title: "Plecare (la prânz)",
    subtitle: "Dimineață relaxată, apoi spre aeroport",
    stops: [
      { id: "d5-marco", name: "Marco & Caterina (Posada)", kind: "food",
        time: "11:30", driveFromBase: "5 min", rating: 4.4,
        note: "Prânz de adio lângă castel — fregola cu fructe de mare. Olbia ~40 min, Alghero ~2h.",
        lat: 40.6367796, lng: 9.725594,
        mapsUrl: "https://maps.google.com/?cid=2887425309595092167",
        nearby: [] }
    ]
  }
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

/* ---------- Constante UI ---------- */
const KIND_ICON = { beach: "🏖️", sight: "🏛️", food: "🍽️", boat: "⛵" };
const DAY_ABBR = {
  "Duminică": "D", "Luni": "L", "Marți": "Ma", "Miercuri": "Mi",
  "Joi": "J", "Vineri": "V", "Sâmbătă": "S"
};

const LS = {
  state: "tripState",
  pending: "pendingToggles",
  tab: "lastTab",
  banner: "bannerDismissed"
};

/* ---------- Stare ---------- */
let state = { checked: {}, updatedAt: null };
let pending = [];        // [{id, value}]
let currentDay = 0;
let flushing = false;
let lastCloudOk = true;  // a reușit ultimul GET /api/state?

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
  const checked = (s.checked && typeof s.checked === "object") ? s.checked : {};
  return { checked, updatedAt: s.updatedAt || null };
}
function loadLocal() {
  try { state = normalize(JSON.parse(localStorage.getItem(LS.state))); }
  catch { state = { checked: {}, updatedAt: null }; }
  try { pending = JSON.parse(localStorage.getItem(LS.pending)) || []; }
  catch { pending = []; }
}
function saveLocal() { localStorage.setItem(LS.state, JSON.stringify(state)); }
function savePending() { localStorage.setItem(LS.pending, JSON.stringify(pending)); }
function enqueue(id, value) {
  pending = pending.filter((p) => p.id !== id);
  pending.push({ id, value: !!value });
  savePending();
}

/* ---------- API ---------- */
async function apiGet() {
  const r = await fetch("/api/state", { cache: "no-store" });
  if (!r.ok) throw new Error("GET state " + r.status);
  return await r.json();
}
async function apiToggle(id, value) {
  const r = await fetch("/api/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-trip-token": TOKEN },
    body: JSON.stringify({ id, value: !!value })
  });
  if (!r.ok) throw new Error("POST toggle " + r.status);
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
      // cloud-ul e mai nou → îl adoptăm
      state = cloud;
      saveLocal();
      renderAll();
    } else if (lu > cu) {
      // local mai nou → împingem diferența spre cloud, ca toggle-uri
      pushLocalDiff(cloud);
    }
  } catch (e) {
    lastCloudOk = false;
  }
  updateSync();
}

function pushLocalDiff(cloud) {
  const cc = cloud.checked || {};
  const lc = state.checked || {};
  const ids = new Set([...Object.keys(cc), ...Object.keys(lc)]);
  ids.forEach((id) => {
    if (!!lc[id] !== !!cc[id]) enqueue(id, !!lc[id]);
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
      const newState = await apiToggle(item.id, item.value);
      pending.shift();
      savePending();
      if (newState && newState.updatedAt) {
        state.updatedAt = newState.updatedAt;
        saveLocal();
      }
      lastCloudOk = true;
    } catch (e) {
      flushing = false;
      updateSync();
      return;
    }
  }
  flushing = false;
  updateSync();
}

/* ---------- Toggle ---------- */
function setChecked(id, value) {
  if (value) state.checked[id] = true;
  else delete state.checked[id];
  state.updatedAt = new Date().toISOString();
}
function toggle(id, value) {
  setChecked(id, value);
  saveLocal();
  enqueue(id, value);
  // actualizări țintite (cardul își schimbă deja clasa în handler)
  renderProgress();
  renderBanner();
  refreshTabsState();
  flushQueue();
}

/* ---------- Indicator sync ---------- */
function updateSync(force) {
  const e = el.sync;
  e.className = "sync";
  if (force === "syncing") {
    e.textContent = "↻ se sincronizează…";
    e.classList.add("is-syncing");
  } else if (pending.length > 0) {
    e.textContent = `offline · în așteptare (${pending.length})`;
    e.classList.add("is-offline");
  } else if (!lastCloudOk) {
    e.textContent = "offline";
    e.classList.add("is-offline");
  } else {
    e.textContent = "✓ sincronizat";
    e.classList.add("is-synced");
  }
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
  try {
    const pos = await getPosition();
    openTab(nearbyUrl(query, pos));
  } catch (err) {
    if (err && err.code === 1) { hideQuickRow(); }     // refuz permisiune
    else { openTab("https://www.google.com/maps/search/" + encodeURIComponent(query)); }
  }
}

async function onDirections(stop) {
  try {
    const pos = await getPosition();
    openTab(directionsUrl(stop, pos));
  } catch {
    openTab(directionsUrl(stop, null)); // Maps ia locația curentă singur
  }
}

/* ---------- Randare ---------- */
function dayCounts(day) {
  const total = day.stops.length;
  let done = 0;
  day.stops.forEach((s) => { if (state.checked[s.id]) done++; });
  return { done, total };
}
function overallCounts() {
  let done = 0, total = 0;
  DATA.forEach((d) => { d.stops.forEach((s) => { total++; if (state.checked[s.id]) done++; }); });
  return { done, total };
}

function buildTabs() {
  el.tabs.innerHTML = "";
  DATA.forEach((d, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tab" + (i === currentDay ? " active" : "");
    b.dataset.idx = String(i);
    b.innerHTML = `<span class="tab-day">${DAY_ABBR[d.day] || d.day.slice(0, 2)}</span><span class="tab-date">${d.date}</span>`;
    b.addEventListener("click", () => switchDay(i));
    el.tabs.appendChild(b);
  });
  refreshTabsState();
}
function refreshTabsState() {
  [...el.tabs.children].forEach((b, i) => {
    const c = dayCounts(DATA[i]);
    b.classList.toggle("complete", c.total > 0 && c.done === c.total);
    b.classList.toggle("active", i === currentDay);
  });
}

function renderProgress() {
  const c = dayCounts(DATA[currentDay]);
  el.progressLabel.textContent = `${c.done}/${c.total}`;
  el.progressFill.style.width = c.total ? (c.done / c.total) * 100 + "%" : "0%";
  const o = overallCounts();
  el.progressTotal.textContent = `${o.done}/${o.total} pe tot sejurul`;
}

function renderBanner() {
  const dismissed = localStorage.getItem(LS.banner) === "1";
  const pendingResv = [];
  DATA.forEach((d) => d.stops.forEach((s) => {
    if (s.reservation && s.reservation.required && !state.checked[s.id]) pendingResv.push(s);
  }));

  if (dismissed || pendingResv.length === 0) { el.banner.hidden = true; el.banner.innerHTML = ""; return; }

  const items = pendingResv.map((s) =>
    `<li><a href="${s.reservation.url}" target="_blank" rel="noopener">${s.name}</a> — ${s.reservation.label}</li>`
  ).join("");

  el.banner.innerHTML =
    `<button class="banner-dismiss" type="button" id="bannerX" aria-label="Închide">×</button>` +
    `<h3>🔖 De rezolvat — rezervări</h3>` +
    `<ul>${items}</ul>`;
  el.banner.hidden = false;
  $("bannerX").addEventListener("click", () => {
    localStorage.setItem(LS.banner, "1");
    renderBanner();
  });
}

function cardEl(stop) {
  const art = document.createElement("article");
  art.className = "card" + (state.checked[stop.id] ? " done" : "");
  art.dataset.id = stop.id;

  const icon = KIND_ICON[stop.kind] || "📍";
  const metaBits = [`⏰ ${stop.time}`, `🚗 ${stop.driveFromBase} din bază`];
  if (stop.rating) metaBits.push(`<span class="star">★ ${stop.rating}</span>`);

  let html =
    `<div class="card-head">
       <div style="flex:1 1 auto;min-width:0">
         <div class="card-name">${icon} ${stop.name}</div>
         <div class="card-meta">${metaBits.map((m) => `<span>${m}</span>`).join("")}</div>
       </div>
       <label class="done-toggle"><span>Făcut</span>
         <input type="checkbox" ${state.checked[stop.id] ? "checked" : ""}>
       </label>
     </div>
     <p class="card-note">${stop.note}</p>`;

  if (stop.reservation && stop.reservation.required) {
    html += `<a class="resv" href="${stop.reservation.url}" target="_blank" rel="noopener">🔖 ${stop.reservation.label}</a>`;
  }

  if (stop.nearby && stop.nearby.length) {
    const ns = stop.nearby.map((n) =>
      `<div class="nearby-item">
         <div class="nearby-name">${n.name}</div>
         <div class="nearby-blurb">${n.blurb}</div>
         <div class="nearby-links">
           <a href="${n.mapsUrl}" target="_blank" rel="noopener">📍 Maps</a>
           ${n.website ? `<a href="${n.website}" target="_blank" rel="noopener">🔗 Site</a>` : ""}
         </div>
       </div>`
    ).join("");
    html += `<div class="nearby"><div class="nearby-title">În apropiere</div>${ns}</div>`;
  }

  html +=
    `<div class="actions">
       <button class="act primary" type="button" data-act="dir">🧭 Direcții</button>
       <a class="act" href="${placeUrl(stop)}" target="_blank" rel="noopener">📍 Hartă</a>
       <a class="act" href="${nearbyUrl("restaurants", stop)}" target="_blank" rel="noopener">🍽️ Restaurante</a>
       <a class="act" href="${nearbyUrl("gas station", stop)}" target="_blank" rel="noopener">⛽ Benzinării</a>
     </div>`;

  art.innerHTML = html;

  const cb = art.querySelector(".done-toggle input");
  cb.addEventListener("change", () => {
    art.classList.toggle("done", cb.checked);
    toggle(stop.id, cb.checked);
  });
  art.querySelector('[data-act="dir"]').addEventListener("click", () => onDirections(stop));

  return art;
}

function renderDay(idx, withFade) {
  const day = DATA[idx];
  el.dayHead.innerHTML = `<h2>${day.day}, ${day.date} — ${day.title}</h2><p>${day.subtitle}</p>`;
  el.cards.innerHTML = "";
  const stops = [...day.stops].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  stops.forEach((s) => el.cards.appendChild(cardEl(s)));
  el.resetDay.hidden = day.stops.length === 0;

  if (withFade) {
    el.cards.classList.remove("fade");
    void el.cards.offsetWidth; // reflow ca să re-pornească animația
    el.cards.classList.add("fade");
  }
}

function renderAll() {
  buildTabs();
  renderDay(currentDay);
  renderProgress();
  renderBanner();
}

function switchDay(i) {
  if (i === currentDay) return;
  currentDay = i;
  localStorage.setItem(LS.tab, String(i));
  refreshTabsState();
  renderDay(i, true);
  renderProgress();
}

function resetDay() {
  const day = DATA[currentDay];
  const done = day.stops.filter((s) => state.checked[s.id]);
  if (done.length === 0) return;
  if (!confirm(`Debifezi toate cele ${done.length} opriri din ziua „${day.day}”?`)) return;
  done.forEach((s) => { delete state.checked[s.id]; enqueue(s.id, false); });
  state.updatedAt = new Date().toISOString();
  saveLocal();
  renderDay(currentDay);
  renderProgress();
  renderBanner();
  refreshTabsState();
  flushQueue();
}

/* ---------- Service worker ---------- */
function registerSW() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
}

/* ---------- Init ---------- */
function init() {
  loadLocal();
  const saved = parseInt(localStorage.getItem(LS.tab), 10);
  currentDay = Number.isInteger(saved) && saved >= 0 && saved < DATA.length ? saved : 0;

  renderAll();
  initGeoUI();
  updateSync();

  // sincronizare inițială: GET, reconciliere, apoi golire coadă
  syncFromCloud().then(() => flushQueue());

  // listeners globale
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
