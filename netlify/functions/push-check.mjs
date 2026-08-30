// ═══════════════════════════════════════════════
// NETLIFY SCHEDULED FUNCTION – Push-Erinnerungen
// Läuft alle 5 Minuten, prüft Aufgaben/Termine/Geburtstage
// auf fällige Erinnerungen und verschickt Web-Push an alle
// registrierten Geräte.
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

export default async () => {
  if (!SUPABASE_URL || !SUPABASE_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error('push-check: SUPABASE_URL/SUPABASE_KEY/VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY fehlen');
    return new Response('missing env vars', { status: 500 });
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const dataRes = await sbFetch('heimplaner_sync?id=eq.shared&select=data');
  const rows = await dataRes.json();
  if (!rows.length) return new Response('no data', { status: 200 });
  const HP = rows[0].data || {};

  const subsRes = await sbFetch('push_subscriptions?select=id,endpoint,p256dh,auth');
  const subs = await subsRes.json();
  if (!subs.length) return new Response('no subscribers', { status: 200 });

  const now = Date.now();
  // Rückblickendes Fenster: erfasst alles, was seit dem letzten Lauf fällig wurde.
  // (Ein vorausschauendes Fenster verpasst Erinnerungen, sobald der Cron-Lauf
  // auch nur ein paar Sekunden nach der eigentlichen Fälligkeit startet.)
  const windowStart = now - 5 * 60000;
  const todayKey = zurichDateKey(new Date(now));
  const tomorrowKey = addDaysToKey(todayKey, 1);
  const due = [];

  // Wöchentliche Aufgaben (heute + morgen prüfen, wegen möglichem Tageswechsel bei der Erinnerungszeit)
  const exceptions = HP.taskExceptions || {};
  ['p1', 'p2', 'shared'].forEach(who => {
    ((HP.tasks && HP.tasks[who]) || []).forEach(task => {
      if (!task.time || task.reminder === '' || task.reminder === undefined) return;
      const off = parseInt(task.reminder) || 0;
      [todayKey, tomorrowKey].forEach(dateKey => {
        if (!taskOccursOn(task, dateKey, exceptions)) return;
        const fire = zonedTimeToUtcMs(dateKey, task.time) - off * 60000;
        if (fire > windowStart && fire <= now) {
          due.push({ title: `${task.emoji || '⭐'} ${reminderLabel(off)}: ${task.name}`, body: 'Heimplaner', tag: `${task.id}-${dateKey}` });
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
      due.push({ title: `📅 ${reminderLabel(off)}: ${ev.name}`, body: `${ev.date} um ${ev.time}`, tag: `ev-${ev.id}` });
    }
  });

  // Geburtstage (immer 09:00)
  (HP.birthdays || []).forEach(b => {
    const nextKey = getNextBirthdayKey(b.date, todayKey);
    const fire = zonedTimeToUtcMs(nextKey, '09:00');
    if (fire > windowStart && fire <= now) {
      due.push({ title: `🎂 ${b.name} hat heute Geburtstag!`, body: '', tag: `bd-${b.id}` });
    }
  });

  if (!due.length) return new Response('nothing due', { status: 200 });

  let sent = 0;
  for (const sub of subs) {
    const pushSub = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } };
    for (const item of due) {
      try {
        await webpush.sendNotification(pushSub, JSON.stringify(item));
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

  return new Response(`sent ${sent} notification(s) for ${due.length} reminder(s)`, { status: 200 });
};

export const config = { schedule: '*/5 * * * *' };
