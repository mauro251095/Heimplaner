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

function renderBudgetView() {
  if (!budgetPerson) budgetPerson = loggedInPersonKey();
  const person = budgetPerson;
  const mk = currentMonthKey(budgetOffset);
  const eintraege = budgetEntriesFor(person, mk);

  let istGesamt = 0, limitGesamt = 0;
  const karten = BUDGET_CATS.map(cat => {
    const catEintraege = eintraege.filter(e => e.cat === cat)
      .sort((a, b) => b.date.localeCompare(a.date) || (b.updatedAt || 0) - (a.updatedAt || 0));
    const ist = catEintraege.reduce((s, e) => s + e.amount, 0);
    const limit = budgetLimit(person, cat);
    istGesamt += ist; limitGesamt += limit;
    const anteil = limit > 0 ? ist / limit : 0;
    const pct = Math.round(anteil * 100);
    const warn = limit > 0 && anteil >= BUDGET_WARN;
    return '<div class="card budget-card" onclick="this.classList.toggle(\'open\')">' +
      '<div class="card-head"><span class="card-title">' + BUDGET_CAT_EMOJI[cat] + ' ' + esc(cat) + '</span>' +
      '<span class="card-note">' + fmtCHF(ist) + ' / ' + (limit > 0 ? fmtCHF(limit) : '–') + (limit > 0 ? ' · ' + pct + '%' : '') + '</span></div>' +
      '<div class="bar"><div class="bar-fill' + (warn ? ' warn' : '') + '" style="width:' + Math.min(pct, 100) + '%"></div></div>' +
      '<div class="budget-entries">' +
      (catEintraege.length
        ? catEintraege.map(e => '<div class="entry-row">' +
          '<span class="er-date">' + e.date.slice(8, 10) + '.' + e.date.slice(5, 7) + '</span>' +
          '<span class="er-text">' + esc(e.comment || '—') + (e.sharedGroupId ? ' <span class="er-tag">geteilt</span>' : '') + '</span>' +
          '<span class="er-amount">' + fmtCHF(e.amount) + '</span>' +
          '<button class="rowbtn" onclick="event.stopPropagation();openBudgetEntryForm(\'' + esc(e.id) + '\')"><span class="icon i-pencil"></span></button>' +
          '</div>').join('')
        : '<div class="muted small">Keine Buchungen</div>') +
      '</div></div>';
  }).join('');

  const pctGesamt = limitGesamt > 0 ? Math.round(istGesamt / limitGesamt * 100) : 0;

  document.getElementById('view-root').innerHTML =
    viewHead('Budget', segHtml([['p1', HP.names.p1], ['p2', HP.names.p2]], person, 'setBudgetPerson')) +
    navRow('budgetMonat(-1)', monthLabel(mk), 'budgetMonat(1)',
      '<button class="btn btn-outline btn-sm" onclick="openBudgetLimits()">Limits</button>' +
      '<button class="btn btn-outline btn-sm" onclick="openBudgetJahr()">Jahr</button>') +

    '<div class="card addbar">' +
    '<select id="bg-person">' + whoOptions(person) + '</select>' +
    '<select id="bg-cat">' + BUDGET_CATS.map(c => '<option value="' + esc(c) + '">' + BUDGET_CAT_EMOJI[c] + ' ' + esc(c) + '</option>').join('') + '</select>' +
    '<input id="bg-amount" class="w-xs" inputmode="decimal" placeholder="CHF" onkeydown="if(event.key===\'Enter\')addBudgetEntryV2()">' +
    '<input id="bg-comment" placeholder="Kommentar…" maxlength="300" onkeydown="if(event.key===\'Enter\')addBudgetEntryV2()">' +
    '<input id="bg-date" type="date" class="w-md" value="' + budgetStandardDatum() + '">' +
    '<button class="btn btn-accent" onclick="addBudgetEntryV2()"><span class="icon i-plus"></span> Buchen</button>' +
    '</div>' +

    '<div class="summary-card card">' +
    '<div><span class="sum-num">' + fmtCHF(istGesamt) + '</span>' +
    '<span class="sum-lbl"> von ' + (limitGesamt > 0 ? fmtCHF(limitGesamt) : '– ') + ' im ' + esc(monthLabel(mk)) + '</span></div>' +
    (limitGesamt > 0 ? '<div class="bar"><div class="bar-fill' + (pctGesamt >= BUDGET_WARN * 100 ? ' warn' : '') + '" style="width:' + Math.min(pctGesamt, 100) + '%"></div></div>' : '') +
    '</div>' +
    karten;
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
    '<div class="modal-actions"><span></span><button class="btn btn-outline" onclick="closeModal()">Schliessen</button></div>', true);
}
