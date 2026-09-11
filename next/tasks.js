// ═══════════════════════════════════════════════
// HEIMPLANER V2 – Aufgaben & Termine (Formulare + Zeilen)
// Keine eigene Ansicht: stellt die Bausteine bereit, die Heute, Planer und
// Personen gemeinsam nutzen. Datenmodell unverändert aus dem Hauptprojekt:
//   Serien-Aufgabe  HP.tasks[p1|p2|shared][] mit days:[0=Mo..6=So]
//   Status          HP.taskStatus[tid][dateKey]   (pro Vorkommen!)
//   Ausnahme        HP.taskExceptions[tid][dateKey] = true
//   Einmal-Termin   HP.events[] mit date/time, Status HP.eventStatus[id]
// ═══════════════════════════════════════════════

const TASK_REMINDER_OPTS = [['', 'Keine'], ['0', 'Zur Uhrzeit'], ['5', '5 Min vorher'], ['15', '15 Min vorher'], ['30', '30 Min vorher'], ['60', '1 Std vorher']];
const EVENT_REMINDER_OPTS = [['', 'Standard (15 Min vorher)'], ['off', 'Keine'], ['0', 'Zur Uhrzeit'], ['15', '15 Min vorher'], ['30', '30 Min vorher'], ['60', '1 Std vorher'], ['240', '4 Std vorher'], ['1440', '1 Tag vorher'], ['10080', '1 Woche vorher']];

function reminderOptions(opts, selected) {
  return opts.map(([v, l]) => '<option value="' + v + '"' + ((selected || '') === v ? ' selected' : '') + '>' + l + '</option>').join('');
}

function findTask(tid) {
  for (const w of ['p1', 'p2', 'shared']) {
    const t = (HP.tasks[w] || []).find(x => x.id === tid);
    if (t) return { task: t, who: w };
  }
  return null;
}

// ── Zeilen ────────────────────────────────────
// Aufbau nach den Mockups: Häkchen, Personenpunkt, Uhrzeit in fester Spalte,
// dann der Text. Die feste Zeitspalte ist der Grund, warum sich die Namen
// untereinander an einer Kante ausrichten - das trägt die ganze Listenoptik.
function entryRowHtml(opts) {
  return '<div class="ent-row' + (opts.done ? ' is-done' : '') + '" onclick="' + opts.onclick + '">' +
    (opts.toggle
      ? '<button class="check sm' + (opts.done ? ' done' : '') + '" onclick="event.stopPropagation();' + opts.toggle + '" title="Erledigt">' +
        (opts.done ? '<span class="icon i-check"></span>' : '') + '</button>'
      : '') +
    '<span class="ent-dot" style="background:' + opts.farbe + '" title="' + esc(opts.wer) + '"></span>' +
    '<span class="ent-time' + (opts.zeitBreit ? ' wide' : '') + '">' + esc(opts.zeit) + '</span>' +
    '<span class="ent-name">' + esc(opts.text) + '</span>' +
    (opts.rechts || '') + '</div>';
}

function taskRowHtml(t, dateKey) {
  return entryRowHtml({
    done: getStatus(t.id, dateKey) === 'done',
    toggle: 'toggleTaskFromRow(\'' + esc(t.id) + '\',\'' + esc(dateKey) + '\')',
    onclick: 'openTaskForm(\'' + esc(t.id) + '\',\'' + esc(dateKey) + '\')',
    farbe: getColor(t.who), wer: whoLabelV2(t.who),
    // Nur die Startzeit: eine Spanne ("18:00–19:30") sprengt die schmale
    // Zeitspalte, und das Ende steht im Formular.
    zeit: fmtTime(t.time),
    text: t.emoji + ' ' + t.name,
    rechts: t.important ? '<span class="ent-flag">★</span>' : ''
  });
}

function toggleTaskFromRow(tid, dateKey) {
  toggleTaskDone(tid, dateKey);
  render();
}

function eventRowHtml(e) {
  const notiz = notizZuTermin(e.id);
  return entryRowHtml({
    done: getEventStatus(e.id) === 'done',
    toggle: 'toggleEventDone(\'' + esc(e.id) + '\')',
    onclick: 'openEventForm(\'' + esc(e.id) + '\')',
    farbe: getColor(e.who), wer: whoLabelV2(e.who),
    zeit: fmtTime(e.time) || 'ganztags',
    text: e.emoji + ' ' + e.name,
    rechts: (e.important ? '<span class="ent-flag">★</span>' : '') +
      // Zeigt nur an, dass es eine Notiz gibt; geöffnet wird sie im Termin-
      // Formular, damit die Zeile einen einzigen Klick-Zweck behält.
      (notiz ? '<span class="ent-note icon i-notebook" title="Notiz auf der Pinnwand"></span>' : '')
  });
}

function toggleEventDone(id) {
  if (!HP.eventStatus) HP.eventStatus = {};
  if (getEventStatus(id) === 'done') delete HP.eventStatus[id];
  else HP.eventStatus[id] = 'done';
  HP_save();
  render();
}

// Termine und Serien-Aufgaben eines Tages in einer gemeinsamen, nach Uhrzeit
// sortierten Liste (Einträge ohne Uhrzeit ans Ende).
function dayEntries(dateKey, whoFilter) {
  const events = (HP.events || []).filter(e => !e.chore && e.date === dateKey);
  const tasks = allTasks().filter(t => taskOccursOn(t, dateKey));
  const pass = x => !whoFilter || x.who === whoFilter || x.who === 'shared';
  const items = [
    ...events.filter(pass).map(e => ({ kind: 'event', data: e, time: e.time || '' })),
    ...tasks.filter(pass).map(t => ({ kind: 'task', data: t, time: t.time || '' }))
  ];
  return items.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
}

function dayEntriesHtml(dateKey, whoFilter) {
  const items = dayEntries(dateKey, whoFilter);
  if (!items.length) return '';
  return items.map(i => i.kind === 'event' ? eventRowHtml(i.data) : taskRowHtml(i.data, dateKey)).join('');
}

// ── Aufgaben-Formular ─────────────────────────
function dayPillsHtml(days) {
  return '<div class="daypills">' + DS.map((d, i) =>
    '<button type="button" class="daypill' + (days.includes(i) ? ' on' : '') + '" data-d="' + i + '" ' +
    'onclick="this.classList.toggle(\'on\')">' + d + '</button>').join('') + '</div>';
}

function openTaskForm(tid, dateKey, prefill) {
  const found = tid ? findTask(tid) : null;
  const t = found ? found.task : null;
  const who = t ? found.who : (prefill && prefill.who) || 'shared';
  const days = t ? t.days : (prefill && prefill.days) || [];
  const key = dateKey || todayKey();
  showModal(
    '<h3>' + (t ? 'Aufgabe bearbeiten' : 'Neue Aufgabe') + '</h3>' +
    '<div class="field-row">' +
    '<div class="field" style="max-width:70px"><label>Emoji</label><input id="tf-emoji" maxlength="4" value="' + esc(t ? t.emoji : '⭐') + '"></div>' +
    '<div class="field"><label>Name</label><input id="tf-name" maxlength="60" value="' + esc(t ? t.name : '') + '"></div>' +
    '</div>' +
    '<div class="field"><label>Für wen</label><select id="tf-who">' + whoOptions(who) + '</select></div>' +
    '<div class="field"><label>Wochentage</label>' + dayPillsHtml(days) + '</div>' +
    '<div class="field-row">' +
    '<div class="field"><label>Von</label><input type="time" id="tf-time" value="' + esc(t ? t.time || '' : '') + '"></div>' +
    '<div class="field"><label>Bis</label><input type="time" id="tf-timeend" value="' + esc(t ? t.timeEnd || '' : '') + '"></div>' +
    '</div>' +
    '<div class="field"><label>Erinnerung</label><select id="tf-reminder">' + reminderOptions(TASK_REMINDER_OPTS, t ? t.reminder : '') + '</select></div>' +
    '<label class="check-row"><input type="checkbox" id="tf-important"' + (t && t.important ? ' checked' : '') + '> Wichtig (erscheint im Monatsraster)</label>' +
    (t ? '<div class="field" style="margin-top:14px"><label>Nur an diesem Tag</label>' +
      '<button class="btn btn-outline btn-block" onclick="skipTaskOccurrence(\'' + esc(t.id) + '\',\'' + esc(key) + '\')">Am ' + esc(dateLabel(key, { day: 'numeric', month: 'short' })) + ' überspringen</button></div>' : '') +
    '<div class="modal-actions">' +
    (t ? '<button class="btn btn-danger" onclick="deleteTaskSeries(\'' + esc(t.id) + '\')">Serie löschen</button>' : '<span></span>') +
    '<div style="display:flex;gap:8px">' +
    '<button class="btn btn-outline" onclick="closeModal()">Abbrechen</button>' +
    '<button class="btn btn-accent" onclick="saveTaskForm(' + (t ? "'" + esc(t.id) + "'" : 'null') + ')">Speichern</button>' +
    '</div></div>'
  );
  setTimeout(() => document.getElementById('tf-name')?.focus(), 50);
}

function saveTaskForm(tid) {
  const name = kappen(document.getElementById('tf-name').value.trim(), FELD_MAX.name);
  const emoji = document.getElementById('tf-emoji').value.trim() || '⭐';
  const who = document.getElementById('tf-who').value;
  const days = Array.from(document.querySelectorAll('.daypill.on')).map(b => parseInt(b.dataset.d));
  const time = document.getElementById('tf-time').value;
  const timeEnd = document.getElementById('tf-timeend').value;
  const reminder = document.getElementById('tf-reminder').value;
  const important = document.getElementById('tf-important').checked;
  if (!name) { showToast('Bitte Name eingeben'); return; }
  if (!days.length) { showToast('Bitte mindestens einen Wochentag wählen'); return; }
  if (tid) {
    const found = findTask(tid);
    if (!found) { closeModal(); return; }
    Object.assign(found.task, { name, emoji, days, time, timeEnd, reminder, important, updatedAt: Date.now() });
    // Personenwechsel = Umzug zwischen den drei Listen, die ID bleibt.
    if (found.who !== who) {
      HP.tasks[found.who] = HP.tasks[found.who].filter(x => x.id !== tid);
      HP.tasks[who].push(found.task);
    }
  } else {
    HP.tasks[who].push({
      id: 't' + Date.now(), emoji, name, days, prio: false, important,
      status: 'open', time, timeEnd, reminder, updatedAt: Date.now()
    });
  }
  HP_save();
  closeModal();
  render();
  showToast(emoji + ' ' + name + ' gespeichert');
}

// Einzelnes Vorkommen streichen, ohne die Serie anzufassen.
function skipTaskOccurrence(tid, dateKey) {
  if (!HP.taskExceptions[tid]) HP.taskExceptions[tid] = {};
  HP.taskExceptions[tid][dateKey] = true;
  HP_save();
  closeModal();
  render();
  showUndoToast('Vorkommen übersprungen', () => {
    delete HP.taskExceptions[tid][dateKey];
    HP_save(); render(); showToast('Wiederhergestellt');
  });
}

function deleteTaskSeries(tid) {
  const found = findTask(tid);
  if (!found) { closeModal(); return; }
  const { task, who } = found;
  const nebendaten = {
    status: HP.taskStatus[tid], notiz: HP.taskNotes[tid],
    kommentare: (HP.taskComments || {})[tid], ausnahmen: HP.taskExceptions[tid]
  };
  markDeleted('tasks', tid);
  HP.tasks[who] = HP.tasks[who].filter(x => x.id !== tid);
  delete HP.taskStatus[tid]; delete HP.taskNotes[tid];
  if (HP.taskComments) delete HP.taskComments[tid];
  delete HP.taskExceptions[tid];
  HP_save();
  closeModal();
  render();
  showUndoToast('Aufgabe gelöscht', () => {
    unmarkDeleted('tasks', tid);
    task.updatedAt = Date.now();
    HP.tasks[who].push(task);
    if (nebendaten.status) HP.taskStatus[tid] = nebendaten.status;
    if (nebendaten.notiz) HP.taskNotes[tid] = nebendaten.notiz;
    if (nebendaten.kommentare) { HP.taskComments = HP.taskComments || {}; HP.taskComments[tid] = nebendaten.kommentare; }
    if (nebendaten.ausnahmen) HP.taskExceptions[tid] = nebendaten.ausnahmen;
    HP_save(); render(); showToast('Wiederhergestellt');
  });
}

// ── Termin-Formular ───────────────────────────
// rueckweg: wird ein Termin aus einem anderen Formular heraus angelegt oder
// bearbeitet (aktuell aus einer Notiz), springt das Formular nach Speichern,
// Abbrechen oder Löschen dorthin zurück, statt einfach zuzugehen. Wird bei
// jedem normalen Aufruf wieder geleert, damit kein alter Rückweg hängenbleibt.
let terminRueckweg = null;

function openEventForm(id, prefillDate, rueckweg) {
  terminRueckweg = rueckweg || null;
  const e = id ? (HP.events || []).find(x => x.id === id) : null;
  if (e && e.chore) { openChoreForm(id); return; }
  showModal(
    '<h3>' + (e ? 'Termin bearbeiten' : 'Neuer Termin') + '</h3>' +
    '<div class="field-row">' +
    '<div class="field" style="max-width:70px"><label>Emoji</label><input id="ef-emoji" maxlength="4" value="' + esc(e ? e.emoji : '📅') + '"></div>' +
    '<div class="field"><label>Name</label><input id="ef-name" maxlength="60" value="' + esc(e ? e.name : '') + '"></div>' +
    '</div>' +
    '<div class="field-row">' +
    '<div class="field"><label>Datum</label><input type="date" id="ef-date" value="' + esc(e ? e.date : (prefillDate || todayKey())) + '"></div>' +
    '<div class="field"><label>Für wen</label><select id="ef-who">' + whoOptions(e ? e.who : 'shared') + '</select></div>' +
    '</div>' +
    '<div class="field-row">' +
    '<div class="field"><label>Von</label><input type="time" id="ef-time" value="' + esc(e ? e.time || '' : '') + '"></div>' +
    '<div class="field"><label>Bis</label><input type="time" id="ef-timeend" value="' + esc(e ? e.timeEnd || '' : '') + '"></div>' +
    '</div>' +
    '<div class="field"><label>Erinnerung</label><select id="ef-reminder">' + reminderOptions(EVENT_REMINDER_OPTS, e ? e.reminder : '') + '</select></div>' +
    '<div class="field"><label>Notiz</label><textarea id="ef-note" rows="3" maxlength="5000">' + esc(e ? e.note || '' : '') + '</textarea>' +
    // Gegenstück zu "Neuer Termin" in der Notiz: von dort führt der Weg schon
    // zum Termin, hier führt er zurück auf die Pinnwand-Notiz.
    (notizZuTermin(id)
      ? '<div class="field-actions">' +
        '<button class="btn btn-outline btn-sm" onclick="terminNotizOeffnen(\'' + esc(notizZuTermin(id).id) + '\')">' +
        '<span class="icon i-notebook"></span> Notiz auf der Pinnwand öffnen</button></div>'
      : '') +
    '</div>' +
    '<label class="check-row"><input type="checkbox" id="ef-important"' + (e && e.important ? ' checked' : '') + '> Wichtig</label>' +
    '<div class="modal-actions">' +
    (e ? '<button class="btn btn-danger" onclick="deleteEventV2(\'' + esc(e.id) + '\')">Löschen</button>' : '<span></span>') +
    '<div style="display:flex;gap:8px">' +
    '<button class="btn btn-outline" onclick="terminAbbrechen()">Abbrechen</button>' +
    '<button class="btn btn-accent" onclick="saveEventForm(' + (e ? "'" + esc(e.id) + "'" : 'null') + ')">Speichern</button>' +
    '</div></div>'
  );
  setTimeout(() => document.getElementById('ef-name')?.focus(), 50);
}

// Die Notiz übernimmt das offene Fenster (showModal ersetzt den Inhalt). Der
// Rückweg wird vorher geleert: sonst zeigte er auf das Termin-Formular, aus
// dem man gerade weggegangen ist.
function terminNotizOeffnen(noteId) {
  terminRueckweg = null;
  openNoteForm(noteId);
}

function terminAbbrechen() {
  const zurueck = terminRueckweg;
  terminRueckweg = null;
  if (zurueck) zurueck(null); else closeModal();
}

function saveEventForm(id) {
  const name = kappen(document.getElementById('ef-name').value.trim(), FELD_MAX.name);
  const emoji = document.getElementById('ef-emoji').value.trim() || '📅';
  const date = document.getElementById('ef-date').value;
  const who = document.getElementById('ef-who').value;
  const time = document.getElementById('ef-time').value;
  const timeEnd = document.getElementById('ef-timeend').value;
  const reminder = document.getElementById('ef-reminder').value;
  const note = kappen(document.getElementById('ef-note').value.trim(), FELD_MAX.notiz);
  const important = document.getElementById('ef-important').checked;
  if (!name) { showToast('Bitte Name eingeben'); return; }
  if (!date) { showToast('Bitte Datum wählen'); return; }
  if (!HP.events) HP.events = [];
  let eid = id;
  if (id) {
    const e = HP.events.find(x => x.id === id);
    // Kann fehlen, wenn der Termin währenddessen auf dem anderen Gerät
    // gelöscht wurde und ein Poll dazwischenkam.
    if (!e) { showToast('Termin existiert nicht mehr'); terminRueckweg = null; closeModal(); render(); return; }
    Object.assign(e, { name, emoji, date, who, time, timeEnd, reminder, note, important, updatedAt: Date.now() });
  } else {
    eid = 'ev' + Date.now();
    HP.events.push({ id: eid, emoji, name, date, time, timeEnd, who, reminder, important, note, updatedAt: Date.now() });
  }
  HP_save();
  showToast(emoji + ' ' + name + ' gespeichert');
  const zurueck = terminRueckweg;
  terminRueckweg = null;
  if (zurueck) { zurueck(eid); return; }
  closeModal();
  render();
}

function deleteEventV2(id) {
  const e = (HP.events || []).find(x => x.id === id); if (!e) return;
  const nebendaten = {
    status: (HP.eventStatus || {})[id],
    notiz: (HP.eventNotes || {})[id],
    kommentare: (HP.eventComments || {})[id]
  };
  markDeleted('events', id);
  HP.events = HP.events.filter(x => x.id !== id);
  if (HP.eventStatus) delete HP.eventStatus[id];
  if (HP.eventNotes) delete HP.eventNotes[id];
  if (HP.eventComments) delete HP.eventComments[id];
  HP_save();
  const zurueck = terminRueckweg;
  terminRueckweg = null;
  if (zurueck) zurueck(null); else { closeModal(); render(); }
  showUndoToast('Termin gelöscht', () => {
    unmarkDeleted('events', id);
    e.updatedAt = Date.now();
    HP.events.push(e);
    if (nebendaten.status !== undefined) { HP.eventStatus = HP.eventStatus || {}; HP.eventStatus[id] = nebendaten.status; }
    if (nebendaten.notiz !== undefined) { HP.eventNotes = HP.eventNotes || {}; HP.eventNotes[id] = nebendaten.notiz; }
    if (nebendaten.kommentare !== undefined) { HP.eventComments = HP.eventComments || {}; HP.eventComments[id] = nebendaten.kommentare; }
    HP_save(); render(); showToast('Wiederhergestellt');
  });
}
