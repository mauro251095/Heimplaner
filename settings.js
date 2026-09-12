// ═══════════════════════════════════════════════
// HEIMPLANER V2 – Einstellungen
// Namen, Personenfarben, Theme, Synchronisation, Push-Erinnerungen,
// Kalender-Import/-Export (.ics) und JSON-Backup.
//
// Der Sync-Passwort-Dialog (openSyncModal aus heimplaner-sync.js) hängt hier
// drin: die alte Sync-Leiste in der Topbar ist in V2 auf Name + Statuspunkt
// reduziert, damit bleibt diese Ansicht der einzige Weg dorthin.
// ═══════════════════════════════════════════════

// Auswahl-Palette aus tokens.css. Keine Farbe ist einer Person fest
// zugeordnet - jede wählt ihre eigene (siehe next/CLAUDE.md).
const PERSON_PALETTE = [
  ['#6C8EFF', 'Blau'], ['#FF7EB3', 'Pink'], ['#4ECDC4', 'Türkis'],
  ['#F0B860', 'Amber'], ['#B79FF0', 'Violett'], ['#E08A5C', 'Terracotta']
];

const VAPID_PUBLIC_KEY = 'BBlPn5qKofB050Ej8ocesJJF4OFKQVo9D10w5w70ynSJpIRrbpchfI99qq-rrefJ62SeKbXQDoCf5Flo-OWLMNo';

function renderEinstellungen() {
  // Der Benutzername wird klein eingetippt (das Login-Feld hat
  // autocapitalize="none"); angezeigt gehört er gross.
  const roh = (typeof getLoggedInUser === 'function' && getLoggedInUser()) || '';
  const user = roh ? roh.charAt(0).toUpperCase() + roh.slice(1) : '—';
  const importierte = (HP.events || []).filter(e => e.icsImport);
  const letzterImport = importierte.reduce((max, e) => Math.max(max, e.icsAt || 0), 0);

  const syncAktiv = typeof syncEnabled !== 'undefined' && syncEnabled;
  const pushText = !NOTIF_OK ? 'Auf diesem Gerät nicht verfügbar'
    : Notification.permission === 'granted' ? 'Aktiv'
      : Notification.permission === 'denied' ? 'Im Browser blockiert'
        : 'Nicht aktiviert';

  document.getElementById('view-root').innerHTML =
    '<div class="list-page">' +
    viewHead('Einstellungen') +

    '<div class="section-label">Allgemein</div>' +
    setRow('i-palette', 'Namen &amp; Farben', esc(HP.names.p1) + ' &amp; ' + esc(HP.names.p2), 'openPersonenEinstellungen()') +
    '<div class="set-row"><span class="icon i-moon"></span>' +
    '<span class="ent-name">Dunkles Design</span>' +
    '<button class="switch' + (HP.theme !== 'light' ? ' on' : '') + '" ' +
    'onclick="setTheme(HP.theme===\'light\'?\'dark\':\'light\')" title="Hell/Dunkel"><span></span></button></div>' +

    '<div class="section-label">Geräte</div>' +
    setRow('i-settings', 'Sync-Passwort', syncAktiv ? 'Verbunden' : 'Nicht verbunden', 'openSyncModal()') +
    setRow('i-bell', 'Push-Erinnerungen', pushText, 'pushAktivieren()') +

    '<div class="section-label">Daten</div>' +
    '<label class="set-row"><span class="icon i-calendar"></span>' +
    '<span class="ent-name">Kalender importieren (.ics)<small>' +
    (importierte.length
      ? importierte.length + ' importierte Termine' + (letzterImport ? ' · ' + new Date(letzterImport).toLocaleDateString('de-CH') : '') + ' – ein neuer Import ersetzt sie'
      : 'Einmaliger Import, ersetzt beim nächsten Mal die vorherigen') +
    '</small></span><span class="icon i-chev-r rowhint"></span>' +
    '<input type="file" accept=".ics,text/calendar" hidden onchange="icsDateiGewaehlt(this)"></label>' +
    (importierte.length ? setRow('i-x', 'Importierte Termine entfernen', '', 'icsImportEntfernen()') : '') +
    setRow('i-file-export', 'Kalender exportieren (.ics)', 'Nächste 4 Wochen', 'exportICSV2()') +
    setRow('i-download', 'Momentaufnahme sichern (JSON)',
      'Supabase hält nur den aktuellen Stand – dies ist der einzige Weg zurück', 'exportJSONV2()') +
    '<label class="set-row"><span class="icon i-clipboard"></span>' +
    '<span class="ent-name">Sicherung einspielen<small>Ersetzt den gesamten Datenbestand dieses Geräts</small></span>' +
    '<span class="icon i-chev-r rowhint"></span>' +
    '<input type="file" accept="application/json" hidden onchange="importJSONV2(this)"></label>' +

    '<div class="section-label">Konto</div>' +
    setRow('i-users', esc(user), 'Angemeldet auf diesem Gerät · Abmelden', 'logout()') +
    '</div>';
}

// Eine Einstellungszeile: Symbol, Beschriftung, Nebenzeile, Hinweispfeil.
function setRow(icon, label, sub, onclick) {
  return '<div class="set-row" onclick="' + onclick + '">' +
    '<span class="icon ' + icon + '"></span>' +
    '<span class="ent-name">' + label + (sub ? '<small>' + sub + '</small>' : '') + '</span>' +
    '<span class="icon i-chev-r rowhint"></span></div>';
}

// Namen und Farben liegen im Dialog statt in der Liste: beides wird selten
// geändert, und in der Zeile sähe ein Eingabefeld neben lauter Text
// unruhig aus.
function openPersonenEinstellungen() {
  showModal('<h3>Namen &amp; Farben</h3>' +
    ['p1', 'p2'].map(w =>
      '<div class="field"><label>' + (w === 'p1' ? 'Person 1' : 'Person 2') + '</label>' +
      '<input id="set-name-' + w + '" maxlength="30" value="' + esc(HP.names[w]) + '" ' +
      'onchange="setPersonName(\'' + w + '\',this.value)"></div>').join('') +
    ['p1', 'p2', 'shared'].map(w =>
      '<div class="field"><label>' + esc(whoLabelV2(w)) + '</label>' +
      '<div class="color-row">' + PERSON_PALETTE.map(([val, name]) =>
        '<button class="color-dot' + (getColor(w) === val ? ' sel' : '') + '" title="' + name + '" ' +
        'style="background:' + val + '" onclick="setPersonFarbe(\'' + w + '\',\'' + val + '\')"></button>').join('') +
      '</div></div>').join('') +
    '<div class="modal-actions"><span></span><button class="btn btn-accent" onclick="closeModal()">Fertig</button></div>');
}

function setPersonName(who, val) {
  const name = kappen(val.trim(), 30);
  if (!name) { showToast('Name darf nicht leer sein'); openPersonenEinstellungen(); return; }
  HP.names[who] = name;
  HP_save();
  render();
  openPersonenEinstellungen();
  showToast('Name gespeichert');
}

function setPersonFarbe(who, farbe) {
  if (!HP.colors) HP.colors = { ...DEFAULT_COLORS };
  HP.colors[who] = farbe;
  HP_save();
  applyColors();
  render();
  openPersonenEinstellungen();
}

// ── Push ──────────────────────────────────────
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function pushAktivieren() {
  if (!NOTIF_OK || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    showToast('Push wird auf diesem Gerät nicht unterstützt');
    return;
  }
  if (!syncPassword) { showToast('Bitte zuerst das Sync-Passwort eintragen'); return; }
  try {
    if (Notification.permission === 'denied') { showToast('Benachrichtigungen sind im Browser blockiert'); return; }
    if (Notification.permission !== 'granted') {
      const r = await Notification.requestPermission();
      if (r !== 'granted') { showToast('Abgelehnt'); return; }
    }
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) });
    const res = await fetch('/.netlify/functions/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-app-password': syncPassword },
      body: JSON.stringify({ subscription: sub.toJSON(), who: loggedInPersonKey() })
    });
    if (!res.ok) { showToast('Push-Server-Fehler: ' + res.status); return; }
    showToast('🔔 Erinnerungen aktiv');
    render();
  } catch (e) {
    showToast('Push-Fehler: ' + (e && e.message ? e.message : e));
  }
}

// ── JSON-Backup ───────────────────────────────
function exportJSONV2() {
  const blob = new Blob([JSON.stringify(HP, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'heimplaner-backup-' + todayKey() + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJSONV2(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const d = JSON.parse(String(ev.target.result));
      if (!d.tasks || !d.names) throw new Error('Ungültiges Format');
      Object.assign(HP, d);
      HP_save();
      applyTheme(HP.theme || 'dark');
      applyColors();
      render();
      showToast('Daten importiert');
    } catch (err) {
      showToast('Fehler: ' + err.message);
    }
  };
  reader.readAsText(file);
  input.value = '';
}

// ── Kalender-Export ───────────────────────────
function exportICSV2() {
  const evs = [];
  for (let w = 0; w < 4; w++) {
    getWeekDates(w).forEach(date => {
      const key = dk(date);
      allTasks().filter(t => taskOccursOn(t, key) && t.time).forEach(t => {
        const [h, m] = t.time.split(':').map(Number);
        const s = new Date(date); s.setHours(h, m, 0, 0);
        let e;
        if (t.timeEnd) { const [eh, em] = t.timeEnd.split(':').map(Number); e = new Date(date); e.setHours(eh, em, 0, 0); if (e <= s) e.setHours(eh + 24, em, 0, 0); }
        else { e = new Date(s); e.setMinutes(m + 30); }
        evs.push({ summary: t.emoji + ' ' + t.name, start: s, end: e, desc: 'Heimplaner Aufgabe' });
      });
      Object.entries(HP.meals[key] || {}).forEach(([slot, meal]) => {
        const h = slot === 'Frühstück' ? 8 : slot === 'Mittag' ? 12 : 19;
        const s = new Date(date); s.setHours(h, 0, 0, 0);
        const e = new Date(s); e.setHours(h + 1, 0, 0, 0);
        evs.push({ summary: '🍽️ ' + slot + ': ' + meal.name, start: s, end: e, desc: 'Heimplaner Menüplan' });
      });
    });
  }
  (HP.events || []).filter(e => e.time && !e.icsImport).forEach(ev => {
    const [h, mi] = ev.time.split(':').map(Number);
    const s = new Date(ev.date + 'T12:00:00'); s.setHours(h, mi, 0, 0);
    let e;
    if (ev.timeEnd) { const [eh, em] = ev.timeEnd.split(':').map(Number); e = new Date(s); e.setHours(eh, em, 0, 0); if (e <= s) e.setHours(eh + 24, em, 0, 0); }
    else { e = new Date(s); e.setHours(h + 1, mi, 0, 0); }
    evs.push({ summary: ev.emoji + ' ' + ev.name, start: s, end: e, desc: 'Heimplaner Termin' });
  });
  if (!evs.length) { showToast('Keine Einträge zum Exportieren'); return; }
  const fmtDT = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const stamp = fmtDT(new Date());
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Heimplaner//DE',
    ...evs.map(ev => ['BEGIN:VEVENT', 'UID:' + Math.random().toString(36).slice(2) + '@heimplaner',
      'DTSTAMP:' + stamp, 'DTSTART:' + fmtDT(ev.start), 'DTEND:' + fmtDT(ev.end),
      'SUMMARY:' + ev.summary, 'DESCRIPTION:' + (ev.desc || ''), 'END:VEVENT'].join('\r\n')),
    'END:VCALENDAR'].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'heimplaner-kalender.ics';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast(evs.length + ' Einträge exportiert');
}

// ═══════════════════════════════════════════════
// Kalender-Import (.ics) – einmaliger Import, ersetzend
//
// Bewusst KEIN laufendes Abo: der Import legt ganz normale Termine in
// HP.events an (Flag icsImport:true). Ein neuer Import löscht die zuvor
// importierten Termine und legt sie frisch an, statt sie zu verdoppeln -
// von Hand erfasste Termine bleiben dabei unangetastet.
//
// Wichtig fürs Sync: die neuen Termine bekommen NEUE IDs. Die alten werden
// per markDeleted() zu Tombstones, und ein Tombstone würde eine wieder
// verwendete ID beim nächsten Merge sofort wieder austragen.
// ═══════════════════════════════════════════════

const ICS_MAX_TERMINE = 500;
const ICS_MAX_VORKOMMEN = 200;      // pro Serie
let icsGeparst = null;

function icsDateiGewaehlt(input) {
  const file = input.files[0];
  input.value = '';
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('Datei zu gross (max. 5 MB)'); return; }
  const reader = new FileReader();
  reader.onload = ev => icsVorschau(String(ev.target.result), file.name);
  reader.onerror = () => showToast('Datei konnte nicht gelesen werden');
  reader.readAsText(file);
}

// RFC 5545: Zeilen dürfen umgebrochen werden, Fortsetzungen beginnen mit
// Leerzeichen/Tab. Ohne Entfalten zerfällt jeder längere SUMMARY.
function icsEntfalten(text) {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n[ \t]/g, '');
}

function icsText(v) {
  return v.replace(/\\n/gi, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').trim();
}

// Wandelt DTSTART/DTEND in {date:'YYYY-MM-DD', time:'HH:MM'|''}.
// "…Z" ist UTC und wird in Ortszeit umgerechnet. Zeiten mit TZID werden als
// Ortszeit gelesen - für einen Haushaltskalender in einer Zeitzone stimmt das,
// und eine vollständige Zeitzonen-Datenbank wäre hier deutlich zu viel.
function icsZeit(wert, istDatum) {
  const v = (wert || '').trim();
  const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m) return null;
  if (istDatum || !m[4]) return { date: m[1] + '-' + m[2] + '-' + m[3], time: '' };
  if (m[7]) {
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)));
    return { date: dk(d), time: String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') };
  }
  return { date: m[1] + '-' + m[2] + '-' + m[3], time: m[4] + ':' + m[5] };
}

function icsParse(text) {
  const lines = icsEntfalten(text).split('\n');
  const events = [];
  let cur = null;
  lines.forEach(line => {
    if (/^BEGIN:VEVENT/i.test(line)) { cur = { exdates: [] }; return; }
    if (/^END:VEVENT/i.test(line)) { if (cur && cur.start) events.push(cur); cur = null; return; }
    if (!cur) return;
    const i = line.indexOf(':');
    if (i < 0) return;
    const links = line.slice(0, i), wert = line.slice(i + 1);
    const teile = links.split(';');
    const name = teile[0].toUpperCase();
    const istDatum = teile.slice(1).some(p => /^VALUE=DATE$/i.test(p));
    if (name === 'SUMMARY') cur.summary = icsText(wert);
    else if (name === 'LOCATION') cur.location = icsText(wert);
    else if (name === 'DESCRIPTION') cur.desc = icsText(wert);
    else if (name === 'DTSTART') cur.start = icsZeit(wert, istDatum);
    else if (name === 'DTEND') cur.end = icsZeit(wert, istDatum);
    else if (name === 'RRULE') cur.rrule = wert;
    else if (name === 'EXDATE') wert.split(',').forEach(v => { const z = icsZeit(v, istDatum); if (z) cur.exdates.push(z.date); });
  });
  return events;
}

function rruleTeile(rrule) {
  const o = {};
  (rrule || '').split(';').forEach(p => {
    const [k, v] = p.split('=');
    if (k) o[k.toUpperCase()] = v;
  });
  return o;
}

// Termine einer Serie bis "bisKey" ausrollen. Unterstützt FREQ DAILY/WEEKLY/
// MONTHLY/YEARLY mit INTERVAL, COUNT, UNTIL und BYDAY (bei WEEKLY) - das
// deckt ab, was übliche Kalender exportieren. Exotischere Regeln landen als
// einzelner Termin am Startdatum statt gar nicht.
function icsVorkommen(ev, bisKey) {
  const start = ev.start.date;
  if (!ev.rrule) return [start];
  const r = rruleTeile(ev.rrule);
  const freq = (r.FREQ || '').toUpperCase();
  const intervall = Math.max(1, parseInt(r.INTERVAL) || 1);
  const untilZ = r.UNTIL ? icsZeit(r.UNTIL, false) : null;
  const grenze = untilZ && untilZ.date < bisKey ? untilZ.date : bisKey;
  const WD = { MO: 0, TU: 1, WE: 2, TH: 3, FR: 4, SA: 5, SU: 6 };
  const byday = (r.BYDAY || '').split(',').filter(Boolean).map(d => WD[d.slice(-2).toUpperCase()]).filter(d => d !== undefined);
  let out = [];
  if (freq === 'WEEKLY' && byday.length) {
    const startDow = (new Date(start + 'T12:00:00').getDay() + 6) % 7;
    let wochenStart = shiftDateKey(start, -startDow);
    while (wochenStart <= grenze && out.length < ICS_MAX_VORKOMMEN) {
      byday.forEach(d => {
        const k = shiftDateKey(wochenStart, d);
        if (k >= start && k <= grenze) out.push(k);
      });
      wochenStart = shiftDateKey(wochenStart, 7 * intervall);
    }
  } else {
    const schritt = freq === 'DAILY' ? k => shiftDateKey(k, intervall)
      : freq === 'WEEKLY' ? k => shiftDateKey(k, 7 * intervall)
        : freq === 'MONTHLY' ? k => advanceDateKey(k, 'months', intervall)
          : freq === 'YEARLY' ? k => advanceDateKey(k, 'months', 12 * intervall)
            : null;
    if (!schritt) return [start];
    let k = start;
    while (k <= grenze && out.length < ICS_MAX_VORKOMMEN) { out.push(k); k = schritt(k); }
  }
  out.sort();
  const count = parseInt(r.COUNT);
  if (count) out = out.slice(0, count);
  return out.filter(k => !ev.exdates.includes(k));
}

function icsVorschau(text, dateiname) {
  const roh = icsParse(text);
  if (!roh.length) { showToast('Keine Termine in der Datei gefunden'); return; }
  const heute = todayKey();
  const bis = advanceDateKey(heute, 'months', 12);
  const termine = [];
  roh.forEach(ev => {
    icsVorkommen(ev, bis).forEach(datum => {
      termine.push({
        datum,
        time: ev.start.time || '',
        timeEnd: ev.end && ev.end.date === ev.start.date ? ev.end.time || '' : '',
        name: kappen(ev.summary || 'Termin', FELD_MAX.name),
        note: kappen([ev.location, ev.desc].filter(Boolean).join(' · '), FELD_MAX.notiz)
      });
    });
  });
  termine.sort((a, b) => a.datum.localeCompare(b.datum) || (a.time || '').localeCompare(b.time || ''));
  icsGeparst = { dateiname, termine, heute };
  const kuenftig = termine.filter(t => t.datum >= heute).length;
  const bisher = (HP.events || []).filter(e => e.icsImport).length;
  const beispiele = termine.filter(t => t.datum >= heute).slice(0, 5);

  showModal('<h3>Kalender importieren</h3>' +
    '<p class="muted small">' + esc(dateiname || 'Datei') + ' · ' + termine.length + ' Termine erkannt, davon ' +
    kuenftig + ' ab heute. Serien sind bis 12 Monate im Voraus ausgerollt.</p>' +
    (bisher ? '<p class="warn-box">Der Import <b>ersetzt</b> die ' + bisher + ' bereits importierten Termine. ' +
      'Von Hand erfasste Termine bleiben unberührt.</p>' : '') +
    (beispiele.length ? '<div class="card-head"><span class="card-title">Beispiele</span></div>' +
      beispiele.map(t => '<div class="list-row"><div class="meta"><div class="name">📅 ' + esc(t.name) + '</div>' +
        '<div class="sub">' + esc(dateLabel(t.datum, { weekday: 'short', day: 'numeric', month: 'short' })) +
        (t.time ? ' · ' + esc(t.time) : ' · ganztägig') + '</div></div></div>').join('') : '') +
    '<div class="field-row" style="margin-top:14px">' +
    '<div class="field"><label>Zuordnen zu</label><select id="ics-who">' + whoOptions('shared') + '</select></div>' +
    '<div class="field"><label>Emoji</label><input id="ics-emoji" maxlength="4" value="📅"></div>' +
    '</div>' +
    '<label class="check-row"><input type="checkbox" id="ics-nur-kuenftig" checked> Vergangene Termine überspringen</label>' +
    '<div class="modal-actions"><span></span><div style="display:flex;gap:8px">' +
    '<button class="btn btn-outline" onclick="closeModal()">Abbrechen</button>' +
    '<button class="btn btn-accent" onclick="icsImportieren()">Importieren</button></div></div>', true);
}

function icsImportieren() {
  if (!icsGeparst) { closeModal(); return; }
  const who = document.getElementById('ics-who').value;
  const emoji = document.getElementById('ics-emoji').value.trim() || '📅';
  const nurKuenftig = document.getElementById('ics-nur-kuenftig').checked;
  let termine = icsGeparst.termine.filter(t => !nurKuenftig || t.datum >= icsGeparst.heute);
  const gekappt = termine.length > ICS_MAX_TERMINE;
  if (gekappt) termine = termine.slice(0, ICS_MAX_TERMINE);

  const alt = (HP.events || []).filter(e => e.icsImport);
  alt.forEach(e => {
    markDeleted('events', e.id);
    if (HP.eventStatus) delete HP.eventStatus[e.id];
    if (HP.eventNotes) delete HP.eventNotes[e.id];
    if (HP.eventComments) delete HP.eventComments[e.id];
  });
  HP.events = (HP.events || []).filter(e => !e.icsImport);

  const stamp = Date.now();
  termine.forEach((t, i) => {
    HP.events.push({
      id: 'ics' + stamp + '-' + i, emoji, name: t.name, date: t.datum,
      time: t.time, timeEnd: t.timeEnd, who, reminder: 'off', important: false,
      note: t.note, icsImport: true, icsAt: stamp, updatedAt: stamp
    });
  });
  HP_save();
  closeModal();
  render();
  showToast(termine.length + ' Termine importiert' +
    (alt.length ? ' (' + alt.length + ' ersetzt)' : '') +
    (gekappt ? ' – auf ' + ICS_MAX_TERMINE + ' begrenzt' : ''));
  icsGeparst = null;
}

function icsImportEntfernen() {
  const alt = (HP.events || []).filter(e => e.icsImport);
  if (!alt.length) return;
  alt.forEach(e => markDeleted('events', e.id));
  HP.events = HP.events.filter(e => !e.icsImport);
  HP_save();
  render();
  showUndoToast(alt.length + ' importierte Termine entfernt', () => {
    alt.forEach(e => { unmarkDeleted('events', e.id); e.updatedAt = Date.now(); HP.events.push(e); });
    HP_save(); render(); showToast('Wiederhergestellt');
  });
}
