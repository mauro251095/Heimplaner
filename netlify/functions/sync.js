// ═══════════════════════════════════════════════
// NETLIFY FUNCTION – Supabase Proxy
// Der API Key bleibt hier, nie im Frontend-Code
// ═══════════════════════════════════════════════

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const APP_PASSWORD = process.env.APP_PASSWORD;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-app-password',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Passwort prüfen
  const pw = event.headers['x-app-password'];
  if (pw !== APP_PASSWORD) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Ungültiges Passwort' })
    };
  }

  try {
    // GET — Daten laden
    if (event.httpMethod === 'GET') {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/heimplaner_sync?id=eq.shared&select=data,updated_at`,
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
