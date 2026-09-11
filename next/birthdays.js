// ═══════════════════════════════════════════════
// HEIMPLANER V2 – Geburtstage
// HP.birthdays[] = {id,name,date:'0000-MM-DD',year,updatedAt}
// Das Jahr steht bewusst separat (und darf leer sein): das Datum ist der
// jährlich wiederkehrende Teil, das Jahr nur für die Altersangabe.
// ═══════════════════════════════════════════════

function birthdaysOn(dateKey) {
  const mmdd = dateKey.slice(5);
  return (HP.birthdays || []).filter(b => (b.date || '').slice(5) === mmdd);
}

// Tage bis zum nächsten Geburtstag (0 = heute), inkl. Jahreswechsel.
function tageBisGeburtstag(b) {
  const heute = new Date(); heute.setHours(0, 0, 0, 0);
  const [m, d] = (b.date || '0000-01-01').slice(5).split('-').map(Number);
  let next = new Date(heute.getFullYear(), m - 1, d);
  if (next < heute) next = new Date(heute.getFullYear() + 1, m - 1, d);
  return Math.round((next - heute) / 86400000);
}

function kommendeGeburtstage(tage) {
  return (HP.birthdays || [])
    .map(b => ({ ...b, tage: tageBisGeburtstag(b) }))
    .filter(b => b.tage <= tage)
    .sort((a, b) => a.tage - b.tage);
}

function alterAm(b) {
  if (!b.year) return null;
  const heute = new Date();
  const [m, d] = (b.date || '').slice(5).split('-').map(Number);
  const dieses = new Date(heute.getFullYear(), m - 1, d);
  dieses.setHours(0, 0, 0, 0);
  const kommendesJahr = dieses < new Date(heute.getFullYear(), heute.getMonth(), heute.getDate())
    ? heute.getFullYear() + 1 : heute.getFullYear();
  return kommendesJahr - parseInt(b.year);
}

function renderGeburtstage() {
  const liste = (HP.birthdays || [])
    .map(b => ({ ...b, tage: tageBisGeburtstag(b) }))
    .sort((a, b) => a.tage - b.tage);
  document.getElementById('view-root').innerHTML =
    viewHead('Geburtstage') +
    (liste.length
      ? '<div class="card" style="padding:0 20px">' + liste.map(bdayRowHtml).join('') + '</div>'
      : emptyState('i-cake', 'Noch keine Geburtstage. Mit "+" unten rechts einen ersten anlegen.')) +
    '<button class="fab" onclick="openBirthdayForm()" title="Neuer Geburtstag"><span class="icon i-plus"></span></button>';
}

function bdayRowHtml(b) {
  const alter = alterAm(b);
  const datum = new Date(2000, parseInt(b.date.slice(5, 7)) - 1, parseInt(b.date.slice(8, 10)))
    .toLocaleDateString('de-CH', { day: 'numeric', month: 'long' });
  const wann = b.tage === 0 ? 'Heute!' : b.tage === 1 ? 'Morgen' : 'in ' + b.tage + ' Tagen';
  return '<div class="list-row" onclick="openBirthdayForm(\'' + esc(b.id) + '\')">' +
    '<span class="row-emoji">🎂</span>' +
    '<div class="meta"><div class="name">' + esc(b.name) + '</div>' +
    '<div class="sub' + (b.tage === 0 ? ' accent' : '') + '">' + esc(datum) +
    (alter != null ? ' · wird ' + alter : '') + ' · ' + wann + '</div></div>' +
    '</div>';
}

function openBirthdayForm(id) {
  const b = id ? (HP.birthdays || []).find(x => x.id === id) : null;
  const tag = b ? b.date.slice(8, 10) : '';
  const monat = b ? b.date.slice(5, 7) : '';
  showModal('<h3>' + (b ? 'Geburtstag bearbeiten' : 'Neuer Geburtstag') + '</h3>' +
    '<div class="field"><label>Name</label><input id="bf-name" maxlength="60" value="' + esc(b ? b.name : '') + '"></div>' +
    '<div class="field-row">' +
    '<div class="field"><label>Tag</label><input type="number" id="bf-day" min="1" max="31" value="' + esc(tag) + '"></div>' +
    '<div class="field"><label>Monat</label><select id="bf-month">' +
    MONTH_NAMES.map((m, i) => '<option value="' + String(i + 1).padStart(2, '0') + '"' +
      (monat === String(i + 1).padStart(2, '0') ? ' selected' : '') + '>' + m + '</option>').join('') +
    '</select></div>' +
    '<div class="field"><label>Jahrgang</label><input type="number" id="bf-year" placeholder="optional" value="' + esc(b ? b.year || '' : '') + '"></div>' +
    '</div>' +
    '<div class="modal-actions">' +
    (b ? '<button class="btn btn-danger" onclick="deleteBirthdayV2(\'' + esc(b.id) + '\')">Löschen</button>' : '<span></span>') +
    '<div style="display:flex;gap:8px">' +
    '<button class="btn btn-outline" onclick="closeModal()">Abbrechen</button>' +
    '<button class="btn btn-accent" onclick="saveBirthdayForm(' + (b ? "'" + esc(b.id) + "'" : 'null') + ')">Speichern</button>' +
    '</div></div>');
  setTimeout(() => document.getElementById('bf-name')?.focus(), 50);
}

function saveBirthdayForm(id) {
  const name = kappen(document.getElementById('bf-name').value.trim(), FELD_MAX.name);
  const tag = parseInt(document.getElementById('bf-day').value);
  const monat = document.getElementById('bf-month').value;
  const jahr = document.getElementById('bf-year').value.trim();
  if (!name) { showToast('Bitte Name eingeben'); return; }
  if (!tag || tag < 1 || tag > 31) { showToast('Bitte gültigen Tag eingeben'); return; }
  const date = '0000-' + monat + '-' + String(tag).padStart(2, '0');
  if (!HP.birthdays) HP.birthdays = [];
  if (id) {
    const b = HP.birthdays.find(x => x.id === id);
    Object.assign(b, { name, date, year: jahr, updatedAt: Date.now() });
  } else {
    HP.birthdays.push({ id: 'bd' + Date.now(), name, date, year: jahr, updatedAt: Date.now() });
  }
  HP_save(); closeModal(); render();
  showToast('🎂 ' + name + ' gespeichert');
}

function deleteBirthdayV2(id) {
  const weg = (HP.birthdays || []).find(x => x.id === id); if (!weg) return;
  markDeleted('birthdays', id);
  HP.birthdays = HP.birthdays.filter(x => x.id !== id);
  HP_save(); closeModal(); render();
  showUndoToast('Geburtstag gelöscht', () => {
    unmarkDeleted('birthdays', id);
    weg.updatedAt = Date.now();
    HP.birthdays.push(weg);
    HP_save(); render(); showToast('Wiederhergestellt');
  });
}
