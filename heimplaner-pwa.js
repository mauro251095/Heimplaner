// ═══════════════════════════════════════════════
// HEIMPLANER – PWA-Schale
// Service Worker, Deep-Link ueber ?view=, Installationsbanner.
//
// Ausgelagert aus dem inline-<script> in index.html, damit die CSP
// script-src-elem 'self' setzen kann – dann laesst der Browser gar kein
// eingeschleustes <script> mehr laufen.
//
// Reihenfolge: MUSS nach heimplaner-app.js kommen (nutzt setView).
// Steht als letztes, weil hier nur Listener registriert werden.
// ═══════════════════════════════════════════════

// ── Service Worker ──────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.warn('SW failed:', err));
  });
}

// ── Deep link via URL param ──────────────────
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  if (view) {
    setTimeout(() => {
      const btn = document.querySelector('[data-view="'+view+'"]');
      if (btn) setView(view, btn);
    }, 100);
  }
});

// ── Install Banner ───────────────────────────
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallBanner();
});

function showInstallBanner() {
  if (document.getElementById('install-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'install-banner';
  banner.style.cssText = [
    'position:fixed','top:0','left:0','right:0','z-index:300',
    'background:linear-gradient(135deg,#1a1d27,#13161e)',
    'border-bottom:1px solid rgba(108,142,255,.3)',
    'padding:12px 20px','display:flex','align-items:center','gap:12px',
    'font-family:Inter,sans-serif','font-size:.82rem','color:#e8eaf0',
    'box-shadow:0 4px 20px rgba(0,0,0,.4)'
  ].join(';');
  banner.innerHTML =
    '<span style="font-size:1.4rem">🏠</span>'+
    '<div style="flex:1"><div style="font-weight:600">Heimplaner installieren</div>'+
    '<div style="font-size:.72rem;color:#6b7280;margin-top:1px">Als App auf dem Homescreen speichern</div></div>'+
    '<button onclick="installApp()" style="background:#6C8EFF;color:#fff;border:none;border-radius:8px;padding:7px 16px;font-family:Inter,sans-serif;font-size:.78rem;font-weight:600;cursor:pointer">Installieren</button>'+
    '<button onclick="document.getElementById(\'install-banner\').remove()" style="background:none;border:none;color:#6b7280;cursor:pointer;font-size:1.1rem;padding:4px">✕</button>';
  document.body.insertBefore(banner, document.body.firstChild);
}

async function installApp() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById('install-banner')?.remove();
  if (outcome === 'accepted') {
    setTimeout(() => {
      const t = document.getElementById('toast');
      if (t) { t.textContent = '✅ Heimplaner installiert!'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }
    }, 500);
  }
}

// iOS: show manual install hint (no beforeinstallprompt on iOS)
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isInStandalone = window.navigator.standalone === true;
if (isIOS && !isInStandalone) {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (document.getElementById('install-banner')) return;
      const banner = document.createElement('div');
      banner.id = 'install-banner';
      banner.style.cssText = [
        'position:fixed','bottom:70px','left:16px','right:16px','z-index:300',
        'background:linear-gradient(135deg,#1a1d27,#13161e)',
        'border:1px solid rgba(108,142,255,.3)',
        'border-radius:14px','padding:14px 16px',
        'display:flex','align-items:flex-start','gap:12px',
        'font-family:Inter,sans-serif','font-size:.8rem','color:#e8eaf0',
        'box-shadow:0 8px 30px rgba(0,0,0,.5)'
      ].join(';');
      banner.innerHTML =
        '<span style="font-size:1.6rem;flex-shrink:0">🏠</span>'+
        '<div style="flex:1">'+
        '<div style="font-weight:600;margin-bottom:4px">Auf dem Homescreen installieren</div>'+
        '<div style="font-size:.73rem;color:#a8b2d8;line-height:1.5">'+
        'Tippe auf <b style="color:#6C8EFF">Teilen</b> (□↑) unten in Safari,<br>'+
        'dann <b style="color:#6C8EFF">„Zum Home-Bildschirm"</b> wählen.</div></div>'+
        '<button onclick="this.parentElement.remove()" style="background:none;border:none;color:#6b7280;cursor:pointer;font-size:1.1rem;flex-shrink:0">✕</button>';
      document.body.appendChild(banner);
      setTimeout(() => banner.remove(), 12000);
    }, 3000);
  });
}
