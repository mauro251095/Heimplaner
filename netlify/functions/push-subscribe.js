// ═══════════════════════════════════════════════
// NETLIFY FUNCTION – Push-Abo speichern
// Nimmt ein PushSubscription-Objekt vom Client entgegen
// und legt es (upsert) in Supabase ab.
// ═══════════════════════════════════════════════

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const APP_PASSWORD = process.env.APP_PASSWORD;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-app-password',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const pw = event.headers['x-app-password'];
  if (pw !== APP_PASSWORD) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Ungültiges Passwort' }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const sub = body.subscription;
    if (!sub || !sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ungültiges Abo' }) };
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?on_conflict=endpoint`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('push-subscribe: Supabase insert failed', res.status, err);
      return { statusCode: 500, headers, body: JSON.stringify({ error: err }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error('push-subscribe: unexpected error', e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
