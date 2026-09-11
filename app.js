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

// Schnellwahl am unteren Rand (nur Handy): vier feste Plätze, alles Übrige
// über "Mehr" in der Schublade. Bewusst dieselben SVG-Icons wie die Sidebar
// statt Emoji - Emoji zeichnet jedes Betriebssystem in seiner eigenen
// Schrift, die Leiste sähe auf iPhone und Android sonst verschieden aus.
const MOBILE_NAV = ['heute', 'einkaufsliste', 'budget', 'pinnwand'];

function buildSidebar() {
  document.getElementById('sidebar-nav').innerHTML = Object.entries(VIEWS).map(([key, v]) =>
    '<button class="navitem' + (key === currentView ? ' active' : '') + '" data-view="' + key + '" onclick="switchView(\'' + key + '\')">' +
    '<span class="icon ' + v.icon + '"></span>' + v.label + '</button>'
  ).join('');
}

// Wird bei jedem Rendern neu gebaut: die Zahl offener Artikel am Einkaufs-
// Symbol ändert sich auch, ohne dass die Ansicht wechselt (Partnergerät,
// Abhaken in einer anderen Ansicht).
function buildBottomNav() {
  const nav = document.getElementById('bottom-nav');
  if (!nav) return;
  const offen = (HP.shop || []).filter(i => !i.bought).length;
  nav.innerHTML = MOBILE_NAV.map(key => {
    const v = VIEWS[key];
    const badge = key === 'einkaufsliste' && offen
      ? '<span class="bn-badge">' + (offen > 99 ? '99+' : offen) + '</span>' : '';
    return '<button class="bn-item' + (key === currentView ? ' active' : '') + '" onclick="switchView(\'' + key + '\')">' +
      '<span class="bn-icon"><span class="icon ' + v.icon + '"></span>' + badge + '</span>' +
      '<span class="bn-label">' + esc(bnLabel(key)) + '</span></button>';
  }).join('') +
    '<button class="bn-item' + (MOBILE_NAV.includes(currentView) ? '' : ' active') + '" onclick="openDrawer()">' +
    '<span class="bn-icon"><span class="icon i-menu"></span></span>' +
    '<span class="bn-label">Mehr</span></button>';
}
// "Einkaufsliste" passt nicht unter ein 22px-Symbol.
function bnLabel(key) { return key === 'einkaufsliste' ? 'Einkauf' : VIEWS[key].label; }

function switchView(key) {
  if (!VIEWS[key]) return;
  currentView = key;
  document.querySelectorAll('.navitem').forEach(b => b.classList.toggle('active', b.dataset.view === key));
  const title = document.querySelector('.topbar .title');
  if (title) title.textContent = VIEWS[key].label;
  closeDrawer();
  VIEWS[key].render();
  buildBottomNav();
  document.getElementById('view-root').scrollTop = 0;
}
// heimplaner-pwa.js (geteilt, unverändert) öffnet Deep-Links per setView().
function setView(key) { switchView(key); }

function openDrawer() { document.getElementById('sidebar').classList.add('open'); document.getElementById('drawer-scrim').classList.add('open'); }
function closeDrawer() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('drawer-scrim').classList.remove('open'); }

// heimplaner-sync.js ruft nach jedem Merge (Partnergerät hat etwas
// geändert) global render() auf, falls vorhanden - hier einfach die
// aktuell offene Ansicht neu zeichnen.
function render() { VIEWS[currentView].render(); buildBottomNav(); }

// ── Gemeinsame Bausteine für alle Ansichten ────
function viewHead(title, actionsHtml) {
  return '<div class="view-head"><h1>' + esc(title) + '</h1>' +
    (actionsHtml ? '<div class="head-actions">' + actionsHtml + '</div>' : '') + '</div>';
}
// Zwei Umschalter mit unterschiedlicher Aufgabe, deshalb bewusst zwei Formen
// (so auch in den Mockups): segHtml für Modi derselben Ansicht (Tag/Woche/
// Monat), utabs für den Wechsel der betrachteten Person - dort trägt der
// Unterstrich die Personenfarbe und sagt damit gleich mit, wessen Zahlen man
// gerade sieht.
function segHtml(options, activeKey, onclickFn) {
  return '<div class="seg">' + options.map(([key, label]) =>
    '<button class="' + (key === activeKey ? 'active' : '') + '" onclick="' + onclickFn + '(\'' + esc(key) + '\')">' + esc(label) + '</button>'
  ).join('') + '</div>';
}
function utabs(options, activeKey, onclickFn) {
  return '<div class="utabs">' + options.map(([key, label]) =>
    '<button class="' + (key === activeKey ? 'active' : '') + '" ' +
    'style="--c:' + getColor(key) + '" onclick="' + onclickFn + '(\'' + esc(key) + '\')">' + esc(label) + '</button>'
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
  const hell = theme === 'light';
  document.body.classList.toggle('light', hell);
  // theme-color steht in index.html fest auf dem dunklen Grund. Android färbt
  // damit die Systemleisten der installierten App, deshalb hier mitziehen -
  // sonst rahmt ein dunkler Balken die helle App ein. Auf dem iPhone regelt
  // iOS die Statusleiste selbst nach dem, was hinter ihr liegt.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = hell ? '#F1EEE7' : '#1B1A18';
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
  const heute = todayKey();
  const faellig = chores.filter(e => e.date <= heute);
  const kommend = chores.filter(e => e.date > heute);
  document.getElementById('view-root').innerHTML =
    '<div class="list-page">' +
    viewHead('Haushalt',
      '<button class="btn btn-ghost btn-sm" onclick="openChoreForm()"><span class="icon i-plus"></span> Aufgabe</button>') +
    (chores.length
      ? (faellig.length ? '<div class="section-label">Jetzt fällig · ' + faellig.length + '</div>' + faellig.map(choreRowHtml).join('') : '') +
        (kommend.length ? '<div class="section-label">Später</div>' + kommend.map(choreRowHtml).join('') : '')
      : emptyState('i-home-2', 'Noch keine Haushaltsaufgaben.')) +
    '</div>';
}

function choreRowHtml(e) {
  const done = getEventStatus(e.id) === 'done';
  const due = choreDueLabel(e.date);
  return '<div class="ent-row two-line' + (done ? ' is-done' : '') + '" onclick="openChoreForm(\'' + esc(e.id) + '\')">' +
    '<button class="check sm' + (done ? ' done' : '') + '" onclick="event.stopPropagation();completeChore(\'' + esc(e.id) + '\')" title="Erledigt">' +
    (done ? '<span class="icon i-check"></span>' : '') + '</button>' +
    '<span class="ent-dot" style="background:' + getColor(e.who) + '" title="' + esc(whoLabelV2(e.who)) + '"></span>' +
    '<span class="ent-name">' + esc(e.emoji) + ' ' + esc(e.name) +
    '<small class="' + (due.overdue ? 'overdue' : '') + '">' + esc(recurLabel(e.recur)) + ' · ' + esc(due.text) + '</small></span>' +
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

// Fenster putzen "jedes Jahr im Oktober" trifft nach reinem Datum jedes Jahr
// einen anderen Wochentag - irgendwann einen Dienstag, an dem nie Zeit ist.
// Deshalb kann die Fälligkeit stattdessen an einen Wochentag im Monat
// gebunden werden ("erster/letzter Samstag"); advanceDateKey() im geteilten
// heimplaner-data.js rechnet damit bereits, hier fehlte nur die Eingabe.
const NTH_OPTS = [[1, 'erster'], [2, 'zweiter'], [3, 'dritter'], [4, 'vierter'], [-1, 'letzter']];

function toggleChoreWeekday() {
  const wochenweise = (document.getElementById('ch-recur')?.value || '').startsWith('weeks');
  const cb = document.getElementById('ch-weekday-on');
  const cbRow = document.getElementById('ch-weekday-cb');
  const row = document.getElementById('ch-weekday-row');
  // Bei "wöchentlich"/"alle 2 Wochen" ist der Wochentag schon durch das Datum
  // festgelegt - die Auswahl hätte dort keine Wirkung.
  if (cbRow) cbRow.style.display = wochenweise ? 'none' : '';
  if (wochenweise && cb) cb.checked = false;
  if (row) row.style.display = (!wochenweise && cb && cb.checked) ? '' : 'none';
}

function openChoreForm(id) {
  const e = id ? (HP.events || []).find(x => x.id === id) : null;
  const intervalOptions = CHORE_INTERVALS.map(([key, label]) => {
    const sel = e && e.recur && (e.recur.unit + ':' + e.recur.value) === key ? ' selected' : '';
    return '<option value="' + key + '"' + sel + '>' + label + '</option>';
  }).join('');
  const recur = e && e.recur;
  const hatWochentag = !!(recur && recur.weekday != null && recur.nth != null);
  const weekday = hatWochentag ? recur.weekday : 5;   // Samstag als häufigster Fall
  const nth = hatWochentag ? recur.nth : -1;
  showModal(
    '<h3>' + (e ? 'Aufgabe bearbeiten' : 'Neue Haushaltsaufgabe') + '</h3>' +
    '<div class="field-row">' +
    '<div class="field" style="max-width:70px"><label>Emoji</label><input id="ch-emoji" value="' + esc(e ? e.emoji : '🧹') + '" maxlength="4"></div>' +
    '<div class="field"><label>Name</label><input id="ch-name" maxlength="60" value="' + esc(e ? e.name : '') + '"></div>' +
    '</div>' +
    '<div class="field-row">' +
    '<div class="field"><label>Nächste Fälligkeit</label><input type="date" id="ch-date" value="' + esc(e ? e.date : dk(new Date())) + '"></div>' +
    '<div class="field"><label>Wiederholung</label><select id="ch-recur" onchange="toggleChoreWeekday()">' + intervalOptions + '</select></div>' +
    '</div>' +
    '<label class="check-row" id="ch-weekday-cb">' +
    '<input type="checkbox" id="ch-weekday-on"' + (hatWochentag ? ' checked' : '') + ' onchange="toggleChoreWeekday()">' +
    ' Immer an einem festen Wochentag</label>' +
    '<div class="field-row" id="ch-weekday-row" style="display:' + (hatWochentag ? '' : 'none') + '">' +
    '<div class="field"><label>Welcher</label><select id="ch-nth">' +
    NTH_OPTS.map(([v, l]) => '<option value="' + v + '"' + (nth === v ? ' selected' : '') + '>' + l + '</option>').join('') +
    '</select></div>' +
    '<div class="field"><label>Wochentag</label><select id="ch-wd">' +
    DL.map((l, i) => '<option value="' + i + '"' + (weekday === i ? ' selected' : '') + '>' + esc(l) + '</option>').join('') +
    '</select></div>' +
    '</div>' +
    '<div class="field"><label>Für wen</label><select id="ch-who">' + whoOptions(e ? e.who : 'shared') + '</select></div>' +
    '<div class="modal-actions">' +
    (e ? '<button class="btn btn-danger" onclick="deleteChore(\'' + esc(e.id) + '\')">Löschen</button>' : '<span></span>') +
    '<div style="display:flex;gap:8px">' +
    '<button class="btn btn-outline" onclick="closeModal()">Abbrechen</button>' +
    '<button class="btn btn-accent" onclick="saveChore(' + (e ? "'" + e.id + "'" : 'null') + ')">Speichern</button>' +
    '</div></div>'
  );
  setTimeout(() => { document.getElementById('ch-name')?.focus(); toggleChoreWeekday(); }, 50);
}

function saveChore(id) {
  const name = document.getElementById('ch-name').value.trim();
  const emoji = document.getElementById('ch-emoji').value.trim() || '🧹';
  let date = document.getElementById('ch-date').value;
  const [unit, value] = document.getElementById('ch-recur').value.split(':');
  const who = document.getElementById('ch-who').value;
  if (!name) { showToast('Bitte Name eingeben'); return; }
  if (!date) { showToast('Bitte Datum wählen'); return; }

  const recur = { unit, value: parseInt(value) };
  const mitWochentag = unit !== 'weeks' && document.getElementById('ch-weekday-on')?.checked;
  if (mitWochentag) {
    recur.weekday = parseInt(document.getElementById('ch-wd').value);
    recur.nth = parseInt(document.getElementById('ch-nth').value);
    // Schon die erste Fälligkeit auf den gewählten Wochentag ziehen - sonst
    // stimmt der Rhythmus erst ab dem zweiten Mal, und genau das ist das
    // Problem, das die Einstellung lösen soll.
    const [y, m] = date.split('-').map(Number);
    date = nthWeekdayOfMonth(y, m - 1, recur.weekday, recur.nth).toISOString().slice(0, 10);
  }

  if (!HP.events) HP.events = [];
  if (id) {
    const e = HP.events.find(x => x.id === id);
    // Kann fehlen, wenn die Aufgabe währenddessen auf dem anderen Gerät
    // gelöscht wurde und ein Poll dazwischenkam.
    if (!e) { showToast('Aufgabe existiert nicht mehr'); closeModal(); render(); return; }
    Object.assign(e, { name, emoji, date, who, recur, updatedAt: Date.now() });
  } else {
    HP.events.push({ id: 'ev' + Date.now(), emoji, name, date, time: '', timeEnd: '', who, reminder: '', important: false, note: '', chore: true, recur, updatedAt: Date.now() });
  }
  HP_save();
  closeModal();
  render();
  showToast(emoji + ' ' + name + ' · fällig ' + dateLabel(date, { weekday: 'short', day: 'numeric', month: 'short' }));
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
