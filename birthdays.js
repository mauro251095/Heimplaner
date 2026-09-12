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

// Kalenderjahr, in dem der nächste Geburtstag stattfindet - liegt er hinter
// uns, ist das bereits das Folgejahr. Trägt die Monats-Überschriften und die
// Unterscheidung "wird" / "wurde".
function bdayNaechstesJahr(b) {
  const heute = new Date(); heute.setHours(0, 0, 0, 0);
  const [m, d] = (b.date || '0000-01-01').slice(5).split('-').map(Number);
  return new Date(heute.getFullYear(), m - 1, d) < heute
    ? heute.getFullYear() + 1 : heute.getFullYear();
}

function bdaySchonGehabt(b) {
  return bdayNaechstesJahr(b) > new Date().getFullYear();
}

function tageSeitGeburtstag(b) {
  const heute = new Date(); heute.setHours(0, 0, 0, 0);
  const [m, d] = (b.date || '0000-01-01').slice(5).split('-').map(Number);
  return Math.round((heute - new Date(heute.getFullYear(), m - 1, d)) / 86400000);
}

// Alter am NÄCHSTEN Geburtstag. Bei einem schon gefeierten ist das eines mehr
// als das heutige - deshalb rechnet die Zeile dort wieder eins zurück.
function alterAm(b) {
  if (!b.year) return null;
  return bdayNaechstesJahr(b) - parseInt(b.year);
}

// Der nächste Geburtstag steht hervorgehoben oben, der Rest nach Monaten
// gruppiert - so sieht man auf einen Blick, was als Nächstes kommt, ohne die
// ganze Liste zu lesen.
//
// Gruppiert wird nach zusammenhaengenden Laeufen im (nach Naehe sortierten)
// Verlauf, nicht nach Monatsnamen: der laufende Monat ist zum Teil noch
// Zukunft und zum Teil schon Vergangenheit und erscheint deshalb ZWEIMAL -
// oben das Kommende, ganz unten das Gewesene. Eine Gruppierung nach Namen
// warf beides in denselben Topf und stellte einen Geburtstag von vorgestern
// neben einen von uebermorgen.
function renderGeburtstage() {
  const liste = (HP.birthdays || [])
    .map(b => ({ ...b, tage: tageBisGeburtstag(b) }))
    .sort((a, b) => a.tage - b.tage);
  const naechster = liste[0];
  const rest = liste.slice(1);
  const diesesJahr = new Date().getFullYear();

  const bloecke = [];
  rest.forEach(b => {
    const monat = parseInt(b.date.slice(5, 7)) - 1;
    const jahr = bdayNaechstesJahr(b);
    const letzter = bloecke[bloecke.length - 1];
    if (letzter && letzter.monat === monat && letzter.jahr === jahr) letzter.eintraege.push(b);
    else bloecke.push({ monat, jahr, eintraege: [b] });
  });

  document.getElementById('view-root').innerHTML =
    '<div class="list-page">' +
    viewHead('Geburtstage',
      '<button class="btn btn-ghost btn-sm" onclick="openBirthdayForm()"><span class="icon i-plus"></span> Geburtstag</button>') +
    (liste.length
      ? '<div class="highlight-row" onclick="openBirthdayForm(\'' + esc(naechster.id) + '\')">' +
        '<span class="hl-avatar">' + esc((naechster.name || '?').charAt(0).toUpperCase()) + '</span>' +
        '<div class="hl-text"><b>' + esc(naechster.name) + '</b><span>' + esc(bdayDatum(naechster)) +
        (alterAm(naechster) != null ? ', wird ' + alterAm(naechster) : '') + '</span></div>' +
        '<span class="hl-when">' + esc(wannLabel(naechster.tage)) + '</span></div>' +
        // Die Jahreszahl nur am Folgejahr: sie ist der einzige Unterschied
        // zwischen dem oberen und dem unteren "September".
        bloecke.map(bl =>
          '<div class="section-label">' + esc(MONTH_NAMES[bl.monat]) +
          (bl.jahr > diesesJahr ? ' ' + bl.jahr : '') + '</div>' +
          bl.eintraege.map(bdayRowHtml).join('')).join('')
      : emptyState('i-cake', 'Noch keine Geburtstage.')) +
    '</div>';
}

function bdayDatum(b) {
  return new Date(2000, parseInt(b.date.slice(5, 7)) - 1, parseInt(b.date.slice(8, 10)))
    .toLocaleDateString('de-CH', { day: 'numeric', month: 'long' }) + (b.year ? ' ' + b.year : '');
}

function wannLabel(tage) {
  return tage === 0 ? 'heute' : tage === 1 ? 'morgen' : 'in ' + tage + ' Tagen';
}

// Rueckblickend beschriftet wird nur das kuerzlich Gewesene: "gestern" oder
// "vor 7 Tagen" ist eine brauchbare Auskunft (nachtraeglich gratulieren), "vor
// 182 Tagen" dagegen nicht - und es stuende in der Zeile unter einer
// Ueberschrift, die bereits das naechste Jahr nennt.
const BDAY_RUECKBLICK_TAGE = 31;

function warLabel(tage) {
  return tage === 1 ? 'gestern' : 'vor ' + tage + ' Tagen';
}

// Datum und Jahrgang stehen unter dem Namen, nicht rechts aussen: die rechte
// Spalte (.fr-meta) blendet CSS auf schmalen Handys aus, und genau dort ging
// der Jahrgang bisher verloren.
function bdayRowHtml(b) {
  const alter = alterAm(b);
  const gehabt = bdaySchonGehabt(b);
  const datum = esc(b.date.slice(8, 10)) + '.' + esc(b.date.slice(5, 7)) + '.' + esc(b.year || '');
  const alterText = alter == null ? '' : ' · ' + (gehabt ? 'wurde ' + (alter - 1) : 'wird ' + alter);
  const seit = gehabt ? tageSeitGeburtstag(b) : null;
  const wann = seit != null && seit <= BDAY_RUECKBLICK_TAGE ? warLabel(seit) : wannLabel(b.tage);
  return '<div class="ent-row" onclick="openBirthdayForm(\'' + esc(b.id) + '\')">' +
    '<span class="avatar">' + esc((b.name || '?').charAt(0).toUpperCase()) + '</span>' +
    '<span class="ent-name">' + esc(b.name) + '<small>' + datum + alterText + '</small></span>' +
    '<span class="fr-meta">' + esc(wann) + '</span>' +
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
