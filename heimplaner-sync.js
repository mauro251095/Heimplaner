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

function mergeData(remote) {
  if (!remote || typeof remote !== 'object') return;
  Object.assign(HP, remote);
  if (!HP.notes) HP.notes = [];
  if (!HP.customRecipes) HP.customRecipes = [];
  if (!HP.taskStatus) HP.taskStatus = {};
  if (!HP.taskNotes) HP.taskNotes = {};
  if (!HP.colors) HP.colors = {};
  if (!HP.events) HP.events = [];
  if (!HP.birthdays) HP.birthdays = [];
  if (!HP.taskComments) HP.taskComments = {};
  if (!HP.eventStatus) HP.eventStatus = {};
  if (!HP.eventNotes) HP.eventNotes = {};
  if (!HP.eventComments) HP.eventComments = {};
  if (!HP.savedShopItems) HP.savedShopItems = [];
  if (!HP.taskExceptions) HP.taskExceptions = {};
  try { localStorage.setItem(SK, JSON.stringify(HP)); } catch(e) {}
  if (typeof render === 'function') render();
  if (typeof applyColors === 'function') applyColors();
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
          await syncSave();
        } catch(e) {
          setSyncStatus('🔴 Sync-Fehler', 'var(--red)');
        }
      }, 2000);
    }
  };
  setTimeout(initSync, 800);
});