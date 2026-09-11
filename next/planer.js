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
    '<div class="list-page' + (planerModus === 'tag' ? '' : ' wide') + '">' +
    viewHead('Planer',
      '<button class="btn btn-ghost btn-sm" onclick="openAddSheet(\'' + esc(fabDate) + '\')"><span class="icon i-plus"></span> Neu</button>') +
    segHtml([['tag', 'Tag'], ['woche', 'Woche'], ['monat', 'Monat']], planerModus, 'setPlanerModus') +
    body +
    '</div>';
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
    (wochenOffset === 0 ? '' : '<button class="linkbtn" onclick="planerHeute()">Heute</button>')) +
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
// Der Wochenstreifen über der Tagesliste stammt aus dem Mockup: er zeigt,
// wo man in der Woche steht, und springt mit einem Tipp zum Nachbartag -
// ohne den Umweg über die Wochenansicht.
function wochenStreifenHtml(key) {
  const d = new Date(key + 'T12:00:00');
  const montag = shiftDateKey(key, -((d.getDay() + 6) % 7));
  return '<div class="daystrip">' + DS.map((kurz, i) => {
    const k = shiftDateKey(montag, i);
    const zahl = parseInt(k.slice(8, 10));
    return '<button class="ds-day' + (k === key ? ' sel' : '') + (k === todayKey() ? ' heute' : '') + '" ' +
      'onclick="planerOeffneTag(\'' + k + '\')">' +
      '<span class="ds-dow">' + kurz + '</span><span class="ds-num">' + zahl + '</span></button>';
  }).join('') + '</div>';
}

function planerTagHtml() {
  const key = planerDatum;
  const entries = dayEntriesHtml(key);
  const chores = (HP.events || []).filter(e => e.chore && e.date <= key)
    .sort((a, b) => a.date.localeCompare(b.date));
  const bdays = birthdaysOn(key);
  const meals = HP.meals[key] || {};
  const isHeute = key === todayKey();
  return navRow('planerTagShift(-1)', dateLabel(key), 'planerTagShift(1)',
    (isHeute ? '<span class="heute-chip">Heute</span>' : '<button class="linkbtn" onclick="planerHeute()">Heute</button>')) +
    wochenStreifenHtml(key) +
    '<div class="section-label">Termine &amp; Aufgaben</div>' +
    (entries || '<div class="leer-zeile">Nichts geplant für diesen Tag</div>') +
    (bdays.length ? '<div class="section-label">Geburtstage</div>' +
      bdays.map(b => '<div class="ent-row" onclick="switchView(\'geburtstage\')">' +
        '<span class="avatar">🎂</span><span class="ent-name">' + esc(b.name) +
        (b.year ? '<small>wird ' + (parseInt(key.slice(0, 4)) - parseInt(b.year)) + '</small>' : '') + '</span></div>').join('') : '') +
    '<div class="section-label">Menüplan</div>' +
    MEAL_SLOTS.map(slot => {
      const m = meals[slot];
      return '<div class="ent-row" onclick="openMealPicker(\'' + key + '\',\'' + slot + '\')">' +
        '<span class="ent-time wide">' + slot + '</span>' +
        '<span class="ent-name' + (m ? '' : ' muted') + '">' + (m ? esc(m.emoji || '🍽️') + ' ' + esc(m.name) : 'eintragen') + '</span></div>';
    }).join('') +
    (chores.length ? '<div class="section-label">Haushalt fällig</div>' +
      chores.slice(0, 6).map(choreRowHtml).join('') : '');
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
    (monatsOffset === 0 ? '' : '<button class="linkbtn" onclick="planerHeute()">Heute</button>')) +
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
  return '<div class="section-label with-action">Wochenmuster' +
    '<span class="sl-note">Wiederkehrende Aufgaben – Abhaken in Tag/Heute</span></div>' +
    '<div class="wm-grid">' + spalten + '</div>';
}

// ═══════════════════════════════════════════════
// Personen
// ═══════════════════════════════════════════════

let personTab = 'p1';
function setPersonTab(p) { personTab = p; renderPersonen(); }

function renderPersonen() {
  const who = personTab;
  const key = todayKey();
  const eigene = allTasks(who);

  // Reihenfolge wie besprochen: heute zuerst, dann die Termine, dann der
  // Bestand an Aufgaben.
  const termine = (HP.events || []).filter(e => !e.chore && e.date >= key && (e.who === who || e.who === 'shared'))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '')).slice(0, 8);

  let wocheGesamt = 0, wocheErledigt = 0;
  getWeekDates(0).forEach(d => {
    const k = dk(d);
    eigene.filter(t => taskOccursOn(t, k)).forEach(t => {
      wocheGesamt++;
      if (getStatus(t.id, k) === 'done') wocheErledigt++;
    });
  });

  document.getElementById('view-root').innerHTML =
    '<div class="list-page">' +
    viewHead('Personen',
      '<button class="btn btn-ghost btn-sm" onclick="openTaskForm(null,\'' + key + '\',{who:\'' + who + '\'})">' +
      '<span class="icon i-plus"></span> Aufgabe</button>') +
    utabs([['p1', HP.names.p1], ['p2', HP.names.p2]], who, 'setPersonTab') +

    '<div class="section-label">Heute anstehend</div>' +
    (dayEntriesHtml(key, who) || '<div class="leer-zeile">Für heute ist nichts eingetragen</div>') +

    '<div class="section-label">Nächste Termine</div>' +
    (termine.length
      ? termine.map(e => entryRowHtml({
        done: getEventStatus(e.id) === 'done',
        onclick: 'openEventForm(\'' + esc(e.id) + '\')',
        farbe: getColor(e.who), wer: whoLabelV2(e.who),
        zeit: dateLabel(e.date, { day: 'numeric', month: 'short' }), zeitBreit: true,
        text: e.emoji + ' ' + e.name,
        rechts: e.time ? '<span class="fr-meta">' + esc(fmtTime(e.time)) + '</span>' : ''
      })).join('')
      : '<div class="leer-zeile">Keine kommenden Termine</div>') +

    '<div class="section-label">Alle Aufgaben</div>' +
    (eigene.length
      ? eigene.map(t => '<div class="ent-row" onclick="openTaskForm(\'' + esc(t.id) + '\')">' +
        '<span class="ent-dot" style="background:' + getColor(t.who) + '" title="' + esc(whoLabelV2(t.who)) + '"></span>' +
        '<span class="ent-name">' + esc(t.emoji) + ' ' + esc(t.name) +
        '<small>' + t.days.map(d => DS[d]).join(', ') + (t.time ? ' · ' + esc(fmtTime(t.time)) : '') + '</small></span>' +
        '<span class="icon i-pencil rowhint"></span></div>').join('')
      : '<div class="leer-zeile">Noch keine Aufgaben angelegt</div>') +

    '<div class="summary-row">' +
    '<span>Aufgaben diese Woche</span>' +
    '<b style="color:' + getColor(who) + '">' + wocheErledigt + ' / ' + wocheGesamt + '</b>' +
    '</div>' +
    '</div>';
}
