// ═══════════════════════════════════════════════
// HEIMPLANER – APP LOGIC
// ═══════════════════════════════════════════════

let weekOffset=0, monthOffset=0, monthViewOffset=0;
let curView='all', persView='p1', recipeFilter='Alle', pendingMealSlot=null;
let afSelectedDays=[];
const NOTIF_OK=typeof window!=='undefined'&&'Notification' in window;

// ── Toast ─────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t=document.getElementById('toast');
  if(!t) return;
  t.textContent=msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove('show'),2600);
}

// Toast mit "Rückgängig"-Knopf. Angenehmer als ein Bestätigungsdialog bei
// jedem Löschvorgang: der Normalfall (man wollte wirklich löschen) bleibt
// ein Klick, und der Fehlgriff ist trotzdem abgesichert.
// Steht bewusst länger als der normale Toast, damit man reagieren kann.
function showUndoToast(msg, undoFn) {
  const t=document.getElementById('toast');
  if(!t) { showToast(msg); return; }
  t.textContent='';
  const span=document.createElement('span');
  span.textContent=msg;
  const btn=document.createElement('button');
  btn.className='toast-undo';
  btn.textContent='Rückgängig';
  btn.onclick=()=>{
    clearTimeout(toastTimer);
    t.classList.remove('show');
    try { undoFn(); } catch(e) { showToast('Wiederherstellen fehlgeschlagen'); }
  };
  t.appendChild(span); t.appendChild(btn);
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{ t.classList.remove('show'); },6000);
}

// ── Modal ─────────────────────────────────────
function showModal(html, wide=false) {
  closeModal();
  const ov=document.createElement('div');
  ov.className='modal-overlay'; ov.id='modal-ov';
  ov.addEventListener('click',e=>{if(e.target===ov)closeModal();});
  const m=document.createElement('div');
  m.className='modal'+(wide?' rd-wide':'');
  m.innerHTML=html;
  ov.appendChild(m);
  document.body.appendChild(ov);
}
function closeModal() { document.getElementById('modal-ov')?.remove(); }

// ── Routing ───────────────────────────────────
function setView(view, btn) {
  curView=view;
  document.querySelectorAll('.vbtn,[data-view]').forEach(b=>{
    b.classList.toggle('active', b.dataset&&b.dataset.view===view);
  });
  const views=['all','person','shop','budget','meals','recipes','manage','month','pinboard','ai','settings','birthdays','household'];
  views.forEach(v=>document.getElementById('view-'+v)?.classList.add('hidden'));
  const target=document.getElementById('view-'+( view==='p1'||view==='p2'?'person':view ));
  if(target) target.classList.remove('hidden');
  if(view==='p1'||view==='p2') persView=view;
  // extra init per view
  if(view==='month') renderMonth();
  else if(view==='pinboard') renderPinboard();
  else if(view==='recipes') renderRecipes();
  else if(view==='manage') { render(); renderEventsList(); renderBirthdayList(); return; }
  else if(view==='birthdays') { renderBirthdayList(); renderEventsList(); }
  else if(view==='household') { renderHouseholdList(); return; }
  else if(view==='budget') { initBudgetView(); return; }
  else if(view==='settings') renderColorSettings();
  render();
  // mobile nav sync
  document.querySelectorAll('.bn-item[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  document.querySelectorAll('.mob-nav-btn[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  updateShopBadge();
}
function updateShopBadge() {
  const n=HP.shop.filter(i=>!i.bought).length;
  ['shop-badge','bn-badge'].forEach(id=>{const e=document.getElementById(id);if(e){e.textContent=n;e.classList.toggle('hidden',n===0);}});
}

// ── Main render ───────────────────────────────
function render() {
  syncNames(); renderMiniMonth(); renderWeekLabel(); renderSidebarStats();
  if(curView==='all') renderAllView();
  else if(curView==='p1'||curView==='p2') renderPersonView(curView);
  else if(curView==='shop') renderShop();
  else if(curView==='meals') renderMeals();
  else if(curView==='manage') renderManage();
  else if(curView==='budget') renderBudget();
}

function syncNames() {
  const n1=HP.names.p1, n2=HP.names.p2;
  const l1=document.getElementById("sb-lbl-p1"); if(l1) l1.textContent=n1;
  const l2=document.getElementById("sb-lbl-p2"); if(l2) l2.textContent=n2;
  document.querySelectorAll('[data-sync="p1"]').forEach(e=>{if(e.tagName!=='INPUT')e.textContent=n1;});
  document.querySelectorAll('[data-sync="p2"]').forEach(e=>{if(e.tagName!=='INPUT')e.textContent=n2;});
  const o1=document.getElementById("af-op1"); if(o1) o1.textContent=n1;
  const o2=document.getElementById("af-op2"); if(o2) o2.textContent=n2;
  const h1=document.getElementById("tm-h-p1"); if(h1) h1.textContent=n1;
  const h2=document.getElementById("tm-h-p2"); if(h2) h2.textContent=n2;
}

function renderWeekLabel() {
  const dates=getWeekDates(weekOffset);
  const fmt=d=>d.toLocaleDateString('de-CH',{day:'numeric',month:'short'});
  const el=document.getElementById('wk-lbl');
  const isMobile=window.innerWidth<=768;
  if(el) el.textContent='KW '+wkNum(dates[0])+' · '+fmt(dates[0])+' – '+fmt(dates[6])+(isMobile?'':' '+dates[6].getFullYear());
}
window.addEventListener('resize',()=>renderWeekLabel());

function renderMiniMonth(calId='mini-cal', lblId='mm-label') {
  const now=new Date(), base=new Date(now.getFullYear(),now.getMonth()+monthOffset,1);
  const lbl=document.getElementById(lblId);
  if(lbl) lbl.textContent=base.toLocaleDateString('de-CH',{month:'long',year:'numeric'});
  const cal=document.getElementById(calId); if(!cal) return;
  const wdks=getWeekDates(weekOffset).map(dk);
  const today=new Date(); today.setHours(0,0,0,0);
  const first=new Date(base.getFullYear(),base.getMonth(),1);
  const last=new Date(base.getFullYear(),base.getMonth()+1,0);
  const startDow=(first.getDay()+6)%7;
  let html=DS.map(x=>'<span class="dow">'+x+'</span>').join('');
  for(let i=0;i<startDow;i++) html+='<span class="mday empty"></span>';
  for(let i=1;i<=last.getDate();i++) {
    const dt=new Date(base.getFullYear(),base.getMonth(),i);
    const cls=['mday',dt.getTime()===today.getTime()?'today':'',wdks.includes(dk(dt))?'in-week':''].filter(Boolean).join(' ');
    html+='<span class="'+cls+'">'+i+'</span>';
  }
  cal.innerHTML=html;
}

function renderSidebarStats() {
  updateShopBadge();
}
