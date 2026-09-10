// ═══════════════════════════════════════════════
// HEIMPLANER V2 – App-Gerüst
// Lädt nach heimplaner-data.js (braucht HP, esc, dk, getColor, ...) und vor
// heimplaner-sync.js (das showModal/closeModal/showToast unten erwartet).
// ═══════════════════════════════════════════════

// ── Modal / Toast ─────────────────────────────
// showModal/closeModal werden auch von heimplaner-sync.js (openSyncModal)
// aufgerufen - Signatur bewusst kompatibel (ein HTML-String, keine Optionen).
function showModal(html) {
  let scrim = document.getElementById('modal-scrim');
  if (!scrim) {
    scrim = document.createElement('div');
    scrim.id = 'modal-scrim';
    scrim.className = 'modal-scrim';
    scrim.innerHTML = '<div class="modal" id="modal-inner"></div>';
    scrim.addEventListener('click', e => { if (e.target === scrim) closeModal(); });
    document.body.appendChild(scrim);
  }
  document.getElementById('modal-inner').innerHTML = html;
  scrim.classList.add('open');
}
function closeModal() {
  document.getElementById('modal-scrim')?.classList.remove('open');
}
let _toastTimer = null;
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

// ── Navigation ─────────────────────────────────
// Nur "haushalt" ist echt gebaut - der Rest zeigt bewusst einen Platzhalter,
// damit man durchklicken kann, ohne dass next/CLAUDE.md's "Nächste Schritte"
// (kleine Ansichten zuerst) übersprungen werden.
const VIEWS = {
  heute:        { label: 'Heute',         icon: 'i-home',    render: renderPlaceholder },
  planer:       { label: 'Planer',        icon: 'i-calendar',render: renderPlaceholder },
  personen:     { label: 'Personen',      icon: 'i-users',   render: renderPlaceholder },
  haushalt:     { label: 'Haushalt',      icon: 'i-home-2',  render: renderHaushalt },
  einkaufsliste:{ label: 'Einkaufsliste', icon: 'i-cart',    render: renderPlaceholder },
  budget:       { label: 'Budget',        icon: 'i-money',   render: renderPlaceholder },
  menueplan:    { label: 'Menüplan',      icon: 'i-kitchen', render: renderPlaceholder },
  rezepte:      { label: 'Rezepte',       icon: 'i-notebook',render: renderPlaceholder },
  pinnwand:     { label: 'Pinnwand',      icon: 'i-pin',     render: renderPlaceholder },
  geburtstage:  { label: 'Geburtstage',   icon: 'i-cake',    render: renderPlaceholder },
  einstellungen:{ label: 'Einstellungen', icon: 'i-settings',render: renderPlaceholder }
};
let currentView = 'haushalt';

function buildSidebar() {
  document.getElementById('sidebar-nav').innerHTML = Object.entries(VIEWS).map(([key, v]) =>
    '<button class="navitem' + (key === currentView ? ' active' : '') + '" data-view="' + key + '" onclick="switchView(\'' + key + '\')">' +
    '<span class="icon ' + v.icon + '"></span>' + v.label + '</button>'
  ).join('');
}
function switchView(key) {
  currentView = key;
  document.querySelectorAll('.navitem').forEach(b => b.classList.toggle('active', b.dataset.view === key));
  closeDrawer();
  VIEWS[key].render();
}
function renderPlaceholder() {
  const v = VIEWS[currentView];
  document.getElementById('view-root').innerHTML =
    '<div class="view-head"><h1>' + v.label + '</h1></div>' +
    '<div class="placeholder"><span class="icon ' + v.icon + '" style="width:32px;height:32px;opacity:.4"></span>' +
    '<p style="margin-top:12px">Diese Ansicht ist noch nicht gebaut.</p></div>';
}
function openDrawer() { document.getElementById('sidebar').classList.add('open'); document.getElementById('drawer-scrim').classList.add('open'); }
function closeDrawer() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('drawer-scrim').classList.remove('open'); }

// heimplaner-sync.js ruft nach jedem Merge (Partnergerät hat etwas
// geändert) global render() auf, falls vorhanden - hier einfach die
// aktuell offene Ansicht neu zeichnen. Personenfarben werden bei jedem
// Render live über getColor() gelesen, ein separates applyColors() braucht
// es dafür nicht.
function render() { VIEWS[currentView].render(); }

document.addEventListener('DOMContentLoaded', () => {
  buildSidebar();
  VIEWS[currentView].render();
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
function whoLabelV2(who) { return who === 'p1' ? HP.names.p1 : who === 'p2' ? HP.names.p2 : 'Gemeinsam'; }

function renderHaushalt() {
  const chores = (HP.events || []).filter(e => e.chore).slice().sort((a, b) => a.date.localeCompare(b.date));
  const rows = chores.length
    ? chores.map(choreRowHtml).join('')
    : '<div class="empty-state"><span class="icon i-home-2"></span><div class="msg">Noch keine Haushaltsaufgaben. Mit "+" unten rechts eine erste anlegen.</div></div>';
  document.getElementById('view-root').innerHTML =
    '<div class="view-head"><h1>Haushalt</h1></div>' +
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
    '<span class="dot" style="background:' + getColor(e.who) + '" title="' + esc(whoLabelV2(e.who)) + '"></span>' +
    '</div>';
}

function completeChore(id) {
  const e = (HP.events || []).find(x => x.id === id); if (!e) return;
  if (e.recur) e.date = advanceDateKey(e.date, e.recur.unit, e.recur.value, e.recur.weekday, e.recur.nth);
  e.updatedAt = Date.now();
  if (HP.eventStatus) delete HP.eventStatus[id];
  HP_save();
  showToast('✅ ' + e.name + ' erledigt' + (e.recur ? ' — nächste Fälligkeit: ' + e.date : ''));
  renderHaushalt();
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
    '<div class="field"><label>Für wen</label><select id="ch-who">' +
    '<option value="shared"' + (!e || e.who === 'shared' ? ' selected' : '') + '>Gemeinsam</option>' +
    '<option value="p1"' + (e && e.who === 'p1' ? ' selected' : '') + '>' + esc(HP.names.p1) + '</option>' +
    '<option value="p2"' + (e && e.who === 'p2' ? ' selected' : '') + '>' + esc(HP.names.p2) + '</option>' +
    '</select></div>' +
    '<div class="modal-actions">' +
    (e ? '<button class="btn" style="color:var(--danger);border:1px solid var(--danger)" onclick="deleteChore(\'' + esc(e.id) + '\')">Löschen</button>' : '<span></span>') +
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
  renderHaushalt();
  showToast(emoji + ' ' + name + ' gespeichert');
}

function deleteChore(id) {
  const e = (HP.events || []).find(x => x.id === id); if (!e) return;
  markDeleted('events', id);
  HP.events = HP.events.filter(x => x.id !== id);
  if (HP.eventStatus) delete HP.eventStatus[id];
  HP_save();
  closeModal();
  renderHaushalt();
  showToast('Gelöscht');
}
