// ═══════════════════════════════════════════════
// HEIMPLANER V2 – Globale Suche
//
// Eigene Daten hält diese Ansicht keine: sie liest quer durch HP und zeigt
// jeden Treffer in der Zeilenform seiner Heimat-Ansicht, geöffnet wird das
// dort übliche Formular. Eine zweite Darstellung derselben Sache würde über
// die Zeit auseinanderlaufen.
//
// Verglichen wird mit trifftWortanfang() aus app.js - derselben Regel, die
// schon die Zutatensuche und die Geschenk-Zuordnung im Budget benutzen.
// ═══════════════════════════════════════════════

let sucheQuery = '';
const SUCHE_PRO_GRUPPE = 6;

// Nur die Ergebnisse neu zeichnen, nicht die ganze Ansicht: sonst verliert
// das Suchfeld bei jedem Tastendruck den Fokus (wie in der Rezeptsuche).
function sucheEingabe(v) {
  sucheQuery = v;
  const ziel = document.getElementById('su-results');
  if (ziel) ziel.innerHTML = sucheErgebnisseHtml();
}

function renderSuche() {
  document.getElementById('view-root').innerHTML =
    '<div class="list-page">' +
    viewHead('Suche') +
    '<div class="searchbar"><span class="icon i-search"></span>' +
    '<input id="su-input" maxlength="60" placeholder="Aufgabe, Termin, Notiz, Rezept, Artikel …" ' +
    'value="' + esc(sucheQuery) + '" oninput="sucheEingabe(this.value)"></div>' +
    '<div id="su-results">' + sucheErgebnisseHtml() + '</div>' +
    '</div>';
  // Nur beim Betreten mit leerem Feld: heimplaner-sync.js ruft nach jedem
  // Merge render() auf, und ein Fokus bei jedem Sync liesse auf dem Handy
  // mitten im Lesen die Tastatur aufspringen.
  if (!sucheQuery) document.getElementById('su-input')?.focus();
}

// Liefert alle Gruppen für eine Anfrage. "ungenau" lockert von "Wortanfang"
// auf "enthält" - siehe sucheErgebnisseHtml().
function sucheQuellen(q, ungenau) {
  const passt = t => !!t && (ungenau ? String(t).toLowerCase().includes(q) : trifftWortanfang(t, q));
  const zeile = (tile, name, meta, onclick) => ({ tile, name, meta, onclick });
  const gruppen = [];

  const aufgaben = [];
  ['p1', 'p2', 'shared'].forEach(who =>
    (HP.tasks[who] || []).forEach(t => {
      if (passt(t.name)) aufgaben.push(zeile(t.emoji || '⭐', t.name, whoLabelV2(who),
        "openTaskForm('" + esc(t.id) + "')"));
    }));
  gruppen.push({ label: 'Aufgaben', view: 'haushalt', zeilen: aufgaben });

  gruppen.push({
    label: 'Termine', view: 'planer',
    zeilen: (HP.events || []).filter(e => passt(e.name))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .map(e => zeile(e.emoji || '📅', e.name,
        dateLabel(e.date, { day: 'numeric', month: 'short', year: 'numeric' }) + (e.time ? ' · ' + e.time : ''),
        "openEventForm('" + esc(e.id) + "')"))
  });

  gruppen.push({
    label: 'Pinnwand', view: 'pinnwand',
    zeilen: (HP.notes || []).filter(n => passt(n.title) || passt(n.body))
      .map(n => zeile('📌', n.title || n.body.split('\n')[0] || 'Notiz',
        n.title ? n.body.split('\n')[0] : '',
        "openNoteForm('" + esc(n.id) + "')"))
  });

  gruppen.push({
    label: 'Rezepte', view: 'rezepte',
    zeilen: allRecipes().filter(r =>
      passt(r.name) || (r.tags || []).some(passt) || (r.ing || []).some(i => passt(i.n)))
      .map(r => zeile(r.emoji || '🍽️', r.name, (r.tags || []).slice(0, 2).join(' · '),
        "openRezeptDetail('" + esc(r.id) + "')"))
  });

  // Favoriten stehen mit dabei: wer einen Artikel sucht, den er regelmässig
  // kauft, will wissen, ob er gerade auf der Liste steht ODER hinterlegt ist.
  const artikel = (HP.shop || []).filter(i => passt(i.name))
    .map(i => zeile('🛒', i.name, i.bought ? 'erledigt' : [i.qty, i.unit].filter(Boolean).join(' ') || i.cat,
      "switchView('einkaufsliste')"));
  (HP.savedShopItems || []).filter(i => passt(i.name))
    .forEach(i => artikel.push(zeile('⭐', i.name, 'Favorit', "switchView('einkaufsliste')")));
  gruppen.push({ label: 'Einkaufsliste', view: 'einkaufsliste', zeilen: artikel });

  const menue = [];
  Object.keys(HP.meals || {}).sort().reverse().forEach(key =>
    MEAL_SLOTS.forEach(slot => {
      const m = (HP.meals[key] || {})[slot];
      if (m && passt(m.name)) menue.push(zeile(m.emoji || '🍽️', m.name,
        slot + ' · ' + dateLabel(key, { day: 'numeric', month: 'short' }),
        "openMealPicker('" + esc(key) + "','" + esc(slot) + "')"));
    }));
  gruppen.push({ label: 'Menüplan', view: 'menueplan', zeilen: menue });

  gruppen.push({
    label: 'Budget', view: 'budget',
    zeilen: (HP.budgetEntries || []).filter(e => passt(e.comment) || passt(e.cat))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .map(e => zeile(BUDGET_CAT_EMOJI[e.cat] || '💰', e.comment || e.cat,
        dateLabel(e.date, { day: 'numeric', month: 'short' }) + ' · ' + fmtCHF(e.amount),
        "openBudgetEntryForm('" + esc(e.id) + "')"))
  });

  gruppen.push({
    label: 'Geburtstage', view: 'geburtstage',
    zeilen: (HP.birthdays || []).filter(b => passt(b.name))
      .map(b => zeile('🎂', b.name, bdayDatum(b), "openBirthdayForm('" + esc(b.id) + "')"))
  });

  return gruppen.filter(g => g.zeilen.length);
}

function sucheErgebnisseHtml() {
  const q = sucheQuery.toLowerCase().trim();
  if (!q) return emptyState('i-search', 'Tippe, wonach du suchst.');

  // Erst am Wortanfang, damit "Lauch" nicht jede "Knoblauchzehe" findet.
  // Deutsche Komposita fallen dabei durch, deshalb dieselbe Lockerung wie in
  // der Zutatensuche: "enthält" nur dann, wenn sonst gar nichts käme - und
  // sichtbar angesagt, sonst wirkt das Ergebnis willkürlich.
  let gruppen = sucheQuellen(q, false);
  let ungenau = false;
  if (!gruppen.length) {
    gruppen = sucheQuellen(q, true);
    ungenau = gruppen.length > 0;
  }
  if (!gruppen.length) return emptyState('i-search', 'Nichts gefunden zu „' + q + '“.');

  return (ungenau
    ? '<div class="section-label">Keine genauen Treffer – Ergebnisse, die „' + esc(q) + '“ enthalten</div>'
    : '') +
    gruppen.map(g =>
      '<div class="section-label">' + esc(g.label) + '</div>' +
      g.zeilen.slice(0, SUCHE_PRO_GRUPPE).map(z =>
        '<div class="flat-row" onclick="' + z.onclick + '">' +
        '<span class="tile">' + esc(z.tile) + '</span>' +
        '<span class="fr-name">' + esc(z.name) + '</span>' +
        (z.meta ? '<span class="fr-meta">' + esc(z.meta) + '</span>' : '') +
        '</div>').join('') +
      (g.zeilen.length > SUCHE_PRO_GRUPPE
        ? '<button class="linkbtn" onclick="switchView(\'' + g.view + '\')">+' +
          (g.zeilen.length - SUCHE_PRO_GRUPPE) + ' weitere in ' + esc(g.label) + '</button>'
        : '')).join('');
}
