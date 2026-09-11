// ═══════════════════════════════════════════════
// HEIMPLANER V2 – Heute
// Startansicht: fasst zusammen, was genau heute ansteht. Zeigt nichts an,
// was nicht woanders bearbeitet wird - jede Kachel führt in ihre Ansicht.
// Aufbau nach Mockup: Datumszeile, Titel, dann Abschnitte (Termine,
// Aufgaben, ...) als Zeilen mit Haarlinie, unten zwei Kennzahl-Kacheln.
// ═══════════════════════════════════════════════

function begruessung() {
  const h = new Date().getHours();
  return h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend';
}

function renderHeute() {
  const key = todayKey();
  const ich = loggedInPersonKey();
  const eintraege = dayEntries(key);
  const termine = eintraege.filter(i => i.kind === 'event');
  const aufgaben = eintraege.filter(i => i.kind === 'task');
  const erledigt = aufgaben.filter(i => getStatus(i.data.id, key) === 'done').length +
    termine.filter(i => getEventStatus(i.data.id) === 'done').length;

  const meals = HP.meals[key] || {};
  const faellig = (HP.events || []).filter(e => e.chore && e.date <= key)
    .sort((a, b) => a.date.localeCompare(b.date));
  const bdaysHeute = birthdaysOn(key);
  const naechsterBday = kommendeGeburtstage(60)[0];
  const offeneArtikel = (HP.shop || []).filter(i => !i.bought).length;

  const mk = currentMonthKey(0);
  const ausgaben = budgetEntriesFor(ich, mk).reduce((s, e) => s + e.amount, 0);
  const limit = BUDGET_CATS.reduce((s, c) => s + budgetLimit(ich, c), 0);

  document.getElementById('view-root').innerHTML =
    '<div class="list-page">' +
    '<div class="page-date">' + esc(dateLabel(key)) + '</div>' +
    viewHead(begruessung() + ', ' + HP.names[ich],
      '<button class="btn btn-ghost btn-sm" onclick="openAddSheet(\'' + key + '\')"><span class="icon i-plus"></span> Neu</button>') +

    (bdaysHeute.length
      ? bdaysHeute.map(b => '<div class="highlight-row" onclick="switchView(\'geburtstage\')">' +
        '<span class="hl-avatar">🎂</span><div class="hl-text"><b>' + esc(b.name) + '</b>' +
        '<span>hat heute Geburtstag' + (b.year ? ' · wird ' + (new Date().getFullYear() - parseInt(b.year)) : '') + '</span></div></div>').join('')
      : '') +

    sektion('Termine', termine.length ? termine.map(i => eventRowHtml(i.data)).join('')
      : '<div class="leer-zeile">Keine Termine heute</div>') +

    sektion('Aufgaben' + (aufgaben.length ? ' · ' + erledigt + ' von ' + eintraege.length + ' erledigt' : ''),
      aufgaben.length ? aufgaben.map(i => taskRowHtml(i.data, key)).join('')
        : '<div class="leer-zeile">Nichts geplant – geniess den Tag</div>') +

    (faellig.length ? sektion('Haushalt fällig', faellig.slice(0, 4).map(choreRowHtml).join('')) : '') +

    sektion('Menü heute',
      MEAL_SLOTS.map(slot => {
        const m = meals[slot];
        return '<div class="ent-row" onclick="openMealPicker(\'' + key + '\',\'' + slot + '\')">' +
          '<span class="ent-time wide">' + slot + '</span>' +
          '<span class="ent-name' + (m ? '' : ' muted') + '">' + (m ? esc(m.emoji || '🍽️') + ' ' + esc(m.name) : 'eintragen') + '</span>' +
          '</div>';
      }).join('')) +

    '<div class="stat-tiles">' +
    '<button class="stat-tile" onclick="switchView(\'einkaufsliste\')">' +
    '<span class="icon i-cart"></span>' +
    '<span class="st-text">' + (offeneArtikel ? offeneArtikel + ' Artikel fehlen' : 'Liste ist leer') + '</span></button>' +

    '<button class="stat-tile" onclick="switchView(\'budget\')">' +
    '<span class="icon i-money"></span>' +
    '<span class="st-text">' + fmtCHF(ausgaben) + (limit > 0 ? ' von ' + fmtCHF(limit) : '') + ' im ' + esc(MONTH_NAMES[new Date().getMonth()]) + '</span></button>' +

    (naechsterBday && !bdaysHeute.length
      ? '<button class="stat-tile" onclick="switchView(\'geburtstage\')">' +
      '<span class="icon i-cake"></span>' +
      '<span class="st-text">' + esc(naechsterBday.name) + ' in ' + naechsterBday.tage + ' Tag' + (naechsterBday.tage === 1 ? '' : 'en') + '</span></button>'
      : '') +

    (faellig.length ? '' : '<button class="stat-tile" onclick="switchView(\'haushalt\')">' +
      '<span class="icon i-home-2"></span><span class="st-text">Haushalt ist aufgeräumt</span></button>') +
    '</div>' +
    '</div>';
}

// Abschnitt mit kleiner Überschrift - das Grundmuster aller Listen-Ansichten.
function sektion(titel, inhalt) {
  return '<div class="section-label">' + esc(titel) + '</div>' + inhalt;
}
