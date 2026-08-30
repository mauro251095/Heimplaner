// ═══════════════════════════════════════════════
// HEIMPLANER – LOGIN SYSTEM
// Läuft bevor die App geladen wird
// ═══════════════════════════════════════════════

const LOGIN_KEY = 'hp_login_token';
const LOGIN_EXPIRY_DAYS = 30;

function checkLogin() {
  const stored = localStorage.getItem(LOGIN_KEY);
  if (!stored) return false;
  try {
    const { expiry } = JSON.parse(stored);
    if (Date.now() > expiry) {
      localStorage.removeItem(LOGIN_KEY);
      return false;
    }
    return true;
  } catch(e) {
    return false;
  }
}

async function doLogin(username, password) {
  let ok = false;
  try {
    const res = await fetch('/.netlify/functions/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const json = await res.json();
    ok = !!json.ok;
  } catch (e) {
    return false;
  }
  if (!ok) return false;
  const expiry = Date.now() + LOGIN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(LOGIN_KEY, JSON.stringify({ username, expiry }));
  return true;
}

function getLoggedInUser() {
  const stored = localStorage.getItem(LOGIN_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored).username;
  } catch(e) {
    return null;
  }
}

function logout() {
  localStorage.removeItem(LOGIN_KEY);
  location.reload();
}

function showLoginScreen() {
  document.body.style.overflow = 'hidden';
  const overlay = document.createElement('div');
  overlay.id = 'login-overlay';
  overlay.style.cssText = [
    'position:fixed','inset:0','z-index:1000',
    'background:#0d0f14',
    'display:flex','align-items:center','justify-content:center',
    'font-family:Inter,sans-serif','padding:20px'
  ].join(';');

  overlay.innerHTML = `
    <div style="width:100%;max-width:360px">
      <!-- Logo -->
      <div style="text-align:center;margin-bottom:32px">
        <div style="font-size:3rem;margin-bottom:8px">🏠</div>
        <h1 style="font-family:'Playfair Display',serif;font-size:1.8rem;color:#e8eaf0;margin-bottom:4px">Heimplaner</h1>
        <div style="font-size:.78rem;color:#6b7280;text-transform:uppercase;letter-spacing:.1em">Privater Zugang</div>
      </div>

      <!-- Form -->
      <div style="background:#13161e;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:28px">
        <div style="margin-bottom:16px">
          <label style="font-size:.72rem;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:6px">Benutzername</label>
          <input id="login-user" type="text" placeholder="z.B. mauro"
            autocomplete="username" autocapitalize="none"
            style="width:100%;background:#1a1d27;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:10px 14px;color:#e8eaf0;font-family:Inter,sans-serif;font-size:.9rem;outline:none;transition:border-color .15s"
            onfocus="this.style.borderColor='#6C8EFF'"
            onblur="this.style.borderColor='rgba(255,255,255,0.07)'">
        </div>
        <div style="margin-bottom:24px">
          <label style="font-size:.72rem;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:6px">Passwort</label>
          <input id="login-pw" type="password" placeholder="••••••••"
            autocomplete="current-password"
            style="width:100%;background:#1a1d27;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:10px 14px;color:#e8eaf0;font-family:Inter,sans-serif;font-size:.9rem;outline:none;transition:border-color .15s"
            onfocus="this.style.borderColor='#6C8EFF'"
            onblur="this.style.borderColor='rgba(255,255,255,0.07)'"
            onkeydown="if(event.key==='Enter')attemptLogin()">
        </div>
        <div id="login-error" style="display:none;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);border-radius:8px;padding:9px 12px;font-size:.79rem;color:#f87171;margin-bottom:16px;text-align:center">
          ❌ Benutzername oder Passwort falsch
        </div>
        <button id="login-submit-btn" onclick="attemptLogin()" style="width:100%;background:#6C8EFF;color:#fff;border:none;border-radius:8px;padding:12px;font-family:Inter,sans-serif;font-size:.9rem;font-weight:600;cursor:pointer;transition:opacity .15s" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
          Einloggen →
        </button>
      </div>
      <div style="text-align:center;margin-top:16px;font-size:.7rem;color:#6b7280">
        Privater Heimplaner · Kein öffentlicher Zugang
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('login-user')?.focus(), 100);
}

async function attemptLogin() {
  const user = document.getElementById('login-user')?.value.trim();
  const pw = document.getElementById('login-pw')?.value;
  const errEl = document.getElementById('login-error');
  const btn = document.getElementById('login-submit-btn');

  if (!user || !pw) {
    if (errEl) { errEl.textContent = '⚠️ Bitte alle Felder ausfüllen'; errEl.style.display = 'block'; }
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'Prüfe…'; }
  const success = await doLogin(user, pw);
  if (btn) { btn.disabled = false; btn.textContent = 'Einloggen →'; }

  if (success) {
    // Erfolg — Login-Screen entfernen
    document.getElementById('login-overlay')?.remove();
    document.body.style.overflow = '';
    // Logout-Button zur App hinzufügen
    addLogoutButton(user);
  } else {
    if (errEl) { errEl.textContent = '❌ Benutzername oder Passwort falsch'; errEl.style.display = 'block'; }
    document.getElementById('login-pw').value = '';
    document.getElementById('login-pw').focus();
  }
}

function addLogoutButton(username) {
  setTimeout(() => {
    const topbar = document.querySelector('.topbar');
    if (!topbar || document.getElementById('logout-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'logout-btn';
    btn.title = 'Ausloggen';
    btn.style.cssText = 'background:none;border:1px solid rgba(255,255,255,0.07);border-radius:6px;color:#6b7280;font-family:Inter,sans-serif;font-size:.7rem;padding:3px 9px;cursor:pointer;display:flex;align-items:center;gap:4px';
    btn.innerHTML = '<span class="lb-icon">👤</span><span class="lb-text"> ' + username + '</span>';
    btn.onclick = () => {
      if (confirm('Ausloggen?')) logout();
    };
    // Vor dem Sync-Button einfügen falls vorhanden
    const syncBar = document.getElementById('sync-bar');
    if (syncBar) topbar.insertBefore(btn, syncBar);
    else topbar.appendChild(btn);
  }, 1000);
}

// ── Init ──────────────────────────────────────
(function() {
  if (!checkLogin()) {
    // DOM muss bereit sein
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showLoginScreen);
    } else {
      showLoginScreen();
    }
  } else {
    // Bereits eingeloggt — Logout-Button zeigen
    const user = getLoggedInUser();
    if (user) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => addLogoutButton(user));
      } else {
        addLogoutButton(user);
      }
    }
  }
})();