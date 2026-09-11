// ═══════════════════════════════════════════════
// HEIMPLANER V2 – Pinnwand
// HP.notes[] = {id,title,body,color,linkedEventId,created,updatedAt}
// ═══════════════════════════════════════════════

const NOTE_COLORS = [['yellow', 'Gelb'], ['blue', 'Blau'], ['pink', 'Pink'], ['green', 'Grün'], ['purple', 'Violett']];

function renderPinnwand() {
  const notes = HP.notes || [];
  document.getElementById('view-root').innerHTML =
    viewHead('Pinnwand') +
    (notes.length
      ? '<div class="pin-grid">' + notes.map(pinNoteHtml).join('') + '</div>'
      : emptyState('i-pin', 'Noch keine Notizen. Mit "+" unten rechts eine erste anlegen.')) +
    '<button class="fab" onclick="openNoteForm()" title="Neue Notiz"><span class="icon i-plus"></span></button>';
}

function pinNoteHtml(n) {
  const termin = n.linkedEventId ? (HP.events || []).find(e => e.id === n.linkedEventId) : null;
  return '<div class="pin-note note-' + esc(n.color || 'yellow') + '" onclick="openNoteForm(\'' + esc(n.id) + '\')">' +
    (n.title ? '<div class="pin-title">' + esc(n.title) + '</div>' : '') +
    (n.body ? '<div class="pin-body">' + esc(n.body) + '</div>' : '') +
    (termin ? '<div class="pin-link">' + esc(termin.emoji) + ' ' + esc(termin.name) + ' · ' +
      esc(dateLabel(termin.date, { day: 'numeric', month: 'short' })) + '</div>' : '') +
    '</div>';
}

// entwurf: erhält die eingetippten Werte, wenn zwischendurch das
// Termin-Formular offen war (siehe notizTerminAnlegen) - sonst wäre der Text
// nach dem Umweg weg.
function openNoteForm(id, entwurf) {
  const n = id ? (HP.notes || []).find(x => x.id === id) : null;
  const w = entwurf || {
    title: n ? n.title || '' : '',
    body: n ? n.body || '' : '',
    color: n ? n.color || 'yellow' : 'yellow',
    linkedEventId: n ? n.linkedEventId || '' : ''
  };
  const termine = (HP.events || []).filter(e => !e.chore).sort((a, b) => a.date.localeCompare(b.date));
  const verknuepft = termine.find(e => e.id === w.linkedEventId);
  showModal('<h3>' + (n ? 'Notiz bearbeiten' : 'Neue Notiz') + '</h3>' +
    '<div class="field"><label>Farbe</label><div class="color-row">' +
    NOTE_COLORS.map(([c, label]) =>
      '<button type="button" class="color-dot note-' + c + (w.color === c ? ' sel' : '') + '" title="' + label + '" ' +
      'onclick="document.querySelectorAll(\'.color-dot\').forEach(x=>x.classList.remove(\'sel\'));this.classList.add(\'sel\');document.getElementById(\'nf-color\').value=\'' + c + '\'"></button>').join('') +
    '</div><input type="hidden" id="nf-color" value="' + esc(w.color) + '"></div>' +
    '<div class="field"><label>Titel</label><input id="nf-title" maxlength="200" value="' + esc(w.title) + '"></div>' +
    '<div class="field"><label>Text</label><textarea id="nf-body" rows="5" maxlength="5000">' + esc(w.body) + '</textarea></div>' +
    '<div class="field"><label>Mit Termin verknüpfen</label><select id="nf-event">' +
    '<option value="">— keiner —</option>' +
    termine.map(e => '<option value="' + esc(e.id) + '"' + (w.linkedEventId === e.id ? ' selected' : '') + '>' +
      esc(e.emoji) + ' ' + esc(e.name) + ' (' + esc(e.date) + ')</option>').join('') +
    '</select>' +
    '<div class="field-actions">' +
    '<button class="btn btn-outline btn-sm" onclick="notizTerminAnlegen(' + (id ? "'" + esc(id) + "'" : 'null') + ')">' +
    '<span class="icon i-plus"></span> Neuer Termin</button>' +
    (verknuepft ? '<button class="btn btn-outline btn-sm" onclick="notizTerminBearbeiten(' + (id ? "'" + esc(id) + "'" : 'null') + ')">' +
      '<span class="icon i-pencil"></span> Termin bearbeiten</button>' : '') +
    '</div>' +
    (verknuepft ? '<div class="muted small">' + esc(dateLabel(verknuepft.date, { weekday: 'short', day: 'numeric', month: 'short' })) +
      (verknuepft.time ? ' · ' + esc(fmtTime(verknuepft.time)) : ' · ohne Uhrzeit') + '</div>' : '') +
    '</div>' +
    '<div class="modal-actions">' +
    (n ? '<button class="btn btn-danger" onclick="deleteNoteV2(\'' + esc(n.id) + '\')">Löschen</button>' : '<span></span>') +
    '<div style="display:flex;gap:8px">' +
    '<button class="btn btn-outline" onclick="closeModal()">Abbrechen</button>' +
    '<button class="btn btn-accent" onclick="saveNoteForm(' + (n ? "'" + esc(n.id) + "'" : 'null') + ')">Speichern</button>' +
    '</div></div>');
  setTimeout(() => document.getElementById('nf-title')?.focus(), 50);
}

function notizFormularWerte() {
  return {
    title: document.getElementById('nf-title').value,
    body: document.getElementById('nf-body').value,
    color: document.getElementById('nf-color').value,
    linkedEventId: document.getElementById('nf-event').value
  };
}

// Umweg über das normale Termin-Formular statt eigener Mini-Felder in der
// Notiz: dort gibt es Uhrzeit, Ende, Person und Erinnerung schon - und ein
// zweites Formular für dieselbe Sache würde früher oder später auseinanderlaufen.
function notizTerminAnlegen(id) {
  const entwurf = notizFormularWerte();
  openEventForm(null, todayKey(), neuId => {
    if (neuId) entwurf.linkedEventId = neuId;
    openNoteForm(id, entwurf);
  });
}

function notizTerminBearbeiten(id) {
  const entwurf = notizFormularWerte();
  const eid = entwurf.linkedEventId;
  if (!eid) return;
  openEventForm(eid, null, weiterhin => {
    // weiterhin === null: Termin wurde gelöscht oder abgebrochen - beim
    // Löschen zeigt der Select den Eintrag dann nicht mehr an.
    if (!(HP.events || []).some(e => e.id === eid)) entwurf.linkedEventId = '';
    openNoteForm(id, entwurf);
  });
}

function saveNoteForm(id) {
  const title = kappen(document.getElementById('nf-title').value.trim(), FELD_MAX.titel);
  const body = kappen(document.getElementById('nf-body').value.trim(), FELD_MAX.notiz);
  const color = document.getElementById('nf-color').value || 'yellow';
  const linkedEventId = document.getElementById('nf-event').value || '';
  if (!title && !body) { showToast('Bitte Titel oder Text eingeben'); return; }
  if (!HP.notes) HP.notes = [];
  if (id) {
    const n = HP.notes.find(x => x.id === id);
    Object.assign(n, { title, body, color, linkedEventId, updatedAt: Date.now() });
  } else {
    HP.notes.unshift({
      id: 'n' + Date.now(), title, body, color, linkedEventId,
      created: new Date().toISOString(), updatedAt: Date.now()
    });
  }
  HP_save(); closeModal(); render();
  showToast('Notiz gespeichert');
}

function deleteNoteV2(id) {
  const weg = (HP.notes || []).find(x => x.id === id); if (!weg) return;
  markDeleted('notes', id);
  HP.notes = HP.notes.filter(x => x.id !== id);
  HP_save(); closeModal(); render();
  showUndoToast('Notiz gelöscht', () => {
    unmarkDeleted('notes', id);
    weg.updatedAt = Date.now();
    HP.notes.unshift(weg);
    HP_save(); render(); showToast('Wiederhergestellt');
  });
}
