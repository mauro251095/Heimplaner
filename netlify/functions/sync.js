// ═══════════════════════════════════════════════
// NETLIFY FUNCTION – Supabase Proxy
// Der API Key bleibt hier, nie im Frontend-Code
// ═══════════════════════════════════════════════

const { guardPassword } = require('../lib/throttle');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const APP_PASSWORD = process.env.APP_PASSWORD;

// Grosszügig über dem, was Rezepte/Budget/Notizen/Menüplan heute brauchen,
// aber weit unter dem, was Netlify Functions synchron überhaupt annehmen -
// verhindert, dass ein Bug oder wer auch immer das Passwort kennt, mit einem
// beliebig grossen Body das Supabase-/Netlify-Kontingent sprengt.
const MAX_BODY_CHARS = 2_000_000;

// "__proto__"/"constructor"/"prototype" als eigener, aufzählbarer Objekt-Key
// kann nur über JSON.parse oder absichtlich entstehen (ein normales
// Objekt-Literal {__proto__: x} setzt stattdessen das Prototype, erzeugt also
// nie so einen Key) - taucht einer davon auf, ist das kein legitimer
// Datensatz. Ungefiltert würde er beim nächsten Poll via
// Object.assign(HP, remote) auf dem Partnergerät dessen Prototype-Kette
// umbiegen (heimplaner-sync.js, mergeData). Serverseitig geprüft, weil ein
// Angriff hier auch direkt per HTTP ohne den Client laufen könnte.
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
function hasUnsafeKey(v) {
  if (Array.isArray(v)) return v.some(hasUnsafeKey);
  if (v && typeof v === 'object') {
    return Object.keys(v).some(k => UNSAFE_KEYS.has(k) || hasUnsafeKey(v[k]));
  }
  return false;
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': 'https://sage-salmiakki-4ab33e.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type, x-app-password',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Passwort prüfen — mit Fehlversuchsbremse und Vergleich in konstanter Zeit.
  // Muss vor jeder anderen Logik stehen.
  const denied = await guardPassword(event, headers, {
    supabaseUrl: SUPABASE_URL, supabaseKey: SUPABASE_KEY, appPassword: APP_PASSWORD
  });
  if (denied) return denied;

  try {
    // GET — Daten laden
    // ?meta=1 liefert NUR den Zeitstempel (ohne den kompletten Datensatz).
    // Der Client pollt damit alle 15 s ~50 Byte statt des ganzen HP-Objekts und
    // holt die Vollversion erst, wenn sich updated_at tatsächlich geändert hat.
    // Spart Supabase-Egress UND Netlify-Bandbreite, weil beides durch diese
    // Function läuft. Ohne den Parameter bleibt das Verhalten unverändert.
    if (event.httpMethod === 'GET') {
      const metaOnly = (event.queryStringParameters || {}).meta === '1';
      const select = metaOnly ? 'updated_at' : 'data,updated_at';
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/heimplaner_sync?id=eq.shared&select=${select}`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      const rows = await res.json();
      if (!rows.length) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Keine Daten' }) };
      return { statusCode: 200, headers, body: JSON.stringify(rows[0]) };
    }

    // POST — Daten speichern
    if (event.httpMethod === 'POST') {
      if ((event.body || '').length > MAX_BODY_CHARS) {
        return { statusCode: 413, headers, body: JSON.stringify({ error: 'Datensatz zu gross' }) };
      }
      const body = JSON.parse(event.body || '{}');
      if (!body.data || typeof body.data !== 'object' || Array.isArray(body.data)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Keine Daten' }) };
      }
      if (hasUnsafeKey(body.data)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ungültige Daten' }) };
      }

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/heimplaner_sync?id=eq.shared`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ data: body.data, updated_at: new Date().toISOString() })
        }
      );

      // Der Supabase-Fehlertext bleibt im Netlify-Log, geht aber nicht an den
      // Client: er nennt Tabellen-, Spalten- und Constraint-Namen. Das ist
      // zwar erst nach bestandener Passwortpruefung erreichbar, ist dort aber
      // trotzdem eine unnoetige Auskunft ueber den Innenbau.
      if (!res.ok) {
        console.error('sync: Supabase PATCH fehlgeschlagen', res.status, await res.text());
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Speichern fehlgeschlagen' }) };
      }

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  } catch (e) {
    console.error('sync: unerwarteter Fehler', e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Serverfehler' }) };
  }
};
