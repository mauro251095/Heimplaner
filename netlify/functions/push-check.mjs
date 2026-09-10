// ═══════════════════════════════════════════════
// NETLIFY SCHEDULED FUNCTION – Push-Erinnerungen
// Läuft jede Minute, prüft Aufgaben/Termine/Geburtstage auf fällige
// Erinnerungen und verschickt Web-Push an die passenden Geräte.
// Ein rückblickendes 5-Minuten-Fenster + Dedup-Tabelle sorgen dafür, dass
// nichts verpasst wird und trotz überlappender Läufe nichts doppelt kommt.
//
// Bewusst OHNE guardPassword (anders als sync.js/push-subscribe.js/auth.js):
// Netlify blockt bei Scheduled Functions den direkten Aufruf der
// öffentlichen URL grundsätzlich mit 403 - nur der eigene Scheduler darf
// auslösen (https://docs.netlify.com/build/functions/scheduled-functions/).
// Der Schutz kommt hier also von der Plattform, nicht von dieser Datei. Falls
// diese Function je zu einer regulären (nicht-geplanten) umgebaut wird, muss
// guardPassword nachgerüstet werden - sonst kann jeder ohne Passwort beliebig
// oft Push-Zustellungen an Mauro/Melissa auslösen.
// ═══════════════════════════════════════════════

import webpush from 'web-push';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:mauropiovanelli@gmail.com';

const TZ = 'Europe/Zurich';
const REMINDER_LABEL = { 0: 'Jetzt', 5: 'In 5 Min', 15: 'In 15 Min', 30: 'In 30 Min', 60: 'In 1 Std', 240: 'In 4 Std', 480: 'In 8 Std', 720: 'In 12 Std', 1440: 'In 1 Tag', 10080: 'In 1 Woche' };
const reminderLabel = (off) => REMINDER_LABEL[off] || ('In ' + off + ' Min');

// ── Zeitzone: Europe/Zurich, unabhängig von der Server-Standardzone ──
function zurichDateKey(date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
function tzOffsetMinutes(date, timeZone) {
  const part = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' }).formatToParts(date).find(p => p.type === 'timeZoneName').value;
  const m = part.match(/GMT([+-]\d+)(?::(\d+))?/);
  if (!m) return 0;
  const h = parseInt(m[1], 10), mm = m[2] ? parseInt(m[2], 10) : 0;
  return h * 60 + (h < 0 ? -mm : mm);
}
function zonedTimeToUtcMs(dateKey, timeStr) {
  const naiveUTC = new Date(`${dateKey}T${timeStr}:00Z`).getTime();
  const offsetMin = tzOffsetMinutes(new Date(naiveUTC), TZ);
  return naiveUTC - offsetMin * 60000;
}
function addDaysToKey(dateKey, days) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}
function mondayIndex(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return (dow + 6) % 7;
}
function taskOccursOn(task, dateKey, exceptions) {
  if (!task.days || !task.days.includes(mondayIndex(dateKey))) return false;
  if (exceptions && exceptions[task.id] && exceptions[task.id][dateKey]) return false;
  return true;
}
function getNextBirthdayKey(bDate, todayKey) {
  const [, m, d] = bDate.split('-');
  const year = parseInt(todayKey.slice(0, 4), 10);
  let candidate = `${year}-${m}-${d}`;
  if (candidate < todayKey) candidate = `${year + 1}-${m}-${d}`;
  return candidate;
}

async function sbFetch(path, opts = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    }
  });
}

// Holt gezielt die vier für Erinnerungen relevanten Teilbäume aus der
// jsonb-Spalte "data". Schlägt die schlanke Abfrage fehl (z.B. weil eine
// PostgREST-Version die ->-Syntax im select nicht unterstützt), wird auf den
// bisherigen Vollabruf zurückgefallen — die Erinnerungen laufen dann wie
// vorher weiter, nur ohne die Ersparnis. Ein stiller Ausfall der
// Benachrichtigungen ist damit ausgeschlossen.
const REMINDER_KEYS = ['tasks', 'events', 'birthdays', 'taskExceptions'];

async function loadReminderData() {
  try {
    const select = REMINDER_KEYS.map(k => `data->${k}`).join(',');
    const res = await sbFetch(`heimplaner_sync?id=eq.shared&select=${encodeURIComponent(select)}`);
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length && REMINDER_KEYS.some(k => rows[0][k] != null)) {
        return rows[0];
      }
      if (Array.isArray(rows) && !rows.length) return null; // wirklich keine Daten
    }
    console.warn('push-check: schlanke Abfrage nicht verwendbar, nutze Vollabruf');
  } catch (e) {
    console.warn('push-check: schlanke Abfrage fehlgeschlagen, nutze Vollabruf:', e.message);
  }

  const res = await sbFetch('heimplaner_sync?id=eq.shared&select=data');
  const rows = await res.json();
  if (!Array.isArray(rows) || !rows.length) return null;
  return rows[0].data || {};
}

// Minuten seit Mitternacht in Zürcher Ortszeit — unabhängig davon, dass der
// Server in UTC läuft und die Schweiz je nach Jahreszeit ein oder zwei Stunden
// vorgeht.
function zurichMinutesOfDay(date) {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false })
    .formatToParts(date).reduce((a, x) => (a[x.type] = x.value, a), {});
  return parseInt(p.hour, 10) * 60 + parseInt(p.minute, 10);
}

// Nachtruhe: ab 23:05 bis 06:00 Zürcher Zeit wird nichts verschickt.
// Warum 23:05 und nicht 23:00: der Lauf um 23:00 deckt mit seinem
// rückblickenden Fenster noch die Erinnerungen ab, die zwischen 22:54 und
// 23:00 fällig wurden. Würde man dort schon abbrechen, gingen die verloren.
const NACHT_START_MIN = 23 * 60 + 5;
const NACHT_ENDE_MIN = 6 * 60;

function istNachtruhe(date) {
  const m = zurichMinutesOfDay(date);
  return m >= NACHT_START_MIN || m < NACHT_ENDE_MIN;
}

export default async () => {
  if (!SUPABASE_URL || !SUPABASE_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error('push-check: SUPABASE_URL/SUPABASE_KEY/VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY fehlen');
    return new Response('missing env vars', { status: 500 });
  }

  // Zweite, genaue Hälfte der Nachtpause. Die grobe Eingrenzung macht der
  // Zeitplan unten (der spart die Aufrufe), aber der läuft in UTC und kann
  // der Sommerzeit nicht folgen — diese Prüfung schneidet die Ränder sauber ab.
  if (istNachtruhe(new Date())) {
    return new Response('Nachtruhe', { status: 200 });
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  // Nur laden, was für Erinnerungen gebraucht wird.
  // Diese Function läuft ~43'200 Mal pro Monat; ein Vollabruf des HP-Objekts
  // (dominiert von der Rezeptbibliothek, dazu Budget, Notizen, Menüplan und
  // Tombstones) war damit der grösste Einzelposten beim Supabase-Egress —
  // ganz ohne dass die App überhaupt geöffnet wird.
  // Gebraucht werden nur tasks, events, birthdays und taskExceptions.
  const HP = await loadReminderData();
  if (!HP) return new Response('no data', { status: 200 });

  const subsRes = await sbFetch('push_subscriptions?select=id,endpoint,p256dh,auth,who');
  const subs = await subsRes.json();
  if (!subs.length) return new Response('no subscribers', { status: 200 });

  const now = Date.now();
  // Rückblickendes Fenster: erfasst alles, was seit dem letzten Lauf fällig wurde.
  // (Ein vorausschauendes Fenster verpasst Erinnerungen, sobald der Cron-Lauf
  // auch nur ein paar Sekunden nach der eigentlichen Fälligkeit startet.)
  // Eine Minute mehr als das Cron-Intervall (5 Min), damit zwischen zwei Läufen
  // nichts durchrutscht. Die Überschneidung fängt die Dedup-Tabelle ab.
  const windowStart = now - 6 * 60000;
  const todayKey = zurichDateKey(new Date(now));
  const tomorrowKey = addDaysToKey(todayKey, 1);
  const due = [];

  // Wöchentliche Aufgaben (heute + morgen prüfen, wegen möglichem Tageswechsel bei der Erinnerungszeit)
  const exceptions = HP.taskExceptions || {};
  ['p1', 'p2', 'shared'].forEach(taskWho => {
    ((HP.tasks && HP.tasks[taskWho]) || []).forEach(task => {
      if (!task.time || task.reminder === '' || task.reminder === undefined) return;
      const off = parseInt(task.reminder) || 0;
      [todayKey, tomorrowKey].forEach(dateKey => {
        if (!taskOccursOn(task, dateKey, exceptions)) return;
        const fire = zonedTimeToUtcMs(dateKey, task.time) - off * 60000;
        if (fire > windowStart && fire <= now) {
          due.push({ who: taskWho, title: `${task.emoji || '⭐'} ${reminderLabel(off)}: ${task.name}`, body: 'Heimplaner', tag: `${task.id}-${dateKey}` });
        }
      });
    });
  });

  // Einmalige Termine
  (HP.events || []).forEach(ev => {
    if (!ev.time || !ev.date || ev.reminder === 'off') return;
    const off = (ev.reminder === undefined || ev.reminder === '') ? 15 : (parseInt(ev.reminder) || 0);
    const fire = zonedTimeToUtcMs(ev.date, ev.time) - off * 60000;
    if (fire > windowStart && fire <= now) {
      due.push({ who: ev.who || 'shared', title: `${ev.chore ? '🧹' : '📅'} ${reminderLabel(off)}: ${ev.name}`, body: `${ev.date} um ${ev.time}`, tag: `ev-${ev.id}-${ev.date}-${ev.time}-${off}` });
    }
  });

  // Geburtstage (immer 09:00, geht an alle)
  (HP.birthdays || []).forEach(b => {
    const nextKey = getNextBirthdayKey(b.date, todayKey);
    const fire = zonedTimeToUtcMs(nextKey, '09:00');
    if (fire > windowStart && fire <= now) {
      due.push({ who: 'shared', title: `🎂 ${b.name} hat heute Geburtstag!`, body: '', tag: `bd-${b.id}` });
    }
  });

  if (!due.length) return new Response('nothing due', { status: 200 });

  // Dedup: da sich die rückblickenden Zeitfenster aufeinanderfolgender Läufe
  // überschneiden können, merken wir bereits verschickte Erinnerungen und
  // überspringen sie beim nächsten Lauf.
  const filterValue = 'in.(' + due.map(d => `"${d.tag}"`).join(',') + ')';
  const sentRes = await sbFetch(`push_sent_log?tag=${encodeURIComponent(filterValue)}&select=tag`);
  const alreadySent = new Set((await sentRes.json()).map(r => r.tag));
  const toSend = due.filter(d => !alreadySent.has(d.tag));
  if (!toSend.length) return new Response('nothing new (all deduped)', { status: 200 });

  let sent = 0;
  for (const sub of subs) {
    const pushSub = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } };
    for (const item of toSend) {
      // Nur an die Person(en) senden, für die der Termin/die Aufgabe gilt.
      // Unbekannte/fehlende Rolle (altes Abo, noch nicht neu registriert) -> sicherheitshalber trotzdem senden.
      if (item.who !== 'shared' && sub.who && sub.who !== item.who) continue;
      try {
        // urgency:'high' -> bittet den Push-Dienst (v.a. Android/FCM) um sofortige
        // Zustellung statt sie aus Akkuspar-Gründen zu verzögern.
        await webpush.sendNotification(pushSub, JSON.stringify(item), { urgency: 'high' });
        sent++;
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          await sbFetch(`push_subscriptions?id=eq.${sub.id}`, { method: 'DELETE' });
        } else {
          console.error('push send failed', e.statusCode, e.message);
        }
      }
    }
  }

  await sbFetch('push_sent_log', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(toSend.map(d => ({ tag: d.tag })))
  });

  return new Response(`sent ${sent} notification(s) for ${toSend.length} reminder(s)`, { status: 200 });
};

// Alle 5 Minuten statt jede Minute, und nur in den UTC-Stunden 4–22.
//
// Warum die Stundeneingrenzung hier und nicht nur in der Function: ein früher
// Abbruch IM Code spart zwar Supabase-Abfragen, aber der Netlify-Aufruf ist
// trotzdem passiert und zählt aufs Kontingent. Nur ein engerer Zeitplan spart
// echte Aufrufe.
//
// Warum 4–22 UTC: der Zeitplan kann der Sommerzeit nicht folgen. Das Fenster
// deckt die Zürcher Zeit 06:00–23:59 im Sommer (UTC+2) und 05:00–23:59 im
// Winter (UTC+1) ab — also immer etwas mehr als nötig. Die genaue Grenze
// zieht istNachtruhe() oben.
//
// 43'200 Läufe/Monat -> rund 6'800.
export const config = { schedule: '*/5 4-22 * * *' };
