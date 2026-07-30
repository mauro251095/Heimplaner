// ═══════════════════════════════════════════════
// HEIMPLANER – APP LOGIC
// ═══════════════════════════════════════════════

let weekOffset=0, monthOffset=0, monthViewOffset=0;
let curView='all', persView='p1', recipeFilter='Alle', pendingMealSlot=null;
let aiHistory=[], speechRec=null, isMicActive=false, afSelectedDays=[];
const schedTimers={};
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
  const views=['all','person','shop','meals','recipes','manage','month','pinboard','ai','settings'];
  views.forEach(v=>document.getElementById('view-'+v)?.classList.add('hidden'));
  const target=document.getElementById('view-'+( view==='p1'||view==='p2'?'person':view ));
  if(target) target.classList.remove('hidden');
  if(view==='p1'||view==='p2') persView=view;
  // extra init per view
  if(view==='month') renderMonth();
  else if(view==='pinboard') renderPinboard();
  else if(view==='ai') { renderAiQuickBtns(); if(!aiHistory.length) addAiMsg('bot','Hallo! 👋 Ich bin dein Heimplaner-Assistent.\n\nIch kann dir helfen:\n• Tasks, Einkaufsartikel & Rezepte per Sprache oder Text hinzufügen\n• Menüvorschläge für die Woche machen\n• Fragen zum Haushalt beantworten\n\nWas darf ich für dich tun?'); }
  else if(view==='recipes') renderRecipes();
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
  if(el) el.textContent='KW '+wkNum(dates[0])+' · '+fmt(dates[0])+' – '+fmt(dates[6])+' '+dates[6].getFullYear();
}

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
  const dates=getWeekDates(weekOffset), tasks=allTasks();
  let tot=0,done=0,blocked=0;
  dates.forEach((date,di)=>{
    const dt=tasks.filter(t=>t.days.includes(di));
    tot+=dt.length;
    dt.forEach(t=>{ if(isDone(date,t.id)) done++; if(getStatus(t.id)==='blocked') blocked++; });
  });
  const pct=tot?Math.round(done/tot*100):0;
  const rp=document.getElementById('ring-pct'); if(rp) rp.textContent=pct+'%';
  const rn=document.getElementById('ring-num'); if(rn) rn.textContent=done+' / '+tot;
  const rb=document.getElementById('ring-bg'); if(rb) rb.style.background='conic-gradient(var(--today) 0% '+pct+'%, var(--subtle) '+pct+'% 100%)';
  const today=new Date(); today.setHours(0,0,0,0);
  let streak=0;
  for(let i=0;i<60;i++) {
    const dd=new Date(today); dd.setDate(today.getDate()-i);
    const di2=(dd.getDay()+6)%7;
    const dt2=tasks.filter(t=>t.days.includes(di2));
    if(!dt2.length){streak++;continue;}
    if(dt2.every(t=>isDone(dd,t.id))) streak++; else break;
  }
  const ss=document.getElementById('st-streak'); if(ss) ss.textContent=streak+' Tage';
  const sb=document.getElementById('st-blocked'); if(sb) sb.textContent=blocked;
  updateShopBadge();
}

// ── ALL VIEW ──────────────────────────────────
function renderAllView() { renderTodayBanner(); renderBlockedBanners(); renderWeekGrid(); }

function renderTodayBanner() {
  const today=new Date(); today.setHours(0,0,0,0);
  const di=(today.getDay()+6)%7, tasks=allTasks();
  const dayT=tasks.filter(t=>t.days.includes(di));
  const doneC=dayT.filter(t=>isDone(today,t.id)||getStatus(t.id)==='done').length;
  const prioOpen=dayT.filter(t=>t.prio&&!isDone(today,t.id)&&getStatus(t.id)!=='done').length;
  const chips=dayT.length
    ? dayT.map(t=>{
        const d=isDone(today,t.id)||getStatus(t.id)==='done';
        const si=getStatus(t.id)==='wip'?'🟡':getStatus(t.id)==='blocked'?'🔴':getStatus(t.id)==='done'?'✅':'';
        return '<span class="tbc tbc-'+t.who+(d?' done':'')+(t.prio?' tbc-prio':'')+'" onclick="openTaskModal(\''+t.id+'\')">'+(t.prio?'● ':'')+t.emoji+' '+t.name+(si?' '+si:'')+'</span>';
      }).join('')
    : '<span style="font-size:.76rem;color:var(--muted)">Keine Aufgaben heute</span>';
  const el=document.getElementById('today-banner');
  if(el) el.innerHTML='<div class="tb-date">'+today.getDate()+'</div>'+
    '<div><div class="tb-dow">'+DL[di]+' · Heute</div>'+
    '<div class="tb-stat"><b>'+doneC+'/'+dayT.length+'</b> erledigt'+(prioOpen?'<span style="color:var(--prio)"> · '+prioOpen+' Priorität'+(prioOpen>1?'en':'')+' offen</span>':'')+
    '</div></div><div class="tb-chips">'+chips+'</div>';
}

function renderBlockedBanners() {
  const today=new Date(); today.setHours(0,0,0,0);
  const di=(today.getDay()+6)%7;
  const blocked=allTasks().filter(t=>t.days.includes(di)&&getStatus(t.id)==='blocked');
  const el=document.getElementById('blocked-banners');
  if(el) el.innerHTML=blocked.map(t=>
    '<div class="blocked-banner" onclick="openTaskModal(\''+t.id+'\')">🔴 <b>'+t.emoji+' '+t.name+'</b> ist blockiert'+
    (HP.taskNotes[t.id]?' <span style="color:var(--muted)">– '+HP.taskNotes[t.id]+'</span>':'')+
    '<span style="margin-left:auto;font-size:.7rem;color:var(--muted)">Details →</span></div>'
  ).join('');
}

function renderWeekGrid() {
  const grid=document.getElementById('week-grid'); if(!grid) return;
  const today=new Date(); today.setHours(0,0,0,0);
  const dates=getWeekDates(weekOffset), tasks=allTasks();
  grid.innerHTML='';
  dates.forEach((date,di)=>{
    const dayT=tasks.filter(t=>t.days.includes(di));
    const doneT=dayT.filter(t=>isDone(date,t.id)||getStatus(t.id)==='done');
    const pct=dayT.length?Math.round(doneT.length/dayT.length*100):0;
    const col=document.createElement('div');
    col.className='day-col'+(isToday(date)?' is-today':'')+(isPast(date)&&!isToday(date)?' is-past':'');
    col.innerHTML='<div class="day-head"><div class="dh-dow">'+DS[di]+'</div><div class="dh-num">'+date.getDate()+'</div>'+
      '<div class="dh-prog"><div class="dh-prog-fill" style="width:'+pct+'%"></div></div></div>'+
      '<div class="day-tasks" id="wg-'+di+'"></div>';
    grid.appendChild(col);
    const tc=col.querySelector('#wg-'+di);
    if(!dayT.length){tc.innerHTML='<span style="font-size:.66rem;color:var(--muted)">–</span>';return;}
    [...dayT].sort((a,b)=>a.prio&&!b.prio?-1:!a.prio&&b.prio?1:0).forEach(t=>{
      const d=isDone(date,t.id)||getStatus(t.id)==='done', st=getStatus(t.id);
      const si=st==='wip'?'🟡':st==='blocked'?'🔴':'';
      const chip=document.createElement('div');
      chip.className='task-chip c'+t.who+' s-'+st+(d?' done':'');
      chip.innerHTML='<span class="chip-dot"></span><span style="flex:1">'+t.emoji+' '+t.name+(t.time?'<span style="font-size:.6rem;opacity:.7;margin-left:3px">⏰'+fmtTime(t.time)+'</span>':'')+'</span>'+
        '<span class="chip-st">'+si+'</span>'+(t.prio?'<span class="chip-prio">●</span>':'');
      chip.addEventListener('click',()=>openTaskModal(t.id));
      tc.appendChild(chip);
    });
  });
}

// ── PERSON VIEW ───────────────────────────────
function renderPersonView(who) {
  const dates=getWeekDates(weekOffset), today=new Date(); today.setHours(0,0,0,0);
  const tasks=allTasks(who), n=HP.names[who], color=who==='p1'?'var(--p1)':'var(--p2)';
  let tot=0,done=0;
  dates.forEach((date,di)=>{const dt=tasks.filter(t=>t.days.includes(di));tot+=dt.length;dt.forEach(t=>{if(isDone(date,t.id)||getStatus(t.id)==='done')done++;});});
  const pct=tot?Math.round(done/tot*100):0;
  const hd=document.getElementById('pv-hd');
  if(hd) hd.innerHTML='<div class="pv-av pv-av-'+who+'">'+n.charAt(0).toUpperCase()+'</div>'+
    '<div><div class="pv-name" style="color:'+color+'">'+n+'</div><div class="pv-sub">Persönliche Wochenübersicht</div></div>'+
    '<div class="pv-stats"><div class="pv-stat"><div class="psn" style="color:'+color+'">'+done+'</div><div class="psl">Erledigt</div></div>'+
    '<div class="pv-stat"><div class="psn">'+tot+'</div><div class="psl">Gesamt</div></div>'+
    '<div class="pv-stat"><div class="psn" style="color:var(--today)">'+pct+'%</div><div class="psl">Quote</div></div></div>';
  const pvDays=document.getElementById('pv-days'); if(!pvDays) return; pvDays.innerHTML='';
  dates.forEach((date,di)=>{
    const tl=isToday(date), dayT=tasks.filter(t=>t.days.includes(di));
    const sorted=[...dayT].sort((a,b)=>a.prio&&!b.prio?-1:!a.prio&&b.prio?1:0);
    const row=document.createElement('div'); row.className='pv-day-row';
    row.innerHTML='<div class="pvdl'+(tl?' tlbl':'')+'"><div class="pvd">'+DS[di]+(tl?' · Heute':'')+'</div>'+
      '<div class="pvdt">'+date.toLocaleDateString('de-CH',{day:'numeric',month:'short'})+'</div></div>'+
      '<div class="pv-day-tasks'+(tl?' tbg':'')+'" id="pvt-'+di+'"></div>';
    pvDays.appendChild(row);
    const tc=row.querySelector('#pvt-'+di);
    if(!sorted.length){tc.innerHTML='<span class="empty-day">Frei 🎉</span>';return;}
    sorted.forEach(t=>{
      const d=isDone(date,t.id)||getStatus(t.id)==='done', st=getStatus(t.id);
      const pill=document.createElement('div');
      pill.className='pv-pill p'+(t.who==='shared'?'shared':t.who[1])+(d?' s-done':'')+(t.prio?' is-prio':'')+(st==='blocked'?' s-blocked':'');
      pill.innerHTML=(t.prio?'<span style="font-size:.6rem;color:var(--prio)">●</span>':'')+t.emoji+' '+t.name+
        (st==='wip'?'<span class="pst wip">🟡</span>':st==='blocked'?'<span class="pst blk">🔴</span>':'')+
        (t.who==='shared'?'<span style="font-size:.62rem;opacity:.55"> gem.</span>':'');
      pill.addEventListener('click',()=>openTaskModal(t.id));
      tc.appendChild(pill);
    });
  });
}

// ── SHOP ──────────────────────────────────────
function renderShop() {
  const total=HP.shop.length, bought=HP.shop.filter(i=>i.bought).length;
  const pct=total?Math.round(bought/total*100):0;
  const st=document.getElementById('shop-stat'); if(st) st.textContent=(total-bought)+' offen · '+bought+' im Wagen';
  const pf=document.getElementById('shop-prog-fill'); if(pf) pf.style.width=pct+'%';
  const el=document.getElementById('shop-cats'); if(!el) return; el.innerHTML='';
  CATS.forEach(cat=>{
    const items=HP.shop.filter(i=>i.cat===cat); if(!items.length) return;
    const sec=document.createElement('div'); sec.className='cat-section';
    sec.innerHTML='<div class="cat-title">'+(CAT_EMOJI[cat]||'📦')+' '+cat+'</div><div class="shop-grid"></div>';
    el.appendChild(sec);
    items.forEach(item=>sec.querySelector('.shop-grid').appendChild(makeShopItem(item)));
  });
  const uncat=HP.shop.filter(i=>!CATS.includes(i.cat));
  if(uncat.length) {
    const sec=document.createElement('div'); sec.className='cat-section';
    sec.innerHTML='<div class="cat-title">📦 Sonstiges</div><div class="shop-grid"></div>';
    el.appendChild(sec);
    uncat.forEach(item=>sec.querySelector('.shop-grid').appendChild(makeShopItem(item)));
  }
}

function makeShopItem(item) {
  const div=document.createElement('div');
  div.className='shop-item'+(item.bought?' bought':'')+(item.taskId?' has-task':'');
  div.innerHTML='<div class="si-name">'+item.name+'</div>'+
    '<div class="si-qty">'+[item.qty,item.unit].filter(Boolean).join(' ')+'</div>'+
    (item.taskId?'<div class="si-task">🔗 '+(item.taskName||'Projekt')+'</div>':'')+
    '<div class="si-check">'+(item.bought?'✓':'')+'</div>';
  div.addEventListener('click',()=>{item.bought=!item.bought;HP_save();renderShop();renderSidebarStats();});
  let pt;
  div.addEventListener('pointerdown',()=>{pt=setTimeout(()=>openEditShopItem(item),500);});
  ['pointerup','pointercancel','pointermove'].forEach(e=>div.addEventListener(e,()=>clearTimeout(pt)));
  return div;
}

function addShopItem(name,qty,unit,cat,taskId,taskName) {
  const n=name||document.getElementById('shop-add-name')?.value.trim();
  if(!n){showToast('Bitte Artikelname eingeben');return;}
  const q=qty||document.getElementById('shop-add-qty')?.value.trim()||'';
  const u=unit||document.getElementById('shop-add-unit')?.value.trim()||'';
  const c=cat||document.getElementById('shop-add-cat')?.value||'';
  if(!c){showToast('⚠️ Bitte Kategorie wählen');document.getElementById('shop-add-cat')?.focus();return;}
  const existing=HP.shop.find(i=>i.name.toLowerCase()===n.toLowerCase()&&!i.bought);
  if(existing&&!name){showDuplicateModal(existing,q,u);return;}
  if(existing&&name){existing.qty=existing.qty?existing.qty+'+'+q:q;HP_save();renderShop();renderSidebarStats();showToast(n+' Menge angepasst');return;}
  HP.shop.push({id:'sh'+Date.now(),name:n,qty:q,unit:u,cat:c,bought:false,taskId:taskId||null,taskName:taskName||null});
  HP_save();
  if(!name){['shop-add-name','shop-add-qty','shop-add-unit'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});const sc=document.getElementById('shop-add-cat');if(sc)sc.value='';}
  renderShop();renderSidebarStats();showToast(n+' hinzugefügt');
}

function openEditShopItem(item) {
  const opts=CATS.map(c=>'<option value="'+c+'"'+(item.cat===c?' selected':'')+'>'+catEmoji(c)+' '+c+'</option>').join('');
  showModal('<h3>✏️ Artikel bearbeiten</h3>'+
    '<div class="modal-row"><label>Name</label><input class="modal-in" id="ei-name" value="'+item.name+'"></div>'+
    '<div class="modal-row"><div style="display:flex;gap:8px">'+
    '<div style="flex:1"><label>Menge</label><input class="modal-in" id="ei-qty" value="'+(item.qty||'')+'"></div>'+
    '<div style="flex:1"><label>Einheit</label><input class="modal-in" id="ei-unit" value="'+(item.unit||'')+'"></div></div></div>'+
    '<div class="modal-row"><label>Kategorie</label><select class="modal-in" id="ei-cat">'+opts+'</select></div>'+
    '<div class="modal-btns" style="justify-content:space-between">'+
    '<button class="mbtn" style="background:var(--rbg);border:1px solid var(--red);color:var(--red)" onclick="deleteShopItem(\''+item.id+'\')">🗑 Löschen</button>'+
    '<button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
    '<button class="mbtn mbtn-confirm" onclick="saveEditShopItem(\''+item.id+'\')">✓ Speichern</button></div>');
}
function saveEditShopItem(id) {
  const item=HP.shop.find(i=>i.id===id); if(!item){closeModal();return;}
  item.name=document.getElementById('ei-name')?.value.trim()||item.name;
  item.qty=document.getElementById('ei-qty')?.value.trim()||'';
  item.unit=document.getElementById('ei-unit')?.value.trim()||'';
  item.cat=document.getElementById('ei-cat')?.value||item.cat;
  HP_save();closeModal();renderShop();showToast('Artikel aktualisiert');
}
function deleteShopItem(id){HP.shop=HP.shop.filter(i=>i.id!==id);HP_save();closeModal();renderShop();renderSidebarStats();showToast('Artikel gelöscht');}
function clearBought(){HP.shop=HP.shop.filter(i=>!i.bought);HP_save();renderShop();renderSidebarStats();showToast('Erledigte Artikel entfernt');}
function showDuplicateModal(existing,q,u) {
  showModal('<h3>🛒 Bereits auf der Liste</h3>'+
    '<div class="dup-warn">⚠️ <b>'+existing.name+'</b> ist bereits auf der Liste ('+[existing.qty,existing.unit].filter(Boolean).join(' ')+').</div>'+
    '<p style="font-size:.8rem;color:var(--muted);margin-bottom:14px">Menge erhöhen'+(q?' (+'+q+(u?' '+u:'')+')':'')+' oder separat hinzufügen?</p>'+
    '<div class="modal-btns" style="justify-content:space-between">'+
    '<button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
    '<button class="mbtn" style="background:var(--surface);color:var(--text)" onclick="addSeparate(\''+existing.name+'\',\''+q+'\',\''+u+'\')">Separat</button>'+
    '<button class="mbtn mbtn-confirm" onclick="increaseQty(\''+existing.id+'\',\''+q+'\')">Erhöhen</button></div>');
}
function increaseQty(id,q){const i=HP.shop.find(x=>x.id===id);if(i)i.qty=i.qty?i.qty+'+'+q:q;HP_save();closeModal();renderShop();showToast('Menge angepasst');}
function addSeparate(name,qty,unit){closeModal();HP.shop.push({id:'sh'+Date.now(),name,qty,unit,cat:'Sonstiges',bought:false,taskId:null,taskName:null});HP_save();renderShop();renderSidebarStats();showToast(name+' separat hinzugefügt');}

// ── MEALS ─────────────────────────────────────
function renderMeals() {
  const grid=document.getElementById('meal-grid'); if(!grid) return; grid.innerHTML='';
  const today=new Date(); today.setHours(0,0,0,0);
  getWeekDates(weekOffset).forEach((date,di)=>{
    const key=dk(date), meals=HP.meals[key]||{};
    const col=document.createElement('div'); col.className='meal-day'+(isToday(date)?' is-today':'');
    const slotsHtml=['Frühstück','Mittag','Abend'].map(slot=>{
      const m=meals[slot];
      if(m){
        // Filled slot: emoji is purely decorative, name + edit/delete buttons
        return '<div class="meal-slot"><div class="ms-lbl">'+slot+'</div>'+
          '<div class="ms-content has-meal" style="cursor:default">'+
          '<span class="me" style="pointer-events:none">'+m.emoji+'</span>'+
          '<span class="mn2" style="pointer-events:none">'+m.name+'</span>'+
          '<span style="display:flex;gap:4px;margin-left:auto;flex-shrink:0">'+
          '<span class="mdel" style="opacity:.7;cursor:pointer" onclick="openMealPicker(\''+key+'\',\''+slot+'\')">✏️</span>'+
          '<span class="mdel" style="opacity:.7;cursor:pointer" onclick="removeMeal(\''+key+'\',\''+slot+'\')">✕</span>'+
          '</span></div></div>';
      } else {
        // Empty slot: whole area clickable
        return '<div class="meal-slot"><div class="ms-lbl">'+slot+'</div>'+
          '<div class="ms-content" onclick="openMealPicker(\''+key+'\',\''+slot+'\')"><span>+ Wählen</span></div></div>';
      }
    }).join('');
    col.innerHTML='<div class="meal-day-hd"><div class="mdow">'+DS[di]+'</div><div class="mnum">'+date.getDate()+'</div></div>'+
      '<div class="meal-slots">'+slotsHtml+'</div>'+
      '<button class="add-all-btn" onclick="addDayToShop(\''+key+'\')">🛒 Zutaten</button>';
    grid.appendChild(col);
  });
}

function openMealPicker(key,slot) {
  // Check if there's an existing manual meal (no recipeId) to offer "add to library"
  const existing=HP.meals[key]?.[slot];
  const hasManualMeal=existing&&!existing.recipeId;
  const addToLibBtn=hasManualMeal
    ? '<button class="mbtn" style="background:var(--p2bg);border:1px solid var(--p2);color:var(--p2)" onclick="addMealToLibrary(\''+key+'\',\''+slot+'\')">📖 Zur Bibliothek</button>'
    : '';
  showModal(
    '<h3>📅 '+slot+' eintragen</h3>'+
    '<div class="modal-row"><label>Gericht</label>'+
    '<div style="display:flex;gap:7px">'+
    '<input class="modal-in" id="mp-emoji" placeholder="🍽️" maxlength="2" style="width:48px;text-align:center" value="'+(existing?.emoji&&existing.emoji!=='🍽️'?existing.emoji:'')+'">'+
    '<input class="modal-in" id="mp-name" placeholder="z.B. Älplermagronen" style="flex:1" value="'+(existing?.name||'')+'">'+
    '</div></div>'+
    '<div class="modal-btns" style="justify-content:space-between;flex-wrap:wrap;gap:6px">'+
    '<button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
    addToLibBtn+
    '<button class="mbtn" style="background:var(--p1bg);border:1px solid var(--p1);color:var(--p1)" onclick="pickFromLibrary(\''+key+'\',\''+slot+'\')">📖 Aus Bibliothek</button>'+
    '<button class="mbtn mbtn-confirm" onclick="saveManualMeal(\''+key+'\',\''+slot+'\')">✓ Speichern</button>'+
    '</div>'
  );
  setTimeout(()=>{const inp=document.getElementById('mp-name');if(inp)inp.focus();},50);
}

function saveManualMeal(key,slot){
  const name=document.getElementById('mp-name')?.value.trim();
  const emoji=document.getElementById('mp-emoji')?.value.trim()||'🍽️';
  if(!name){showToast('Bitte Gerichtname eingeben');return;}
  if(!HP.meals[key])HP.meals[key]={};
  HP.meals[key][slot]={recipeId:null,name,emoji};
  HP_save();closeModal();renderMeals();showToast(emoji+' '+name+' eingetragen');
}

function addMealToLibrary(key,slot){
  // Pre-fill recipe form with meal name and open the custom recipe modal
  const m=HP.meals[key]?.[slot];
  if(!m){closeModal();return;}
  closeModal();
  const cats=['Frühstück','Salate','Pasta','Hauptspeisen','Grill','Suppen','Snacks','Desserts'];
  const defaultCat=slot==='Frühstück'?'Frühstück':'Hauptspeisen';
  showModal(
    '<h3>📖 "'+m.name+'" zur Bibliothek</h3>'+
    '<div class="modal-row"><label>Emoji & Name</label><div style="display:flex;gap:7px">'+
    '<input class="modal-in" id="cr-emoji" placeholder="🍽️" maxlength="2" style="width:48px;text-align:center" value="'+m.emoji+'">'+
    '<input class="modal-in" id="cr-name" placeholder="Name" style="flex:1" value="'+m.name+'"></div></div>'+
    '<div class="modal-row"><div style="display:flex;gap:7px">'+
    '<div style="flex:1"><label>Zeit (Min)</label><input class="modal-in" id="cr-time" type="number" value="30"></div>'+
    '<div style="flex:1"><label>Personen</label><input class="modal-in" id="cr-pers" type="number" value="2"></div>'+
    '<div style="flex:1"><label>Kategorie</label><select class="modal-in" id="cr-cat">'+
    cats.map(c=>'<option'+(c===defaultCat?' selected':'')+'>'+c+'</option>').join('')+
    '</select></div></div></div>'+
    '<div class="modal-row"><label>Zutaten (Name, Menge, Einheit – eine pro Zeile)</label>'+
    '<textarea class="modal-in" id="cr-ings" rows="5" placeholder="Pasta, 300, g&#10;Tomatensauce, 1, Dose" style="resize:vertical;font-family:Inter,sans-serif"></textarea></div>'+
    '<div class="modal-btns"><button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
    '<button class="mbtn mbtn-confirm" onclick="saveCustomRecipeFromMeal(\''+key+'\',\''+slot+'\')">✓ Zur Bibliothek hinzufügen</button></div>'
  );
}

function saveCustomRecipeFromMeal(key,slot){
  const emoji=document.getElementById('cr-emoji')?.value.trim()||'🍽️';
  const name=document.getElementById('cr-name')?.value.trim();
  if(!name){showToast('Bitte Namen eingeben');return;}
  const ing=(document.getElementById('cr-ings')?.value||'').split('\n').filter(l=>l.trim()).map(l=>{
    const p=l.split(',').map(x=>x.trim()); return{n:p[0]||l,q:p[1]||'',u:p[2]||''};
  });
  const newRecipe={id:'cr'+Date.now(),emoji,name,
    cat:document.getElementById('cr-cat')?.value||'Hauptspeisen',
    time:parseInt(document.getElementById('cr-time')?.value)||30,
    pers:parseInt(document.getElementById('cr-pers')?.value)||2,
    tags:['eigenes'],ing,custom:true};
  if(!HP.customRecipes)HP.customRecipes=[];
  HP.customRecipes.push(newRecipe);
  // Link the meal slot to this new recipe
  if(!HP.meals[key])HP.meals[key]={};
  HP.meals[key][slot]={recipeId:newRecipe.id,name:newRecipe.name,emoji:newRecipe.emoji};
  HP_save();closeModal();renderMeals();showToast(emoji+' '+name+' zur Bibliothek hinzugefügt');
}
function pickFromLibrary(key,slot){pendingMealSlot={key,slot};closeModal();setView('recipes',null);showToast('Rezept wählen → "Zum Menüplan" tippen');}
function removeMeal(key,slot){if(HP.meals[key])delete HP.meals[key][slot];HP_save();renderMeals();}
function assignMealFromRecipe(recipe){
  if(!recipe||!pendingMealSlot)return;
  const {key,slot}=pendingMealSlot;
  if(!HP.meals[key])HP.meals[key]={};
  HP.meals[key][slot]={recipeId:recipe.id,name:recipe.name,emoji:recipe.emoji};
  HP_save();pendingMealSlot=null;setView('meals',null);showToast(recipe.emoji+' '+recipe.name+' gesetzt');
}
function addDayToShop(key){
  let added=0;
  Object.values(HP.meals[key]||{}).forEach(m=>{
    const r=allRecipes().find(x=>x.id===m.recipeId); if(!r) return;
    r.ing.forEach(ing=>{
      if(!HP.shop.find(i=>i.name.toLowerCase()===ing.n.toLowerCase()&&!i.bought)){
        HP.shop.push({id:'sh'+Date.now()+Math.random(),name:ing.n,qty:ing.q,unit:ing.u,cat:guessCat(ing.n),bought:false,taskId:null,taskName:m.emoji+' '+m.name});added++;
      }
    });
  });
  HP_save();renderSidebarStats();showToast(added+' Zutaten hinzugefügt');
}
function addWholeWeekToShop(){
  let added=0;
  getWeekDates(weekOffset).forEach(d=>{
    Object.values(HP.meals[dk(d)]||{}).forEach(m=>{
      const r=allRecipes().find(x=>x.id===m.recipeId); if(!r) return;
      r.ing.forEach(ing=>{
        if(!HP.shop.find(i=>i.name.toLowerCase()===ing.n.toLowerCase()&&!i.bought)){
          HP.shop.push({id:'sh'+Date.now()+Math.random(),name:ing.n,qty:ing.q,unit:ing.u,cat:guessCat(ing.n),bought:false,taskId:null,taskName:m.emoji+' '+m.name});added++;
        }
      });
    });
  });
  HP_save();renderSidebarStats();showToast(added+' Zutaten für die ganze Woche hinzugefügt');
}

// ── RECIPES ───────────────────────────────────
function renderRecipes() {
  const all=allRecipes();
  const hd=document.getElementById('recipe-hd'); if(hd) hd.textContent='Rezeptbibliothek · '+all.length+' Rezepte';
  const cats=['Alle',...new Set(all.map(r=>r.cat))];
  const fe=document.getElementById('recipe-filters');
  if(fe) fe.innerHTML=cats.map(c=>'<button class="rfbtn'+(c===recipeFilter?' active':'')+'" onclick="setRecipeFilter(\''+c+'\')">'+c+'</button>').join('')+
    '<button class="rfbtn" style="background:var(--p2bg);border-color:var(--p2);color:var(--p2)" onclick="openAddCustomRecipe()">+ Eigenes Rezept</button>';
  const q=(document.getElementById('recipe-search')?.value||'').toLowerCase();
  const filtered=all.filter(r=>(recipeFilter==='Alle'||r.cat===recipeFilter)&&(!q||r.name.toLowerCase().includes(q)||r.tags.some(t=>t.includes(q))));
  const grid=document.getElementById('recipes-grid'); if(!grid) return; grid.innerHTML='';
  filtered.forEach(r=>{
    const card=document.createElement('div'); card.className='rc';
    const isPending=!!pendingMealSlot;
    card.innerHTML='<div class="rc-top">'+r.emoji+'</div><div class="rc-body">'+
      '<div class="rc-name">'+r.name+(r.custom?'<span style="font-size:.6rem;color:var(--amber);margin-left:5px">eigenes</span>':'')+'</div>'+
      '<div class="rc-meta"><span>⏱ '+r.time+' Min</span><span>👥 '+r.pers+' Pers.</span></div>'+
      '<div class="rc-tags">'+r.tags.map(t=>'<span class="rc-tag">'+t+'</span>').join('')+'</div>'+
      '<button class="rc-addbtn" onclick="event.stopPropagation();openRecipeDetail(\''+r.id+'\')">🛒 Zutaten wählen</button>'+
      '<button class="rc-addbtn" style="margin-top:4px;background:var(--p2bg);border-color:var(--p2);color:var(--p2)" onclick="event.stopPropagation();'+(isPending?'assignMealFromRecipe(allRecipes().find(x=>x.id===\''+r.id+'\'))':'openMealPlanModal(\''+r.id+'\')')+'">'+(isPending?'✓ Für Menüplan wählen':'📅 Zum Menüplan')+'</button>'+
      (r.custom?'<button class="rc-addbtn" style="margin-top:4px;background:var(--rbg);border-color:var(--red);color:var(--red)" onclick="event.stopPropagation();deleteCustomRecipe(\''+r.id+'\')">✕ Löschen</button>':'')+
      '</div>';
    card.addEventListener('click',()=>openRecipeDetail(r.id));
    grid.appendChild(card);
  });
}
function setRecipeFilter(c){recipeFilter=c;renderRecipes();}
function filterRecipes(){renderRecipes();}
function openRecipeDetail(rid) {
  const r=allRecipes().find(x=>x.id===rid); if(!r) return;
  const rows=r.ing.map((ing,i)=>
    '<li style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">'+
    '<input type="checkbox" id="ic-'+i+'" checked style="accent-color:var(--shared);width:15px;height:15px;cursor:pointer;flex-shrink:0">'+
    '<label for="ic-'+i+'" style="flex:1;font-size:.79rem;cursor:pointer">'+ing.n+(ing.optional?' <span style="font-size:.65rem;color:var(--amber)">(optional)</span>':'')+'</label>'+
    '<span style="font-size:.75rem;color:var(--muted);white-space:nowrap">'+ing.q+' '+ing.u+'</span></li>').join('');
  showModal('<span style="font-size:2rem;text-align:center;display:block;margin-bottom:6px">'+r.emoji+'</span>'+
    '<h3 style="text-align:center">'+r.name+'</h3>'+
    '<div style="display:flex;gap:10px;justify-content:center;font-size:.73rem;color:var(--muted);margin-bottom:12px">'+
    '<span>⏱ '+r.time+' Min</span><span>👥 '+r.pers+' Pers.</span><span>'+r.tags.join(' · ')+'</span></div>'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'+
    '<span style="font-size:.65rem;text-transform:uppercase;letter-spacing:.09em;color:var(--muted)">Zutaten wählen</span>'+
    '<button onclick="toggleAllIng('+r.ing.length+')" style="background:none;border:none;color:var(--muted);font-size:.72rem;cursor:pointer">Alle an/ab</button></div>'+
    '<ul style="list-style:none">'+rows+'</ul>'+
    '<div class="modal-btns"><button class="mbtn mbtn-cancel" onclick="closeModal()">Schliessen</button>'+
    '<button class="mbtn" style="background:var(--shbg);border:1px solid var(--shared);color:var(--shared)" onclick="addSelectedIngs(\''+rid+'\')">🛒 Auswahl zur Liste</button>'+
    '<button class="mbtn mbtn-confirm" onclick="closeModal();openMealPlanModal(\''+rid+'\')">📅 Menüplan</button></div>',true);
}
function toggleAllIng(n){const cbs=Array.from({length:n},(_,i)=>document.getElementById('ic-'+i)).filter(Boolean);const all=cbs.every(c=>c.checked);cbs.forEach(c=>c.checked=!all);}
function addSelectedIngs(rid) {
  const r=allRecipes().find(x=>x.id===rid); if(!r) return;
  let added=0;
  r.ing.forEach((ing,i)=>{
    const cb=document.getElementById('ic-'+i); if(!cb||!cb.checked) return;
    if(!HP.shop.find(x=>x.name.toLowerCase()===ing.n.toLowerCase()&&!x.bought)){
      HP.shop.push({id:'sh'+Date.now()+Math.random(),name:ing.n,qty:ing.q,unit:ing.u,cat:guessCat(ing.n),bought:false,taskId:null,taskName:r.emoji+' '+r.name});added++;
    }
  });
  HP_save();closeModal();renderSidebarStats();showToast(added+' Zutaten von "'+r.name+'" hinzugefügt');
}
function openMealPlanModal(rid) {
  const r=allRecipes().find(x=>x.id===rid); if(!r) return;
  const dates=getWeekDates(weekOffset);
  const opts=dates.map((d,i)=>['Frühstück','Mittag','Abend'].map(s=>'<option value="'+dk(d)+'||'+s+'">'+DS[i]+' '+d.getDate()+'. – '+s+'</option>').join('')).join('');
  showModal('<h3>'+r.emoji+' '+r.name+'</h3>'+
    '<div class="modal-row"><label>Wann?</label><select class="modal-in" id="meal-slot-sel">'+opts+'</select></div>'+
    '<div class="modal-btns"><button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
    '<button class="mbtn mbtn-confirm" onclick="confirmMealSlot(\''+rid+'\')">Hinzufügen</button></div>');
}
function confirmMealSlot(rid) {
  const val=document.getElementById('meal-slot-sel')?.value||''; if(!val) return;
  const [key,slot]=val.split('||');
  const r=allRecipes().find(x=>x.id===rid); if(!r) return;
  if(!HP.meals[key])HP.meals[key]={};
  HP.meals[key][slot]={recipeId:r.id,name:r.name,emoji:r.emoji};
  HP_save();closeModal();showToast(r.emoji+' '+r.name+' zum Menüplan hinzugefügt');
}
function openAddCustomRecipe() {
  const cats=['Frühstück','Salate','Pasta','Hauptspeisen','Grill','Suppen','Snacks','Desserts'];
  showModal('<h3>📖 Eigenes Rezept</h3>'+
    '<div class="modal-row"><label>Emoji & Name</label><div style="display:flex;gap:7px">'+
    '<input class="modal-in" id="cr-emoji" placeholder="🍽️" maxlength="2" style="width:48px;text-align:center">'+
    '<input class="modal-in" id="cr-name" placeholder="Name" style="flex:1"></div></div>'+
    '<div class="modal-row"><div style="display:flex;gap:7px">'+
    '<div style="flex:1"><label>Zeit (Min)</label><input class="modal-in" id="cr-time" type="number" value="30"></div>'+
    '<div style="flex:1"><label>Personen</label><input class="modal-in" id="cr-pers" type="number" value="2"></div>'+
    '<div style="flex:1"><label>Kategorie</label><select class="modal-in" id="cr-cat">'+cats.map(c=>'<option>'+c+'</option>').join('')+'</select></div></div></div>'+
    '<div class="modal-row"><label>Zutaten (Name, Menge, Einheit – eine pro Zeile)</label>'+
    '<textarea class="modal-in" id="cr-ings" rows="5" placeholder="Pasta, 300, g&#10;Tomatensauce, 1, Dose" style="resize:vertical;font-family:Inter,sans-serif"></textarea></div>'+
    '<div class="modal-btns"><button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
    '<button class="mbtn mbtn-confirm" onclick="saveCustomRecipe()">✓ Speichern</button></div>');
}
function saveCustomRecipe() {
  const emoji=document.getElementById('cr-emoji')?.value.trim()||'🍽️';
  const name=document.getElementById('cr-name')?.value.trim();
  if(!name){showToast('Bitte Namen eingeben');return;}
  const ing=(document.getElementById('cr-ings')?.value||'').split('\n').filter(l=>l.trim()).map(l=>{const p=l.split(',').map(x=>x.trim());return{n:p[0]||l,q:p[1]||'',u:p[2]||''};});
  if(!HP.customRecipes)HP.customRecipes=[];
  HP.customRecipes.push({id:'cr'+Date.now(),emoji,name,cat:document.getElementById('cr-cat')?.value||'Hauptspeisen',time:parseInt(document.getElementById('cr-time')?.value)||30,pers:parseInt(document.getElementById('cr-pers')?.value)||2,tags:['eigenes'],ing,custom:true});
  HP_save();closeModal();renderRecipes();showToast(emoji+' '+name+' hinzugefügt');
}
function deleteCustomRecipe(id){HP.customRecipes=(HP.customRecipes||[]).filter(r=>r.id!==id);HP_save();renderRecipes();showToast('Rezept gelöscht');}

// ── MANAGE ────────────────────────────────────
function renderManage() {
  ['p1','p2','shared'].forEach(who=>{
    const el=document.getElementById('tm-'+who); if(!el) return; el.innerHTML='';
    HP.tasks[who].forEach(task=>{
      const card=document.createElement('div'); card.className='tm-card';
      const dps=DS.map((d,i)=>'<span class="dp '+(task.days.includes(i)?'o'+(who==='shared'?'sh':who):'')+'" data-tid="'+task.id+'" data-who="'+who+'" data-day="'+i+'">'+d+'</span>').join('');
      card.innerHTML='<div class="tm-top"><span class="tm-name">'+task.emoji+' '+task.name+(task.time?' <span style="font-size:.65rem;color:var(--muted)">⏰'+task.time+'</span>':'')+'</span>'+
        '<div class="tm-acts"><button class="prio-btn'+(task.prio?' on':'')+'" data-tid="'+task.id+'" data-who="'+who+'">●</button>'+
        '<button class="tm-del" data-tid="'+task.id+'" data-who="'+who+'">✕</button></div></div>'+
        '<div class="day-pills">'+dps+'</div>';
      el.appendChild(card);
    });
    el.querySelectorAll('.dp').forEach(p=>{p.addEventListener('click',()=>{
      const t=HP.tasks[p.dataset.who].find(t=>t.id===p.dataset.tid); if(!t) return;
      const i=t.days.indexOf(+p.dataset.day); if(i>-1)t.days.splice(i,1); else t.days.push(+p.dataset.day);
      HP_save();render();
    });});
    el.querySelectorAll('.prio-btn').forEach(b=>{b.addEventListener('click',()=>{
      const t=HP.tasks[b.dataset.who].find(t=>t.id===b.dataset.tid); if(t){t.prio=!t.prio;HP_save();render();}
    });});
    el.querySelectorAll('.tm-del').forEach(b=>{b.addEventListener('click',()=>{
      HP.tasks[b.dataset.who]=HP.tasks[b.dataset.who].filter(t=>t.id!==b.dataset.tid); HP_save();render();
    });});
  });
}

// ── ADD TASK ──────────────────────────────────
function renamePerson(who) {
  const current = HP.names[who];
  const color = who === 'p1' ? 'var(--p1)' : 'var(--p2)';
  showModal(
    '<h3>✏️ Name ändern</h3>' +
    '<div class="modal-row"><label>Neuer Name</label>' +
    '<input class="modal-in" id="rename-input" value="' + current + '" style="border-color:' + color + '"></div>' +
    '<div class="modal-btns">' +
    '<button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>' +
    '<button class="mbtn mbtn-confirm" onclick="savePersonName(\'' + who + '\')">✓ Speichern</button>' +
    '</div>'
  );
  setTimeout(() => {
    const inp = document.getElementById('rename-input');
    if (inp) { inp.focus(); inp.select(); }
  }, 50);
}

function savePersonName(who) {
  const inp = document.getElementById('rename-input');
  const name = inp?.value.trim();
  if (!name) { showToast('Bitte einen Namen eingeben'); return; }
  HP.names[who] = name;
  HP_save();
  closeModal();
  syncNames();
  showToast('Name geändert zu ' + name);
}

// ── ADD TASK DAY PILLS ────────────────────────
function initDayPills() {
  afSelectedDays=[];
  document.querySelectorAll('.af-day-pill').forEach(p=>{
    p.className='dp af-day-pill';
    p.onclick=()=>{
      const d=parseInt(p.dataset.day), i=afSelectedDays.indexOf(d);
      if(i>-1){afSelectedDays.splice(i,1);p.className='dp af-day-pill';}
      else{afSelectedDays.push(d);p.className='dp af-day-pill op1';}
    };
  });
}
function toggleAllDays(){
  const pills=document.querySelectorAll('.af-day-pill');
  if(afSelectedDays.length===7){afSelectedDays=[];pills.forEach(p=>p.className='dp af-day-pill');}
  else{afSelectedDays=[0,1,2,3,4,5,6];pills.forEach(p=>p.className='dp af-day-pill op1');}
}
function addTask(){
  const emoji=document.getElementById('af-emoji')?.value.trim()||'⭐';
  const name=document.getElementById('af-name')?.value.trim();
  const who=document.getElementById('af-who')?.value||'shared';
  const prio=document.getElementById('af-prio')?.checked||false;
  const time=document.getElementById('af-time')?.value||'';
  const reminder=document.getElementById('af-reminder')?.value||'';
  if(!name){showToast('Bitte Aufgabenname eingeben');return;}
  const days=afSelectedDays.length?[...afSelectedDays]:[0,1,2,3,4,5,6];
  const tid=who+Date.now();
  HP.tasks[who].push({id:tid,emoji,name,days,prio,status:'open',time,reminder});
  if(time&&reminder!=='') scheduleTaskNotif({id:tid,emoji,name,days,time,reminder});
  ['af-name','af-emoji','af-time'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  document.getElementById('af-prio').checked=false;
  document.getElementById('af-reminder').value='';
  afSelectedDays=[];
  document.querySelectorAll('.af-day-pill').forEach(p=>p.className='dp af-day-pill');
  HP_save();render();showToast(emoji+' '+name+' hinzugefügt');
}

// ── TASK MODAL ────────────────────────────────
function openTaskModal(tid) {
  const task=allTasks().find(t=>t.id===tid); if(!task) return;
  const st=getStatus(tid), note=HP.taskNotes[tid]||'';
  const stBtns=[['open','⬜ Offen'],['wip','🟡 In Arbeit'],['blocked','🔴 Blockiert'],['done','✅ Erledigt']]
    .map(([s,l])=>'<button class="st-btn'+(st===s?' sel-'+s:'')+'" onclick="setTaskStatus(\''+tid+'\',\''+s+'\',this)">'+l+'</button>').join('');
  showModal('<h3>'+task.emoji+' '+task.name+'</h3>'+
    '<div class="modal-row"><label>Status</label><div class="st-btns">'+stBtns+'</div></div>'+
    '<div class="modal-row" style="display:flex;gap:8px">'+
    '<div style="flex:1"><label>Uhrzeit</label><input class="modal-in" type="time" id="tm-time" value="'+(task.time||'')+'"></div>'+
    '<div style="flex:1"><label>Erinnerung</label><select class="modal-in" id="tm-rem">'+
    ['','0','5','15','30','60'].map((v,i)=>'<option value="'+v+'"'+(task.reminder===v?' selected':'')+'>'+['Keine','Zur Uhrzeit','5 Min vorher','15 Min vorher','30 Min vorher','1 Std vorher'][i]+'</option>').join('')+
    '</select></div></div>'+
    '<div class="modal-row" id="block-sec" style="'+(st!=='blocked'?'display:none':'')+' ">'+
    '<label>Was fehlt / warum blockiert?</label>'+
    '<input class="modal-in" id="block-note" placeholder="z.B. Blumenerde fehlt…" value="'+note+'">'+
    '<button class="mbtn mbtn-confirm" style="margin-top:8px;width:100%;background:var(--shared)" onclick="addBlockedToShop(\''+tid+'\')">🛒 Zur Einkaufsliste</button></div>'+
    '<div class="modal-btns"><button class="mbtn mbtn-cancel" onclick="closeModal()">Schliessen</button>'+
    '<button class="mbtn mbtn-confirm" onclick="saveTaskDetails(\''+tid+'\');closeModal()">Speichern</button></div>');
}
function setTaskStatus(tid,status,btn) {
  HP.taskStatus[tid]=status;
  document.querySelectorAll('.st-btn').forEach(b=>b.className='st-btn');
  btn.className='st-btn sel-'+status;
  const bs=document.getElementById('block-sec'); if(bs) bs.style.display=status==='blocked'?'':'none';
  HP_save();
}
function saveTaskDetails(tid) {
  const el=document.getElementById('block-note'); if(el) HP.taskNotes[tid]=el.value;
  const t=document.getElementById('tm-time')?.value||'', r=document.getElementById('tm-rem')?.value||'';
  ['p1','p2','shared'].forEach(w=>{const task=HP.tasks[w].find(x=>x.id===tid);if(task){task.time=t;task.reminder=r;}});
  HP_save(); const task=allTasks().find(x=>x.id===tid);
  if(task&&t&&r!=='') scheduleTaskNotif({...task,time:t,reminder:r});
  render();
}
function addBlockedToShop(tid) {
  const task=allTasks().find(t=>t.id===tid);
  const note=document.getElementById('block-note')?.value||'';
  HP.taskNotes[tid]=note; HP_save(); closeModal();
  const opts=CATS.map(c=>'<option value="'+c+'">'+catEmoji(c)+' '+c+'</option>').join('');
  showModal('<h3>🛒 Zur Einkaufsliste</h3>'+
    '<div class="modal-row"><label>Artikel</label><input class="modal-in" id="bl-name" value="'+note+'" placeholder="z.B. Blumenerde"></div>'+
    '<div class="modal-row"><div style="display:flex;gap:8px">'+
    '<div style="flex:1"><label>Menge</label><input class="modal-in" id="bl-qty"></div>'+
    '<div style="flex:1"><label>Einheit</label><input class="modal-in" id="bl-unit"></div>'+
    '<div style="flex:1"><label>Kategorie</label><select class="modal-in" id="bl-cat">'+opts+'</select></div></div></div>'+
    '<div class="modal-btns"><button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
    '<button class="mbtn mbtn-confirm" style="background:var(--green);color:#000" onclick="confirmBlockedShop(\''+tid+'\')">✓ Hinzufügen</button></div>');
}
function confirmBlockedShop(tid) {
  const task=allTasks().find(t=>t.id===tid);
  const name=document.getElementById('bl-name')?.value.trim();
  if(!name){closeModal();return;}
  HP.taskNotes[tid]=name; HP_save(); closeModal();
  addShopItem(name,document.getElementById('bl-qty')?.value.trim()||'',document.getElementById('bl-unit')?.value.trim()||'',document.getElementById('bl-cat')?.value||'Sonstiges',tid,task?task.emoji+' '+task.name:null);
  render();
}

// ── MONTH VIEW ────────────────────────────────
function renderMonth() {
  const base=new Date(new Date().getFullYear(), new Date().getMonth()+monthViewOffset, 1);
  const el=document.getElementById('month-title'); if(el) el.textContent=base.toLocaleDateString('de-CH',{month:'long',year:'numeric'});
  const today=new Date(); today.setHours(0,0,0,0);
  const tasks=allTasks(), firstDow=(base.getDay()+6)%7;
  const daysInMonth=new Date(base.getFullYear(),base.getMonth()+1,0).getDate();
  let html=DS.map(d=>'<div class="month-dow">'+d+'</div>').join('');
  for(let i=0;i<firstDow;i++){
    const pd=new Date(base.getFullYear(),base.getMonth(),-firstDow+i+1);
    html+='<div class="month-cell other-month"><div class="mc-num">'+pd.getDate()+'</div></div>';
  }
  for(let day=1;day<=daysInMonth;day++){
    const date=new Date(base.getFullYear(),base.getMonth(),day);
    const di=(date.getDay()+6)%7, key=dk(date), isT=date.getTime()===today.getTime();
    const dayT=tasks.filter(t=>t.days.includes(di));
    const meals=HP.meals[key]||{};
    const evHtml=[
      ...dayT.slice(0,2).map(t=>'<div class="mc-event e'+(t.who==='shared'?'sh':t.who)+'">'+t.emoji+' '+t.name+'</div>'),
      ...Object.values(meals).slice(0,1).map(m=>'<div class="mc-event emeal">🍽️ '+m.name+'</div>')
    ].join('');
    html+='<div class="month-cell'+(isT?' today':'')+((dayT.length||Object.keys(meals).length)?' has-events':'')+'" onclick="openDayDetail(\''+key+'\')">'+
      '<div class="mc-num">'+day+'</div>'+evHtml+'</div>';
  }
  const mc=document.getElementById('month-cal'); if(mc) mc.innerHTML='<div class="month-grid">'+html+'</div>';
}
function changeMonthView(d){monthViewOffset+=d;renderMonth();}
function goMonthToday(){monthViewOffset=0;renderMonth();}
function openDayDetail(key) {
  const date=new Date(key+'T00:00:00'), di=(date.getDay()+6)%7;
  const tasks=allTasks().filter(t=>t.days.includes(di));
  const meals=HP.meals[key]||{};
  const label=date.toLocaleDateString('de-CH',{weekday:'long',day:'numeric',month:'long'});
  const tasksHtml=tasks.length
    ? tasks.map(t=>'<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);font-size:.81rem">'+
        '<span style="color:'+(t.who==='p1'?'var(--p1)':t.who==='p2'?'var(--p2)':'var(--shared)')+'">'+t.emoji+'</span>'+
        '<span style="flex:1">'+t.name+'</span>'+(t.time?'<span style="font-size:.7rem;color:var(--muted)">⏰'+t.time+'</span>':'')+
        (isDone(date,t.id)?'<span style="color:var(--green)">✓</span>':'')+'</div>').join('')
    : '<div style="font-size:.78rem;color:var(--muted);padding:6px 0">Keine Aufgaben</div>';
  const mealsHtml=['Frühstück','Mittag','Abend'].map(s=>'<div style="display:flex;gap:8px;padding:4px 0;font-size:.79rem">'+
    '<span style="color:var(--muted);width:70px;flex-shrink:0">'+s+'</span>'+
    '<span>'+(meals[s]?meals[s].emoji+' '+meals[s].name:'—')+'</span></div>').join('');
  showModal('<h3>'+label+'</h3>'+
    '<div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.09em;color:var(--muted);margin:12px 0 6px">Aufgaben</div>'+tasksHtml+
    '<div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.09em;color:var(--muted);margin:12px 0 6px">Menü</div>'+mealsHtml+
    '<div class="modal-btns"><button class="mbtn mbtn-cancel" onclick="closeModal()">Schliessen</button>'+
    '<button class="mbtn" style="background:var(--gbg);border:1px solid var(--green);color:var(--green)" onclick="exportDayICS(\''+key+'\');closeModal()">📅 In Kalender</button></div>');
}

// ── PINBOARD ──────────────────────────────────
function renderPinboard() {
  const notes=HP.notes||[], el=document.getElementById('pin-board'); if(!el) return;
  if(!notes.length){el.innerHTML='<div style="text-align:center;padding:60px 20px;color:var(--muted)"><div style="font-size:2.5rem;margin-bottom:12px">📌</div><div>Noch keine Notizen.</div></div>';return;}
  const NOTE_BG={yellow:'background:#2d2a00;border:1px solid rgba(251,191,36,.3);color:#fde68a',blue:'background:#0a1628;border:1px solid rgba(108,142,255,.3);color:#bfcfff',pink:'background:#2a0a14;border:1px solid rgba(255,126,179,.3);color:#ffcce5',green:'background:#082010;border:1px solid rgba(74,222,128,.3);color:#bbf7d0',purple:'background:#180a2a;border:1px solid rgba(167,139,250,.3);color:#ddd6fe'};
  el.innerHTML='<div class="pin-grid">'+notes.map(n=>
    '<div class="pin-note" style="'+NOTE_BG[n.color||'yellow']+'" onclick="openEditNote(\''+n.id+'\')">'+
    '<div class="pin-pin">📌</div>'+
    '<button class="pin-del" onclick="event.stopPropagation();deleteNote(\''+n.id+'\')">✕</button>'+
    (n.title?'<div class="pin-title">'+n.title+'</div>':'')+
    '<div class="pin-body">'+n.body+'</div>'+
    (n.date?'<div class="pin-date">📅 '+n.date+'</div>':'')+
    '</div>').join('')+'</div>';
}
const NOTE_COLORS=['yellow','blue','pink','green','purple'];
const NOTE_BG_PREVIEW={yellow:'#fde68a',blue:'#bfcfff',pink:'#ffcce5',green:'#bbf7d0',purple:'#ddd6fe'};
function noteColorBtns(selected){return NOTE_COLORS.map(c=>'<span onclick="document.querySelectorAll(\'.nc-btn\').forEach(x=>x.style.borderColor=\'transparent\');this.style.borderColor=\'#fff\';document.getElementById(\'note-color\').value=\''+c+'\'" class="nc-btn" style="display:inline-block;width:22px;height:22px;border-radius:50%;cursor:pointer;background:'+NOTE_BG_PREVIEW[c]+';border:2px solid '+(selected===c?'#fff':'transparent')+';transition:all .15s"></span>').join('');}
function openAddNote(){
  showModal('<h3>📌 Neue Notiz</h3><input type="hidden" id="note-color" value="yellow">'+
    '<div class="modal-row"><label>Farbe</label><div style="display:flex;gap:6px">'+noteColorBtns('yellow')+'</div></div>'+
    '<div class="modal-row"><label>Titel (optional)</label><input class="modal-in" id="note-title" placeholder="Titel…"></div>'+
    '<div class="modal-row"><label>Notiz</label><textarea class="modal-in" id="note-body" rows="5" placeholder="Text…" style="resize:vertical;font-family:Inter,sans-serif"></textarea></div>'+
    '<div class="modal-row"><label>Datum (optional)</label><input class="modal-in" type="date" id="note-date"></div>'+
    '<div class="modal-btns"><button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
    '<button class="mbtn mbtn-confirm" onclick="saveNewNote()">✓ Speichern</button></div>');
}
function saveNewNote(){
  const body=document.getElementById('note-body')?.value.trim(); if(!body){showToast('Bitte Text eingeben');return;}
  if(!HP.notes)HP.notes=[];
  HP.notes.unshift({id:'n'+Date.now(),title:document.getElementById('note-title')?.value.trim()||'',body,color:document.getElementById('note-color')?.value||'yellow',date:document.getElementById('note-date')?.value||'',created:new Date().toISOString()});
  HP_save();closeModal();renderPinboard();
}
function openEditNote(id){
  const n=(HP.notes||[]).find(x=>x.id===id); if(!n) return;
  showModal('<h3>✏️ Notiz bearbeiten</h3><input type="hidden" id="note-color" value="'+n.color+'">'+
    '<div class="modal-row"><label>Farbe</label><div style="display:flex;gap:6px">'+noteColorBtns(n.color)+'</div></div>'+
    '<div class="modal-row"><label>Titel</label><input class="modal-in" id="note-title" value="'+(n.title||'')+'"></div>'+
    '<div class="modal-row"><label>Notiz</label><textarea class="modal-in" id="note-body" rows="5" style="resize:vertical;font-family:Inter,sans-serif">'+n.body+'</textarea></div>'+
    '<div class="modal-row"><label>Datum</label><input class="modal-in" type="date" id="note-date" value="'+(n.date||'')+'"></div>'+
    '<div class="modal-btns" style="justify-content:space-between">'+
    '<button class="mbtn" style="background:var(--rbg);border:1px solid var(--red);color:var(--red)" onclick="deleteNote(\''+id+'\')">🗑</button>'+
    '<button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
    '<button class="mbtn mbtn-confirm" onclick="saveEditNote(\''+id+'\')">✓ Speichern</button></div>');
}
function saveEditNote(id){
  const n=(HP.notes||[]).find(x=>x.id===id); if(!n){closeModal();return;}
  n.title=document.getElementById('note-title')?.value.trim()||'';
  n.body=document.getElementById('note-body')?.value.trim()||n.body;
  n.color=document.getElementById('note-color')?.value||n.color;
  n.date=document.getElementById('note-date')?.value||'';
  HP_save();closeModal();renderPinboard();
}
function deleteNote(id){HP.notes=(HP.notes||[]).filter(x=>x.id!==id);HP_save();closeModal();renderPinboard();}

// ── NOTIFICATIONS ─────────────────────────────
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
function scheduleTaskNotif(task){
  if(!NOTIF_OK||!task.time||task.reminder===''||task.reminder===undefined)return;
  try{
    if(Notification.permission!=='granted')return;
    const[h,m]=task.time.split(':').map(Number), off=parseInt(task.reminder)||0;
    const nm=h*60+m-off;
    getWeekDates(weekOffset).forEach((date,di)=>{
      if(!task.days.includes(di))return;
      const fire=new Date(date); fire.setHours(Math.floor(nm/60),nm%60,0,0);
      const ms=fire.getTime()-Date.now(); if(ms<0)return;
      const key=task.id+'-'+dk(date);
      clearTimeout(schedTimers[key]);
      schedTimers[key]=setTimeout(()=>{
        try{new Notification(task.emoji+' '+(off===0?'Jetzt: ':'In '+off+' Min: ')+task.name,{body:'Heimplaner',tag:key,renotify:true});}catch(e){}
      },ms);
    });
  }catch(e){}
}
function rescheduleAll(){if(NOTIF_OK){try{if(Notification.permission==='granted')allTasks().forEach(t=>{if(t.time&&t.reminder!=='')scheduleTaskNotif(t);});}catch(e){}}}
function maybeNotifBanner(){
  if(!NOTIF_OK)return;
  try{
    if(Notification.permission!=='default')return;
    const bar=document.createElement('div');
    bar.id='notif-banner';
    bar.style.cssText='background:rgba(108,142,255,.12);border-bottom:1px solid rgba(108,142,255,.25);padding:8px 20px;font-size:.78rem;display:flex;align-items:center;gap:10px;flex-shrink:0';
    bar.innerHTML='<span>🔔 Erinnerungen aktivieren?</span>'+
      '<button onclick="requestNotifPermission().then(ok=>{if(ok)rescheduleAll();document.getElementById(\'notif-banner\')?.remove()})" style="background:var(--p1);color:#fff;border:none;border-radius:6px;padding:4px 12px;font-family:Inter,sans-serif;font-size:.75rem;cursor:pointer">Erlauben</button>'+
      '<button onclick="document.getElementById(\'notif-banner\')?.remove()" style="background:none;border:none;color:var(--muted);cursor:pointer;margin-left:auto;font-size:1rem">✕</button>';
    const main=document.querySelector('.main'), tb=document.querySelector('.topbar');
    if(main&&tb)main.insertBefore(bar,tb.nextSibling);
  }catch(e){}
}

// ── AI ASSISTANT ──────────────────────────────
const AI_SYSTEM=`Du bist ein hilfreicher Haushalts-Assistent für die App "Heimplaner" (Mauro & Lena, Schweiz).
Antworte IMMER mit JSON wenn du eine Aktion ausführst:
- Task: {"action":"add_task","emoji":"💪","name":"Sport","who":"p1|p2|shared","days":[0,1,2,3,4,5,6],"time":"18:00","prio":false}
- Einkauf: {"action":"add_shop","name":"Milch","qty":"1","unit":"L","cat":"Kühlwaren"}
- Menü: {"action":"set_meal","date":"YYYY-MM-DD","slot":"Frühstück|Mittag|Abend","meal":"Pasta","emoji":"🍝"}
- Menüvorschlag: {"action":"suggest_menu","days":{"Mo":"Pasta Carbonara","Di":"Lachs aus dem Ofen","Mi":"Burger","Do":"Bolognese","Fr":"Pizza","Sa":"Grill","So":"Rührei"}}
- Mehrere: {"actions":[...]}
- Nur Text: {"action":"reply","text":"..."}
Mauro mag: simpel, klassisch, kein Seafood, keine Pilze. Zwiebeln/Knoblauch optional.
Schweizer Begriffe (Poulet statt Hähnchen). Heute: ${new Date().toLocaleDateString('de-CH',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}.`;

function renderAiQuickBtns(){
  const btns=[
    {i:'🗓️',l:'Menü für diese Woche',m:'Schlage mir einen kompletten Menüplan für diese Woche vor.'},
    {i:'🛒',l:'Einkaufsliste ergänzen',m:'Welche Grundzutaten sollten wir diese Woche einkaufen?'},
    {i:'💡',l:'Task-Vorschläge',m:'Welche Haushalts-Aufgaben empfiehlst du für diese Woche?'},
    {i:'🍽️',l:'Was kochen heute?',m:'Was können wir heute Abend simpel und klassisch kochen?'},
  ];
  const el=document.getElementById('ai-quick-btns');
  if(el) el.innerHTML=btns.map(b=>'<button class="ai-quick-btn" onclick="sendAiMessage(\''+b.m.replace(/'/g,"&#39;")+'\')">'+(b.i)+' '+(b.l)+'</button>').join('');
}
function addAiMsg(role,text,actions=[]){
  const chat=document.getElementById('ai-chat'); if(!chat) return;
  const div=document.createElement('div'); div.className='ai-msg '+role;
  const actHtml=actions.length?'<div class="ai-actions">'+actions.map(a=>'<button class="ai-action-btn" onclick="'+a.fn+'">'+a.label+'</button>').join('')+'</div>':'';
  div.innerHTML='<div class="ai-avatar '+(role==='bot'?'bot':'usr')+'">'+(role==='bot'?'✨':'👤')+'</div>'+
    '<div><div class="ai-bubble">'+text.replace(/\n/g,'<br>')+'</div>'+actHtml+'</div>';
  chat.appendChild(div); chat.scrollTop=chat.scrollHeight;
}
function showAiTyping(){
  const chat=document.getElementById('ai-chat'); if(!chat) return;
  const div=document.createElement('div'); div.className='ai-msg bot'; div.id='ai-typing';
  div.innerHTML='<div class="ai-avatar bot">✨</div><div class="ai-typing"><span></span><span></span><span></span></div>';
  chat.appendChild(div); chat.scrollTop=chat.scrollHeight;
}
function removeAiTyping(){document.getElementById('ai-typing')?.remove();}
function buildContext(){
  const tasks=allTasks(), shopOpen=HP.shop.filter(i=>!i.bought);
  const today=new Date(); today.setHours(0,0,0,0);
  const di=(today.getDay()+6)%7;
  const todayT=tasks.filter(t=>t.days.includes(di));
  const weekMeals=[];
  getWeekDates(weekOffset).forEach((d,i)=>{const m=HP.meals[dk(d)]||{};if(Object.keys(m).length)weekMeals.push(DS[i]+': '+Object.values(m).map(x=>x.name).join(', '));});
  return ['Tasks: '+tasks.length,'Heute ('+DS[di]+'): '+todayT.map(t=>t.name).join(', '),'Einkauf offen: '+shopOpen.map(i=>i.name).join(', '),'Menü diese Woche: '+weekMeals.join(' | '),'Namen: p1='+HP.names.p1+', p2='+HP.names.p2].join('\n');
}
async function sendAiMessage(override=null){
  const input=document.getElementById('ai-input');
  const text=override||(input?input.value.trim():''); if(!text) return;
  if(input)input.value='';
  addAiMsg('user',text);
  aiHistory.push({role:'user',content:text});
  showAiTyping();
  try{
    const response=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1000,system:AI_SYSTEM,
        messages:[{role:'user',content:'App-Kontext:\n'+buildContext()+'\n\nNachricht: '+text},...aiHistory.slice(1).slice(-8)]})
    });
    const data=await response.json(); removeAiTyping();
    const raw=data.content?.map(c=>c.text||'').join('')||'Keine Antwort.';
    aiHistory.push({role:'assistant',content:raw});
    const match=raw.match(/\{[\s\S]*\}/);
    if(match){try{const r=execAiAction(JSON.parse(match[0]));addAiMsg('bot',r.msg,r.actions||[]);}
    catch(e){addAiMsg('bot',raw.replace(/\{[\s\S]*\}/,'').trim()||'Erledigt!');}}
    else addAiMsg('bot',raw);
  }catch(e){removeAiTyping();addAiMsg('bot','Fehler: '+e.message);}
}
function execAiAction(p){
  if(p.actions&&Array.isArray(p.actions)){const msgs=p.actions.map(a=>execSingle(a).msg);HP_save();render();return{msg:msgs.join('\n')};}
  const r=execSingle(p); HP_save();render(); return r;
}
function execSingle(a){
  if(a.action==='add_task'){
    const w=a.who||'shared';
    HP.tasks[w].push({id:w+Date.now(),emoji:a.emoji||'⭐',name:a.name,days:a.days||[0,1,2,3,4,5,6],prio:a.prio||false,status:'open',time:a.time||'',reminder:''});
    return{msg:'✅ Task "'+a.emoji+' '+a.name+'" für '+(w==='p1'?HP.names.p1:w==='p2'?HP.names.p2:'beide')+' hinzugefügt.'};
  }
  if(a.action==='add_shop'){
    const ex=HP.shop.find(i=>i.name.toLowerCase()===a.name.toLowerCase()&&!i.bought);
    if(ex){ex.qty=ex.qty?ex.qty+'+'+a.qty:a.qty;return{msg:'📝 "'+a.name+'" — Menge angepasst.'};}
    HP.shop.push({id:'sh'+Date.now(),name:a.name,qty:a.qty||'',unit:a.unit||'',cat:a.cat||guessCat(a.name),bought:false,taskId:null,taskName:null});
    return{msg:'🛒 "'+a.name+'" zur Einkaufsliste hinzugefügt.'};
  }
  if(a.action==='set_meal'){
    if(!HP.meals[a.date])HP.meals[a.date]={};
    HP.meals[a.date][a.slot]={recipeId:null,name:a.meal,emoji:a.emoji||'🍽️'};
    return{msg:'🍽️ '+a.slot+' am '+a.date+': "'+a.meal+'" eingetragen.'};
  }
  if(a.action==='suggest_menu'){
    const dates=getWeekDates(weekOffset); let count=0;
    Object.entries(a.days||{}).forEach(([dn,mn])=>{
      const di2=DS.indexOf(dn); if(di2<0)return;
      const d=dates[di2], key=dk(d);
      if(!HP.meals[key])HP.meals[key]={};
      HP.meals[key]['Abend']={recipeId:null,name:mn,emoji:'🍽️'};count++;
    });
    return{msg:'📅 Menüplan für '+count+' Tage eingetragen!',actions:[{label:'📅 Zum Menüplan',fn:"setView('meals',null)"}]};
  }
  if(a.action==='reply') return{msg:a.text||'...'};
  return{msg:JSON.stringify(a)};
}
// Speech
function initSpeech(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR) return;
  speechRec=new SR(); speechRec.lang='de-CH'; speechRec.continuous=false; speechRec.interimResults=false;
  speechRec.onresult=e=>{const t=e.results[0][0].transcript;const inp=document.getElementById('ai-input');if(inp)inp.value=t;stopSpeech();sendAiMessage();};
  speechRec.onerror=()=>{stopSpeech();showToast('Spracheingabe fehlgeschlagen');};
  speechRec.onend=()=>stopSpeech();
}
function toggleSpeech(){if(!speechRec)initSpeech();if(!speechRec){showToast('Spracheingabe nicht verfügbar');return;}if(isMicActive)stopSpeech();else startSpeech();}
function startSpeech(){try{speechRec.start();isMicActive=true;const b=document.getElementById('ai-mic-btn');if(b){b.classList.add('mic-active');b.textContent='⏹';}showToast('🎤 Spreche jetzt…');}catch(e){}}
function stopSpeech(){try{speechRec?.stop();}catch(e){}isMicActive=false;const b=document.getElementById('ai-mic-btn');if(b){b.classList.remove('mic-active');b.textContent='🎤';}}

// ── IMPORT / EXPORT ───────────────────────────
function exportJSON(){
  const blob=new Blob([JSON.stringify(HP,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob), a=document.createElement('a');
  a.href=url; a.download='heimplaner-backup-'+dk(new Date())+'.json';
  a.click(); URL.revokeObjectURL(url); showToast('💾 Backup exportiert');
}
function importJSON(e){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>{
    try{
      const d=JSON.parse(ev.target.result);
      if(!d.tasks||!d.names)throw new Error('Ungültiges Format');
      if(!confirm('Alle aktuellen Daten überschreiben?'))return;
      Object.assign(HP,d);
      if(!HP.notes)HP.notes=[];if(!HP.customRecipes)HP.customRecipes=[];
      HP_save();render();showToast('✅ Daten importiert');
    }catch(err){showToast('❌ Import-Fehler: '+err.message);}
  };
  reader.readAsText(file);
}
function exportICS(){
  const inclTasks=document.getElementById('exp-tasks')?.checked!==false;
  const inclMeals=document.getElementById('exp-meals')?.checked!==false;
  const inclNotes=document.getElementById('exp-notes')?.checked!==false;
  const events=[], now=new Date();
  if(inclTasks){
    for(let w=0;w<4;w++){
      getWeekDates(w).forEach((date,di)=>{
        allTasks().filter(t=>t.days.includes(di)&&t.time).forEach(t=>{
          const[h,m]=t.time.split(':').map(Number);
          const s=new Date(date); s.setHours(h,m,0,0);
          const e=new Date(s); e.setHours(h,m+30,0,0);
          events.push({summary:t.emoji+' '+t.name,start:s,end:e,desc:'Heimplaner Task'});
        });
      });
    }
  }
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
  const date=new Date(key+'T00:00:00'), di=(date.getDay()+6)%7;
  const events=[];
  allTasks().filter(t=>t.days.includes(di)&&t.time).forEach(t=>{
    const[h,m]=t.time.split(':').map(Number), s=new Date(date); s.setHours(h,m,0,0);
    const e=new Date(s); e.setHours(h,m+30,0,0);
    events.push({summary:t.emoji+' '+t.name,start:s,end:e,desc:'Heimplaner'});
  });
  Object.entries(HP.meals[key]||{}).forEach(([slot,meal])=>{
    const h=slot==='Frühstück'?8:slot==='Mittag'?12:19, s=new Date(date); s.setHours(h,0,0,0);
    const e=new Date(s); e.setHours(h+1,0,0,0);
    events.push({summary:'🍽️ '+slot+': '+meal.name,start:s,end:e,desc:'Heimplaner Menüplan'});
  });
  if(!events.length){showToast('Keine Einträge mit Uhrzeit');return;}
  buildAndDownloadICS(events, key+'.ics');
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
function resetAllData(){
  if(!confirm('Wirklich ALLE Daten löschen?'))return;
  localStorage.removeItem(SK); location.reload();
}

// ── MOBILE DRAWER ─────────────────────────────
function openMobDrawer(){
  const d=document.getElementById('mob-drawer'); if(d){d.classList.add('open'); syncMobDrawer();}
}
function closeMobDrawer(e){if(e.target===e.currentTarget||e.target.classList.contains('mob-overlay'))closeMobDrawerDirect();}
function closeMobDrawerDirect(){document.getElementById('mob-drawer')?.classList.remove('open');}
function syncMobDrawer(){
  renderMiniMonth('mini-cal-mob','mm-label-mob');
  const rn=document.getElementById('mob-ring-num'); if(rn)rn.textContent=document.getElementById('ring-num')?.textContent||'';
  const rs=document.getElementById('mob-streak'); if(rs)rs.textContent=document.getElementById('st-streak')?.textContent||'';
  const rb=document.getElementById('mob-blocked'); if(rb)rb.textContent=document.getElementById('st-blocked')?.textContent||'';
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
  try{if(NOTIF_OK&&Notification.permission==='granted')rescheduleAll();}catch(e){}
  // Input listeners
  document.getElementById('af-name')?.addEventListener('keydown',e=>{if(e.key==='Enter')addTask();});
  document.getElementById('shop-add-name')?.addEventListener('keydown',e=>{if(e.key==='Enter')addShopItem();});
  document.getElementById('ai-input')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendAiMessage();}});
  document.getElementById('recipe-search')?.addEventListener('input',filterRecipes);
});

// ═══════════════════════════════════════════════
// SYNC – Echtzeit-Synchronisation via Netlify
// ═══════════════════════════════════════════════

const SYNC_URL = '/.netlify/functions/sync';
let syncPassword = localStorage.getItem('hp_sync_pw') || '';
let syncEnabled = false;
let syncTimer = null;
let lastSyncedAt = null;
let syncPollTimer = null;

// ── Sync UI ───────────────────────────────────
function initSync() {
  // Show sync status bar in topbar
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;

  const syncBar = document.createElement('div');
  syncBar.id = 'sync-bar';
  syncBar.style.cssText = 'margin-left:auto;display:flex;align-items:center;gap:8px;font-size:.72rem;color:var(--muted)';
  syncBar.innerHTML =
    '<span id="sync-status">⚪ Nicht verbunden</span>' +
    '<button onclick="openSyncModal()" style="background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--muted);font-family:Inter,sans-serif;font-size:.7rem;padding:3px 9px;cursor:pointer">🔄 Sync</button>';
  topbar.appendChild(syncBar);

  // Auto-connect if password saved
  if (syncPassword) connectSync();
}

function setSyncStatus(status, color) {
  const el = document.getElementById('sync-status');
  if (el) el.innerHTML = '<span style="color:' + color + '">' + status + '</span>';
}

function openSyncModal() {
  showModal(
    '<h3>🔄 Synchronisation</h3>' +
    '<p style="font-size:.8rem;color:var(--muted);margin-bottom:14px">Gemeinsames Passwort für Mauro & Lena — beide müssen dasselbe Passwort eingeben.</p>' +
    '<div class="modal-row"><label>Passwort</label>' +
    '<input class="modal-in" type="password" id="sync-pw-input" placeholder="Euer gemeinsames Passwort" value="' + syncPassword + '"></div>' +
    (syncEnabled
      ? '<div style="background:var(--gbg);border:1px solid var(--green);border-radius:var(--rs);padding:9px 12px;font-size:.78rem;color:var(--green);margin-bottom:10px">✅ Verbunden — Daten werden synchronisiert</div>'
      : '') +
    '<div class="modal-btns" style="justify-content:space-between">' +
    '<button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>' +
    (syncEnabled ? '<button class="mbtn" style="background:var(--rbg);border:1px solid var(--red);color:var(--red)" onclick="disconnectSync()">Trennen</button>' : '') +
    '<button class="mbtn mbtn-confirm" onclick="saveSyncPassword()">✓ Verbinden</button>' +
    '</div>'
  );
  setTimeout(() => document.getElementById('sync-pw-input')?.focus(), 50);
}

function saveSyncPassword() {
  const pw = document.getElementById('sync-pw-input')?.value.trim();
  if (!pw) { showToast('Bitte Passwort eingeben'); return; }
  syncPassword = pw;
  localStorage.setItem('hp_sync_pw', pw);
  closeModal();
  connectSync();
}

function disconnectSync() {
  syncEnabled = false;
  syncPassword = '';
  localStorage.removeItem('hp_sync_pw');
  clearInterval(syncPollTimer);
  setSyncStatus('⚪ Nicht verbunden', 'var(--muted)');
  closeModal();
  showToast('Synchronisation getrennt');
}

// ── Connect & Poll ─────────────────────────────
async function connectSync() {
  setSyncStatus('⏳ Verbinde…', 'var(--amber)');
  try {
    // Test connection by loading data
    const remote = await syncLoad();
    if (remote === null) {
      // First time: push local data
      await syncSave();
    } else {
      // Merge: use newer data
      mergeData(remote);
    }
    syncEnabled = true;
    setSyncStatus('🟢 Synchron', 'var(--green)');
    showToast('✅ Synchronisation aktiv');
    startSyncPolling();
  } catch(e) {
    setSyncStatus('🔴 Fehler', 'var(--red)');
    showToast('❌ Sync-Fehler: ' + e.message);
    syncEnabled = false;
  }
}

async function syncLoad() {
  const res = await fetch(SYNC_URL, {
    headers: { 'x-app-password': syncPassword }
  });
  if (res.status === 401) throw new Error('Falsches Passwort');
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Server-Fehler ' + res.status);
  const json = await res.json();
  lastSyncedAt = json.updated_at;
  return json.data;
}

async function syncSave() {
  if (!syncEnabled && !syncPassword) return;
  const res = await fetch(SYNC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-password': syncPassword
    },
    body: JSON.stringify({ data: HP })
  });
  if (res.status === 401) { disconnectSync(); throw new Error('Falsches Passwort'); }
  if (!res.ok) throw new Error('Speichern fehlgeschlagen');
  setSyncStatus('🟢 Synchron', 'var(--green)');
}

function mergeData(remote) {
  // Simply use remote data — last-write-wins
  if (!remote || typeof remote !== 'object') return;
  Object.assign(HP, remote);
  if (!HP.notes) HP.notes = [];
  if (!HP.customRecipes) HP.customRecipes = [];
  if (!HP.taskStatus) HP.taskStatus = {};
  if (!HP.taskNotes) HP.taskNotes = {};
  HP_save(); // also save to localStorage
  render();
}

function startSyncPolling() {
  clearInterval(syncPollTimer);
  // Poll every 15 seconds for changes from other devices
  syncPollTimer = setInterval(async () => {
    if (!syncEnabled) return;
    try {
      const res = await fetch(SYNC_URL, {
        headers: { 'x-app-password': syncPassword }
      });
      if (!res.ok) return;
      const json = await res.json();
      // Only update if remote is newer
      if (json.updated_at && json.updated_at !== lastSyncedAt) {
        lastSyncedAt = json.updated_at;
        mergeData(json.data);
        setSyncStatus('🟢 Aktualisiert', 'var(--green)');
        showToast('🔄 Daten aktualisiert');
      }
    } catch(e) {
      setSyncStatus('🟡 Offline', 'var(--amber)');
    }
  }, 15000);
}

// ── Hook into save ────────────────────────────
const _origSave = HP_save;
// Override HP_save to also sync
function HP_save() {
  try { localStorage.setItem(SK, JSON.stringify(HP)); } catch(e) {}
  // Debounce sync saves (wait 2s after last change)
  if (syncEnabled) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(async () => {
      try {
        setSyncStatus('⏳ Speichert…', 'var(--amber)');
        await syncSave();
      } catch(e) {
        setSyncStatus('🔴 Sync-Fehler', 'var(--red)');
      }
    }, 2000);
  }
}

// ── Init on load ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initSync, 500);
});
