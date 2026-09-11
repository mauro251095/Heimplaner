// ═══════════════════════════════════════════════
// HEIMPLANER V2 – Einkaufsliste
// Artikel: HP.shop[] = {id,name,qty,unit,cat,bought,taskName,updatedAt}
// Favoriten: HP.savedShopItems[] (Vorlagen ohne bought-Flag)
// Kategorien/Emoji und die Kategorie-Erkennung (guessCat) kommen aus
// heimplaner-data.js und bleiben unverändert.
// ═══════════════════════════════════════════════

let einkaufFormOffen = false;

function toggleEinkaufForm() {
  einkaufFormOffen = !einkaufFormOffen;
  renderEinkauf();
  if (einkaufFormOffen) document.getElementById('sh-name')?.focus();
}

function renderEinkauf() {
  const alle = HP.shop || [];
  const offen = alle.filter(i => !i.bought);
  const gekauft = alle.filter(i => i.bought);
  const favNamen = new Set((HP.savedShopItems || []).map(f => f.name.toLowerCase()));

  const gruppen = CATS.map(cat => {
    const items = offen.filter(i => (i.cat || 'Sonstiges') === cat);
    if (!items.length) return '';
    return '<div class="section-label">' + CAT_EMOJI[cat] + ' ' + esc(cat) + ' · ' + items.length + '</div>' +
      items.map(i => shopRowHtml(i, favNamen)).join('');
  }).join('');

  document.getElementById('view-root').innerHTML =
    '<div class="list-page">' +
    viewHead('Einkaufsliste',
      '<span class="head-count">' + offen.length + ' offen</span>' +
      '<button class="btn btn-ghost btn-sm" onclick="openFavoriten()"><span class="icon i-star"></span> Favoriten</button>') +

    // Nach Mockup nur eine ruhige Zeile; die Felder klappen erst auf, wenn
    // wirklich etwas hinzukommt. Das ist der häufigere Zustand: lesen und
    // abhaken, nicht erfassen.
    (einkaufFormOffen
      ? '<div class="inline-form">' +
        '<input id="sh-name" placeholder="Artikel" maxlength="60" onkeydown="if(event.key===\'Enter\')addShopItemV2()">' +
        '<div class="if-row">' +
        '<input id="sh-qty" placeholder="Menge" maxlength="12" onkeydown="if(event.key===\'Enter\')addShopItemV2()">' +
        '<input id="sh-unit" placeholder="Einheit" maxlength="10" onkeydown="if(event.key===\'Enter\')addShopItemV2()">' +
        '<select id="sh-cat"><option value="">Kategorie automatisch</option>' +
        CATS.map(c => '<option value="' + esc(c) + '">' + CAT_EMOJI[c] + ' ' + esc(c) + '</option>').join('') + '</select>' +
        '</div>' +
        '<div class="if-actions">' +
        '<button class="btn btn-outline btn-sm" onclick="toggleEinkaufForm()">Abbrechen</button>' +
        '<button class="btn btn-accent btn-sm" onclick="addShopItemV2()">Hinzufügen</button>' +
        '</div></div>'
      : '<button class="addrow" onclick="toggleEinkaufForm()">' +
        '<span class="icon i-plus"></span> Artikel hinzufügen</button>') +

    (offen.length ? gruppen : emptyState('i-cart', 'Die Liste ist leer.')) +
    (gekauft.length
      ? '<div class="section-label with-action">Erledigt · ' + gekauft.length +
      '<button class="linkbtn" onclick="aufraeumenEinkauf()">Aufräumen</button></div>' +
      '<div class="done-group">' + gekauft.map(i => shopRowHtml(i, favNamen)).join('') + '</div>'
      : '') +
    '</div>';
}

function shopRowHtml(i, favNamen) {
  const menge = [i.qty, i.unit].filter(Boolean).join(' ');
  const istFavorit = favNamen && favNamen.has(i.name.toLowerCase());
  return '<div class="ent-row' + (i.bought ? ' is-done' : '') + '" onclick="openShopItemForm(\'' + esc(i.id) + '\')">' +
    '<button class="check sm' + (i.bought ? ' done' : '') + '" onclick="event.stopPropagation();toggleShopItem(\'' + esc(i.id) + '\')">' +
    (i.bought ? '<span class="icon i-check"></span>' : '') + '</button>' +
    '<span class="ent-name">' + esc(i.name) +
    (i.taskName ? '<small>' + esc(i.taskName) + '</small>' : '') + '</span>' +
    (menge ? '<span class="fr-meta">' + esc(menge) + '</span>' : '') +
    '<button class="rowbtn' + (istFavorit ? ' on' : '') + '" onclick="event.stopPropagation();alsFavoritSpeichern(\'' + esc(i.id) + '\')" ' +
    'title="' + (istFavorit ? 'Ist ein Favorit' : 'Als Favorit speichern') + '"><span class="icon i-star"></span></button>' +
    '</div>';
}

function addShopItemV2(name, qty, unit, cat, taskName) {
  const n = kappen((name !== undefined ? name : document.getElementById('sh-name').value).trim(), FELD_MAX.name);
  if (!n) { showToast('Bitte Artikel eingeben'); return; }
  const q = (qty !== undefined ? qty : document.getElementById('sh-qty').value).trim();
  const u = (unit !== undefined ? unit : document.getElementById('sh-unit').value).trim();
  const c = (cat !== undefined ? cat : document.getElementById('sh-cat').value) || guessCat(n);
  if (!HP.shop) HP.shop = [];
  // Gleicher Artikel schon offen auf der Liste: Menge ergänzen statt eine
  // zweite Zeile anzulegen - beim Einkaufen will man eine Position sehen.
  const vorhanden = HP.shop.find(i => i.name.toLowerCase() === n.toLowerCase() && !i.bought);
  if (vorhanden) {
    if (q) vorhanden.qty = vorhanden.qty ? vorhanden.qty + ' + ' + q : q;
    vorhanden.updatedAt = Date.now();
    HP_save(); render(); showToast(n + ' – Menge ergänzt');
    return;
  }
  HP.shop.push({
    id: 'sh' + Date.now() + Math.random().toString(36).slice(2, 6),
    name: n, qty: q, unit: u, cat: c, bought: false,
    taskId: null, taskName: taskName || null, updatedAt: Date.now()
  });
  HP_save();
  render();
  document.getElementById('sh-name')?.focus();
  showToast(n + ' hinzugefügt');
}

function toggleShopItem(id) {
  const i = (HP.shop || []).find(x => x.id === id); if (!i) return;
  i.bought = !i.bought;
  i.updatedAt = Date.now();
  HP_save();
  render();
}

function openShopItemForm(id) {
  const i = (HP.shop || []).find(x => x.id === id); if (!i) return;
  showModal('<h3>Artikel bearbeiten</h3>' +
    '<div class="field"><label>Name</label><input id="si-name" maxlength="60" value="' + esc(i.name) + '"></div>' +
    '<div class="field-row">' +
    '<div class="field"><label>Menge</label><input id="si-qty" maxlength="12" value="' + esc(i.qty || '') + '"></div>' +
    '<div class="field"><label>Einheit</label><input id="si-unit" maxlength="10" value="' + esc(i.unit || '') + '"></div>' +
    '</div>' +
    '<div class="field"><label>Kategorie</label><select id="si-cat">' +
    CATS.map(c => '<option value="' + esc(c) + '"' + ((i.cat || 'Sonstiges') === c ? ' selected' : '') + '>' + CAT_EMOJI[c] + ' ' + esc(c) + '</option>').join('') +
    '</select></div>' +
    '<div class="modal-actions">' +
    '<button class="btn btn-danger" onclick="deleteShopItemV2(\'' + esc(id) + '\')">Löschen</button>' +
    '<div style="display:flex;gap:8px">' +
    '<button class="btn btn-outline" onclick="closeModal()">Abbrechen</button>' +
    '<button class="btn btn-accent" onclick="saveShopItemForm(\'' + esc(id) + '\')">Speichern</button>' +
    '</div></div>');
}

function saveShopItemForm(id) {
  const i = (HP.shop || []).find(x => x.id === id); if (!i) { closeModal(); return; }
  const name = kappen(document.getElementById('si-name').value.trim(), FELD_MAX.name);
  if (!name) { showToast('Bitte Name eingeben'); return; }
  Object.assign(i, {
    name,
    qty: document.getElementById('si-qty').value.trim(),
    unit: document.getElementById('si-unit').value.trim(),
    cat: document.getElementById('si-cat').value,
    updatedAt: Date.now()
  });
  HP_save(); closeModal(); render(); showToast('Gespeichert');
}

function deleteShopItemV2(id) {
  const weg = (HP.shop || []).find(x => x.id === id); if (!weg) return;
  markDeleted('shop', id);
  HP.shop = HP.shop.filter(x => x.id !== id);
  HP_save(); closeModal(); render();
  showUndoToast('Artikel gelöscht', () => {
    unmarkDeleted('shop', id);
    weg.updatedAt = Date.now();
    HP.shop.push(weg);
    HP_save(); render(); showToast('Wiederhergestellt');
  });
}

function aufraeumenEinkauf() {
  const weg = (HP.shop || []).filter(i => i.bought);
  if (!weg.length) return;
  weg.forEach(i => markDeleted('shop', i.id));
  HP.shop = HP.shop.filter(i => !i.bought);
  HP_save(); render();
  showUndoToast(weg.length + ' Artikel entfernt', () => {
    weg.forEach(i => { unmarkDeleted('shop', i.id); i.updatedAt = Date.now(); HP.shop.push(i); });
    HP_save(); render(); showToast(weg.length + ' wiederhergestellt');
  });
}

// ── Favoriten ─────────────────────────────────
function alsFavoritSpeichern(id) {
  const i = (HP.shop || []).find(x => x.id === id); if (!i) return;
  if (!HP.savedShopItems) HP.savedShopItems = [];
  const vorhanden = HP.savedShopItems.find(s => s.name.toLowerCase() === i.name.toLowerCase());
  if (vorhanden) {
    Object.assign(vorhanden, { qty: i.qty, unit: i.unit, cat: i.cat, updatedAt: Date.now() });
  } else {
    HP.savedShopItems.push({
      id: 'ssi' + Date.now() + Math.random().toString(36).slice(2, 6),
      name: i.name, qty: i.qty, unit: i.unit, cat: i.cat, updatedAt: Date.now()
    });
  }
  HP_save();
  showToast('⭐ ' + i.name + ' als Favorit gespeichert');
}

function openFavoriten() {
  const favs = HP.savedShopItems || [];
  showModal('<h3>⭐ Favoriten</h3>' +
    (favs.length
      ? favs.slice().sort((a, b) => a.name.localeCompare(b.name)).map(f =>
        '<div class="list-row">' +
        '<div class="meta"><div class="name">' + esc(f.name) + '</div>' +
        '<div class="sub">' + esc([f.qty, f.unit].filter(Boolean).join(' ')) + (f.cat ? ' · ' + esc(f.cat) : '') + '</div></div>' +
        '<button class="btn btn-accent btn-sm" onclick="favoritAufListe(\'' + esc(f.id) + '\')">+ Liste</button>' +
        '<button class="rowbtn" onclick="favoritLoeschen(\'' + esc(f.id) + '\')" title="Favorit löschen"><span class="icon i-x"></span></button>' +
        '</div>').join('')
      : '<p class="muted">Noch keine Favoriten. Auf der Liste beim Artikel auf ⭐ tippen.</p>') +
    '<div class="modal-actions"><span></span><button class="btn btn-outline" onclick="closeModal()">Schliessen</button></div>');
}

function favoritAufListe(id) {
  const f = (HP.savedShopItems || []).find(x => x.id === id); if (!f) return;
  addShopItemV2(f.name, f.qty || '', f.unit || '', f.cat || guessCat(f.name));
}

function favoritLoeschen(id) {
  const weg = (HP.savedShopItems || []).find(x => x.id === id); if (!weg) return;
  markDeleted('savedShopItems', id);
  HP.savedShopItems = HP.savedShopItems.filter(x => x.id !== id);
  HP_save(); openFavoriten();
  showUndoToast('Favorit gelöscht', () => {
    unmarkDeleted('savedShopItems', id);
    weg.updatedAt = Date.now();
    HP.savedShopItems.push(weg);
    HP_save(); openFavoriten(); showToast('Wiederhergestellt');
  });
}
