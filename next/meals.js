// ═══════════════════════════════════════════════
// HEIMPLANER V2 – Menüplan & Rezepte
// Menüplan: HP.meals[dateKey][slot] = {recipeId,name,emoji}
// Rezepte:  HP.customRecipes[] (RECIPES aus heimplaner-data.js ist nur noch
//           Migrationsquelle - siehe migrateBuiltinRecipes dort)
// ═══════════════════════════════════════════════

const MEAL_SLOTS = ['Frühstück', 'Mittag', 'Abend'];
let menuOffset = 0;
let rezeptFilter = 'Alle';
let rezeptSuche = '';

function menuWoche(d) { menuOffset += d; renderMenueplan(); }

function renderMenueplan() {
  const dates = getWeekDates(menuOffset);
  const label = 'KW ' + wkNum(dates[0]) + ' · ' +
    dates[0].toLocaleDateString('de-CH', { day: 'numeric', month: 'short' }) + ' – ' +
    dates[6].toLocaleDateString('de-CH', { day: 'numeric', month: 'short' });
  const spalten = dates.map((d, i) => {
    const key = dk(d);
    const meals = HP.meals[key] || {};
    return '<div class="day-col' + (isToday(d) ? ' is-today' : '') + '">' +
      '<div class="day-head"><span class="dh-dow">' + DS[i] + '</span><span class="dh-num">' + d.getDate() + '</span></div>' +
      '<div class="day-body">' + MEAL_SLOTS.map(slot => {
        const m = meals[slot];
        return '<button class="slot-card' + (m ? ' filled' : '') + '" onclick="openMealPicker(\'' + key + '\',\'' + slot + '\')">' +
          '<span class="slot-label">' + slot + '</span>' +
          '<span class="slot-value">' + (m ? esc(m.emoji || '🍽️') + ' ' + esc(m.name) : '+') + '</span></button>';
      }).join('') + '</div>' +
      '<button class="day-add" onclick="tagZutatenAufListe(\'' + key + '\')" title="Zutaten des Tages zur Einkaufsliste">🛒</button>' +
      '</div>';
  }).join('');

  document.getElementById('view-root').innerHTML =
    viewHead('Menüplan',
      '<button class="btn btn-outline" onclick="wocheZutatenAufListe()"><span class="icon i-cart"></span> Zutaten der Woche</button>') +
    navRow('menuWoche(-1)', label, 'menuWoche(1)',
      (menuOffset === 0 ? '' : '<button class="btn btn-outline btn-sm" onclick="menuOffset=0;renderMenueplan()">Heute</button>')) +
    '<div class="week-grid">' + spalten + '</div>';
}

function openMealPicker(key, slot) {
  const vorhanden = (HP.meals[key] || {})[slot];
  const rezepte = allRecipes().slice().sort((a, b) => a.name.localeCompare(b.name));
  showModal('<h3>' + esc(slot) + ' · ' + esc(dateLabel(key, { weekday: 'long', day: 'numeric', month: 'long' })) + '</h3>' +
    '<div class="field"><label>Aus der Rezeptbibliothek</label>' +
    '<select id="mp-recipe"><option value="">— keines —</option>' +
    rezepte.map(r => '<option value="' + esc(r.id) + '"' + (vorhanden && vorhanden.recipeId === r.id ? ' selected' : '') + '>' +
      esc(r.emoji) + ' ' + esc(r.name) + '</option>').join('') + '</select></div>' +
    '<div class="field-row">' +
    '<div class="field" style="max-width:70px"><label>Emoji</label><input id="mp-emoji" maxlength="4" value="' +
    esc(vorhanden && !vorhanden.recipeId ? vorhanden.emoji || '🍽️' : '🍽️') + '"></div>' +
    '<div class="field"><label>…oder frei eintragen</label><input id="mp-name" maxlength="60" placeholder="z.B. Resten" value="' +
    esc(vorhanden && !vorhanden.recipeId ? vorhanden.name : '') + '"></div>' +
    '</div>' +
    '<div class="modal-actions">' +
    (vorhanden ? '<button class="btn btn-danger" onclick="mealEntfernen(\'' + key + '\',\'' + slot + '\')">Entfernen</button>' : '<span></span>') +
    '<div style="display:flex;gap:8px">' +
    '<button class="btn btn-outline" onclick="closeModal()">Abbrechen</button>' +
    '<button class="btn btn-accent" onclick="mealSpeichern(\'' + key + '\',\'' + slot + '\')">Speichern</button>' +
    '</div></div>');
}

function mealSpeichern(key, slot) {
  const rid = document.getElementById('mp-recipe').value;
  const name = kappen(document.getElementById('mp-name').value.trim(), FELD_MAX.name);
  if (!HP.meals[key]) HP.meals[key] = {};
  if (rid) {
    const r = allRecipes().find(x => x.id === rid);
    if (!r) { showToast('Rezept nicht gefunden'); return; }
    HP.meals[key][slot] = { recipeId: r.id, name: r.name, emoji: r.emoji };
  } else if (name) {
    HP.meals[key][slot] = { recipeId: null, name, emoji: document.getElementById('mp-emoji').value.trim() || '🍽️' };
  } else {
    showToast('Bitte Rezept wählen oder Namen eintragen');
    return;
  }
  HP_save(); closeModal(); render();
  showToast(HP.meals[key][slot].emoji + ' ' + HP.meals[key][slot].name + ' eingetragen');
}

function mealEntfernen(key, slot) {
  const weg = (HP.meals[key] || {})[slot]; if (!weg) return;
  delete HP.meals[key][slot];
  HP_save(); closeModal(); render();
  showUndoToast('Eintrag entfernt', () => {
    if (!HP.meals[key]) HP.meals[key] = {};
    HP.meals[key][slot] = weg;
    HP_save(); render(); showToast('Wiederhergestellt');
  });
}

// ── Zutaten auf die Einkaufsliste ─────────────
// Legt direkt an (ohne Toast/Render pro Zutat) und meldet, ob etwas Neues
// dazukam - bei einem ganzen Wochenplan sonst ein Dutzend Toasts.
function zutatAnlegen(n, q, u, quelle) {
  if (!HP.shop) HP.shop = [];
  if (HP.shop.some(i => i.name.toLowerCase() === n.toLowerCase() && !i.bought)) return false;
  HP.shop.push({
    id: 'sh' + Date.now() + Math.random().toString(36).slice(2, 6),
    name: kappen(n, FELD_MAX.name), qty: q || '', unit: u || '', cat: guessCat(n),
    bought: false, taskId: null, taskName: quelle || null, updatedAt: Date.now()
  });
  return true;
}

function mealsZutaten(keys) {
  let neu = 0;
  keys.forEach(key => {
    Object.values(HP.meals[key] || {}).forEach(m => {
      const r = allRecipes().find(x => x.id === m.recipeId);
      if (!r) return;
      r.ing.forEach(ing => { if (zutatAnlegen(ing.n, ing.q, ing.u, m.emoji + ' ' + m.name)) neu++; });
    });
  });
  HP_save(); render();
  showToast(neu ? neu + ' Zutaten zur Einkaufsliste' : 'Alles schon auf der Liste');
}

function tagZutatenAufListe(key) { mealsZutaten([key]); }
function wocheZutatenAufListe() { mealsZutaten(getWeekDates(menuOffset).map(dk)); }

// ═══════════════════════════════════════════════
// Rezepte
// ═══════════════════════════════════════════════

function setRezeptFilter(c) { rezeptFilter = c; renderRezepte(); }
// Nur die Liste neu zeichnen, nicht die ganze Ansicht: sonst verliert das
// Suchfeld bei jedem Tastendruck den Fokus.
function rezeptSuchen(v) {
  rezeptSuche = v;
  const liste = document.getElementById('rezept-liste');
  if (liste) liste.innerHTML = rezeptListeHtml();
}

// Listen-Darstellung nach den Mockups: eine Fläche, darauf Zeilen mit
// Haarlinie dazwischen und kleinen Abschnitts-Überschriften - keine Kachel
// je Rezept. Dadurch passen bei gleicher Höhe rund dreimal so viele Rezepte
// auf den Schirm, und der Blick läuft eine Kante entlang statt über ein Raster.
function renderRezepte() {
  const alle = allRecipes();
  const kategorien = ['Alle', ...Array.from(new Set(alle.map(r => r.cat))).sort()];
  document.getElementById('view-root').innerHTML =
    '<div class="list-page">' +
    viewHead('Rezepte', '<span class="head-count">' + alle.length + ' Rezepte</span>') +
    '<div class="searchbar"><span class="icon i-search"></span>' +
    '<input id="rz-suche" placeholder="Rezept suchen" value="' + esc(rezeptSuche) + '" oninput="rezeptSuchen(this.value)">' +
    (rezeptSuche ? '<button class="rowbtn" onclick="rezeptSuchen(\'\');renderRezepte()"><span class="icon i-x"></span></button>' : '') +
    '</div>' +
    '<div class="chips">' + kategorien.map(c =>
      '<button class="chip' + (c === rezeptFilter ? ' active' : '') + '" onclick="setRezeptFilter(\'' + esc(c) + '\')">' + esc(c) + '</button>').join('') + '</div>' +
    '<div id="rezept-liste">' + rezeptListeHtml() + '</div>' +
    '<div class="page-actions">' +
    '<button class="btn btn-ghost btn-block" onclick="openRezeptForm()"><span class="icon i-plus"></span> Eigenes Rezept</button>' +
    '<button class="btn btn-ghost btn-block" onclick="openRezeptImport()"><span class="icon i-clipboard"></span> Rezept einfügen</button>' +
    '</div></div>';
}

function rezeptListeHtml() {
  const q = rezeptSuche.toLowerCase();
  const gefiltert = allRecipes().filter(r =>
    (rezeptFilter === 'Alle' || r.cat === rezeptFilter) &&
    (!q || r.name.toLowerCase().includes(q) || (r.tags || []).some(t => t.toLowerCase().includes(q))));
  if (!gefiltert.length) return emptyState('i-notebook', 'Kein Rezept gefunden.');
  gefiltert.sort((a, b) => a.name.localeCompare(b.name));
  // Nach Kategorie gruppieren, solange kein Kategorie-Chip aktiv ist - sonst
  // wäre die Überschrift über jeder Gruppe dieselbe wie der aktive Chip.
  if (rezeptFilter !== 'Alle') return gefiltert.map(rezeptZeileHtml).join('');
  const gruppen = {};
  gefiltert.forEach(r => { (gruppen[r.cat] = gruppen[r.cat] || []).push(r); });
  return Object.keys(gruppen).sort().map(cat =>
    '<div class="section-label">' + esc(cat) + ' · ' + gruppen[cat].length + '</div>' +
    gruppen[cat].map(rezeptZeileHtml).join('')).join('');
}

function rezeptZeileHtml(r) {
  return '<div class="flat-row" onclick="openRezeptDetail(\'' + esc(r.id) + '\')">' +
    '<span class="tile">' + esc(r.emoji) + '</span>' +
    '<span class="fr-name">' + esc(r.name) + '</span>' +
    '<span class="fr-meta">' + esc(r.time) + ' Min · ' + esc(r.pers) + ' Pers.</span>' +
    '<button class="rowbtn" onclick="event.stopPropagation();openRezeptForm(\'' + esc(r.id) + '\')" title="Bearbeiten">' +
    '<span class="icon i-pencil"></span></button>' +
    '</div>';
}

function openRezeptDetail(rid) {
  const r = allRecipes().find(x => x.id === rid); if (!r) return;
  const zutaten = r.ing.map((ing, i) =>
    '<label class="ing-row"><input type="checkbox" id="ing-' + i + '" checked>' +
    '<span class="ing-name">' + esc(ing.n) + '</span>' +
    '<span class="ing-qty">' + esc([ing.q, ing.u].filter(Boolean).join(' ')) + '</span></label>').join('');
  const schritte = (r.steps || []).map((s, i) =>
    '<div class="step-row"><span class="step-num">' + (i + 1) + '</span><span>' + esc(s) + '</span></div>').join('');
  showModal('<h3>' + esc(r.emoji) + ' ' + esc(r.name) + '</h3>' +
    '<p class="muted small">' + esc(r.cat) + ' · ' + esc(r.time) + ' Min · ' + esc(r.pers) + ' Personen</p>' +
    '<div class="card-head"><span class="card-title">Zutaten</span>' +
    '<button class="btn btn-outline btn-sm" onclick="alleZutatenUmschalten(' + r.ing.length + ')">Alle an/aus</button></div>' +
    zutaten +
    (schritte ? '<div class="card-head" style="margin-top:16px"><span class="card-title">Zubereitung</span></div>' + schritte : '') +
    '<div class="modal-actions wrap">' +
    '<button class="btn btn-danger" onclick="deleteRezept(\'' + esc(r.id) + '\')">Löschen</button>' +
    '<button class="btn btn-outline" onclick="openRezeptForm(\'' + esc(r.id) + '\')">Bearbeiten</button>' +
    '<button class="btn btn-outline" onclick="rezeptInMenueplan(\'' + esc(r.id) + '\')">Menüplan</button>' +
    '<button class="btn btn-accent" onclick="ausgewaehlteZutaten(\'' + esc(r.id) + '\')">Zutaten zur Liste</button>' +
    '</div>', true);
}

function alleZutatenUmschalten(n) {
  const boxen = Array.from({ length: n }, (_, i) => document.getElementById('ing-' + i)).filter(Boolean);
  const alle = boxen.every(b => b.checked);
  boxen.forEach(b => { b.checked = !alle; });
}

function ausgewaehlteZutaten(rid) {
  const r = allRecipes().find(x => x.id === rid); if (!r) return;
  let neu = 0;
  r.ing.forEach((ing, i) => {
    const box = document.getElementById('ing-' + i);
    if (box && box.checked && zutatAnlegen(ing.n, ing.q, ing.u, r.emoji + ' ' + r.name)) neu++;
  });
  HP_save(); closeModal(); render();
  showToast(neu ? neu + ' Zutaten zur Einkaufsliste' : 'Alles schon auf der Liste');
}

function rezeptInMenueplan(rid) {
  const r = allRecipes().find(x => x.id === rid); if (!r) return;
  const dates = getWeekDates(menuOffset);
  const opts = dates.map((d, i) => MEAL_SLOTS.map(s =>
    '<option value="' + dk(d) + '||' + s + '">' + DS[i] + ' ' + d.getDate() + '. · ' + s + '</option>').join('')).join('');
  showModal('<h3>' + esc(r.emoji) + ' ' + esc(r.name) + '</h3>' +
    '<div class="field"><label>Wann?</label><select id="rm-slot">' + opts + '</select></div>' +
    '<div class="modal-actions"><span></span><div style="display:flex;gap:8px">' +
    '<button class="btn btn-outline" onclick="closeModal()">Abbrechen</button>' +
    '<button class="btn btn-accent" onclick="rezeptSlotSetzen(\'' + esc(rid) + '\')">Eintragen</button></div></div>');
}

function rezeptSlotSetzen(rid) {
  const val = document.getElementById('rm-slot').value; if (!val) return;
  const [key, slot] = val.split('||');
  const r = allRecipes().find(x => x.id === rid); if (!r) return;
  if (!HP.meals[key]) HP.meals[key] = {};
  HP.meals[key][slot] = { recipeId: r.id, name: r.name, emoji: r.emoji };
  HP_save(); closeModal(); render();
  showToast(r.emoji + ' ' + r.name + ' eingetragen');
}

// ── Rezept anlegen / bearbeiten ───────────────
const REZEPT_CATS = ['Frühstück', 'Salate', 'Pasta', 'Hauptspeisen', 'Grill', 'Suppen', 'Snacks', 'Desserts'];

function rezeptFormHtml(titel, saveOnclick, p) {
  p = p || {};
  const ingText = (p.ing || []).map(i => [i.n, i.q, i.u].filter(x => x !== undefined && x !== '').join(', ')).join('\n');
  return '<h3>' + esc(titel) + '</h3>' +
    '<div class="field-row">' +
    '<div class="field" style="max-width:70px"><label>Emoji</label><input id="rf-emoji" maxlength="4" value="' + esc(p.emoji || '🍽️') + '"></div>' +
    '<div class="field"><label>Name</label><input id="rf-name" maxlength="200" value="' + esc(p.name || '') + '"></div>' +
    '</div>' +
    '<div class="field-row">' +
    '<div class="field"><label>Zeit (Min)</label><input type="number" id="rf-time" value="' + (p.time != null ? p.time : 30) + '"></div>' +
    '<div class="field"><label>Personen</label><input type="number" id="rf-pers" value="' + (p.pers != null ? p.pers : 4) + '"></div>' +
    '<div class="field"><label>Kategorie</label><select id="rf-cat">' +
    REZEPT_CATS.map(c => '<option' + (p.cat === c ? ' selected' : '') + '>' + esc(c) + '</option>').join('') + '</select></div>' +
    '</div>' +
    '<div class="field"><label>Zutaten – eine pro Zeile: Name, Menge, Einheit</label>' +
    '<textarea id="rf-ings" rows="6" maxlength="4000" placeholder="Pasta, 300, g&#10;Tomaten, 1, Dose">' + esc(ingText) + '</textarea></div>' +
    '<div class="field"><label>Zubereitung – ein Schritt pro Zeile</label>' +
    '<textarea id="rf-steps" rows="6" maxlength="8000">' + esc((p.steps || []).join('\n')) + '</textarea></div>' +
    '<div class="modal-actions"><span></span><div style="display:flex;gap:8px">' +
    '<button class="btn btn-outline" onclick="closeModal()">Abbrechen</button>' +
    '<button class="btn btn-accent" onclick="' + saveOnclick + '">Speichern</button></div></div>';
}

function openRezeptForm(id) {
  const r = id ? allRecipes().find(x => x.id === id) : null;
  showModal(rezeptFormHtml(r ? 'Rezept bearbeiten' : 'Eigenes Rezept',
    r ? 'saveRezept(\'' + esc(id) + '\')' : 'saveRezept(null)', r), true);
}

function readRezeptForm() {
  const name = kappen(document.getElementById('rf-name').value.trim(), FELD_MAX.name);
  const ing = (document.getElementById('rf-ings').value || '').split('\n').filter(l => l.trim()).map(l => {
    const t = l.split(',').map(x => x.trim());
    return { n: t[0] || l.trim(), q: t[1] || '', u: t[2] || '' };
  });
  const steps = (document.getElementById('rf-steps').value || '').split('\n')
    .map(s => kappen(s.trim(), FELD_MAX.schritt)).filter(Boolean);
  if (!name) { showToast('Bitte Namen eingeben'); return null; }
  if (!ing.length) { showToast('Bitte mindestens eine Zutat eingeben'); return null; }
  return {
    emoji: document.getElementById('rf-emoji').value.trim() || '🍽️',
    name, ing, steps,
    cat: document.getElementById('rf-cat').value,
    time: parseInt(document.getElementById('rf-time').value) || 30,
    pers: parseInt(document.getElementById('rf-pers').value) || 4
  };
}

function saveRezept(id) {
  const f = readRezeptForm(); if (!f) return;
  if (!HP.customRecipes) HP.customRecipes = [];
  if (id) {
    const r = HP.customRecipes.find(x => x.id === id);
    if (r) Object.assign(r, f, { updatedAt: Date.now() });
  } else {
    HP.customRecipes.push({ id: 'cr' + Date.now(), ...f, tags: ['eigenes'], custom: true, updatedAt: Date.now() });
  }
  HP_save(); closeModal(); render();
  showToast(f.emoji + ' ' + f.name + ' gespeichert');
}

function deleteRezept(id) {
  const weg = (HP.customRecipes || []).find(x => x.id === id); if (!weg) return;
  markDeleted('customRecipes', id);
  HP.customRecipes = HP.customRecipes.filter(x => x.id !== id);
  HP_save(); closeModal(); render();
  showUndoToast('Rezept gelöscht', () => {
    unmarkDeleted('customRecipes', id);
    weg.updatedAt = Date.now();
    HP.customRecipes.push(weg);
    HP_save(); render(); showToast('Wiederhergestellt');
  });
}

// ── Import per Copy-Paste (bettybossi.ch) ─────
// Kein Netzwerkaufruf: arbeitet nur auf Text, den man selbst einfügt.
// bettybossi.ch gruppiert Zutaten pro Schritt ("N. Zutat" / "Menge Einheit" /
// Fliesstext). Zeit und Portionen stehen im kopierten Text nicht drin -
// deshalb Vorschau mit Standardwerten, die man korrigiert.
function istSchrittSatz(line) { return line.length > 25 && /[.!?]\s*$/.test(line.trim()); }

function parseMengenZeile(line) {
  const t = (line || '').trim();
  if (!t) return { q: '', u: '' };
  if (/^wenig$/i.test(t)) return { q: 'wenig', u: '' };
  const m = t.match(/^([\d.,]+(?:\s*[-–]\s*[\d.,]+)?)\s*(.*)$/);
  if (m && m[1]) return { q: m[1].trim(), u: (m[2] || '').trim() || 'Stk' };
  return { q: '', u: t };
}

function parseRezeptText(raw) {
  const lines = (raw || '').split('\n').map(l => l.replace(/\r/g, ''));
  const marker = [];
  lines.forEach((l, i) => { if (/^\s*\d+\.\s/.test(l)) marker.push(i); });
  const name = (lines.slice(0, marker.length ? marker[0] : lines.length).find(l => l.trim()) || '').trim();
  const ing = [], steps = [];
  marker.forEach((start, mi) => {
    const end = mi + 1 < marker.length ? marker[mi + 1] : lines.length;
    const block = lines.slice(start, end);
    block[0] = block[0].replace(/^\s*\d+\.\s*/, '');
    let idx = -1;
    for (let i = block.length - 1; i >= 0; i--) { if (istSchrittSatz(block[i])) { idx = i; break; } }
    if (idx === -1) { for (let i = block.length - 1; i >= 0; i--) { if (block[i].trim()) { idx = i; break; } } }
    const schritt = idx >= 0 ? block[idx].trim() : '';
    const zutatZeilen = idx >= 0 ? block.slice(0, idx) : block;
    for (let i = 0; i < zutatZeilen.length; i += 2) {
      const n = (zutatZeilen[i] || '').trim();
      if (!n) continue;
      const qu = parseMengenZeile(zutatZeilen[i + 1]);
      ing.push({ n, q: qu.q, u: qu.u });
    }
    if (schritt) steps.push(schritt);
  });
  return { name, ing, steps };
}

function openRezeptImport() {
  showModal('<h3>Rezept importieren</h3>' +
    '<p class="muted small">Rezepttext von bettybossi.ch markieren, kopieren und hier einfügen. ' +
    'Läuft komplett lokal im Browser – es wird keine Seite nachgeladen.</p>' +
    '<div class="field"><textarea id="rz-raw" rows="12" maxlength="20000" placeholder="Rezepttext hier einfügen…"></textarea></div>' +
    '<div class="modal-actions"><span></span><div style="display:flex;gap:8px">' +
    '<button class="btn btn-outline" onclick="closeModal()">Abbrechen</button>' +
    '<button class="btn btn-accent" onclick="rezeptImportVorschau()">Vorschau</button></div></div>', true);
}

function rezeptImportVorschau() {
  const parsed = parseRezeptText(document.getElementById('rz-raw').value || '');
  if (!parsed.name && !parsed.ing.length && !parsed.steps.length) {
    showToast('Konnte nichts erkennen – bitte Text prüfen');
    return;
  }
  showModal(rezeptFormHtml('Vorschau – bitte prüfen', 'saveImportiertesRezept()',
    { emoji: '🍽️', name: parsed.name, cat: 'Hauptspeisen', time: 30, pers: 4, ing: parsed.ing, steps: parsed.steps }), true);
  showToast('Zeit & Personenzahl bitte prüfen – die kopiert bettybossi.ch nicht mit');
}

function saveImportiertesRezept() {
  const f = readRezeptForm(); if (!f) return;
  if (!HP.customRecipes) HP.customRecipes = [];
  HP.customRecipes.push({ id: 'cr' + Date.now(), ...f, tags: ['eigenes', 'importiert'], custom: true, updatedAt: Date.now() });
  HP_save(); closeModal(); render();
  showToast(f.emoji + ' ' + f.name + ' importiert');
}
