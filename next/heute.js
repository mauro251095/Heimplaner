// ═══════════════════════════════════════════════
// HEIMPLANER V2 – Heute
// Startansicht: fasst zusammen, was genau heute ansteht. Zeigt nichts an,
// was nicht woanders bearbeitet wird - jede Kachel führt in ihre Ansicht.
// ═══════════════════════════════════════════════

function begruessung() {
  const h = new Date().getHours();
  return h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend';
}

function renderHeute() {
  const key = todayKey();
  const ich = loggedInPersonKey();
  const eintraege = dayEntries(key);
  const tasksHeute = eintraege.filter(i => i.kind === 'task');
  const erledigt = tasksHeute.filter(i => getStatus(i.data.id, key) === 'done').length +
    eintraege.filter(i => i.kind === 'event' && getEventStatus(i.data.id) === 'done').length;
  const gesamt = eintraege.length;
  const pct = gesamt ? Math.round(erledigt / gesamt * 100) : 0;

  const meals = HP.meals[key] || {};
  const mealCards = ['Frühstück', 'Mittag', 'Abend'].map(slot => {
    const m = meals[slot];
    return '<button class="slot-card' + (m ? ' filled' : '') + '" onclick="openMealPicker(\'' + key + '\',\'' + slot + '\')">' +
      '<span class="slot-label">' + slot + '</span>' +
      '<span class="slot-value">' + (m ? esc(m.emoji || '🍽️') + ' ' + esc(m.name) : '+ eintragen') + '</span></button>';
  }).join('');

  const faellig = (HP.events || []).filter(e => e.chore && e.date <= key)
    .sort((a, b) => a.date.localeCompare(b.date));
  const bdaysHeute = birthdaysOn(key);
  const bdaysBald = kommendeGeburtstage(14).filter(b => b.tage > 0).slice(0, 3);
  const offeneArtikel = (HP.shop || []).filter(i => !i.bought).length;

  const mk = currentMonthKey(0);
  const ausgaben = budgetEntriesFor(ich, mk).reduce((s, e) => s + e.amount, 0);
  const limit = BUDGET_CATS.reduce((s, c) => s + budgetLimit(ich, c), 0);
  const budgetPct = limit > 0 ? Math.round(ausgaben / limit * 100) : 0;

  document.getElementById('view-root').innerHTML =
    '<div class="hero">' +
    '<div class="hero-greet">' + begruessung() + ', ' + esc(HP.names[ich]) + '</div>' +
    '<div class="hero-date">' + esc(dateLabel(key)) + '</div>' +
    '</div>' +

    '<div class="card"><div class="card-head"><span class="card-title">Heute anstehend</span>' +
    '<span class="card-note">' + erledigt + ' / ' + gesamt + ' erledigt</span></div>' +
    '<div class="bar"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
    (dayEntriesHtml(key) || emptyState('i-check', 'Nichts geplant – geniess den Tag.')) +
    '<button class="btn btn-outline btn-block" onclick="openAddSheet(\'' + key + '\')">+ Neu</button></div>' +

    '<div class="grid cols-2">' +
    '<div class="card"><div class="card-head"><span class="card-title">Menü heute</span>' +
    '<button class="btn btn-outline btn-sm" onclick="switchView(\'menueplan\')">Woche</button></div>' +
    '<div class="slot-row col">' + mealCards + '</div></div>' +

    '<div class="card"><div class="card-head"><span class="card-title">Haushalt</span>' +
    '<button class="btn btn-outline btn-sm" onclick="switchView(\'haushalt\')">Alle</button></div>' +
    (faellig.length ? faellig.slice(0, 4).map(choreRowHtml).join('')
      : emptyState('i-home-2', 'Nichts fällig.')) + '</div>' +
    '</div>' +

    '<div class="grid cols-2">' +
    '<button class="card stat-card" onclick="switchView(\'einkaufsliste\')">' +
    '<span class="icon i-cart"></span>' +
    '<span class="stat-num">' + offeneArtikel + '</span>' +
    '<span class="stat-lbl">offene Artikel auf der Einkaufsliste</span></button>' +

    '<button class="card stat-card" onclick="switchView(\'budget\')">' +
    '<span class="icon i-money"></span>' +
    '<span class="stat-num">' + fmtCHF(ausgaben) + '</span>' +
    '<span class="stat-lbl">' + (limit > 0
      ? 'von ' + fmtCHF(limit) + ' diesen Monat (' + budgetPct + '%)'
      : 'diesen Monat ausgegeben') + '</span>' +
    (limit > 0 ? '<span class="bar"><span class="bar-fill' + (budgetPct >= 90 ? ' warn' : '') + '" style="width:' + Math.min(budgetPct, 100) + '%"></span></span>' : '') +
    '</button>' +
    '</div>' +

    (bdaysHeute.length || bdaysBald.length
      ? '<div class="card"><div class="card-head"><span class="card-title">Geburtstage</span>' +
      '<button class="btn btn-outline btn-sm" onclick="switchView(\'geburtstage\')">Alle</button></div>' +
      bdaysHeute.map(b => '<div class="list-row"><div class="meta"><div class="name">🎂 ' + esc(b.name) + '</div>' +
        '<div class="sub accent">Heute!' + (b.year ? ' Wird ' + (new Date().getFullYear() - parseInt(b.year)) : '') + '</div></div></div>').join('') +
      bdaysBald.map(b => '<div class="list-row"><div class="meta"><div class="name">🎂 ' + esc(b.name) + '</div>' +
        '<div class="sub">in ' + b.tage + ' Tag' + (b.tage === 1 ? '' : 'en') + '</div></div></div>').join('') +
      '</div>'
      : '');
}
