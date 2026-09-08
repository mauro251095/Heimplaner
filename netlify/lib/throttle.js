// ═══════════════════════════════════════════════
// Bremse gegen automatisiertes Durchprobieren des APP_PASSWORD
//
// Warum hier und nicht in netlify/functions/: Dateien direkt in functions/
// werden von Netlify je zu einem öffentlich erreichbaren Endpunkt. Dieses
// Modul soll keiner sein — es wird von sync.js und push-subscribe.js per
// require('../lib/throttle') eingebunden und mitgebündelt.
//
// Warum überhaupt: /.netlify/functions/sync ist der einzige Weg zu allen
// Daten, gesichert nur durch APP_PASSWORD. Da das Repo öffentlich ist, ist
// die URL bekannt. Ohne Bremse kann man dort beliebig viele Passwörter pro
// Sekunde durchprobieren.
//
// Warum die Zähler in Supabase und nicht im Speicher: Bei Serverless hat
// jede Instanz ihren eigenen Speicher. Ein In-Memory-Zähler wird durch
// paralleles Hochskalieren wirkungslos — genau im Angriffsfall.
//
// Kosten: ein zusätzlicher Lesevorgang pro Anfrage (~100 Byte). Bei rund
// 29'000 Polls im Monat sind das ~3 MB Egress — vernachlässigbar gegenüber
// dem, was das Polling vorher allein verbraucht hat.
// ═══════════════════════════════════════════════

const crypto = require('crypto');

const WINDOW_MS = 15 * 60 * 1000;   // Beobachtungsfenster für Fehlversuche
const MAX_FAILS  = 10;              // danach wird gesperrt
const BLOCK_MS   = 15 * 60 * 1000;  // Sperrdauer

// Netlify setzt diesen Header selbst; er ist vom Client nicht fälschbar.
function clientIp(event) {
  const h = event.headers || {};
  return h['x-nf-client-connection-ip'] || h['client-ip'] || h['x-forwarded-for']?.split(',')[0].trim() || 'unknown';
}

function sbHeaders(key, extra) {
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(extra || {}) };
}

// Vergleich mit konstanter Laufzeit: verhindert, dass sich das Passwort über
// Antwortzeiten Zeichen für Zeichen erraten lässt. Ein einfaches !== bricht
// beim ersten abweichenden Zeichen ab und ist damit messbar unterschiedlich
// schnell.
function safeEqual(a, b) {
  const ba = Buffer.from(String(a == null ? '' : a), 'utf8');
  const bb = Buffer.from(String(b == null ? '' : b), 'utf8');
  if (ba.length !== bb.length) {
    // Auch hier einen Vergleich durchführen, damit die Laufzeit nicht schon
    // an der Länge ablesbar ist.
    crypto.timingSafeEqual(ba, ba);
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

async function readRow(url, key, ip) {
  const res = await fetch(
    `${url}/rest/v1/auth_throttle?ip=eq.${encodeURIComponent(ip)}&select=fails,window_start,blocked_until`,
    { headers: sbHeaders(key) }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function upsertRow(url, key, row) {
  await fetch(`${url}/rest/v1/auth_throttle?on_conflict=ip`, {
    method: 'POST',
    headers: sbHeaders(key, { Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify(row)
  });
}

/**
 * Prüft das Passwort und führt dabei die Fehlversuchsbremse.
 * Rückgabe: null wenn alles in Ordnung ist, sonst eine fertige HTTP-Antwort.
 *
 * Bewusst fail-open: Ist die Tabelle nicht vorhanden oder Supabase gerade
 * nicht erreichbar, greift weiterhin die reine Passwortprüfung. Ein Fehler
 * in der Bremse darf euch nicht aus eurer eigenen App aussperren.
 */
async function guardPassword(event, headers, { supabaseUrl, supabaseKey, appPassword }) {
  const provided = (event.headers || {})['x-app-password'];
  const ip = clientIp(event);
  const now = Date.now();

  let row = null;
  try {
    row = await readRow(supabaseUrl, supabaseKey, ip);
  } catch (e) {
    console.warn('throttle: Zustand nicht lesbar, prüfe nur das Passwort:', e.message);
  }

  // Gesperrt? Dann auch ein richtiges Passwort nicht durchlassen — sonst
  // bremst die Sperre das Durchprobieren gar nicht.
  if (row && row.blocked_until && new Date(row.blocked_until).getTime() > now) {
    const retryAfter = Math.ceil((new Date(row.blocked_until).getTime() - now) / 1000);
    return {
      statusCode: 429,
      headers: { ...headers, 'Retry-After': String(retryAfter) },
      body: JSON.stringify({ error: 'Zu viele Fehlversuche. Bitte später erneut versuchen.' })
    };
  }

  if (safeEqual(provided, appPassword)) {
    // Erfolg: Zähler nur zurücksetzen, wenn tatsächlich etwas zu löschen ist.
    if (row && row.fails > 0) {
      try {
        await upsertRow(supabaseUrl, supabaseKey, { ip, fails: 0, window_start: new Date(now).toISOString(), blocked_until: null });
      } catch (e) { /* nicht kritisch */ }
    }
    return null;
  }

  // Fehlversuch zählen. Fenster neu beginnen, wenn das alte abgelaufen ist.
  const windowStart = row && row.window_start ? new Date(row.window_start).getTime() : 0;
  const inWindow = now - windowStart < WINDOW_MS;
  const fails = (inWindow && row ? row.fails : 0) + 1;
  const blockedUntil = fails >= MAX_FAILS ? new Date(now + BLOCK_MS).toISOString() : null;

  try {
    await upsertRow(supabaseUrl, supabaseKey, {
      ip,
      fails,
      window_start: new Date(inWindow ? windowStart : now).toISOString(),
      blocked_until: blockedUntil
    });
  } catch (e) {
    console.warn('throttle: Fehlversuch nicht speicherbar:', e.message);
  }

  return {
    statusCode: blockedUntil ? 429 : 401,
    headers: blockedUntil ? { ...headers, 'Retry-After': String(Math.ceil(BLOCK_MS / 1000)) } : headers,
    body: JSON.stringify({
      error: blockedUntil ? 'Zu viele Fehlversuche. Bitte später erneut versuchen.' : 'Ungültiges Passwort'
    })
  };
}

module.exports = { guardPassword, safeEqual, clientIp, WINDOW_MS, MAX_FAILS, BLOCK_MS };
