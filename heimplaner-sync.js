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
  el.innerHTML = '<span class="sync-icon" style="color:' + color + '">' + icon + '</span>' +
    '<span class="sync-label" style="color:' + color + '"> ' + label + '</span>';
}

function openSyncModal() {
  showModal(
    '<h3>🔄 Synchronisation</h3>' +
    '<p style="font-size:.8rem;color:var(--muted);margin-bottom:14px">Gemeinsames Passwort für Mauro & Lena. Beide müssen dasselbe Passwort eingeben.</p>' +
    '<div class="modal-row"><label>Passwort</label>' +
    '<input class="modal-in" type="password" id="sync-pw-input" placeholder="Euer gemeinsames Passwort" value="' + syncPassword + '"></div>' +
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
  clearInterval(syncPollTimer);
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

// Datentypen, die als flache id-Arrays gemerged werden (nicht blind überschrieben).
// 'tasks' ist gesondert unten behandelt (Objekt aus 3 Arrays: p1/p2/shared).
const SYNCED_ARRAY_TYPES = ['events','notes','birthdays','shop','savedShopItems','customRecipes','budgetEntries'];

// Union-merge zweier Listen nach id. Bei gleicher id gewinnt remote (= zuletzt
// synchronisierter Stand) — entspricht dem bisherigen Verhalten bei einem vollen
// Overwrite. Neu hinzugekommene, noch nicht synchronisierte lokale Einträge
// bleiben aber erhalten (gehen bei einem reinen Overwrite sonst verloren),
// und per deletedMap (Tombstones, siehe HP.deleted/markDeleted) getilgte IDs
// werden aus dem Ergebnis entfernt, damit ein noch nicht aktualisierter
// Gegenstand eine Löschung nicht wiederherstellt.
function mergeArrayById(local, remote, deletedMap) {
  const map = new Map();
  (local||[]).forEach(item=>map.set(item.id, item));
  (remote||[]).forEach(item=>map.set(item.id, item));
  if (deletedMap) Object.keys(deletedMap).forEach(id=>map.delete(id));
  return Array.from(map.values());
}

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

  Object.assign(HP, remote);
  HP.deleted = mergedDeleted;
  SYNCED_ARRAY_TYPES.forEach(t => { HP[t] = mergeArrayById(localSnapshot[t], remote[t], mergedDeleted[t]); });
  HP.tasks = mergeTaskLists(localTasks, remote.tasks, mergedDeleted.tasks);
  if (!HP.taskStatus) HP.taskStatus = {};
  if (!HP.taskNotes) HP.taskNotes = {};
  if (!HP.colors) HP.colors = {};
  if (!HP.taskComments) HP.taskComments = {};
  if (!HP.eventStatus) HP.eventStatus = {};
  if (!HP.eventNotes) HP.eventNotes = {};
  if (!HP.eventComments) HP.eventComments = {};
  if (!HP.taskExceptions) HP.taskExceptions = {};
  if (!HP.budgetLimits) HP.budgetLimits = {p1:{}, p2:{}};
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
    SYNCED_ARRAY_TYPES.forEach(t => { HP[t] = mergeArrayById(HP[t], remote[t], mergedDeleted[t]); });
    HP.tasks = mergeTaskLists(HP.tasks, remote.tasks, mergedDeleted.tasks);
    try { localStorage.setItem(SK, JSON.stringify(HP)); } catch(e) {}
  } catch(e) { /* best effort – normaler Save läuft trotzdem weiter */ }
}

function startSyncPolling() {
  clearInterval(syncPollTimer);
  syncPollTimer = setInterval(async () => {
    if (!syncEnabled) return;
    try {
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
  }, 15000);
}

document.addEventListener('DOMContentLoaded', () => {
  // HP_save überschreiben damit Änderungen automatisch synchronisiert werden
  const _orig = HP_save;
  HP_save = function() {
    try { localStorage.setItem(SK, JSON.stringify(HP)); } catch(e) {}
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