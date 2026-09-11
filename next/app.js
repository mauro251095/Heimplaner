// ═══════════════════════════════════════════════
// HEIMPLANER V2 – App-Gerüst + gemeinsame Bausteine
// Lädt nach heimplaner-data.js (braucht HP, esc, dk, getColor, ...) und vor
// heimplaner-sync.js (das showModal/closeModal/showToast unten erwartet).
// Die einzelnen Ansichten liegen in eigenen Dateien (planer.js, shop.js, ...)
// und werden hier nur über VIEWS eingehängt.
// ═══════════════════════════════════════════════

const NOTIF_OK = typeof window !== 'undefined' && 'Notification' in window;

// ── Modal / Toast ─────────────────────────────
// showModal/closeModal werden auch von heimplaner-sync.js (openSyncModal)
// aufgerufen - Signatur bewusst kompatibel (ein HTML-String, zweiter Parameter
// optional).
function showModal(html, wide) {
  let scrim = document.getElementById('modal-scrim');
  if (!scrim) {
    scrim = document.createElement('div');
    scrim.id = 'modal-scrim';
    scrim.className = 'modal-scrim';
    scrim.innerHTML = '<div class="modal" id="modal-inner"></div>';
    scrim.addEventListener('click', e => { if (e.target === scrim) closeModal(); });
    document.body.appendChild(scrim);
  }
  const inner = document.getElementById('modal-inner');
  inner.classList.toggle('wide', !!wide);
  inner.innerHTML = html;
  inner.scrollTop = 0;
  scrim.classList.add('open');
}
function closeModal() {
  document.getElementById('modal-scrim')?.classList.remove('open');
}

let _toastTimer = null;
function toastEl() {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  return t;
}
function showToast(msg) {
  const t = toastEl();
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
// Toast mit "Rückgängig": der Normalfall (man wollte wirklich löschen) bleibt
// ein Klick, der Fehlgriff ist trotzdem abgesichert. Steht länger als der
// normale Toast, damit man reagieren kann.
function showUndoToast(msg, undoFn) {
  const t = toastEl();
  t.textContent = '';
  const span = document.createElement('span');
  span.textContent = msg;
  const btn = document.createElement('button');
  btn.className = 'toast-undo';
  btn.textContent = 'Rückgängig';
  btn.onclick = () => {
    clearTimeout(_toastTimer);
    t.classList.remove('show');
    try { undoFn(); } catch (e) { showToast('Wiederherstellen fehlgeschlagen'); }
  };
  t.appendChild(span); t.appendChild(btn);
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 6000);
}

// ── Navigation ─────────────────────────────────
// render-Referenzen bewusst als Pfeilfunktion: die Ansichts-Dateien werden
// NACH dieser Datei geladen, ein direkter Funktionsverweis wäre hier noch
// undefiniert.
const VIEWS = {
  heute:        { label: 'Heute',         icon: 'i-home',     render: () => renderHeute() },
  planer:       { label: 'Planer',        icon: 'i-calendar', render: () => renderPlaner() },
  personen:     { label: 'Personen',      icon: 'i-users',    render: () => renderPersonen() },
  haushalt:     { label: 'Haushalt',      icon: 'i-home-2',   render: () => renderHaushalt() },
  einkaufsliste:{ label: 'Einkaufsliste', icon: 'i-cart',     render: () => renderEinkauf() },
  budget:       { label: 'Budget',        icon: 'i-money',    render: () => renderBudgetView() },
  menueplan:    { label: 'Menüplan',      icon: 'i-kitchen',  render: () => renderMenueplan() },
  rezepte:      { label: 'Rezepte',       icon: 'i-notebook', render: () => renderRezepte() },
  pinnwand:     { label: 'Pinnwand',      icon: 'i-pin',      render: () => renderPinnwand() },
  geburtstage:  { label: 'Geburtstage',   icon: 'i-cake',     render: () => renderGeburtstage() },
  einstellungen:{ label: 'Einstellungen', icon: 'i-settings', render: () => renderEinstellungen() }
};
let currentView = 'heute';

function buildSidebar() {
  document.getElementById('sidebar-nav').innerHTML = Object.entries(VIEWS).map(([key, v]) =>
    '<button class="navitem' + (key === currentView ? ' active' : '') + '" data-view="' + key + '" onclick="switchView(\'' + key + '\')">' +
    '<span class="icon ' + v.icon + '"></span>' + v.label + '</button>'
  ).join('');
}
function switchView(key) {
  if (!VIEWS[key]) return;
  currentView = key;
  document.querySelectorAll('.navitem').forEach(b => b.classList.toggle('active', b.dataset.view === key));
  const title = document.querySelector('.topbar .title');
  if (title) title.textContent = VIEWS[key].label;
  closeDrawer();
  VIEWS[key].render();
  document.getElementById('view-root').scrollTop = 0;
}
// heimplaner-pwa.js (geteilt, unverändert) öffnet Deep-Links per setView().
function setView(key) { switchView(key); }

function openDrawer() { document.getElementById('sidebar').classList.add('open'); document.getElementById('drawer-scrim').classList.add('open'); }
function closeDrawer() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('drawer-scrim').classList.remove('open'); }

// heimplaner-sync.js ruft nach jedem Merge (Partnergerät hat etwas
// geändert) global render() auf, falls vorhanden - hier einfach die
// aktuell offene Ansicht neu zeichnen.
function render() { VIEWS[currentView].render(); }

// ── Gemeinsame Bausteine für alle Ansichten ────
function viewHead(title, actionsHtml) {
  return '<div class="view-head"><h1>' + esc(title) + '</h1>' +
    (actionsHtml ? '<div class="head-actions">' + actionsHtml + '</div>' : '') + '</div>';
}
function segHtml(options, activeKey, onclickFn) {
  return '<div class="seg">' + options.map(([key, label]) =>
    '<button class="' + (key === activeKey ? 'active' : '') + '" onclick="' + onclickFn + '(\'' + esc(key) + '\')">' + esc(label) + '</button>'
  ).join('') + '</div>';
}
function navRow(prevFn, label, nextFn, extraHtml) {
  return '<div class="navrow">' +
    '<button class="iconbtn" onclick="' + prevFn + '"><span class="icon i-chev-l"></span></button>' +
    '<span class="lbl">' + esc(label) + '</span>' +
    '<button class="iconbtn" onclick="' + nextFn + '"><span class="icon i-chev-r"></span></button>' +
    (extraHtml || '') + '</div>';
}
function emptyState(icon, msg) {
  return '<div class="empty-state"><span class="icon ' + icon + '"></span><div class="msg">' + esc(msg) + '</div></div>';
}
function whoLabelV2(who) { return who === 'p1' ? HP.names.p1 : who === 'p2' ? HP.names.p2 : 'Gemeinsam'; }
function personDot(who) {
  return '<span class="dot" style="background:' + getColor(who) + '" title="' + esc(whoLabelV2(who)) + '"></span>';
}
function whoOptions(selected) {
  return ['shared', 'p1', 'p2'].map(w =>
    '<option value="' + w + '"' + (selected === w ? ' selected' : '') + '>' + esc(whoLabelV2(w)) + '</option>'
  ).join('');
}
function dateLabel(dateKey, opts) {
  return new Date(dateKey + 'T12:00:00').toLocaleDateString('de-CH',
    opts || { weekday: 'long', day: 'numeric', month: 'long' });
}
function shiftDateKey(dateKey, days) {
  const d = new Date(dateKey + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return dk(d);
}
function todayKey() { return dk(new Date()); }

// ── Theme & Personenfarben ─────────────────────
function applyTheme(theme) {
  document.body.classList.toggle('light', theme === 'light');
}
function setTheme(theme) {
  HP.theme = theme;
  HP_save();
  applyTheme(theme);
  render();
}
// heimplaner-sync.js ruft applyColors() nach jedem Merge auf, falls vorhanden.
// Gewählte Personenfarben liegen als CSS-Variablen bereit, damit auch reine
// CSS-Regeln (z.B. Fortschrittsringe) sie benutzen können.
function applyColors() {
  const s = document.documentElement.style;
  s.setProperty('--p1', getColor('p1'));
  s.setProperty('--p2', getColor('p2'));
  s.setProperty('--shared', getColor('shared'));
}

// ── Aufgaben-Status (pro Vorkommen, nicht pro Serie) ──
function toggleTaskDone(tid, dateKey) {
  if (!HP.taskStatus[tid]) HP.taskStatus[tid] = {};
  if (getStatus(tid, dateKey) === 'done') delete HP.taskStatus[tid][dateKey];
  else HP.taskStatus[tid][dateKey] = 'done';
  HP_save();
}

// ── Kompakte Konto-Anzeige (nur Name + Status-Punkt) ──
// #logout-btn wird von heimplaner-login.js selbst injiziert (👤 + Name);
// hier nur das Emoji durch einen Punkt ersetzt, dessen Farbe vom (per CSS
// versteckten, aber weiterhin aktiven) #sync-status übernommen wird. Läuft
// bei jeder DOM-Änderung mit, weil weder der Zeitpunkt der Injektion noch
// der Status-Wechsel selbst beeinflussbar sind, ohne die geteilten Dateien
// anzufassen.
function syncAccountDot() {
  const btn = document.getElementById('logout-btn');
  if (!btn) return;
  let dot = btn.querySelector('.acct-dot');
  if (!dot) {
    btn.querySelector('.lb-icon')?.remove();
    dot = document.createElement('span');
    dot.className = 'acct-dot';
    btn.insertBefore(dot, btn.firstChild);
  }
  const statusIcon = document.querySelector('#sync-status .sync-icon');
  // Nur schreiben, wenn sich wirklich etwas ändert: ein unbedingtes Setzen
  // löst über den Observer unten sofort die nächste Runde aus (Attribut-
  // Änderung → Callback → Attribut-Änderung …) und friert die Seite ein.
  if (statusIcon && dot.style.background !== statusIcon.style.color) {
    dot.style.background = statusIcon.style.color;
  }
}
// Nur childList: die Injektion von #logout-btn und jede Statusänderung
// (setSyncStatus setzt innerHTML neu) sind Kind-Änderungen. attributes/
// characterData mitzubeobachten würde jedes Rendern mitschleppen.
new MutationObserver(syncAccountDot).observe(document.body, { childList: true, subtree: true });

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(HP.theme || 'dark');
  applyColors();
  buildSidebar();
  switchView(currentView);
  syncAccountDot();
});

// ═══════════════════════════════════════════════
// Haushalt
// Datengrundlage identisch zur Hauptapp: HP.events mit chore:true,
// Wiederholung über e.recur ({unit,value[,weekday,nth]}), Fälligkeit über
// e.date, Status über HP.eventStatus[id]. Alles davon kommt aus dem
// geteilten heimplaner-data.js (dk, recurLabel, advanceDateKey, getColor,
// getEventStatus, esc, markDeleted, HP_save, CHORE_INTERVALS) - hier wird
// nichts davon neu erfunden, nur neu dargestellt.
// ═══════════════════════════════════════════════

function choreDueLabel(dateKey) {
  const diff = Math.round((new Date(dateKey + 'T00:00:00') - new Date(dk(new Date()) + 'T00:00:00')) / 86400000);
  if (diff < 0) return { text: 'Fällig seit ' + (-diff) + ' Tag' + (-diff === 1 ? '' : 'en'), overdue: true };
  if (diff === 0) return { text: 'Heute fällig', overdue: false };
  if (diff === 1) return { text: 'Morgen fällig', overdue: false };
  return { text: 'In ' + diff + ' Tagen', overdue: false };
}

function renderHaushalt() {
  const chores = (HP.events || []).filter(e => e.chore).slice().sort((a, b) => a.date.localeCompare(b.date));
  const rows = chores.length
    ? chores.map(choreRowHtml).join('')
    : emptyState('i-home-2', 'Noch keine Haushaltsaufgaben. Mit "+" unten rechts eine erste anlegen.');
  document.getElementById('view-root').innerHTML =
    viewHead('Haushalt') +
    '<div class="card" style="padding:0 20px">' + rows + '</div>' +
    '<button class="fab" onclick="openChoreForm()" title="Neue Haushaltsaufgabe"><span class="icon i-plus"></span></button>';
}

function choreRowHtml(e) {
  const done = getEventStatus(e.id) === 'done';
  const due = choreDueLabel(e.date);
  return '<div class="list-row" data-eid="' + esc(e.id) + '" onclick="openChoreForm(\'' + esc(e.id) + '\')">' +
    '<button class="check' + (done ? ' done' : '') + '" onclick="event.stopPropagation();completeChore(\'' + esc(e.id) + '\')" title="Erledigt">' +
    (done ? '<span class="icon i-check"></span>' : '') + '</button>' +
    '<div class="meta"><div class="name">' + esc(e.emoji) + ' ' + esc(e.name) + '</div>' +
    '<div class="sub' + (due.overdue ? ' overdue' : '') + '">🔁 ' + esc(recurLabel(e.recur)) + ' · ' + due.text + '</div></div>' +
    personDot(e.who) +
    '</div>';
}

function completeChore(id) {
  const e = (HP.events || []).find(x => x.id === id); if (!e) return;
  if (e.recur) e.date = advanceDateKey(e.date, e.recur.unit, e.recur.value, e.recur.weekday, e.recur.nth);
  e.updatedAt = Date.now();
  if (HP.eventStatus) delete HP.eventStatus[id];
  HP_save();
  showToast('✅ ' + e.name + ' erledigt' + (e.recur ? ' — nächste Fälligkeit: ' + e.date : ''));
  render();
}

function openChoreForm(id) {
  const e = id ? (HP.events || []).find(x => x.id === id) : null;
  const intervalOptions = CHORE_INTERVALS.map(([key, label]) => {
    const sel = e && e.recur && (e.recur.unit + ':' + e.recur.value) === key ? ' selected' : '';
    return '<option value="' + key + '"' + sel + '>' + label + '</option>';
  }).join('');
  showModal(
    '<h3>' + (e ? 'Aufgabe bearbeiten' : 'Neue Haushaltsaufgabe') + '</h3>' +
    '<div class="field-row">' +
    '<div class="field" style="max-width:70px"><label>Emoji</label><input id="ch-emoji" value="' + esc(e ? e.emoji : '🧹') + '" maxlength="4"></div>' +
    '<div class="field"><label>Name</label><input id="ch-name" maxlength="60" value="' + esc(e ? e.name : '') + '"></div>' +
    '</div>' +
    '<div class="field-row">' +
    '<div class="field"><label>Nächste Fälligkeit</label><input type="date" id="ch-date" value="' + esc(e ? e.date : dk(new Date())) + '"></div>' +
    '<div class="field"><label>Wiederholung</label><select id="ch-recur">' + intervalOptions + '</select></div>' +
    '</div>' +
    '<div class="field"><label>Für wen</label><select id="ch-who">' + whoOptions(e ? e.who : 'shared') + '</select></div>' +
    '<div class="modal-actions">' +
    (e ? '<button class="btn btn-danger" onclick="deleteChore(\'' + esc(e.id) + '\')">Löschen</button>' : '<span></span>') +
    '<div style="display:flex;gap:8px">' +
    '<button class="btn btn-outline" onclick="closeModal()">Abbrechen</button>' +
    '<button class="btn btn-accent" onclick="saveChore(' + (e ? "'" + e.id + "'" : 'null') + ')">Speichern</button>' +
    '</div></div>'
  );
  setTimeout(() => document.getElementById('ch-name')?.focus(), 50);
}

function saveChore(id) {
  const name = document.getElementById('ch-name').value.trim();
  const emoji = document.getElementById('ch-emoji').value.trim() || '🧹';
  const date = document.getElementById('ch-date').value;
  const [unit, value] = document.getElementById('ch-recur').value.split(':');
  const who = document.getElementById('ch-who').value;
  if (!name) { showToast('Bitte Name eingeben'); return; }
  if (!date) { showToast('Bitte Datum wählen'); return; }
  if (!HP.events) HP.events = [];
  if (id) {
    const e = HP.events.find(x => x.id === id);
    Object.assign(e, { name, emoji, date, who, recur: { unit, value: parseInt(value) }, updatedAt: Date.now() });
  } else {
    HP.events.push({ id: 'ev' + Date.now(), emoji, name, date, time: '', timeEnd: '', who, reminder: '', important: false, note: '', chore: true, recur: { unit, value: parseInt(value) }, updatedAt: Date.now() });
  }
  HP_save();
  closeModal();
  render();
  showToast(emoji + ' ' + name + ' gespeichert');
}

function deleteChore(id) {
  const e = (HP.events || []).find(x => x.id === id); if (!e) return;
  const status = (HP.eventStatus || {})[id];
  markDeleted('events', id);
  HP.events = HP.events.filter(x => x.id !== id);
  if (HP.eventStatus) delete HP.eventStatus[id];
  HP_save();
  closeModal();
  render();
  showUndoToast('Haushaltsaufgabe gelöscht', () => {
    unmarkDeleted('events', id);
    e.updatedAt = Date.now();
    HP.events.push(e);
    if (status !== undefined) { HP.eventStatus = HP.eventStatus || {}; HP.eventStatus[id] = status; }
    HP_save(); render(); showToast('Wiederhergestellt');
  });
}
