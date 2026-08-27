// ═══════════════════════════════════════════════
// NETLIFY FUNCTION – Auth
// Gibt verschlüsselte Benutzerdaten an die App
// ═══════════════════════════════════════════════
 
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/javascript'
  };
 
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
 
  const users = process.env.HP_USERS || '';
 
  // Gibt die Benutzerdaten als JavaScript-Variable zurück
  // Nur der Netlify-Server kennt HP_USERS — nie im Code sichtbar
  return {
    statusCode: 200,
    headers,
    body: `window.__HP_USERS__ = ${JSON.stringify(users)};`
  };
};
 
