// ═══════════════════════════════════════════════
// HEIMPLANER – Push-Abo, Import/Export, Theme, Farben, Init
//
// Herausgeloest aus heimplaner-app.js (vormals 2381 Zeilen).
// Reine Verschiebung, kein Verhalten geaendert.
// Die Reihenfolge der Skript-Tags in index.html ist bindend – siehe CLAUDE.md.
// ═══════════════════════════════════════════════

// ── PUSH-BENACHRICHTIGUNGEN ────────────────────
// Erinnerungen werden serverseitig verschickt (Netlify Scheduled Function
// "push-check", alle 5 Min) — funktioniert auch bei geschlossener App.
// Der Client muss sich dafür nur einmal per Web Push registrieren.
const VAPID_PUBLIC_KEY='BBlPn5qKofB050Ej8ocesJJF4OFKQVo9D10w5w70ynSJpIRrbpchfI99qq-rrefJ62SeKbXQDoCf5Flo-OWLMNo';

function urlBase64ToUint8Array(base64String){
  const padding='='.repeat((4-base64String.length%4)%4);
  const base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');
  const raw=atob(base64);
  return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));
}

async function requestNotifPermission(){
  if(!NOTIF_OK){showToast('Benachrichtigungen nicht verfügbar');return false;}
  try{
    if(Notification.permission==='granted')return true;
    if(Notification.permission==='denied'){showToast('Benachrichtigungen blockiert');return false;}
    const r=await Notification.requestPermission();
    showToast(r==='granted'?'✅ Benachrichtigungen aktiviert':'Abgelehnt');
    return r==='granted';
  }catch(e){return false;}
}

async function subscribeToPush(){
  if(!NOTIF_OK||!('serviceWorker' in navigator)||!('PushManager' in window)){
    showToast('⚠️ Push wird auf diesem Gerät/Browser nicht unterstützt');
    return;
  }
  try{
    if(Notification.permission!=='granted')return;
    if(!syncPassword){showToast('⚠️ Bitte zuerst Synchronisation einrichten');return;}
    const reg=await navigator.serviceWorker.ready;
    let sub=await reg.pushManager.getSubscription();
    if(!sub) sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY)});
    const loginUser=(typeof getLoggedInUser==='function'?getLoggedInUser():'')||'';
    const who=loginUser.toLowerCase()==='mauro'?'p1':'p2';
    const res=await fetch('/.netlify/functions/push-subscribe',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-app-password':syncPassword},
      body:JSON.stringify({subscription:sub.toJSON(),who})
    });
    if(!res.ok){showToast('⚠️ Push-Server-Fehler: '+res.status);return;}
    showToast('🔔 Push-Erinnerungen aktiv');
  }catch(e){
    console.warn('Push-Registrierung fehlgeschlagen:',e);
    showToast('⚠️ Push-Fehler: '+(e && e.message ? e.message : e));
  }
}

function maybeNotifBanner(){
  if(!NOTIF_OK)return;
  try{
    if(Notification.permission!=='default')return;
    const bar=document.createElement('div');
    bar.id='notif-banner';
    bar.style.cssText='background:rgba(108,142,255,.12);border-bottom:1px solid rgba(108,142,255,.25);padding:8px 20px;font-size:.78rem;display:flex;align-items:center;gap:10px;flex-shrink:0';
    bar.innerHTML='<span>🔔 Erinnerungen aktivieren?</span>'+
      '<button onclick="requestNotifPermission().then(ok=>{if(ok)subscribeToPush();document.getElementById(\'notif-banner\')?.remove()})" style="background:var(--p1);color:#fff;border:none;border-radius:6px;padding:4px 12px;font-family:Inter,sans-serif;font-size:.75rem;cursor:pointer">Erlauben</button>'+
      '<button onclick="document.getElementById(\'notif-banner\')?.remove()" style="background:none;border:none;color:var(--muted);cursor:pointer;margin-left:auto;font-size:1rem">✕</button>';
    const main=document.querySelector('.main'), tb=document.querySelector('.topbar');
    if(main&&tb)main.insertBefore(bar,tb.nextSibling);
  }catch(e){}
}

// ── IMPORT / EXPORT ───────────────────────────



// ── JSON BACKUP ──────────────────────────────────
function exportJSON() {
  const blob=new Blob([JSON.stringify(HP,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download='heimplaner-backup-'+dk(new Date())+'.json'; a.click();
  URL.revokeObjectURL(a.href);
}
function importJSON(e) {
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>{
    try {
      // Sicherheits-Nachzug (keine Weiterentwicklung): alt/ laeuft auf
      // derselben Origin und demselben localStorage wie die App, ein hier
      // eingespieltes Fremd-Backup traefe also beide.
      const d=sanitizeRemote(JSON.parse(ev.target.result));
      if(!d.tasks||!d.names) throw new Error('Ungültiges Format');
      Object.assign(HP,d); HP_save(); render();
      showToast('✅ Daten importiert');
    } catch(err) { showToast('❌ Fehler: '+err.message); }
  };
  reader.readAsText(file);
}

function exportICS(){
  const inclTasks=document.getElementById('ics-tasks')?.checked!==false;
  const inclEvents=document.getElementById('ics-events')?.checked!==false;
  const inclMeals=document.getElementById('ics-meals')?.checked!==false;
  const inclP1=document.getElementById('ics-p1')?.checked!==false;
  const inclP2=document.getElementById('ics-p2')?.checked!==false;
  const inclShared=document.getElementById('ics-shared')?.checked!==false;
  const inclNotes=false;
  const events=[], now=new Date();
  if(inclTasks){
    for(let w=0;w<4;w++){
      getWeekDates(w).forEach((date,di)=>{
        allTasks().filter(t=>taskOccursOn(t,dk(date))&&t.time&&(
        (t.who==='p1'&&inclP1)||(t.who==='p2'&&inclP2)||(t.who==='shared'&&inclShared)
      )).forEach(t=>{
          const[h,m]=t.time.split(':').map(Number);
          const s=new Date(date); s.setHours(h,m,0,0);
          let e;
          if(t.timeEnd){const[eh,em]=t.timeEnd.split(':').map(Number);e=new Date(date);e.setHours(eh,em,0,0);if(e<=s)e.setHours(eh+24,em,0,0);}
          else{e=new Date(s);e.setHours(h,m+30,0,0);}
          events.push({summary:t.emoji+' '+t.name,start:s,end:e,desc:'Heimplaner Task'});
        });
      });
    }
  }
  // One-time events
  if(inclEvents){(HP.events||[]).filter(ev=>
    (ev.who==='p1'&&inclP1)||(ev.who==='p2'&&inclP2)||(ev.who==='shared'&&inclShared)
  ).forEach(ev=>{
    if(!ev.time) return;
    const h=parseInt(ev.time.split(':')[0]), mi=parseInt(ev.time.split(':')[1]);
    const s=new Date(ev.date+'T12:00:00'); s.setHours(h,mi,0,0);
    const e=new Date(s); e.setHours(h,mi+60,0,0);
    events.push({summary:ev.emoji+' '+ev.name,start:s,end:e,desc:'Heimplaner Termin'});
  });}
  if(inclMeals){Object.entries(HP.meals||{}).forEach(([key,slots])=>{
    Object.entries(slots).forEach(([slot,m])=>{
      const d=new Date(key+'T00:00:00'), h=slot==='Frühstück'?8:slot==='Mittag'?12:19;
      const s=new Date(d); s.setHours(h,0,0,0); const e=new Date(s); e.setHours(h+1,0,0,0);
      events.push({summary:'🍽️ '+slot+': '+m.name,start:s,end:e,desc:'Heimplaner Menüplan'});
    });
  });}
  if(inclNotes){(HP.notes||[]).filter(n=>n.date).forEach(n=>{
    const s=new Date(n.date+'T09:00:00'), e=new Date(n.date+'T10:00:00');
    events.push({summary:'📌 '+(n.title||'Notiz'),start:s,end:e,desc:n.body});
  });}
  if(!events.length){showToast('Keine Einträge zum Exportieren');return;}
  buildAndDownloadICS(events);
}
function exportDayICS(key){
  const date=new Date(key+'T12:00:00');
  const evs=[];
  // Recurring tasks with time
  allTasks().filter(t=>taskOccursOn(t,key)&&t.time).forEach(t=>{
    const[h,m]=t.time.split(':').map(Number), s=new Date(date); s.setHours(h,m,0,0);
    let e;
    if(t.timeEnd){const[eh,em]=t.timeEnd.split(':').map(Number);e=new Date(date);e.setHours(eh,em,0,0);if(e<=s)e.setHours(eh+24,em,0,0);}
    else{e=new Date(s);e.setHours(h,m+30,0,0);}
    evs.push({summary:t.emoji+' '+t.name,start:s,end:e,desc:'Heimplaner'});
  });
  // One-time events on this day
  (HP.events||[]).filter(ev=>ev.date===key).forEach(ev=>{
    const h=ev.time?parseInt(ev.time.split(':')[0]):9;
    const mi=ev.time?parseInt(ev.time.split(':')[1]):0;
    const s=new Date(date); s.setHours(h,mi,0,0);
    const e=new Date(s); e.setHours(h,mi+60,0,0);
    evs.push({summary:ev.emoji+' '+ev.name,start:s,end:e,desc:'Heimplaner Termin'});
  });
  // Meals
  Object.entries(HP.meals[key]||{}).forEach(([slot,meal])=>{
    const h=slot==='Frühstück'?8:slot==='Mittag'?12:19, s=new Date(date); s.setHours(h,0,0,0);
    const e=new Date(s); e.setHours(h+1,0,0,0);
    evs.push({summary:'🍽️ '+slot+': '+meal.name,start:s,end:e,desc:'Heimplaner Menüplan'});
  });
  if(!evs.length){showToast('Keine Einträge für diesen Tag');return;}
  buildAndDownloadICS(evs, key+'.ics');
}
function buildAndDownloadICS(events, filename='heimplaner-kalender.ics'){
  const fmtDT=d=>d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
  const stamp=fmtDT(new Date());
  const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Heimplaner//DE',
    ...events.map(ev=>['BEGIN:VEVENT','UID:'+Math.random().toString(36).substr(2)+'@hp',
      'DTSTAMP:'+stamp,'DTSTART:'+fmtDT(ev.start),'DTEND:'+fmtDT(ev.end),
      'SUMMARY:'+ev.summary,'DESCRIPTION:'+(ev.desc||'').replace(/\n/g,'\\n'),'END:VEVENT'].join('\r\n')),
    'END:VCALENDAR'].join('\r\n');
  const blob=new Blob([ics],{type:'text/calendar'});
  const url=URL.createObjectURL(blob), a=document.createElement('a');
  a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
  showToast('📅 '+events.length+' Einträge als .ics exportiert');
}

function openMobDrawer(){
  const d=document.getElementById('mob-drawer'); if(d){d.classList.add('open'); syncMobDrawer();}
}
function closeMobDrawer(e){if(e.target===e.currentTarget||e.target.classList.contains('mob-overlay'))closeMobDrawerDirect();}
function closeMobDrawerDirect(){document.getElementById('mob-drawer')?.classList.remove('open');}
function syncMobDrawer(){
  renderMiniMonth('mini-cal-mob','mm-label-mob');
}
function changeWeek(d){weekOffset+=d;render();}
function goToday(){weekOffset=0;render();}
function changeMonth(d){monthOffset+=d;renderMiniMonth();}

// ── INIT ──────────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
  initDayPills();
  render();
  setView('all',document.querySelector('[data-view="all"]'));
  setTimeout(maybeNotifBanner,1200);
  try{if(NOTIF_OK&&Notification.permission==='granted')subscribeToPush();}catch(e){}
  // Input listeners
  document.getElementById('af-name')?.addEventListener('keydown',e=>{if(e.key==='Enter')addTask();});
  document.getElementById('shop-add-name')?.addEventListener('keydown',e=>{if(e.key==='Enter')addShopItem();});
  document.getElementById('recipe-search')?.addEventListener('input',filterRecipes);
});

// ═══════════════════════════════════════════════

// ═══════════════════════════════════════════════
// THEME – Hell/Dunkel Toggle
// ═══════════════════════════════════════════════

function applyTheme(theme) {
  document.body.classList.toggle('light', theme === 'light');
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = theme === 'light' ? '🌙 Dunkel' : '☀️ Hell';
}

function toggleTheme() {
  const newTheme = HP.theme === 'dark' ? 'light' : 'dark';
  HP.theme = newTheme;
  HP_save();
  applyTheme(newTheme);
}

// ═══════════════════════════════════════════════
// FARBEN – Personenfarben anpassen
// ═══════════════════════════════════════════════

function renderColorSettings() {
  const el = document.getElementById('color-settings');
  if (!el) return;
  const persons = [
    {key:'p1', label: HP.names.p1},
    {key:'p2', label: HP.names.p2},
    {key:'shared', label: 'Gemeinsam'}
  ];
  el.innerHTML = persons.map(p => {
    const currentColor = getColor(p.key);
    const swatches = COLOR_OPTIONS.map(c =>
      `<span onclick="setPersonColor('${p.key}','${c.val}')" title="${c.name}" style="display:inline-block;width:24px;height:24px;border-radius:50%;background:${c.val};cursor:pointer;border:3px solid ${c.val===currentColor?'#fff':'transparent'};transition:border .15s;margin:2px"></span>`
    ).join('');
    return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap">
      <span style="font-size:.82rem;font-weight:500;min-width:80px;color:${currentColor}">${esc(p.label)}</span>
      <div style="display:flex;gap:4px;flex-wrap:wrap">${swatches}</div>
    </div>`;
  }).join('');
}

function setPersonColor(who, color) {
  if (!HP.colors) HP.colors = {...DEFAULT_COLORS};
  HP.colors[who] = color;
  HP_save();
  applyColors();
  renderColorSettings();
  showToast('Farbe geändert');
}

function applyColors() {
  const root = document.documentElement;
  const p1 = getColor('p1');
  const p2 = getColor('p2');
  const sh = getColor('shared');
  const opt1 = COLOR_OPTIONS.find(c=>c.val===p1);
  const opt2 = COLOR_OPTIONS.find(c=>c.val===p2);
  const opts = COLOR_OPTIONS.find(c=>c.val===sh);
  root.style.setProperty('--p1', p1);
  root.style.setProperty('--p1bg', opt1?.bg||'rgba(108,142,255,0.12)');
  root.style.setProperty('--p2', p2);
  root.style.setProperty('--p2bg', opt2?.bg||'rgba(255,126,179,0.12)');
  root.style.setProperty('--shared', sh);
  root.style.setProperty('--shbg', opts?.bg||'rgba(78,205,196,0.12)');
}

function openRecipeDetail(rid) {
  const r = allRecipes().find(x => x.id === rid);
  if (!r) return;
  const rows = r.ing.map((ing, i) =>
    '<li style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">' +
    '<input type="checkbox" id="ic-' + i + '" checked style="accent-color:var(--shared);width:15px;height:15px;cursor:pointer;flex-shrink:0">' +
    '<label for="ic-' + i + '" style="flex:1;font-size:.79rem;cursor:pointer">' + esc(ing.n) + (ing.optional ? ' <span style="font-size:.65rem;color:var(--amber)">(optional)</span>' : '') + '</label>' +
    '<span style="font-size:.75rem;color:var(--muted);white-space:nowrap">' + esc(ing.q) + ' ' + esc(ing.u) + '</span></li>'
  ).join('');

  const stepsHtml = r.steps && r.steps.length
    ? '<div style="font-size:.65rem;text-transform:uppercase;letter-spacing:.09em;color:var(--muted);margin:14px 0 8px">Zubereitung</div>' +
      r.steps.map((s, i) =>
        '<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);font-size:.79rem;line-height:1.5">' +
        '<span style="background:var(--p1bg);color:var(--p1);border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:.68rem;font-weight:700;flex-shrink:0;margin-top:1px">' + (i+1) + '</span>' +
        '<span>' + esc(s) + '</span></div>'
      ).join('')
    : '';

  showModal(
    '<span style="font-size:2rem;text-align:center;display:block;margin-bottom:6px">' + esc(r.emoji) + '</span>' +
    '<h3 style="text-align:center">' + esc(r.name) + '</h3>' +
    '<div style="display:flex;gap:10px;justify-content:center;font-size:.73rem;color:var(--muted);margin-bottom:12px">' +
    '<span>⏱ ' + esc(r.time) + ' Min</span><span>👥 ' + esc(r.pers) + ' Pers.</span><span>' + esc(r.tags.join(' · ')) + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
    '<span style="font-size:.65rem;text-transform:uppercase;letter-spacing:.09em;color:var(--muted)">Zutaten wählen</span>' +
    '<button onclick="toggleAllIng(' + r.ing.length + ')" style="background:none;border:none;color:var(--muted);font-size:.72rem;cursor:pointer">Alle an/ab</button></div>' +
    '<ul style="list-style:none">' + rows + '</ul>' +
    stepsHtml +
    '<div class="modal-btns"><button class="mbtn mbtn-cancel" onclick="closeModal()">Schliessen</button>' +
    '<button class="mbtn" style="background:var(--shbg);border:1px solid var(--shared);color:var(--shared)" onclick="addSelectedIngs(\'' + rid + '\')">🛒 Auswahl zur Liste</button>' +
    '<button class="mbtn mbtn-confirm" onclick="closeModal();openMealPlanModal(\'' + rid + '\')">📅 Menüplan</button></div>', true
  );
}

// ── Init ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(HP.theme || 'dark');
  applyColors();
});
