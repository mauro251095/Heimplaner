// ═══════════════════════════════════════════════
// HEIMPLANER V2 – Planer (Tag / Woche / Monat) und Personen
//
// Monatsraster zeigt bewusst nur datumsgebundene Dinge als Punkte (Termine,
// Geburtstage, als wichtig markierte Aufgaben). Die wiederkehrende
// Wochenroutine steht NICHT im Raster, sondern darunter als kompakter
// 7-Spalten-Streifen - siehe next/CLAUDE.md.
// ═══════════════════════════════════════════════

let planerModus = 'woche';
let planerDatum = null;      // wird beim ersten Render auf heute gesetzt
let wochenOffset = 0;
let monatsOffset = 0;

function setPlanerModus(m) { planerModus = m; renderPlaner(); }
function planerWocheShift(d) { wochenOffset += d; renderPlaner(); }
function planerTagShift(d) { planerDatum = shiftDateKey(planerDatum || todayKey(), d); renderPlaner(); }
function planerMonatShift(d) { monatsOffset += d; renderPlaner(); }
function planerHeute() { wochenOffset = 0; monatsOffset = 0; planerDatum = todayKey(); renderPlaner(); }
function planerOeffneTag(key) { planerDatum = key; planerModus = 'tag'; switchView('planer'); }

function renderPlaner() {
  if (!planerDatum) planerDatum = todayKey();
  const body = planerModus === 'tag' ? planerTagHtml()
    : planerModus === 'monat' ? planerMonatHtml()
      : planerWocheHtml();
  const fabDate = planerModus === 'tag' ? planerDatum : todayKey();
  document.getElementById('view-root').innerHTML =
    viewHead('Planer', segHtml([['tag', 'Tag'], ['woche', 'Woche'], ['monat', 'Monat']], planerModus, 'setPlanerModus')) +
    body +
    '<button class="fab" onclick="openAddSheet(\'' + esc(fabDate) + '\')" title="Neu"><span class="icon i-plus"></span></button>';
}

// FAB-Auswahl: Termin oder Aufgabe - beides landet in unterschiedlichen
// Datentöpfen (HP.events vs. HP.tasks), deshalb bewusst zwei Wege.
function openAddSheet(dateKey) {
  showModal('<h3>Was möchtest du anlegen?</h3>' +
    '<div class="sheet-choices">' +
    '<button class="sheet-btn" onclick="closeModal();openEventForm(null,\'' + esc(dateKey) + '\')">' +
    '<span class="sheet-emoji">📅</span><span><b>Termin</b><small>Einmalig, an einem Datum</small></span></button>' +
    '<button class="sheet-btn" onclick="closeModal();openTaskForm(null,\'' + esc(dateKey) + '\')">' +
    '<span class="sheet-emoji">⭐</span><span><b>Aufgabe</b><small>Wiederkehrend, an Wochentagen</small></span></button>' +
    '<button class="sheet-btn" onclick="closeModal();openChoreForm()">' +
    '<span class="sheet-emoji">🧹</span><span><b>Haushaltsaufgabe</b><small>Wiederkehrend, mit Fälligkeit</small></span></button>' +
    '</div>' +
    '<div class="modal-actions"><span></span><button class="btn btn-outline" onclick="closeModal()">Abbrechen</button></div>');
}

// ── Woche ─────────────────────────────────────
function planerWocheHtml() {
  const dates = getWeekDates(wochenOffset);
  const label = 'KW ' + wkNum(dates[0]) + ' · ' +
    dates[0].toLocaleDateString('de-CH', { day: 'numeric', month: 'short' }) + ' – ' +
    dates[6].toLocaleDateString('de-CH', { day: 'numeric', month: 'short' });
  const cols = dates.map((d, i) => {
    const key = dk(d);
    const items = dayEntries(key);
    const bdays = birthdaysOn(key);
    const meals = HP.meals[key] || {};
    const mealLine = ['Frühstück', 'Mittag', 'Abend'].filter(s => meals[s])
      .map(s => '<div class="wmeal">' + esc(meals[s].emoji || '🍽️') + ' ' + esc(meals[s].name) + '</div>').join('');
    const chores = (HP.events || []).filter(e => e.chore && e.date === key);
    const body =
      bdays.map(b => '<div class="witem bday" onclick="switchView(\'geburtstage\')">🎂 ' + esc(b.name) + '</div>').join('') +
      items.map(i => weekItemHtml(i, key)).join('') +
      chores.map(c => '<div class="witem" style="--c:' + getColor(c.who) + '" onclick="openChoreForm(\'' + esc(c.id) + '\')">' +
        '<span class="wtxt">' + esc(c.emoji) + ' ' + esc(c.name) + '</span></div>').join('') +
      mealLine;
    return '<div class="day-col' + (isToday(d) ? ' is-today' : '') + (isPast(d) ? ' is-past' : '') + '">' +
      '<button class="day-head" onclick="planerOeffneTag(\'' + key + '\')">' +
      '<span class="dh-dow">' + DS[i] + '</span><span class="dh-num">' + d.getDate() + '</span></button>' +
      '<div class="day-body">' + (body || '<div class="wempty">–</div>') + '</div>' +
      '<button class="day-add" onclick="openAddSheet(\'' + key + '\')">+</button>' +
      '</div>';
  }).join('');
  return navRow('planerWocheShift(-1)', label, 'planerWocheShift(1)',
    '<button class="btn btn-outline" onclick="planerHeute()">Heute</button>') +
    '<div class="week-grid">' + cols + '</div>';
}

function weekItemHtml(item, key) {
  const d = item.data;
  const done = item.kind === 'task' ? getStatus(d.id, key) === 'done' : getEventStatus(d.id) === 'done';
  const onclick = item.kind === 'task'
    ? 'openTaskForm(\'' + esc(d.id) + '\',\'' + esc(key) + '\')'
    : 'openEventForm(\'' + esc(d.id) + '\')';
  const toggle = item.kind === 'task'
    ? 'toggleTaskFromRow(\'' + esc(d.id) + '\',\'' + esc(key) + '\')'
    : 'toggleEventDone(\'' + esc(d.id) + '\')';
  return '<div class="witem' + (item.kind === 'event' ? ' ev' : '') + (done ? ' is-done' : '') +
    '" style="--c:' + getColor(d.who) + '" onclick="' + onclick + '">' +
    '<button class="wcheck' + (done ? ' done' : '') + '" onclick="event.stopPropagation();' + toggle + '"></button>' +
    '<span class="wtxt">' + (d.time ? '<b>' + esc(fmtTime(d.time)) + '</b> ' : '') + esc(d.emoji) + ' ' + esc(d.name) + '</span>' +
    '</div>';
}

// ── Tag ───────────────────────────────────────
function planerTagHtml() {
  const key = planerDatum;
  const entries = dayEntriesHtml(key);
  const chores = (HP.events || []).filter(e => e.chore && e.date <= key)
    .sort((a, b) => a.date.localeCompare(b.date));
  const bdays = birthdaysOn(key);
  const meals = HP.meals[key] || {};
  const mealCards = ['Frühstück', 'Mittag', 'Abend'].map(slot => {
    const m = meals[slot];
    return '<button class="slot-card' + (m ? ' filled' : '') + '" onclick="openMealPicker(\'' + key + '\',\'' + slot + '\')">' +
      '<span class="slot-label">' + slot + '</span>' +
      '<span class="slot-value">' + (m ? esc(m.emoji || '🍽️') + ' ' + esc(m.name) : '+ eintragen') + '</span></button>';
  }).join('');
  const isHeute = key === todayKey();
  return navRow('planerTagShift(-1)', dateLabel(key), 'planerTagShift(1)',
    (isHeute ? '' : '<button class="btn btn-outline" onclick="planerHeute()">Heute</button>')) +
    (isHeute ? '<div class="today-flag">Heute</div>' : '') +
    '<div class="card"><div class="card-head"><span class="card-title">Termine &amp; Aufgaben</span>' +
    '<button class="btn btn-outline btn-sm" onclick="openAddSheet(\'' + key + '\')">+ Neu</button></div>' +
    (entries || emptyState('i-calendar', 'Nichts geplant für diesen Tag.')) + '</div>' +
    (bdays.length ? '<div class="card"><div class="card-head"><span class="card-title">Geburtstage</span></div>' +
      bdays.map(b => '<div class="list-row"><div class="meta"><div class="name">🎂 ' + esc(b.name) + '</div>' +
        (b.year ? '<div class="sub">wird ' + (parseInt(key.slice(0, 4)) - parseInt(b.year)) + '</div>' : '') + '</div></div>').join('') + '</div>' : '') +
    '<div class="card"><div class="card-head"><span class="card-title">Menüplan</span></div>' +
    '<div class="slot-row">' + mealCards + '</div></div>' +
    (chores.length ? '<div class="card"><div class="card-head"><span class="card-title">Haushalt fällig</span></div>' +
      chores.slice(0, 6).map(choreRowHtml).join('') + '</div>' : '');
}

// ── Monat ─────────────────────────────────────
function planerMonatHtml() {
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + monatsOffset); base.setHours(0, 0, 0, 0);
  const year = base.getFullYear(), month = base.getMonth();
  const startDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const heute = todayKey();
  let cells = '';
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - startDow + i);
    if (i >= 35 && d.getMonth() !== month) break;
    const key = dk(d);
    const fremd = d.getMonth() !== month;
    const eintraege = monatsEintraege(key);
    const sichtbar = eintraege.slice(0, 3);
    cells += '<div class="mcell' + (fremd ? ' out' : '') + (key === heute ? ' is-today' : '') + '" ' +
      'onclick="planerOeffneTag(\'' + key + '\')">' +
      '<span class="mnum">' + d.getDate() + '</span>' +
      '<div class="mitems">' +
      sichtbar.map(e => '<button class="mitem" style="--c:' + e.farbe + '" onclick="event.stopPropagation();' + e.klick + '">' +
        (e.zeit ? '<b>' + esc(fmtTime(e.zeit)) + '</b> ' : '') + esc(e.text) + '</button>').join('') +
      (eintraege.length > sichtbar.length ? '<span class="mmore">+' + (eintraege.length - sichtbar.length) + '</span>' : '') +
      '</div>' +
      '<span class="mdots">' + monatsPunkte(key) + '</span></div>';
  }
  const wochentage = DS.map(d => '<div class="mdow">' + d + '</div>').join('');
  return navRow('planerMonatShift(-1)', MONTH_NAMES[month] + ' ' + year, 'planerMonatShift(1)',
    (monatsOffset === 0 ? '' : '<button class="btn btn-outline" onclick="planerHeute()">Heute</button>')) +
    '<div class="month-grid">' + wochentage + cells + '</div>' +
    wochenmusterHtml();
}

// Was an einem Tag im Raster steht: nur datumsgebundene Dinge. Die
// wiederkehrende Wochenroutine bleibt bewusst draussen (sonst wäre jeder Tag
// voll) - dafür der Wochenmuster-Streifen darunter. Sortiert nach Uhrzeit,
// Einträge ohne Uhrzeit (ganztägig, Geburtstage) ans Ende.
function monatsEintraege(key) {
  const termine = (HP.events || []).filter(e => !e.chore && e.date === key).map(e => ({
    zeit: e.time || '', farbe: getColor(e.who), text: e.emoji + ' ' + e.name,
    klick: 'openEventForm(\'' + esc(e.id) + '\')'
  }));
  const wichtig = allTasks().filter(t => t.important && taskOccursOn(t, key)).map(t => ({
    zeit: t.time || '', farbe: getColor(t.who), text: t.emoji + ' ' + t.name,
    klick: 'openTaskForm(\'' + esc(t.id) + '\',\'' + key + '\')'
  }));
  const chores = (HP.events || []).filter(e => e.chore && e.date === key).map(e => ({
    zeit: '', farbe: getColor(e.who), text: e.emoji + ' ' + e.name,
    klick: 'openChoreForm(\'' + esc(e.id) + '\')'
  }));
  const bdays = birthdaysOn(key).map(b => ({
    zeit: '', farbe: 'var(--palette-amber)', text: '🎂 ' + b.name,
    klick: 'switchView(\'geburtstage\')'
  }));
  return [...termine, ...wichtig, ...chores, ...bdays]
    .sort((a, b) => (a.zeit || '99:99').localeCompare(b.zeit || '99:99'));
}

// Punkt-Variante derselben Einträge - auf dem Handy ist eine Rasterzelle rund
// 50px breit, da ist für Text kein Platz (siehe @media-Block in app.css).
function monatsPunkte(key) {
  const dots = monatsEintraege(key).map(e => e.farbe);
  const sichtbar = dots.slice(0, 4).map(c => '<i style="background:' + c + '"></i>').join('');
  return sichtbar + (dots.length > 4 ? '<i class="more"></i>' : '');
}

function wochenmusterHtml() {
  const spalten = DS.map((d, i) => {
    const tasks = allTasks().filter(t => t.days.includes(i));
    return '<div class="wm-col"><div class="wm-head">' + d + '</div>' +
      (tasks.length
        ? tasks.map(t => '<div class="wm-task" style="--c:' + getColor(t.who) + '" onclick="openTaskForm(\'' + esc(t.id) + '\')">' +
          esc(t.emoji) + ' ' + esc(t.name) + '</div>').join('')
        : '<div class="wm-empty">–</div>') + '</div>';
  }).join('');
  return '<div class="card"><div class="card-head"><span class="card-title">Wochenmuster</span>' +
    '<span class="card-note">Wiederkehrende Aufgaben – Abhaken in Tag/Heute</span></div>' +
    '<div class="wm-grid">' + spalten + '</div></div>';
}

// ═══════════════════════════════════════════════
// Personen
// ═══════════════════════════════════════════════

let personTab = 'p1';
function setPersonTab(p) { personTab = p; renderPersonen(); }

function renderPersonen() {
  const who = personTab;
  const key = todayKey();
  const farbe = getColor(who);
  const eigene = allTasks(who);
  const heuteTasks = eigene.filter(t => taskOccursOn(t, key));
  const erledigt = heuteTasks.filter(t => getStatus(t.id, key) === 'done').length;
  const pct = heuteTasks.length ? Math.round(erledigt / heuteTasks.length * 100) : 0;

  const wochenTage = getWeekDates(0).map((d, i) => {
    const k = dk(d);
    const tags = eigene.filter(t => taskOccursOn(t, k));
    const done = tags.filter(t => getStatus(t.id, k) === 'done').length;
    const anteil = tags.length ? done / tags.length : 0;
    return '<div class="pw-day' + (isToday(d) ? ' is-today' : '') + '" onclick="planerOeffneTag(\'' + k + '\')">' +
      '<div class="pw-dow">' + DS[i] + '</div>' +
      '<div class="pw-bar"><div class="pw-fill" style="height:' + Math.round(anteil * 100) + '%;background:' + farbe + '"></div></div>' +
      '<div class="pw-num">' + done + '/' + tags.length + '</div></div>';
  }).join('');

  const termine = (HP.events || []).filter(e => !e.chore && e.date >= key && (e.who === who || e.who === 'shared'))
    .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);

  document.getElementById('view-root').innerHTML =
    viewHead('Personen', segHtml([['p1', HP.names.p1], ['p2', HP.names.p2]], who, 'setPersonTab')) +
    '<div class="grid cols-2">' +
    '<div class="card ring-card">' + ringHtml(pct, farbe) +
    '<div><div class="ring-title">Heute</div>' +
    '<div class="ring-sub">' + erledigt + ' von ' + heuteTasks.length + ' erledigt</div></div></div>' +
    '<div class="card"><div class="card-head"><span class="card-title">Diese Woche</span></div>' +
    '<div class="pw-grid">' + wochenTage + '</div></div>' +
    '</div>' +
    '<div class="card"><div class="card-head"><span class="card-title">Heute anstehend</span>' +
    '<button class="btn btn-outline btn-sm" onclick="openTaskForm(null,\'' + key + '\',{who:\'' + who + '\'})">+ Aufgabe</button></div>' +
    (dayEntriesHtml(key, who) || emptyState('i-check', 'Für heute ist nichts eingetragen.')) + '</div>' +
    '<div class="card"><div class="card-head"><span class="card-title">Nächste Termine</span>' +
    '<button class="btn btn-outline btn-sm" onclick="openEventForm(null,\'' + key + '\')">+ Termin</button></div>' +
    (termine.length
      ? termine.map(e => '<div class="list-row" onclick="openEventForm(\'' + esc(e.id) + '\')">' +
        '<div class="meta"><div class="name">' + esc(e.emoji) + ' ' + esc(e.name) + '</div>' +
        '<div class="sub">' + esc(dateLabel(e.date, { weekday: 'short', day: 'numeric', month: 'short' })) +
        (e.time ? ' · ' + esc(fmtTime(e.time)) : '') + '</div></div>' + personDot(e.who) + '</div>').join('')
      : emptyState('i-calendar', 'Keine kommenden Termine.')) + '</div>' +
    '<div class="card"><div class="card-head"><span class="card-title">Alle Aufgaben</span></div>' +
    (eigene.length
      ? eigene.map(t => '<div class="list-row" onclick="openTaskForm(\'' + esc(t.id) + '\')">' +
        '<div class="meta"><div class="name">' + esc(t.emoji) + ' ' + esc(t.name) + '</div>' +
        '<div class="sub">' + t.days.map(d => DS[d]).join(', ') + (t.time ? ' · ' + esc(fmtTime(t.time)) : '') + '</div></div>' +
        personDot(t.who) + '</div>').join('')
      : emptyState('i-check', 'Noch keine Aufgaben angelegt.')) + '</div>';
}

function ringHtml(pct, farbe) {
  const r = 26, u = 2 * Math.PI * r;
  return '<svg class="ring" viewBox="0 0 64 64">' +
    '<circle cx="32" cy="32" r="' + r + '" fill="none" stroke="var(--border-2)" stroke-width="6"></circle>' +
    '<circle cx="32" cy="32" r="' + r + '" fill="none" stroke="' + farbe + '" stroke-width="6" stroke-linecap="round" ' +
    'stroke-dasharray="' + u + '" stroke-dashoffset="' + (u * (1 - pct / 100)) + '" transform="rotate(-90 32 32)"></circle>' +
    '<text x="32" y="37" text-anchor="middle" class="ring-text">' + pct + '%</text></svg>';
}
