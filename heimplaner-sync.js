// ═══════════════════════════════════════════════
// HEIMPLANER SYNC – separate Datei
// ═══════════════════════════════════════════════

const SYNC_URL = '/.netlify/functions/sync';

// Sichere Aufrufe - falls App-Funktionen noch nicht geladen sind
function _toast(msg) {
  if (typeof showToast === 'function') showToast(msg);
  else console.log('[Sync]', msg);
}
let syncPassword = localStorage.getItem('hp_sync_pw') || '';
let syncEnabled = false;
let syncTimer = null;
let lastSyncedAt = null;
let syncPollTimer = null;

function initSync() {
  const topbar = document.querySelector('.topbar');
  if (!topbar || document.getElementById('sync-bar')) return;

  const syncBar = document.createElement('div');
  syncBar.id = 'sync-bar';
  syncBar.style.cssText = 'margin-left:auto;display:flex;align-items:center;gap:8px;font-size:.72rem;color:var(--muted)';
  syncBar.innerHTML =
    '<span id="sync-status"><span class="sync-icon">⚪</span><span class="sync-label"> Nicht verbunden</span></span>' +
    '<button onclick="openSyncModal()" style="background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--muted);font-family:Inter,sans-serif;font-size:.7rem;padding:3px 9px;cursor:pointer"><span class="sync-btn-icon">🔄</span><span class="sync-btn-text"> Sync</span></button>';
  topbar.appendChild(syncBar);

  if (syncPassword) connectSync();
}

function setSyncStatus(status, color) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  const sp = status.indexOf(' ');
  const icon = sp === -1 ? status : status.slice(0, sp);
  const label = sp === -1 ? '' : status.slice(sp + 1);
  // icon/label können Servertext enthalten (z.B. eine Fehlermeldung aus e.message) → escapen.
  el.innerHTML = '<span class="sync-icon" style="color:' + color + '">' + esc(icon) + '</span>' +
    '<span class="sync-label" style="color:' + color + '"> ' + esc(label) + '</span>';
}

function openSyncModal() {
  showModal(
    '<h3>🔄 Synchronisation</h3>' +
    '<p style="font-size:.8rem;color:var(--muted);margin-bottom:14px">Gemeinsames Passwort für Mauro & Melissa. Beide müssen dasselbe Passwort eingeben.</p>' +
    '<div class="modal-row"><label>Passwort</label>' +
    '<input class="modal-in" type="password" id="sync-pw-input" placeholder="Euer gemeinsames Passwort" value="' + esc(syncPassword) + '"></div>' +
    (syncEnabled ? '<div style="background:var(--gbg);border:1px solid var(--green);border-radius:var(--rs);padding:9px 12px;font-size:.78rem;color:var(--green);margin-bottom:10px">✅ Verbunden</div>' : '') +
    '<div class="modal-btns" style="justify-content:space-between">' +
    '<button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>' +
    (syncEnabled ? '<button class="mbtn" style="background:var(--rbg);border:1px solid var(--red);color:var(--red)" onclick="disconnectSync()">Trennen</button>' : '') +
    '<button class="mbtn mbtn-confirm" onclick="saveSyncPassword()">✓ Verbinden</button>' +
    '</div>'
  );
  setTimeout(() => document.getElementById('sync-pw-input')?.focus(), 50);
}

function saveSyncPassword() {
  const pw = document.getElementById('sync-pw-input')?.value.trim();
  if (!pw) { _toast('Bitte Passwort eingeben'); return; }
  syncPassword = pw;
  localStorage.setItem('hp_sync_pw', pw);
  closeModal();
  connectSync();
}

function disconnectSync() {
  syncEnabled = false;
  syncPassword = '';
  localStorage.removeItem('hp_sync_pw');
  clearTimeout(syncPollTimer);
  setSyncStatus('⚪ Nicht verbunden', 'var(--muted)');
  closeModal();
  _toast('Synchronisation getrennt');
}

async function connectSync() {
  setSyncStatus('⏳ Verbinde…', 'var(--amber)');
  try {
    const remote = await syncLoad();
    if (remote === null) {
      await syncSave();
    } else {
      mergeData(remote);
    }
    syncEnabled = true;
    setSyncStatus('🟢 Synchron', 'var(--green)');
    _toast('✅ Synchronisation aktiv');
    startSyncPolling();
  } catch(e) {
    setSyncStatus('🔴 ' + e.message, 'var(--red)');
    _toast('❌ Sync-Fehler: ' + e.message);
    syncEnabled = false;
  }
}

async function syncLoad() {
  const res = await fetch(SYNC_URL, {
    headers: { 'x-app-password': syncPassword }
  });
  if (res.status === 401) throw new Error('Falsches Passwort');
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Server-Fehler ' + res.status);
  const json = await res.json();
  lastSyncedAt = json.updated_at;
  return json.data;
}

async function syncSave() {
  if (!syncPassword) return;
  const res = await fetch(SYNC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-app-password': syncPassword },
    body: JSON.stringify({ data: HP })
  });
  if (res.status === 401) { disconnectSync(); throw new Error('Falsches Passwort'); }
  if (!res.ok) throw new Error('Speichern fehlgeschlagen');
  setSyncStatus('🟢 Synchron', 'var(--green)');
}

// ═══════════════════════════════════════════════════════════
// NEUES HP-FELD HINZUFÜGEN — CHECKLISTE
//
// Ein neues Top-Level-Feld auf HP (z.B. HP.irgendwas) ist erst dann sicher
// synchronisiert, wenn ALLE drei Stellen angepasst sind. Wird eine vergessen,
// gibt es keinen Fehler — das Feld wird einfach beim nächsten Poll (alle
// 15-60 Sekunden!) stillschweigend durch den Serverstand überschrieben,
// sobald zwei Geräte gleichzeitig daran etwas ändern. Genau das war die
// Wurzel des Task-Status-Bugs vom 09.09.2026: taskStatus stand zwar schon in
// Liste 2, aber erst als flacher Wert statt als verschachtelte Map — der
// Merge griff, tat aber inhaltlich das Falsche.
//
// 1. heimplaner-data.js, loadState(): Default ergänzen
//    (if (!d.irgendwas) d.irgendwas = {};) plus ggf. eine Migration für
//    bereits gespeicherte alte Datensätze (siehe migrateTaskStatus()).
// 2. Hier unten in GENAU EINER der drei Listen eintragen:
//    - SYNCED_ARRAY_TYPES: Liste von Objekten mit eigener id (wie events)
//    - OBJECT_MAP_TYPES: flache Map id -> Wert (wie taskNotes)
//      + zugehörige Tombstone-Liste ('tasks'/'events'/null) angeben
//    - zusätzlich NESTED_MAP_TYPES, falls es eine zweistufige Map
//      id -> datum -> Wert ist (wie taskStatus, taskComments)
// 3. Kurz testen: Feld auf Gerät A ändern, auf Gerät B pollen lassen
//    (oder connectSync() manuell aufrufen) — Änderung muss ankommen, OHNE
//    dass ein gleichzeitig auf Gerät B geändertes anderes Feld verloren geht.
// ═══════════════════════════════════════════════════════════

// Datentypen, die als flache id-Arrays gemerged werden (nicht blind überschrieben).
// 'tasks' ist gesondert unten behandelt (Objekt aus 3 Arrays: p1/p2/shared).
const SYNCED_ARRAY_TYPES = ['events','notes','birthdays','shop','savedShopItems','customRecipes','budgetEntries'];

// Union-merge zweier Listen nach id. Alle Items dieser Typen tragen inzwischen ein
// updatedAt (gesetzt bei jeder Erstellung/Änderung, siehe heimplaner-app.js) —
// bei gleicher id gewinnt die tatsächlich neuere Seite; ein fehlendes updatedAt
// zählt als 0 (ältestmöglich), damit der Vergleich auch greift, wenn nur eine
// Seite das Feld schon gesetzt hat. Das verhindert, dass eine gerade lokal
// bearbeitete, aber noch nicht hochgeladene Änderung (z.B. ein abgehakter
// Einkauf) durch den noch älteren Serverstand überschrieben wird (siehe
// mergeBeforeSave) — ohne Timestamp auf beiden Seiten (z.B. zwei nie bearbeitete
// Altbestände) bleibt "remote gewinnt" als Tie-Breaker unverändert, damit ein
// Poll weiterhin unberührte Einträge vom anderen Gerät übernimmt.
// Neu hinzugekommene, noch nicht synchronisierte lokale Einträge bleiben
// erhalten (gehen bei einem reinen Overwrite sonst verloren), und per
// deletedMap (Tombstones, siehe HP.deleted/markDeleted) getilgte IDs werden
// aus dem Ergebnis entfernt, damit ein noch nicht aktualisierter Gegenstand
// eine Löschung nicht wiederherstellt.
function mergeArrayById(local, remote, deletedMap) {
  const map = new Map();
  (local||[]).forEach(item=>map.set(item.id, item));
  (remote||[]).forEach(item=>{
    const existing = map.get(item.id);
    if (existing && (existing.updatedAt||0) > (item.updatedAt||0)) return;
    map.set(item.id, item);
  });
  if (deletedMap) Object.keys(deletedMap).forEach(id=>map.delete(id));
  return Array.from(map.values());
}

// Merged zwei "Plain-Object"-Maps (id/key -> Wert), die nicht Teil der
// SYNCED_ARRAY_TYPES sind (taskStatus, taskNotes, colors, taskComments,
// eventStatus, eventNotes, eventComments, taskExceptions, budgetLimits).
// Diese wurden bisher beim Pull/Poll per Object.assign(HP, remote) komplett
// durch den Serverstand ersetzt — dadurch konnte z.B. ein gerade abgehakter
// Task-Status durch einen Poll wenige Sekunden später wieder verschwinden.
// Stattdessen: lokale Werte gewinnen bei einem Key-Konflikt (die Änderung ist
// per Definition die zuletzt getätigte, die noch nicht hochgeladen wurde),
// neue Keys vom Server (z.B. vom Partnergerät gesetzt) bleiben erhalten.
// deletedIds (Tombstones der zugehörigen Liste, tasks bzw. events) entfernt
// verwaiste Einträge, damit eine gelöschte Aufgabe/ein gelöschter Termin nicht
// über taskStatus/taskNotes/... "auferstehen" kann.
function mergeObjectMap(local, remote, deletedIds, nested) {
  if (nested) {
    // Zweistufige Maps (tid -> dateKey -> Wert): ein flacher Object.assign auf
    // der äusseren Ebene würde bei gleicher tid die komplette innere Map der
    // anderen Seite verwerfen — z.B. wenn Mauro Montag und Melissa Dienstag
    // fürs gleiche Serien-Task abhakt, bevor der jeweils andere Poll lief.
    // Deshalb auf der inneren Ebene ebenfalls mergen (lokal gewinnt bei
    // Datums-Konflikt, neue Daten vom Partnergerät bleiben erhalten).
    const out = {};
    new Set([...Object.keys(remote||{}), ...Object.keys(local||{})]).forEach(id=>{
      out[id] = Object.assign({}, (remote||{})[id], (local||{})[id]);
    });
    if (deletedIds) Object.keys(deletedIds).forEach(id=>delete out[id]);
    return out;
  }
  const out = Object.assign({}, remote||{}, local||{});
  if (deletedIds) Object.keys(deletedIds).forEach(id=>delete out[id]);
  return out;
}

// Ordnet jede Plain-Object-Map ihrer Tombstone-Liste zu (null = keine, weil die
// Keys keine gelöschten Entity-IDs sind, sondern z.B. 'p1'/'p2').
const OBJECT_MAP_TYPES = {
  taskStatus: 'tasks', taskNotes: 'tasks', taskComments: 'tasks', taskExceptions: 'tasks',
  eventStatus: 'events', eventNotes: 'events', eventComments: 'events',
  colors: null, budgetLimits: null
};

// tid/eid -> dateKey -> Wert (im Gegensatz zu tid -> Wert bei den übrigen Maps).
const NESTED_MAP_TYPES = new Set(['taskStatus', 'taskComments', 'taskExceptions']);

// Merged zwei Tombstone-Maps (id -> Lösch-Zeitstempel): Union der Keys, jeweils
// der jüngere Zeitstempel gewinnt.
function mergeDeletedMap(local, remote) {
  const out = {...(local||{})};
  Object.entries(remote||{}).forEach(([id,ts])=>{
    if (!out[id] || ts > out[id]) out[id] = ts;
  });
  return out;
}

function mergeTaskLists(localTasks, remoteTasks, deletedTasks) {
  const lt = localTasks || {p1:[],p2:[],shared:[]};
  const rt = remoteTasks || {};
  return {
    p1: mergeArrayById(lt.p1, rt.p1, deletedTasks),
    p2: mergeArrayById(lt.p2, rt.p2, deletedTasks),
    shared: mergeArrayById(lt.shared, rt.shared, deletedTasks)
  };
}

function mergeData(remote) {
  if (!remote || typeof remote !== 'object') return;
  const mergedDeleted = {};
  SYNCED_ARRAY_TYPES.concat('tasks').forEach(t => {
    mergedDeleted[t] = mergeDeletedMap((HP.deleted||{})[t], (remote.deleted||{})[t]);
  });
  const localSnapshot = {};
  SYNCED_ARRAY_TYPES.forEach(t => { localSnapshot[t] = HP[t]; });
  const localTasks = HP.tasks;
  const localMaps = {};
  Object.keys(OBJECT_MAP_TYPES).forEach(t => { localMaps[t] = HP[t]; });

  Object.assign(HP, remote);
  HP.deleted = mergedDeleted;
  // Auch nach dem Merge kürzen: sonst holt sich das Gerät die abgelaufenen
  // Tombstones des Partnergeräts bei jedem Poll wieder herein.
  pruneTombstones(HP);
  SYNCED_ARRAY_TYPES.forEach(t => { HP[t] = mergeArrayById(localSnapshot[t], remote[t], mergedDeleted[t]); });
  HP.tasks = mergeTaskLists(localTasks, remote.tasks, mergedDeleted.tasks);
  Object.keys(OBJECT_MAP_TYPES).forEach(t => {
    const tombKey = OBJECT_MAP_TYPES[t];
    HP[t] = mergeObjectMap(localMaps[t], remote[t], tombKey ? mergedDeleted[tombKey] : null, NESTED_MAP_TYPES.has(t));
  });
  if (!HP.budgetLimits.p1) HP.budgetLimits.p1 = {};
  if (!HP.budgetLimits.p2) HP.budgetLimits.p2 = {};
  try { localStorage.setItem(SK, JSON.stringify(HP)); } catch(e) {}
  if (typeof render === 'function') render();
  if (typeof applyColors === 'function') applyColors();
}

// Holt vor dem Speichern kurz den aktuellen Serverstand und mischt alle
// sync-relevanten Listen (inkl. Tombstones) ein — schliesst das Zeitfenster
// (2-Sekunden-Debounce), in dem sonst z.B. eine gerade gelöschte Buchung oder
// ein zeitgleich auf dem anderen Gerät neu angelegter Eintrag durch den
// nächsten Full-Blob-Overwrite verloren gehen bzw. wiederhergestellt würde.
async function mergeBeforeSave() {
  if (!syncPassword) return;
  try {
    const res = await fetch(SYNC_URL, { headers: { 'x-app-password': syncPassword } });
    if (!res.ok) return;
    const json = await res.json();
    const remote = json && json.data; if (!remote) return;
    const mergedDeleted = {};
    SYNCED_ARRAY_TYPES.concat('tasks').forEach(t => {
      mergedDeleted[t] = mergeDeletedMap((HP.deleted||{})[t], (remote.deleted||{})[t]);
    });
    HP.deleted = mergedDeleted;
    pruneTombstones(HP);
    SYNCED_ARRAY_TYPES.forEach(t => { HP[t] = mergeArrayById(HP[t], remote[t], mergedDeleted[t]); });
    HP.tasks = mergeTaskLists(HP.tasks, remote.tasks, mergedDeleted.tasks);
    Object.keys(OBJECT_MAP_TYPES).forEach(t => {
      const tombKey = OBJECT_MAP_TYPES[t];
      HP[t] = mergeObjectMap(HP[t], remote[t], tombKey ? mergedDeleted[tombKey] : null, NESTED_MAP_TYPES.has(t));
    });
    try { localStorage.setItem(SK, JSON.stringify(HP)); } catch(e) {}
  } catch(e) { /* best effort – normaler Save läuft trotzdem weiter */ }
}

// Ein Poll-Durchlauf: fragt zuerst nur den Zeitstempel ab (~50 Byte, ?meta=1)
// und holt den vollen Datensatz erst, wenn sich tatsächlich etwas geändert hat.
// Da sich in den allermeisten 15-Sekunden-Fenstern nichts ändert, sinkt das
// übertragene Volumen um ein Vielfaches, ohne dass sich am Verhalten etwas
// ändert — der Sync fühlt sich genauso "live" an wie vorher.
async function syncPollOnce() {
  if (!syncEnabled) return;
  try {
    const metaRes = await fetch(SYNC_URL + '?meta=1', { headers: { 'x-app-password': syncPassword } });
    if (!metaRes.ok) return;
    const meta = await metaRes.json();
    if (!meta.updated_at || meta.updated_at === lastSyncedAt) return;

    const res = await fetch(SYNC_URL, { headers: { 'x-app-password': syncPassword } });
    if (!res.ok) return;
    const json = await res.json();
    if (json.updated_at && json.updated_at !== lastSyncedAt) {
      lastSyncedAt = json.updated_at;
      mergeData(json.data);
      setSyncStatus('🟢 Aktualisiert', 'var(--green)');
      _toast('🔄 Daten aktualisiert');
    }
  } catch(e) {
    setSyncStatus('🟡 Offline', 'var(--amber)');
  }
}

// ── Poll-Takt ───────────────────────────────────────────────────────
// 15 Sekunden, solange jemand die App tatsächlich bedient. Nach 5 Minuten
// ohne Eingabe auf 60 Sekunden hoch, bei der ersten Berührung sofort zurück.
//
// Der Grund ist das Netlify-Kontingent: ein sichtbarer, aber unbenutzter Tab
// am Desktop pollt sonst 5760-mal pro Tag und verbraucht damit still das
// Budget, das die App zum Laufen braucht. Für den gefühlten Sofort-Sync beim
// gemeinsamen Einkaufen ändert sich nichts — dabei tippt und tappt man ja.
const POLL_AKTIV_MS = 15000;
const POLL_RUHE_MS = 60000;
const RUHE_AB_MS = 5 * 60000;
let letzteInteraktion = Date.now();

function inRuhe() {
  return Date.now() - letzteInteraktion > RUHE_AB_MS;
}

function planeNaechstenPoll() {
  clearTimeout(syncPollTimer);
  syncPollTimer = setTimeout(() => {
    // Nicht pollen, solange die App im Hintergrund liegt (anderer Tab, Handy
    // gesperrt) — dort bringt ein Abruf niemandem etwas. Beim Zurückkehren
    // wird über visibilitychange einmal sofort nachgezogen.
    if (!document.hidden) syncPollOnce();
    planeNaechstenPoll();
  }, inRuhe() ? POLL_RUHE_MS : POLL_AKTIV_MS);
}

function startSyncPolling() {
  letzteInteraktion = Date.now();
  planeNaechstenPoll();
}

function merkeInteraktion() {
  const kamAusRuhe = inRuhe();
  letzteInteraktion = Date.now();
  // Nur neu planen, wenn wir gerade im langsamen Takt waren — sonst würde
  // jeder Tastendruck den laufenden Poll immer wieder nach hinten schieben.
  if (kamAusRuhe && syncEnabled) planeNaechstenPoll();
}

document.addEventListener('pointerdown', merkeInteraktion, { passive: true });
document.addEventListener('keydown', merkeInteraktion, { passive: true });

document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  merkeInteraktion();
  if (syncEnabled) syncPollOnce();
});

document.addEventListener('DOMContentLoaded', () => {
  // HP_save erweitern, damit Änderungen automatisch synchronisiert werden.
  // Wichtig: das Original AUFRUFEN statt seine Logik hier zu wiederholen.
  // Vorher wurde _orig zwar gefangen, aber nie benutzt — die Zeile darunter
  // schrieb selbst in den localStorage und verschluckte jeden Fehler. Damit
  // lief alles, was in HP_save (heimplaner-data.js) steht, ins Leere, sobald
  // diese Datei geladen war: die Grössenwarnung ebenso wie der Hinweis, dass
  // lokal gar nicht mehr gespeichert werden konnte.
  const _orig = HP_save;
  HP_save = function() {
    _orig();
    if (syncEnabled) {
      clearTimeout(syncTimer);
      syncTimer = setTimeout(async () => {
        try {
          setSyncStatus('⏳ Speichert…', 'var(--amber)');
          await mergeBeforeSave();
          await syncSave();
        } catch(e) {
          setSyncStatus('🔴 Sync-Fehler', 'var(--red)');
        }
      }, 2000);
    }
  };
  setTimeout(initSync, 800);
});