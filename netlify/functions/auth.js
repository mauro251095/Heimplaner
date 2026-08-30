// ═══════════════════════════════════════════════
// NETLIFY FUNCTION – Auth
// Prüft Benutzername/Passwort serverseitig gegen HP_USERS.
// HP_USERS verlässt den Server nie — nur ein Erfolg/Misserfolg
// wird zurückgegeben.
// ═══════════════════════════════════════════════

function parseUsers(raw) {
  const users = {};
  if (!raw) return users;
  raw.split(',').forEach(pair => {
    const idx = pair.indexOf(':');
    if (idx === -1) return;
    const name = pair.substring(0, idx).trim().toLowerCase();
    const pw = pair.substring(idx + 1).trim();
    if (name && pw) users[name] = pw;
  });
  return users;
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': 'https://sage-salmiakki-4ab33e.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const username = (body.username || '').trim().toLowerCase();
    const password = body.password || '';
    if (!username || !password) {
      return { statusCode: 400, headers, body: JSON.stringify({ ok: false }) };
    }
    const users = parseUsers(process.env.HP_USERS || '');
    const ok = users[username] === password;
    return { statusCode: 200, headers, body: JSON.stringify({ ok }) };
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false }) };
  }
};
