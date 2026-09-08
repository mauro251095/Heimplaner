// ═══════════════════════════════════════════════
// NETLIFY FUNCTION – Supabase Proxy
// Der API Key bleibt hier, nie im Frontend-Code
// ═══════════════════════════════════════════════

const { guardPassword } = require('../lib/throttle');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const APP_PASSWORD = process.env.APP_PASSWORD;

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
      const body = JSON.parse(event.body || '{}');
      if (!body.data) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Keine Daten' }) };

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

      if (!res.ok) {
        const err = await res.text();
        return { statusCode: 500, headers, body: JSON.stringify({ error: err }) };
      }

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
