// ═══════════════════════════════════════════════
// HEIMPLANER V2 – Budget
// Buchungen: HP.budgetEntries[] = {id,person,cat,amount,comment,date,
//            sharedGroupId,updatedAt}; Limits: HP.budgetLimits[person][cat]
// Eine gemeinsame Buchung wird wie im Hauptprojekt als ZWEI verknüpfte
// Hälften gespeichert (sharedGroupId) - sonst stimmt keine Monatssumme.
// Balken wechselt ab 90% des Limits auf Rot (Vorwarnung, siehe CLAUDE.md).
// ═══════════════════════════════════════════════

const BUDGET_WARN = 0.9;
let budgetPerson = null;      // beim ersten Render auf die angemeldete Person
let budgetOffset = 0;

function setBudgetPerson(p) { budgetPerson = p; renderBudgetView(); }
function budgetMonat(d) { budgetOffset += d; renderBudgetView(); }
function budgetSpringe(offset) { budgetOffset = offset; renderBudgetView(); }

let budgetFormOffen = false;
function toggleBudgetForm() {
  budgetFormOffen = !budgetFormOffen;
  renderBudgetView();
  if (budgetFormOffen) document.getElementById('bg-amount')?.focus();
}

// Summe je Monat für die kleine Verlaufsleiste (Mockup: "Letzte 6 Monate").
function budgetVerlauf(person, bisOffset, anzahl) {
  const out = [];
  for (let i = anzahl - 1; i >= 0; i--) {
    const mk = currentMonthKey(bisOffset - i);
    out.push({
      mk,
      offset: bisOffset - i,
      kurz: MONTH_NAMES[parseInt(mk.slice(5, 7)) - 1].slice(0, 3),
      summe: budgetEntriesFor(person, mk).reduce((s, e) => s + e.amount, 0)
    });
  }
  return out;
}

function renderBudgetView() {
  if (!budgetPerson) budgetPerson = loggedInPersonKey();
  const person = budgetPerson;
  const mk = currentMonthKey(budgetOffset);
  const eintraege = budgetEntriesFor(person, mk);

  let istGesamt = 0, limitGesamt = 0;
  const zeilen = BUDGET_CATS.map(cat => {
    const catEintraege = eintraege.filter(e => e.cat === cat)
      .sort((a, b) => b.date.localeCompare(a.date) || (b.updatedAt || 0) - (a.updatedAt || 0));
    const ist = catEintraege.reduce((s, e) => s + e.amount, 0);
    const limit = budgetLimit(person, cat);
    istGesamt += ist; limitGesamt += limit;
    const anteil = limit > 0 ? ist / limit : 0;
    const warn = limit > 0 && anteil >= BUDGET_WARN;
    return '<div class="budget-line" onclick="this.classList.toggle(\'open\')">' +
      '<div class="bl-top"><span>' + BUDGET_CAT_EMOJI[cat] + ' ' + esc(cat) + '</span>' +
      '<span class="bl-nums' + (warn ? ' warn' : '') + '">' + fmtCHF(ist) + (limit > 0 ? ' / ' + fmtCHF(limit) : '') + '</span></div>' +
      '<div class="bar"><div class="bar-fill' + (warn ? ' warn' : '') + '" ' +
      'style="width:' + (limit > 0 ? Math.min(Math.round(anteil * 100), 100) : 0) + '%"></div></div>' +
      '<div class="budget-entries">' +
      (catEintraege.length
        ? catEintraege.map(e => '<div class="entry-row">' +
          '<span class="er-date">' + e.date.slice(8, 10) + '.' + e.date.slice(5, 7) + '</span>' +
          '<span class="er-text">' + esc(e.comment || '—') + (e.sharedGroupId ? ' <span class="er-tag">geteilt</span>' : '') + '</span>' +
          '<span class="er-amount">' + fmtCHF(e.amount) + '</span>' +
          '<button class="rowbtn" onclick="event.stopPropagation();openBudgetEntryForm(\'' + esc(e.id) + '\')"><span class="icon i-pencil"></span></button>' +
          '</div>').join('')
        : '<div class="leer-zeile">Keine Buchungen</div>') +
      '</div></div>';
  }).join('');

  const verbleibend = limitGesamt - istGesamt;
  const verlauf = budgetVerlauf(person, budgetOffset, 6);
  const maxSumme = Math.max(...verlauf.map(v => v.summe), 1);
  const farbe = getColor(person);

  document.getElementById('view-root').innerHTML =
    '<div class="list-page">' +
    viewHead('Budget',
      '<button class="btn btn-ghost btn-sm" onclick="openBudgetLimits()">Limits</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="openBudgetJahr()">Jahresstatistik</button>') +
    utabs([['p1', HP.names.p1], ['p2', HP.names.p2]], person, 'setBudgetPerson') +
    navRow('budgetMonat(-1)', monthLabel(mk), 'budgetMonat(1)') +

    '<div class="big-stat">' +
    '<div class="bs-label">' + esc(monthLabel(mk)) + (limitGesamt > 0 ? ', verbleibend' : ', ausgegeben') + '</div>' +
    '<div class="bs-value' + (limitGesamt > 0 && verbleibend < 0 ? ' over' : '') + '">CHF ' +
    fmtCHF(limitGesamt > 0 ? verbleibend : istGesamt) + '</div>' +
    (limitGesamt > 0 ? '<div class="bs-sub">' + fmtCHF(istGesamt) + ' von ' + fmtCHF(limitGesamt) + ' ausgegeben</div>' : '') +
    '</div>' +

    (budgetFormOffen
      ? '<div class="inline-form">' +
        '<div class="if-row">' +
        '<input id="bg-amount" inputmode="decimal" placeholder="CHF" onkeydown="if(event.key===\'Enter\')addBudgetEntryV2()">' +
        '<select id="bg-cat" onchange="budgetChipsPruefen()">' + BUDGET_CATS.map(c => '<option value="' + esc(c) + '">' + BUDGET_CAT_EMOJI[c] + ' ' + esc(c) + '</option>').join('') + '</select>' +
        '</div>' +
        '<input id="bg-comment" placeholder="Wofür?" maxlength="300" onkeydown="if(event.key===\'Enter\')addBudgetEntryV2()">' +
        geschenkChipsHtml() +
        '<div class="if-row">' +
        '<select id="bg-person">' + whoOptions(person) + '</select>' +
        '<input id="bg-date" type="date" value="' + budgetStandardDatum() + '">' +
        '</div>' +
        '<div class="if-actions">' +
        '<button class="btn btn-outline btn-sm" onclick="toggleBudgetForm()">Abbrechen</button>' +
        '<button class="btn btn-accent btn-sm" onclick="addBudgetEntryV2()">Buchen</button>' +
        '</div></div>'
      : '<button class="addrow" onclick="toggleBudgetForm()"><span class="icon i-plus"></span> Ausgabe erfassen</button>') +

    zeilen +

    '<div class="section-label">Letzte 6 Monate</div>' +
    // Balken sind anklickbar - der Monat, den man vergleichen will, ist meist
    // genau der, den man gerade sieht.
    '<div class="spark">' + verlauf.map(v =>
      '<button class="sp-col" title="' + esc(v.kurz) + ': ' + fmtCHF(v.summe) + '" ' +
      'onclick="budgetSpringe(' + v.offset + ')">' +
      '<span class="sp-bar" style="height:' + Math.max(Math.round(v.summe / maxSumme * 100), 3) + '%' +
      (v.offset === budgetOffset ? ';background:' + farbe : '') + '"></span>' +
      '<span class="sp-lbl' + (v.offset === budgetOffset ? ' sel' : '') + '">' + esc(v.kurz) + '</span></button>').join('') +
    '</div>' +
    '</div>';
}

// ── Geschenke: wer wird beschenkt? ─────────────
// Bewusst OHNE neues Feld an budgetEntries: der Name steht ohnehin im
// Kommentar ("Geschenk Nima"). Die Chips ersparen nicht das Tippen, sondern
// sichern die einheitliche Schreibweise - "Nima" und "Nima H." waeren sonst
// zwei Zeilen in der Auswertung. Und weil nur gelesen wird, was schon
// dasteht, greift die Auswertung auch rueckwirkend.
const GESCHENK_CAT = 'Geschenke';
const GESCHENK_CHIPS_MAX = 6;

// Die Zeile haengt immer im DOM und wird nur ein-/ausgeblendet: ein
// Neuzeichnen des Formulars bei jedem Kategoriewechsel wuerde den schon
// getippten Betrag verwerfen.
function geschenkChipsHtml() {
  const namen = (HP.birthdays || [])
    .map(b => ({ name: b.name, tage: tageBisGeburtstag(b) }))
    .filter(b => b.name)
    .sort((a, b) => a.tage - b.tage)
    .slice(0, GESCHENK_CHIPS_MAX);
  if (!namen.length) return '';
  return '<div class="chips" id="bg-chips" hidden>' +
    // Name über data-Attribut statt in den onclick-String: ein Apostroph im
    // Namen ("D'Angelo") bricht sonst aus dem JS-String aus.
    namen.map(b => '<button type="button" class="chip" data-name="' + esc(b.name) + '" ' +
      'onclick="geschenkChip(this.dataset.name)">' + esc(b.name) + '</button>').join('') +
    '</div>';
}

function budgetChipsPruefen() {
  const chips = document.getElementById('bg-chips');
  if (chips) chips.hidden = document.getElementById('bg-cat').value !== GESCHENK_CAT;
}

// Anhaengen statt ersetzen: wer schon "Buch" getippt hat, soll das nicht
// verlieren. Steht der Name bereits da, passiert nichts.
function geschenkChip(name) {
  const el = document.getElementById('bg-comment');
  if (!el) return;
  if (!trifftWortanfang(el.value, name.toLowerCase())) {
    el.value = (el.value.trim() ? el.value.trim() + ' ' : '') + name;
  }
  el.focus();
}

// Summiert ueber BEIDE Personen, anders als die Kategorie-Tabelle darueber:
// ein gemeinsam gekauftes Geschenk liegt als zwei Haelften mit sharedGroupId
// da, und "wie viel haben wir fuer Nima ausgegeben" ist eine Haushaltsfrage.
function geschenkeNachPerson(jahr) {
  const namen = (HP.birthdays || []).map(b => b.name).filter(Boolean);
  const gruppen = new Map();
  let uebrige = 0, total = 0;
  (HP.budgetEntries || []).forEach(e => {
    if (e.cat !== GESCHENK_CAT || (e.date || '').slice(0, 4) !== jahr) return;
    total += e.amount;
    const treffer = namen.find(n => trifftWortanfang(e.comment, n.toLowerCase()));
    if (treffer) gruppen.set(treffer, (gruppen.get(treffer) || 0) + e.amount);
    else uebrige += e.amount;
  });
  return { zeilen: [...gruppen].sort((a, b) => b[1] - a[1]), uebrige, total };
}

function geschenkAuswertungHtml(jahr) {
  const { zeilen, uebrige, total } = geschenkeNachPerson(jahr);
  if (!total) return '';
  return '<div class="section-label">' + BUDGET_CAT_EMOJI[GESCHENK_CAT] + ' Geschenke ' + esc(jahr) +
    ' · Haushalt ' + fmtCHF(total) + '</div>' +
    zeilen.map(([name, summe]) => '<div class="entry-row">' +
      '<span class="er-text">' + esc(name) + '</span>' +
      '<span class="er-amount">' + fmtCHF(summe) + '</span></div>').join('') +
    (uebrige ? '<div class="entry-row"><span class="er-text muted">Ohne Namen im Kommentar</span>' +
      '<span class="er-amount">' + fmtCHF(uebrige) + '</span></div>' : '');
}

function budgetStandardDatum() {
  if (budgetOffset === 0) return todayKey();
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + budgetOffset);
  return dk(d);
}

function mkBudgetEntryV2(person, cat, amount, comment, date, groupId) {
  return {
    id: 'be' + Date.now() + Math.random().toString(36).slice(2, 7),
    person, cat, amount, comment, date, sharedGroupId: groupId, updatedAt: Date.now()
  };
}

function addBudgetEntryV2() {
  const person = document.getElementById('bg-person').value;
  const cat = document.getElementById('bg-cat').value;
  const comment = kappen(document.getElementById('bg-comment').value.trim(), FELD_MAX.kommentar);
  const betrag = parseFloat((document.getElementById('bg-amount').value || '').replace(',', '.'));
  const date = document.getElementById('bg-date').value || todayKey();
  if (!betrag || betrag <= 0) { showToast('Bitte gültigen Betrag eingeben'); return; }
  if (!HP.budgetEntries) HP.budgetEntries = [];
  if (person === 'shared') {
    const total = Math.round(betrag * 100) / 100;
    const h1 = Math.round(total * 100 / 2) / 100;
    const h2 = Math.round((total - h1) * 100) / 100;
    const gid = 'bgs' + Date.now() + Math.random().toString(36).slice(2, 7);
    HP.budgetEntries.push(mkBudgetEntryV2('p1', cat, h1, comment, date, gid));
    HP.budgetEntries.push(mkBudgetEntryV2('p2', cat, h2, comment, date, gid));
  } else {
    HP.budgetEntries.push(mkBudgetEntryV2(person, cat, Math.round(betrag * 100) / 100, comment, date, null));
  }
  HP_save();
  render();
  showToast('Buchung hinzugefügt');
}

function openBudgetEntryForm(id) {
  const e = (HP.budgetEntries || []).find(x => x.id === id); if (!e) return;
  const geteilt = !!e.sharedGroupId;
  const total = geteilt
    ? HP.budgetEntries.filter(x => x.sharedGroupId === e.sharedGroupId).reduce((s, x) => s + x.amount, 0)
    : e.amount;
  showModal('<h3>Buchung bearbeiten</h3>' +
    (geteilt ? '<p class="muted small">Gemeinsame Buchung – der Betrag wird weiterhin 50/50 aufgeteilt.</p>' : '') +
    '<div class="field"><label>Kategorie</label><select id="be-cat">' +
    BUDGET_CATS.map(c => '<option value="' + esc(c) + '"' + (e.cat === c ? ' selected' : '') + '>' + BUDGET_CAT_EMOJI[c] + ' ' + esc(c) + '</option>').join('') +
    '</select></div>' +
    '<div class="field"><label>Kommentar</label><input id="be-comment" maxlength="300" value="' + esc(e.comment || '') + '"></div>' +
    '<div class="field-row">' +
    '<div class="field"><label>Betrag (CHF)</label><input id="be-amount" inputmode="decimal" value="' + total + '"></div>' +
    '<div class="field"><label>Datum</label><input type="date" id="be-date" value="' + esc(e.date) + '"></div>' +
    '</div>' +
    '<div class="modal-actions">' +
    '<button class="btn btn-danger" onclick="deleteBudgetEntryV2(\'' + esc(id) + '\')">Löschen</button>' +
    '<div style="display:flex;gap:8px">' +
    '<button class="btn btn-outline" onclick="closeModal()">Abbrechen</button>' +
    '<button class="btn btn-accent" onclick="saveBudgetEntryForm(\'' + esc(id) + '\')">Speichern</button>' +
    '</div></div>');
}

function saveBudgetEntryForm(id) {
  const e = (HP.budgetEntries || []).find(x => x.id === id); if (!e) { closeModal(); return; }
  const cat = document.getElementById('be-cat').value;
  const comment = kappen(document.getElementById('be-comment').value.trim(), FELD_MAX.kommentar);
  const date = document.getElementById('be-date').value || e.date;
  const betrag = parseFloat((document.getElementById('be-amount').value || '').replace(',', '.'));
  if (!betrag || betrag <= 0) { showToast('Bitte gültigen Betrag eingeben'); return; }
  if (e.sharedGroupId) {
    const beide = HP.budgetEntries.filter(x => x.sharedGroupId === e.sharedGroupId);
    const total = Math.round(betrag * 100) / 100;
    const h1 = Math.round(total * 100 / 2) / 100;
    const h2 = Math.round((total - h1) * 100) / 100;
    beide.forEach((x, i) => Object.assign(x, { cat, comment, date, amount: i === 0 ? h1 : h2, updatedAt: Date.now() }));
  } else {
    Object.assign(e, { cat, comment, date, amount: Math.round(betrag * 100) / 100, updatedAt: Date.now() });
  }
  HP_save(); closeModal(); render(); showToast('Buchung aktualisiert');
}

function deleteBudgetEntryV2(id) {
  const e = (HP.budgetEntries || []).find(x => x.id === id); if (!e) return;
  const weg = e.sharedGroupId
    ? HP.budgetEntries.filter(x => x.sharedGroupId === e.sharedGroupId)
    : [e];
  weg.forEach(x => markDeleted('budgetEntries', x.id));
  const ids = new Set(weg.map(x => x.id));
  HP.budgetEntries = HP.budgetEntries.filter(x => !ids.has(x.id));
  HP_save(); closeModal(); render();
  showUndoToast(weg.length > 1 ? 'Gemeinsame Buchung gelöscht' : 'Buchung gelöscht', () => {
    weg.forEach(x => { unmarkDeleted('budgetEntries', x.id); x.updatedAt = Date.now(); HP.budgetEntries.push(x); });
    HP_save(); render(); showToast('Wiederhergestellt');
  });
}

function openBudgetLimits() {
  const person = budgetPerson;
  showModal('<h3>Monatslimits – ' + esc(HP.names[person]) + '</h3>' +
    '<p class="muted small">Änderungen wirken sofort, Angaben in CHF.</p>' +
    BUDGET_CATS.map(cat =>
      '<div class="field"><label>' + BUDGET_CAT_EMOJI[cat] + ' ' + esc(cat) + '</label>' +
      '<input type="number" step="1" min="0" value="' + budgetLimit(person, cat) + '" ' +
      'oninput="setBudgetLimit(\'' + person + '\',\'' + esc(cat) + '\',this.value)"></div>').join('') +
    '<div class="modal-actions"><span></span><button class="btn btn-accent" onclick="closeModal()">Fertig</button></div>');
}

function setBudgetLimit(person, cat, val) {
  if (!HP.budgetLimits) HP.budgetLimits = { p1: {}, p2: {} };
  if (!HP.budgetLimits[person]) HP.budgetLimits[person] = {};
  HP.budgetLimits[person][cat] = parseFloat(val) || 0;
  HP_save();
}

function openBudgetJahr() {
  const person = budgetPerson;
  const jahr = currentMonthKey(budgetOffset).split('-')[0];
  const kurz = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  let jahrIst = 0, jahrSoll = 0;
  const zeilen = BUDGET_CATS.map(cat => {
    const limit = budgetLimit(person, cat), soll = limit * 12;
    let ist = 0;
    const zellen = kurz.map((_, mi) => {
      const mkey = jahr + '-' + String(mi + 1).padStart(2, '0');
      const summe = (HP.budgetEntries || [])
        .filter(e => e.person === person && e.cat === cat && monthKey(e.date) === mkey)
        .reduce((s, e) => s + e.amount, 0);
      ist += summe;
      return '<td>' + (summe ? fmtCHF(summe) : '–') + '</td>';
    }).join('');
    jahrIst += ist; jahrSoll += soll;
    return '<tr><td class="ycat">' + BUDGET_CAT_EMOJI[cat] + ' ' + esc(cat) + '</td>' + zellen +
      '<td class="ysum">' + fmtCHF(ist) + '</td><td>' + (soll ? fmtCHF(soll) : '–') + '</td></tr>';
  }).join('');
  showModal('<h3>Jahresstatistik ' + jahr + ' – ' + esc(HP.names[person]) + '</h3>' +
    '<div class="table-wrap"><table class="ytable">' +
    '<tr><th>Kategorie</th>' + kurz.map(m => '<th>' + m + '</th>').join('') + '<th>Ist</th><th>Soll</th></tr>' +
    zeilen +
    '<tr class="ytotal"><td>Total</td>' + kurz.map(() => '<td></td>').join('') +
    '<td>' + fmtCHF(jahrIst) + '</td><td>' + (jahrSoll ? fmtCHF(jahrSoll) : '–') + '</td></tr>' +
    '</table></div>' +
    geschenkAuswertungHtml(jahr) +
    '<div class="modal-actions"><span></span><button class="btn btn-outline" onclick="closeModal()">Schliessen</button></div>', true);
}
