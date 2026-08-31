// ═══════════════════════════════════════════════
// HEIMPLANER – APP LOGIC
// ═══════════════════════════════════════════════

let weekOffset=0, monthOffset=0, monthViewOffset=0;
let curView='all', persView='p1', recipeFilter='Alle', pendingMealSlot=null;
let speechRec=null, isMicActive=false, afSelectedDays=[];
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
  const views=['all','person','shop','meals','recipes','manage','month','pinboard','ai','settings','birthdays','household'];
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

// ── ALL VIEW ──────────────────────────────────
function renderAllView() { renderTodayBanner(); renderBirthdayBanners(); renderBlockedBanners(); renderWeekGrid(); }

function renderTodayBanner() {
  const today=new Date(); today.setHours(0,0,0,0);
  const di=(today.getDay()+6)%7, tasks=allTasks();
  const todayKey=dk(today);
  const dayEv=(HP.events||[]).filter(e=>e.date===todayKey);
  const dayT=tasks.filter(t=>taskOccursOn(t,todayKey));
  const doneC=dayT.filter(t=>isDone(today,t.id)||getStatus(t.id)==='done').length;
  const prioOpen=dayT.filter(t=>t.prio&&!isDone(today,t.id)&&getStatus(t.id)!=='done').length;
  const evChips=dayEv.map(e=>'<span class="tbc '+(e.important?'tbc-important':'tbc-'+e.who+' tbc-event')+'" onclick="openEventModal(\''+e.id+'\')">📅 '+e.emoji+' '+e.name+'</span>').join('');
  const taskChips=dayT.map(t=>{
    const d=isDone(today,t.id)||getStatus(t.id)==='done';
    const si=getStatus(t.id)==='wip'?'🟡':getStatus(t.id)==='blocked'?'🔴':getStatus(t.id)==='done'?'✅':'';
    return '<span class="tbc '+(t.important?'tbc-important':'tbc-'+t.who)+(d?' done':'')+(t.prio?' tbc-prio':'')+'" onclick="openTaskModal(\''+t.id+'\',\''+todayKey+'\')">'+(t.prio?'● ':'')+t.emoji+' '+t.name+(si?' '+si:'')+'</span>';
  }).join('');
  const chips=(evChips+taskChips)||'<span style="font-size:.76rem;color:var(--muted)">Keine Aufgaben heute</span>';
  const el=document.getElementById('today-banner');
  if(el) el.innerHTML='<div class="tb-date" style="cursor:pointer" onclick="openDayDetail(\''+todayKey+'\')" title="Tagesübersicht (inkl. Menü)">'+today.getDate()+'</div>'+
    '<div><div class="tb-dow">'+DL[di]+' · Heute</div>'+
    '<div class="tb-stat"><b>'+doneC+'/'+dayT.length+'</b> erledigt'+(prioOpen?'<span style="color:var(--prio)"> · '+prioOpen+' Priorität'+(prioOpen>1?'en':'')+' offen</span>':'')+
    '</div></div><div class="tb-chips">'+chips+'</div>';
}

function renderBlockedBanners() {
  const today=new Date(); today.setHours(0,0,0,0);
  const todayKey=dk(today);
  const blocked=allTasks().filter(t=>!t.onceDate&&taskOccursOn(t,todayKey)&&getStatus(t.id)==='blocked');
  const el=document.getElementById('blocked-banners');
  if(el) el.innerHTML=blocked.map(t=>
    '<div class="blocked-banner" onclick="openTaskModal(\''+t.id+'\',\''+todayKey+'\')">🔴 <b>'+t.emoji+' '+t.name+'</b> ist blockiert'+
    (HP.taskNotes[t.id]?' <span style="color:var(--muted)">– '+HP.taskNotes[t.id]+'</span>':'')+
    '<span style="margin-left:auto;font-size:.7rem;color:var(--muted)">Details →</span></div>'
  ).join('');
}

// Merge events + tasks into one chronologically ordered list (untimed items first, then ascending by start time)
function mergeTimelineItems(events, tasks) {
  return [...events.map(e=>({kind:'event',data:e})), ...tasks.map(t=>({kind:'task',data:t}))]
    .sort((a,b)=>{
      const at=a.data.time, bt=b.data.time;
      if(!at&&!bt) return 0;
      if(!at) return -1;
      if(!bt) return 1;
      return at.localeCompare(bt);
    });
}

function renderWeekGrid() {
  const grid=document.getElementById('week-grid'); if(!grid) return;
  const today=new Date(); today.setHours(0,0,0,0);
  const dates=getWeekDates(weekOffset), tasks=allTasks();
  grid.innerHTML='';
  dates.forEach((date,di)=>{
    const key=dk(date);
    const dayT=tasks.filter(t=>taskOccursOn(t,key));
    const dayEv=(HP.events||[]).filter(e=>e.date===key);
    const m2=String(date.getMonth()+1).padStart(2,'0'),d2=String(date.getDate()).padStart(2,'0');
    const dayBdays=(HP.birthdays||[]).filter(b=>b.date.slice(5)===m2+'-'+d2);
    const dayMeals=HP.meals[key]||{};
    const doneT=dayT.filter(t=>isDone(date,t.id)||getStatus(t.id)==='done');
    const pct=(dayT.length+dayEv.length)?Math.round(doneT.length/(dayT.length+dayEv.length)*100):0;
    const col=document.createElement('div');
    col.className='day-col'+(isToday(date)?' is-today':'')+(isPast(date)&&!isToday(date)?' is-past':'');
    col.innerHTML='<div class="day-head" style="cursor:pointer" onclick="openDayDetail(\''+key+'\')" title="Tagesübersicht (inkl. Menü)"><div class="dh-dow">'+DS[di]+'</div><div class="dh-num">'+date.getDate()+'</div>'+
      '<div class="dh-prog"><div class="dh-prog-fill" style="width:'+pct+'%"></div></div></div>'+
      '<div class="day-tasks" id="wg-'+di+'"></div>';
    grid.appendChild(col);
    const tc=col.querySelector('#wg-'+di);
    if(!dayT.length&&!dayEv.length&&!dayBdays.length&&!Object.keys(dayMeals).length){tc.innerHTML='<span style="font-size:.66rem;color:var(--muted)">–</span>';return;}
    // Show birthdays first
    dayBdays.forEach(b=>{
      const chip=document.createElement('div');
      chip.className='task-chip c-birthday';
      const bdAge=b.year?new Date().getFullYear()-parseInt(b.year):'';
      chip.innerHTML='<span class="chip-dot"></span><span style="flex:1">🎂 '+b.name+(bdAge?' ('+bdAge+')':'')+' </span>';
      chip.style.cursor='default';
      tc.appendChild(chip);
    });
    // Events + tasks, chronologically ordered (untimed first, then by start time)
    const dayTPrio=[...dayT].sort((a,b)=>a.prio&&!b.prio?-1:!a.prio&&b.prio?1:0);
    mergeTimelineItems(dayEv,dayTPrio).forEach(({kind,data})=>{
      const chip=document.createElement('div');
      if(kind==='event'){
        const e=data, est=getEventStatus(e.id), esi=est==='wip'?'🟡':est==='blocked'?'🔴':'';
        const ecmt=(HP.eventComments||{})[e.id]||'';
        chip.className='task-chip '+(e.important?'c-important':'c'+e.who+' ev-once')+' s-'+est+(est==='done'?' done':'');
        chip.innerHTML='<span class="chip-dot"></span><span style="flex:1">'+e.emoji+' '+e.name+(e.time?'<span style="font-size:.6rem;opacity:.7;margin-left:3px">⏰'+fmtTimeRange(e.time,e.timeEnd)+'</span>':'')+'</span>'+
          '<span class="chip-st">'+esi+'</span>'+(ecmt?'<span style="font-size:.65rem;opacity:.7">💬</span>':'')+
          '<span style="font-size:.6rem;opacity:.6;flex-shrink:0">📅</span>';
        chip.addEventListener('click',()=>openEventModal(e.id));
      } else {
        const t=data, d=isDone(date,t.id)||getStatus(t.id)==='done', st=getStatus(t.id);
        const si=st==='wip'?'🟡':st==='blocked'?'🔴':'';
        chip.className='task-chip '+(t.important?'c-important':'c'+t.who)+' s-'+st+(d?' done':'');
        const cmt=(HP.taskComments||{})[t.id]||'';
        chip.innerHTML='<span class="chip-dot"></span><span style="flex:1">'+t.emoji+' '+t.name+(t.time?'<span style="font-size:.6rem;opacity:.7;margin-left:3px">⏰'+fmtTimeRange(t.time,t.timeEnd)+'</span>':'')+' </span>'+'<span class="chip-st">'+si+'</span>'+(cmt?'<span style="font-size:.65rem;opacity:.7">💬</span>':'');
        chip.addEventListener('click',()=>openTaskModal(t.id,key));
      }
      tc.appendChild(chip);
    });
    // Then planned meals
    Object.entries(dayMeals).forEach(([slot,m])=>{
      const chip=document.createElement('div');
      chip.className='task-chip c-meal';
      chip.innerHTML='<span class="chip-dot"></span><span style="flex:1">🍽️ '+m.name+'</span><span style="font-size:.6rem;opacity:.6;flex-shrink:0">'+slot+'</span>';
      chip.addEventListener('click',()=>openMealPicker(key,slot));
      tc.appendChild(chip);
    });
  });
}

// ── PERSON VIEW ───────────────────────────────
function renderPersonView(who) {
  const dates=getWeekDates(weekOffset), today=new Date(); today.setHours(0,0,0,0);
  const tasks=allTasks(who), n=HP.names[who], color=who==='p1'?'var(--p1)':'var(--p2)';
  let tot=0,done=0;
  dates.forEach((date,di)=>{const dt=tasks.filter(t=>!t.onceDate&&taskOccursOn(t,dk(date)));tot+=dt.length;dt.forEach(t=>{if(isDone(date,t.id)||getStatus(t.id)==='done')done++;});});
  const pct=tot?Math.round(done/tot*100):0;
  const hd=document.getElementById('pv-hd');
  if(hd) hd.innerHTML='<div class="pv-av pv-av-'+who+'">'+n.charAt(0).toUpperCase()+'</div>'+
    '<div><div class="pv-name" style="color:'+color+'">'+n+'</div><div class="pv-sub">Persönliche Wochenübersicht</div></div>'+
    '<div class="pv-stats"><div class="pv-stat"><div class="psn" style="color:'+color+'">'+done+'</div><div class="psl">Erledigt</div></div>'+
    '<div class="pv-stat"><div class="psn">'+tot+'</div><div class="psl">Gesamt</div></div>'+
    '<div class="pv-stat"><div class="psn" style="color:var(--today)">'+pct+'%</div><div class="psl">Quote</div></div></div>'+
    '<button onclick="openQuickAddTask(\''+who+'\')" style="margin-left:12px;background:var(--p1bg);border:1px solid var(--p1);border-radius:var(--rs);color:var(--p1);font-family:Inter,sans-serif;font-size:.75rem;font-weight:600;padding:6px 12px;cursor:pointer;white-space:nowrap;flex-shrink:0">+ Aufgabe</button>';
  const pvDays=document.getElementById('pv-days'); if(!pvDays) return; pvDays.innerHTML='';
  dates.forEach((date,di)=>{
    const tl=isToday(date), dayT=tasks.filter(t=>!t.onceDate&&taskOccursOn(t,dk(date)));
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
      pill.className='pv-pill '+(t.important?'p-important':(t.who==='shared'?'pshared':'p'+t.who[1]))+(d?' s-done':'')+(t.prio?' is-prio':'')+(st==='blocked'?' s-blocked':'');
      pill.innerHTML=t.emoji+' '+t.name+
        (st==='wip'?'<span class="pst wip">🟡</span>':st==='blocked'?'<span class="pst blk">🔴</span>':'')+
        (t.who==='shared'?'<span style="font-size:.62rem;opacity:.55"> gem.</span>':'');
      pill.addEventListener('click',()=>openTaskModal(t.id,dk(date)));
      tc.appendChild(pill);
    });
  });
}

function openQuickAddTask(who='shared', prefillDate='') {
  const colorP1=getColor('p1'), colorP2=getColor('p2'), colorSh=getColor('shared');
  showModal(
    '<h3>+ Termin / Aufgabe</h3>'+
    '<div class="modal-row"><label>Emoji & Name</label>'+


    '<div style="display:flex;gap:7px">'+
    emojiPickerBtnHTML('qa-emoji','📅')+
    '<input class="modal-in" id="qa-name" placeholder="z.B. Arzttermin, Sport…" style="flex:1"></div>'+
    emojiPickerMenuHTML('qa-emoji')+
    '</div>'+
    '<div class="modal-row"><label>Für wen</label>'+
    '<select class="modal-in" id="qa-who" onchange="updateQaDayClass()">'+
    '<option value="p1"'+(who==='p1'?' selected':'')+'>'+HP.names.p1+'</option>'+
    '<option value="p2"'+(who==='p2'?' selected':'')+'>'+HP.names.p2+'</option>'+
    '<option value="shared"'+(who==='shared'?' selected':'')+'>Gemeinsam</option>'+
    '</select></div>'+
    '<div class="modal-row"><label>Art</label>'+
    '<div style="display:flex;gap:12px">'+
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:.82rem">'+
    '<input type="radio" name="qa-type" value="once"'+(prefillDate?' checked':' checked')+' onchange="document.getElementById(\'qa-weekly\').style.display=\'none\';document.getElementById(\'qa-once\').style.display=\'\';document.getElementById(\'qa-reminder-weekly\').style.display=\'none\';document.getElementById(\'qa-reminder-once\').style.display=\'\'"> 📅 Einmaliger Termin</label>'+
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:.82rem">'+
    '<input type="radio" name="qa-type" value="weekly" onchange="document.getElementById(\'qa-weekly\').style.display=\'\';document.getElementById(\'qa-once\').style.display=\'none\';document.getElementById(\'qa-reminder-weekly\').style.display=\'\';document.getElementById(\'qa-reminder-once\').style.display=\'none\'"> 🔁 Wöchentlich</label>'+
    '</div></div>'+
    '<div id="qa-once">'+
    '<div class="modal-row"><label>Datum</label>'+
    '<input class="modal-in" type="date" id="qa-date" value="'+prefillDate+'"></div></div>'+
    '<div id="qa-weekly" style="display:none">'+
    '<div class="modal-row"><label>Wochentage</label>'+
    '<div style="display:flex;gap:4px;flex-wrap:wrap" id="qa-days">'+
    DS.map((d,i)=>'<span class="dp" data-day="'+i+'" onclick="toggleQaDay(this)" style="cursor:pointer">'+d+'</span>').join('')+
    '<span class="dp" style="color:var(--shared);border-color:var(--shared);cursor:pointer" onclick="document.querySelectorAll(\'#qa-days .dp[data-day]\').forEach(x=>x.classList.add(\'qaSel\'))">Alle</span>'+
    '</div></div></div>'+
    '<div class="modal-row" style="display:flex;gap:8px">'+
    '<div style="flex:1"><label>Von (optional)</label><input class="modal-in" type="time" id="qa-time"></div>'+
    '<div style="flex:1"><label>Bis (optional)</label><input class="modal-in" type="time" id="qa-time-end"></div>'+
    '</div>'+
    '<div class="modal-row">'+
    '<div id="qa-reminder-once"><label>Erinnerung</label><select class="modal-in" id="qa-reminder-ev">'+eventReminderOptions('')+'</select></div>'+
    '<div id="qa-reminder-weekly" style="display:none"><label>Erinnerung</label><select class="modal-in" id="qa-reminder-task">'+taskReminderOptions('')+'</select></div>'+
    '</div>'+
    '<div class="modal-row" style="display:flex;gap:16px">'+
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:.82rem"><input type="checkbox" id="qa-prio" style="accent-color:var(--prio)"> Priorität</label>'+
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:.82rem"><input type="checkbox" id="qa-important" style="accent-color:var(--red)"> <span style="color:var(--red)">🚨 Wichtig</span></label>'+
    '</div>'+
    '<div class="modal-btns">'+
    '<button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
    '<button class="mbtn mbtn-confirm" onclick="saveQuickAddTask()">✓ Speichern</button>'+
    '</div>'
  );
  setTimeout(()=>document.getElementById('qa-name')?.focus(),80);
}

function toggleQaDay(el){el.classList.toggle('qaSel');}
function updateQaDayClass(){}  // placeholder

function saveQuickAddTask() {
  const emoji=document.getElementById('qa-emoji')?.value.trim()||'📅';
  const name=document.getElementById('qa-name')?.value.trim();
  const who=document.getElementById('qa-who')?.value||'shared';
  const time=document.getElementById('qa-time')?.value||'';
  const timeEnd=document.getElementById('qa-time-end')?.value||'';
  const prio=document.getElementById('qa-prio')?.checked||false;
  const important=document.getElementById('qa-important')?.checked||false;
  const isOnce=document.querySelector('input[name="qa-type"]:checked')?.value==='once';
  if(!name){showToast('Bitte Name eingeben');return;}

  if(isOnce){
    // Save as event (einmaliger Termin)
    const date=document.getElementById('qa-date')?.value||'';
    if(!date){showToast('Bitte Datum wählen');return;}
    const reminder=document.getElementById('qa-reminder-ev')?.value||'';
    if(!HP.events)HP.events=[];
    HP.events.push({id:'ev'+Date.now(),emoji,name,date,time,timeEnd,who,reminder,important,note:''});
    HP_save();closeModal();render();
    if(typeof renderMonth==='function'&&document.getElementById('view-month')&&!document.getElementById('view-month').classList.contains('hidden'))renderMonth();
    showToast(emoji+' '+name+' am '+date+' eingetragen');
  } else {
    // Save as recurring task
    const sel=[];
    document.querySelectorAll('#qa-days .dp[data-day]').forEach(el=>{
      if(el.classList.contains('qaSel'))sel.push(parseInt(el.dataset.day));
    });
    const days=sel.length?sel:[0,1,2,3,4,5,6];
    const tid=who+Date.now();
    const reminder=document.getElementById('qa-reminder-task')?.value||'';
    HP.tasks[who].push({id:tid,emoji,name,days,prio,important,status:'open',time,timeEnd,reminder});
    HP_save();closeModal();render();showToast(emoji+' '+name+' hinzugefügt');
  }
}

function deleteEvent(id){
  HP.events=(HP.events||[]).filter(e=>e.id!==id);
  if(HP.eventStatus) delete HP.eventStatus[id];
  if(HP.eventNotes) delete HP.eventNotes[id];
  if(HP.eventComments) delete HP.eventComments[id];
  HP_save();render();
  if(typeof renderMonth==='function')renderMonth();
  if(typeof renderHouseholdList==='function')renderHouseholdList();
  showToast('Termin gelöscht');
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
    '<div style="display:flex;align-items:center;gap:6px;margin-top:4px">'+
    '<div class="si-check" style="flex-shrink:0">'+(item.bought?'✓':'')+'</div>'+
    '<button onclick="event.stopPropagation();deleteShopItem(\''+item.id+'\')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:.75rem;padding:2px 4px;border-radius:4px;opacity:0.6" title="Löschen">✕</button>'+
    '<button onclick="event.stopPropagation();openEditShopItemById(\''+item.id+'\')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:.75rem;padding:2px 4px;border-radius:4px;opacity:0.6" title="Bearbeiten">✏️</button>'+
    '<button onclick="event.stopPropagation();saveShopItemTemplate(\''+item.id+'\')" style="background:none;border:none;color:var(--amber);cursor:pointer;font-size:1.15rem;line-height:1;padding:4px 6px;border-radius:4px;opacity:0.85" title="Zu Favoriten hinzufügen">⭐</button>'+
    '</div>';
  div.addEventListener('click',()=>{item.bought=!item.bought;HP_save();renderShop();renderSidebarStats();});
  return div;
}

function addShopItem(name,qty,unit,cat,taskId,taskName) {
  const n=name||document.getElementById('shop-add-name')?.value.trim();
  if(!n){showToast('Bitte Artikelname eingeben');return;}
  const q=qty||document.getElementById('shop-add-qty')?.value.trim()||'';
  const u=unit||document.getElementById('shop-add-unit')?.value.trim()||'';
  const c=cat||document.getElementById('shop-add-cat')?.value||'Sonstiges';
  const existing=HP.shop.find(i=>i.name.toLowerCase()===n.toLowerCase()&&!i.bought);
  if(existing&&!name){showDuplicateModal(existing,q,u);return;}
  if(existing&&name){existing.qty=existing.qty?existing.qty+'+'+q:q;HP_save();renderShop();renderSidebarStats();showToast(n+' Menge angepasst');return;}
  HP.shop.push({id:'sh'+Date.now(),name:n,qty:q,unit:u,cat:c,bought:false,taskId:taskId||null,taskName:taskName||null});
  HP_save();
  if(!name){['shop-add-name','shop-add-qty','shop-add-unit'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});const sc=document.getElementById('shop-add-cat');if(sc)sc.value='';}
  renderShop();renderSidebarStats();showToast(n+' hinzugefügt');
}

function saveShopItemTemplate(id) {
  const item=HP.shop.find(i=>i.id===id); if(!item) return;
  if(!HP.savedShopItems) HP.savedShopItems=[];
  const existing=HP.savedShopItems.find(s=>s.name.toLowerCase()===item.name.toLowerCase());
  if(existing){existing.qty=item.qty;existing.unit=item.unit;existing.cat=item.cat;}
  else HP.savedShopItems.push({id:'ssi'+Date.now(),name:item.name,qty:item.qty,unit:item.unit,cat:item.cat});
  HP_save();showToast('⭐ "'+item.name+'" zu Favoriten hinzugefügt');
}

function openSavedShopItems() {
  const saved=HP.savedShopItems||[];
  const rows=saved.length
    ? saved.map(s=>'<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);font-size:.83rem">'+
        '<span style="flex:1">'+catEmoji(s.cat)+' '+s.name+(s.qty||s.unit?' <span style="color:var(--muted);font-size:.75rem">('+[s.qty,s.unit].filter(Boolean).join(' ')+')</span>':'')+'</span>'+
        '<button class="mbtn mbtn-confirm" style="padding:4px 10px" onclick="addSavedItemToShop(\''+s.id+'\')">+ Hinzufügen</button>'+
        '<button onclick="deleteSavedShopItem(\''+s.id+'\')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:.8rem;padding:2px 6px" title="Favorit löschen">✕</button>'+
        '</div>').join('')
    : '<div style="font-size:.8rem;color:var(--muted);padding:10px 0">Noch keine Favoriten. Speichere Artikel aus der Einkaufsliste mit ⭐.</div>';
  showModal('<h3>⭐ Favoriten</h3>'+rows+
    '<div class="modal-btns"><button class="mbtn mbtn-cancel" onclick="closeModal()">Schliessen</button></div>');
}

function addSavedItemToShop(id) {
  const s=(HP.savedShopItems||[]).find(x=>x.id===id); if(!s) return;
  addShopItem(s.name,s.qty,s.unit,s.cat);
  openSavedShopItems();
}

function deleteSavedShopItem(id) {
  HP.savedShopItems=(HP.savedShopItems||[]).filter(x=>x.id!==id);
  HP_save();openSavedShopItems();
}

function openEditShopItemById(id) {
  const item = HP.shop.find(i => i.id === id);
  if(item) openEditShopItem(item);
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
    '<div class="modal-row"><label>Ablauf (ein Schritt pro Zeile)</label>'+
    '<textarea class="modal-in" id="cr-steps" rows="5" placeholder="Wasser aufkochen und Pasta darin kochen.&#10;Sauce erhitzen und mit der Pasta mischen." style="resize:vertical;font-family:Inter,sans-serif"></textarea></div>'+
    '<div class="modal-btns"><button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
    '<button class="mbtn mbtn-confirm" onclick="saveCustomRecipe()">✓ Speichern</button></div>');
}
function saveCustomRecipe() {
  const emoji=document.getElementById('cr-emoji')?.value.trim()||'🍽️';
  const name=document.getElementById('cr-name')?.value.trim();
  if(!name){showToast('Bitte Namen eingeben');return;}
  const ing=(document.getElementById('cr-ings')?.value||'').split('\n').filter(l=>l.trim()).map(l=>{const p=l.split(',').map(x=>x.trim());return{n:p[0]||l,q:p[1]||'',u:p[2]||''};});
  const steps=(document.getElementById('cr-steps')?.value||'').split('\n').map(s=>s.trim()).filter(Boolean);
  if(!HP.customRecipes)HP.customRecipes=[];
  HP.customRecipes.push({id:'cr'+Date.now(),emoji,name,cat:document.getElementById('cr-cat')?.value||'Hauptspeisen',time:parseInt(document.getElementById('cr-time')?.value)||30,pers:parseInt(document.getElementById('cr-pers')?.value)||2,tags:['eigenes'],ing,steps,custom:true});
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
      card.innerHTML='<div class="tm-top"><span class="tm-name">'+task.emoji+' '+task.name+(task.time?' <span style="font-size:.65rem;color:var(--muted)">⏰'+fmtTimeRange(task.time,task.timeEnd)+'</span>':'')+'</span>'+
        '<div class="tm-acts"><button class="wichtig-btn'+(task.important?' on':'')+'" data-tid="'+task.id+'" data-who="'+who+'" title="Wichtig">!</button>'+
        '<button class="tm-del" data-tid="'+task.id+'" data-who="'+who+'">✕</button></div></div>'+
        '<div class="day-pills">'+dps+'</div>';
      el.appendChild(card);
    });
    el.querySelectorAll('.dp').forEach(p=>{p.addEventListener('click',()=>{
      const t=HP.tasks[p.dataset.who].find(t=>t.id===p.dataset.tid); if(!t) return;
      const i=t.days.indexOf(+p.dataset.day); if(i>-1)t.days.splice(i,1); else t.days.push(+p.dataset.day);
      HP_save();render();
    });});
    el.querySelectorAll('.wichtig-btn').forEach(b=>{b.addEventListener('click',()=>{
      const t=HP.tasks[b.dataset.who].find(t=>t.id===b.dataset.tid); if(t){t.important=!t.important;HP_save();render();}
    });});
    el.querySelectorAll('.tm-del').forEach(b=>{b.addEventListener('click',()=>{
      HP.tasks[b.dataset.who]=HP.tasks[b.dataset.who].filter(t=>t.id!==b.dataset.tid);
      if(HP.taskExceptions) delete HP.taskExceptions[b.dataset.tid];
      HP_save();render();
    });});
  });
  renderEventsList();
}

function renderEventsList() {
  const el = document.getElementById('events-list'); if(!el) return;
  const events = (HP.events||[]).filter(e=>!e.chore).slice().sort((a,b)=>a.date===b.date?(a.time||'').localeCompare(b.time||''):a.date.localeCompare(b.date));
  if(!events.length){
    el.innerHTML='<div style="font-size:.78rem;color:var(--muted);padding:8px 0">Noch keine einmaligen Termine.</div>';
    return;
  }
  const today=dk(new Date());
  el.innerHTML = events.map(e=>{
    const whoLabel=e.who==='p1'?HP.names.p1:e.who==='p2'?HP.names.p2:'Gemeinsam';
    const whoColor=e.who==='p1'?'var(--p1)':e.who==='p2'?'var(--p2)':'var(--shared)';
    const isPast=e.date<today;
    return '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--panel);border:1px solid var(--border);border-radius:var(--rs);margin-bottom:6px'+(isPast?';opacity:.5':'')+'">'+
      '<span style="font-size:1.1rem">'+e.emoji+'</span>'+
      '<div style="flex:1"><div style="font-size:.82rem;font-weight:500">'+e.name+'</div>'+
      '<div style="font-size:.7rem;color:var(--muted)">'+e.date+(e.time?' · ⏰'+fmtTimeRange(e.time,e.timeEnd):'')+'</div></div>'+
      '<span style="font-size:.7rem;color:'+whoColor+';font-weight:500">'+whoLabel+'</span>'+
      '<button data-eid=' + JSON.stringify(e.id) + ' onclick="openEditEvent(this.dataset.eid)" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:3px 6px">✏️</button>'+
      '<button data-eid=' + JSON.stringify(e.id) + ' onclick="deleteEvent(this.dataset.eid)" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:3px 6px">✕</button>'+
    '</div>';
  }).join('');
}

function renderHouseholdList() {
  const el = document.getElementById('household-list'); if(!el) return;
  const chores = (HP.events||[]).filter(e=>e.chore).slice().sort((a,b)=>a.date.localeCompare(b.date));
  if(!chores.length){
    el.innerHTML='<div style="font-size:.78rem;color:var(--muted);padding:8px 0">Noch keine Haushaltsaufgaben.</div>';
    return;
  }
  el.innerHTML = chores.map(e=>{
    const whoLabel=e.who==='p1'?HP.names.p1:e.who==='p2'?HP.names.p2:'Gemeinsam';
    const whoColor=e.who==='p1'?'var(--p1)':e.who==='p2'?'var(--p2)':'var(--shared)';
    return '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--panel);border:1px solid var(--border);border-radius:var(--rs);margin-bottom:6px">'+
      '<span style="font-size:1.1rem">'+e.emoji+'</span>'+
      '<div style="flex:1"><div style="font-size:.82rem;font-weight:500">'+e.name+'</div>'+
      '<div style="font-size:.7rem;color:var(--muted)">🔁 '+recurLabel(e.recur)+' · Fällig: '+e.date+(e.time?' · ⏰'+fmtTimeRange(e.time,e.timeEnd):'')+'</div></div>'+
      '<span style="font-size:.7rem;color:'+whoColor+';font-weight:500">'+whoLabel+'</span>'+
      '<button data-eid=' + JSON.stringify(e.id) + ' onclick="openEventModal(this.dataset.eid)" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:3px 6px">👁️</button>'+
      '<button data-eid=' + JSON.stringify(e.id) + ' onclick="openEditEvent(this.dataset.eid)" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:3px 6px">✏️</button>'+
      '<button data-eid=' + JSON.stringify(e.id) + ' onclick="deleteEvent(this.dataset.eid)" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:3px 6px">✕</button>'+
    '</div>';
  }).join('');
}

// ── ADD TASK ──────────────────────────────────
function renamePerson(who) {
  const current = HP.names[who];
  const currentColor = getColor(who);
  const label = who === 'shared' ? 'Gemeinsam' : HP.names[who];
  const swatches = COLOR_OPTIONS.map(c =>
    '<span onclick="document.querySelectorAll(\'.rp-swatch\').forEach(x=>x.style.borderColor=\'transparent\');this.style.borderColor=\'#fff\';document.getElementById(\'rename-color\').value=\'' + c.val + '\'" ' +
    'class="rp-swatch" style="display:inline-block;width:26px;height:26px;border-radius:50%;background:' + c.val + ';cursor:pointer;border:3px solid ' + (c.val === currentColor ? '#fff' : 'transparent') + ';transition:border .15s;margin:3px" title="' + c.name + '"></span>'
  ).join('');
  showModal(
    '<h3>✏️ ' + label + ' anpassen</h3>' +
    '<input type="hidden" id="rename-color" value="' + currentColor + '">' +
    '<div class="modal-row"><label>Name</label>' +
    '<input class="modal-in" id="rename-input" value="' + current + '" style="border-color:' + currentColor + '"></div>' +
    (who !== 'shared' ? '' : '') +
    '<div class="modal-row"><label>Farbe</label>' +
    '<div style="display:flex;gap:2px;flex-wrap:wrap">' + swatches + '</div></div>' +
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
  const color = document.getElementById('rename-color')?.value;
  if (!name) { showToast('Bitte einen Namen eingeben'); return; }
  HP.names[who] = name;
  if (color) {
    if (!HP.colors) HP.colors = {...DEFAULT_COLORS};
    HP.colors[who] = color;
  }
  HP_save();
  closeModal();
  applyColors();
  syncNames();
  render();
  showToast('Gespeichert');
}

// ── EMOJI PICKER ───────────────────────────────
const TASK_EMOJIS=['🥪','🌺','🍽️','🎉','🎥','📷','🗓️','📌','🧹','🧼','🧽','🚿','🛒','📚','🗑️','💬','🚣🏽‍♀️','💪🏼','🧘🏽‍♀️','🏋🏽‍♀️','🏠'];
function emojiPickerBtnHTML(prefix, current) {
  const cur=current||'⭐';
  return '<button type="button" class="emoji-picker-btn" id="'+prefix+'-btn" onclick="event.stopPropagation();toggleEmojiMenu(\''+prefix+'\')">'+cur+'</button>'+
    '<input type="hidden" id="'+prefix+'" value="'+cur+'">';
}
function emojiPickerMenuHTML(prefix) {
  return '<div class="emoji-picker-menu hidden" id="'+prefix+'-menu">'+
    TASK_EMOJIS.map(em=>'<span class="emoji-opt" onclick="selectEmoji(\''+prefix+'\',\''+em+'\')">'+em+'</span>').join('')+
    '</div>';
}
function toggleEmojiMenu(prefix) {
  document.querySelectorAll('.emoji-picker-menu').forEach(m=>{if(m.id!==prefix+'-menu')m.classList.add('hidden');});
  document.getElementById(prefix+'-menu')?.classList.toggle('hidden');
}
function selectEmoji(prefix, emoji) {
  const input=document.getElementById(prefix); if(input) input.value=emoji;
  const btn=document.getElementById(prefix+'-btn'); if(btn) btn.textContent=emoji;
  document.getElementById(prefix+'-menu')?.classList.add('hidden');
}
document.addEventListener('click',e=>{
  if(!e.target.closest('.emoji-picker-btn')&&!e.target.closest('.emoji-picker-menu')){
    document.querySelectorAll('.emoji-picker-menu').forEach(m=>m.classList.add('hidden'));
  }
});

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
  const timeEnd=document.getElementById('af-time-end')?.value||'';
  const reminder=document.getElementById('af-reminder')?.value||'';
  if(!name){showToast('Bitte Aufgabenname eingeben');return;}
  const days=afSelectedDays.length?[...afSelectedDays]:[0,1,2,3,4,5,6];
  const tid=who+Date.now();
  HP.tasks[who].push({id:tid,emoji,name,days,prio,status:'open',time,timeEnd,reminder});
  ['af-name','af-time','af-time-end'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  selectEmoji('af-emoji','⭐');
  document.getElementById('af-prio').checked=false;
  document.getElementById('af-reminder').value='';
  afSelectedDays=[];
  document.querySelectorAll('.af-day-pill').forEach(p=>p.className='dp af-day-pill');
  HP_save();render();showToast(emoji+' '+name+' hinzugefügt');
}

// ── TASK MODAL ────────────────────────────────
const TASK_REMINDER_OPTS=[['','Keine'],['0','Zur Uhrzeit'],['5','5 Min vorher'],['15','15 Min vorher'],['30','30 Min vorher'],['60','1 Std vorher']];
function taskReminderOptions(selected) {
  return TASK_REMINDER_OPTS.map(([v,l])=>'<option value="'+v+'"'+((selected||'')===v?' selected':'')+'>'+l+'</option>').join('');
}

function openTaskModal(tid,dateKey='') {
  const task=allTasks().find(t=>t.id===tid); if(!task) return;
  const st=getStatus(tid), note=HP.taskNotes[tid]||'';
  const isImportant = task.important || false;
  const stBtns=[['open','⬜ Offen'],['wip','🟡 In Arbeit'],['blocked','🔴 Blockiert'],['done','✅ Erledigt']]
    .map(([s,l])=>'<button class="st-btn'+(st===s?' sel-'+s:'')+'" onclick="setTaskStatus(\''+tid+'\',\''+s+'\',this)">'+l+'</button>').join('');
  const occLabel=dateKey?new Date(dateKey+'T12:00:00').toLocaleDateString('de-CH',{day:'numeric',month:'short'}):'';
  showModal('<h3>'+task.emoji+' '+task.name+'</h3>'+
    '<div class="modal-row"><label>Status</label><div class="st-btns">'+stBtns+'</div></div>'+
    '<div class="modal-row"><label style="display:flex;align-items:center;gap:8px;cursor:pointer">'+
    '<input type="checkbox" id="tm-important"'+(isImportant?' checked':'')+' style="accent-color:var(--red);width:16px;height:16px">'+
    '<span style="font-size:.82rem;font-weight:500;color:var(--red)">🚨 Wichtig — Task wird rot markiert</span>'+
    '</label></div>'+
    '<div class="modal-row" style="display:flex;gap:8px">'+
    '<div style="flex:1"><label>Von</label><input class="modal-in" type="time" id="tm-time" value="'+(task.time||'')+'"></div>'+
    '<div style="flex:1"><label>Bis</label><input class="modal-in" type="time" id="tm-time-end" value="'+(task.timeEnd||'')+'"></div>'+
    '<div style="flex:1"><label>Erinnerung</label><select class="modal-in" id="tm-rem">'+taskReminderOptions(task.reminder)+'</select></div></div>'+
    '<div class="modal-row" id="block-sec" style="'+(st!=='blocked'?'display:none':'')+' ">'+
    '<label>Was fehlt / warum blockiert?</label>'+
    '<input class="modal-in" id="block-note" placeholder="z.B. Blumenerde fehlt…" value="'+note+'">'+
    '<button class="mbtn mbtn-confirm" style="margin-top:8px;width:100%;background:var(--shared)" onclick="addBlockedToShop(\''+tid+'\')">🛒 Zur Einkaufsliste</button></div>'+
    '<div class="modal-row" id="comment-section">'+
    '<label>💬 Kommentar</label>'+
    '<textarea class="modal-in" id="task-comment" rows="2" placeholder="Notiz zum Task…" style="resize:vertical;font-family:Inter,sans-serif;font-size:.79rem">'+((HP.taskComments||{})[tid]||'')+'</textarea>'+
    '</div>'+
    '<div class="modal-row" style="display:flex;flex-direction:column;gap:6px;background:var(--rbg);border:1px solid var(--red);border-radius:var(--rs);padding:10px">'+
    (dateKey?'<button class="mbtn" style="width:100%;background:none;border:1px solid var(--red);color:var(--red)" onclick="deleteTaskOccurrence(\''+tid+'\',\''+dateKey+'\')">🗑 Nur den Termin am '+occLabel+' aus der Serie löschen</button>':'')+
    '<button class="mbtn" style="width:100%;background:var(--red);border:1px solid var(--red);color:#fff" onclick="deleteTaskSeries(\''+tid+'\')">🗑 Ganze Serie löschen</button>'+
    '</div>'+
    '<div class="modal-btns"><button class="mbtn mbtn-cancel" onclick="closeModal()">Schliessen</button>'+
    '<button class="mbtn mbtn-confirm" onclick="saveTaskDetails(\''+tid+'\');closeModal()">Speichern</button></div>');
}
function deleteTaskOccurrence(tid,dateKey) {
  const task=allTasks().find(t=>t.id===tid); if(!task) return;
  const label=new Date(dateKey+'T12:00:00').toLocaleDateString('de-CH',{day:'numeric',month:'short'});
  if(!confirm('Nur "'+task.name+'" am '+label+' löschen?\nVergangene und zukünftige Termine dieser Serie bleiben bestehen.')) return;
  if(!HP.taskExceptions) HP.taskExceptions={};
  if(!HP.taskExceptions[tid]) HP.taskExceptions[tid]={};
  HP.taskExceptions[tid][dateKey]=true;
  HP_save();closeModal();render();
  if(typeof renderMonth==='function') renderMonth();
  showToast('🗑 Einzelner Termin entfernt');
}
function deleteTaskSeries(tid) {
  const task=allTasks().find(t=>t.id===tid); if(!task) return;
  if(!confirm('Die komplette Serie "'+task.name+'" (alle Wochentage) löschen?\nDies kann nicht rückgängig gemacht werden.')) return;
  ['p1','p2','shared'].forEach(w=>{HP.tasks[w]=HP.tasks[w].filter(t=>t.id!==tid);});
  delete HP.taskStatus[tid];
  delete HP.taskNotes[tid];
  if(HP.taskComments) delete HP.taskComments[tid];
  if(HP.taskExceptions) delete HP.taskExceptions[tid];
  HP_save();closeModal();render();
  if(typeof renderMonth==='function') renderMonth();
  showToast('🗑 Serie "'+task.name+'" gelöscht');
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
  const comment=document.getElementById('task-comment')?.value||'';
  if(!HP.taskComments) HP.taskComments={};
  if(comment) HP.taskComments[tid]=comment;
  else delete HP.taskComments[tid];
  const t=document.getElementById('tm-time')?.value||'', r=document.getElementById('tm-rem')?.value||'';
  const te=document.getElementById('tm-time-end')?.value||'';
  const imp=document.getElementById('tm-important')?.checked||false;
  ['p1','p2','shared'].forEach(w=>{const task=HP.tasks[w].find(x=>x.id===tid);if(task){task.time=t;task.timeEnd=te;task.reminder=r;task.important=imp;}});
  HP_save();
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
    date.setHours(12,0,0,0);
    const di=(date.getDay()+6)%7, key=dk(date), isT=dk(date)===dk(today);
    // Include both recurring tasks AND once-tasks matching this date
    const dayT=tasks.filter(t=>!t.onceDate&&taskOccursOn(t,key));
    const dayEvents=(HP.events||[]).filter(e=>e.date===key);
    const mm=String(date.getMonth()+1).padStart(2,'0'),dd2=String(date.getDate()).padStart(2,'0');
    const dayBdaysM=(HP.birthdays||[]).filter(b=>b.date.slice(5)===mm+'-'+dd2);
    const evHtml=[
      ...dayBdaysM.map(b=>'<div class="mc-event mc-birthday">🎂 '+b.name+'</div>'),
      ...mergeTimelineItems(dayEvents,dayT).map(({kind,data})=>{
        if(kind==='event'){
          const e=data, est=getEventStatus(e.id), esi=est==='wip'?' 🟡':est==='blocked'?' 🔴':'';
          return '<div class="mc-event '+(e.important?'mc-event-important':'e'+(e.who==='shared'?'sh':e.who)+' mc-event-once')+'">'+e.emoji+' '+e.name+esi+'</div>';
        }
        const t=data, tst=getStatus(t.id), tsi=tst==='wip'?' 🟡':tst==='blocked'?' 🔴':'';
        return '<div class="mc-event '+(t.important?'mc-event-important':'e'+(t.who==='shared'?'sh':t.who))+'">'+t.emoji+' '+t.name+tsi+'</div>';
      })
    ].join('');
    html+='<div class="month-cell'+(isT?' today':'')+((dayT.length||dayEvents.length||dayBdaysM.length)?' has-events':'')+'" onclick="openDayDetail(\''+key+'\')">'+
      '<div class="mc-num">'+day+'</div>'+evHtml+'</div>';
  }
  const mc=document.getElementById('month-cal'); if(mc) mc.innerHTML='<div class="month-grid">'+html+'</div>';
}
function changeMonthView(d){monthViewOffset+=d;renderMonth();}
function goMonthToday(){monthViewOffset=0;renderMonth();}
function openDayDetail(key) {
  // Fix: use noon time to avoid timezone off-by-one
  const date=new Date(key+'T12:00:00'), di=(date.getDay()+6)%7;
  const tasks=allTasks().filter(t=>!t.onceDate&&taskOccursOn(t,key));
  const events=(HP.events||[]).filter(e=>e.date===key);
  const meals=HP.meals[key]||{};
  const label=date.toLocaleDateString('de-CH',{weekday:'long',day:'numeric',month:'long'});
  const merged=mergeTimelineItems(events,tasks);
  const itemsHtml=merged.length ? merged.map(({kind,data})=>{
    if(kind==='event'){
      const e=data, linkedNote=(HP.notes||[]).find(n=>n.linkedEventId===e.id);
      return '<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-bottom:1px solid var(--border);font-size:.81rem;border-radius:6px;margin-bottom:2px'+(e.important?';background:rgba(248,113,113,.08)':'')+'">'+
      '<span style="color:'+(e.important?'var(--red)':e.who==='p1'?'var(--p1)':e.who==='p2'?'var(--p2)':'var(--shared)')+'">'+e.emoji+'</span>'+
      '<div style="flex:1"><div style="font-weight:500">'+e.name+'</div>'+
      (linkedNote?'<div style="font-size:.7rem;color:var(--muted);margin-top:2px;cursor:pointer" onclick="alert('+JSON.stringify((linkedNote.title?linkedNote.title+': ':'')+linkedNote.body)+')">📝 '+
      (linkedNote.title||linkedNote.body.slice(0,30)+(linkedNote.body.length>30?'…':''))+'</div>':'')+
      '</div>'+
      (e.time?'<span style="font-size:.7rem;color:var(--muted)">⏰'+fmtTimeRange(e.time,e.timeEnd)+'</span>':'')+
      '<button data-eid="'+e.id+'" onclick="openEditEvent(this.dataset.eid)" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:.75rem;padding:2px 5px" title="Bearbeiten">✏️</button>'+
      '<button data-eid="'+e.id+'" onclick="deleteEvent(this.dataset.eid);closeModal()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:.75rem;padding:2px 5px" title="Löschen">✕</button>'+
      '</div>';
    }
    const t=data;
    return '<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-bottom:1px solid var(--border);font-size:.81rem;border-radius:6px;margin-bottom:2px;cursor:pointer" onclick="closeModal();openTaskModal(\''+t.id+'\',\''+key+'\')">'+
        '<span style="color:'+(t.who==='p1'?'var(--p1)':t.who==='p2'?'var(--p2)':'var(--shared)')+'">'+t.emoji+'</span>'+
        '<span style="flex:1">'+t.name+'</span>'+(t.time?'<span style="font-size:.7rem;color:var(--muted)">⏰'+fmtTimeRange(t.time,t.timeEnd)+'</span>':'')+
        (isDone(date,t.id)?'<span style="color:var(--green)">✓</span>':'')+'</div>';
  }).join('') : '<div style="font-size:.78rem;color:var(--muted);padding:6px 0">Keine Termine oder Aufgaben</div>';
  const mealsHtml=['Frühstück','Mittag','Abend'].map(s=>'<div style="display:flex;gap:8px;padding:4px 0;font-size:.79rem">'+
    '<span style="color:var(--muted);width:70px;flex-shrink:0">'+s+'</span>'+
    '<span>'+(meals[s]?meals[s].emoji+' '+meals[s].name:'—')+'</span></div>').join('');
  showModal('<h3>'+label+'</h3>'+
    '<div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.09em;color:var(--muted);margin:12px 0 6px">Termine &amp; Aufgaben</div>'+itemsHtml+
    '<div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.09em;color:var(--muted);margin:12px 0 6px">Menü</div>'+mealsHtml+
    '<div class="modal-btns" style="justify-content:space-between">'+
    '<button class="mbtn mbtn-cancel" onclick="closeModal()">Schliessen</button>'+

    '<button class="mbtn" style="background:var(--gbg);border:1px solid var(--green);color:var(--green)" onclick="exportDayICS(\''+key+'\');closeModal()">📅 Kalender</button></div>');
}

// ── PINBOARD ──────────────────────────────────
function renderPinboard() {
  const notes=HP.notes||[], el=document.getElementById('pin-board'); if(!el) return;
  if(!notes.length){el.innerHTML='<div style="text-align:center;padding:60px 20px;color:var(--muted)"><div style="font-size:2.5rem;margin-bottom:12px">📌</div><div>Noch keine Notizen.</div></div>';return;}
  const NOTE_BG={yellow:'background:#2d2a00;border:1px solid rgba(251,191,36,.3);color:#fde68a',blue:'background:#0a1628;border:1px solid rgba(108,142,255,.3);color:#bfcfff',pink:'background:#2a0a14;border:1px solid rgba(255,126,179,.3);color:#ffcce5',green:'background:#082010;border:1px solid rgba(74,222,128,.3);color:#bbf7d0',purple:'background:#180a2a;border:1px solid rgba(167,139,250,.3);color:#ddd6fe'};
  const tasks=allTasks();
  el.innerHTML='<div class="pin-grid">'+notes.map(n=>{
    const linked=n.linkedEventId?(HP.events||[]).find(e=>e.id===n.linkedEventId):
      (n.linkedTaskId?allTasks().find(t=>t.id===n.linkedTaskId):null);
    const dueDate=linked&&linked.date?linked.date:'';
    return '<div class="pin-note" style="'+NOTE_BG[n.color||'yellow']+'" onclick="openEditNote(\''+n.id+'\')">'+
      '<div class="pin-pin">📌</div>'+
      '<button class="pin-del" onclick="event.stopPropagation();deleteNote(\''+n.id+'\')">✕</button>'+
      (n.title?'<div class="pin-title">'+n.title+'</div>':'')+
      (n.body?'<div class="pin-body">'+n.body+'</div>':'')+
      (dueDate?'<div class="pin-date">📅 Fällig: '+dueDate+'</div>':'')+
      (linked?'<div class="pin-date" style="margin-top:'+(dueDate?'4px':'0')+';opacity:.8">🔗 '+linked.emoji+' '+linked.name+'</div>':'')+
      '</div>';
  }).join('')+'</div>';
}
const NOTE_COLORS=['yellow','blue','pink','green','purple'];
const NOTE_BG_PREVIEW={yellow:'#fde68a',blue:'#bfcfff',pink:'#ffcce5',green:'#bbf7d0',purple:'#ddd6fe'};
function noteColorBtns(selected){return NOTE_COLORS.map(c=>'<span onclick="document.querySelectorAll(\'.nc-btn\').forEach(x=>x.style.borderColor=\'transparent\');this.style.borderColor=\'#fff\';document.getElementById(\'note-color\').value=\''+c+'\'" class="nc-btn" style="display:inline-block;width:22px;height:22px;border-radius:50%;cursor:pointer;background:'+NOTE_BG_PREVIEW[c]+';border:2px solid '+(selected===c?'#fff':'transparent')+';transition:all .15s"></span>').join('');}
function buildNoteTaskSection(linkedEventId) {
  const events = HP.events || [];
  const eventOpts = '<option value="">— kein Termin —</option>' +
    events.map(e => '<option value="' + e.id + '"' + (e.id === linkedEventId ? ' selected' : '') + '>' +
      e.emoji + ' ' + e.name + ' (' + e.date + ')</option>'
    ).join('');
  return '<div class="modal-row"><label>Bestehenden Termin verknüpfen</label>' +
    '<select class="modal-in" id="note-event-id">' + eventOpts + '</select></div>' +
    '<div class="modal-row"><label style="font-size:.7rem;color:var(--muted)">— oder neuen Termin erstellen —</label>' +
    '<div style="display:flex;gap:6px">' +
    '<input class="modal-in" id="note-new-event-name" placeholder="Terminname…" style="flex:1">' +
    '<input class="modal-in" type="date" id="note-new-event-date" style="width:140px">' +
    '<select class="modal-in" id="note-new-event-who" style="width:110px">' +
    '<option value="p1">'+HP.names.p1+'</option><option value="p2">'+HP.names.p2+'</option>'+
    '<option value="shared" selected>Gemeinsam</option>'+
    '</select>' +
    '</div></div>';
}

function openAddNote(){
  showModal('<h3>📌 Neue Notiz</h3><input type="hidden" id="note-color" value="yellow">'+
    '<div class="modal-row"><label>Farbe</label><div style="display:flex;gap:6px">'+noteColorBtns('yellow')+'</div></div>'+
    '<div class="modal-row"><label>Titel</label><input class="modal-in" id="note-title" placeholder="Titel…"></div>'+
    '<div class="modal-row"><label>Notiz (optional)</label><textarea class="modal-in" id="note-body" rows="4" placeholder="Text…" style="resize:vertical;font-family:Inter,sans-serif"></textarea></div>'+
    buildNoteTaskSection(null)+
    '<div class="modal-btns"><button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
    '<button class="mbtn mbtn-confirm" onclick="saveNewNote()">✓ Speichern</button></div>');
}

function saveNewNote(){
  const title=document.getElementById('note-title')?.value.trim(); if(!title){showToast('Bitte Titel eingeben');return;}
  const body=document.getElementById('note-body')?.value.trim();
  if(!HP.notes)HP.notes=[];
  // Handle new event creation
  const newEventName = document.getElementById('note-new-event-name')?.value.trim();
  const newEventDate = document.getElementById('note-new-event-date')?.value;
  const newEventWho = document.getElementById('note-new-event-who')?.value || 'shared';
  let linkedEventId = document.getElementById('note-event-id')?.value || '';
  if(newEventName && newEventDate) {
    const eid = 'ev' + Date.now();
    if(!HP.events) HP.events = [];
    HP.events.push({id:eid,emoji:'📅',name:newEventName,date:newEventDate,time:'',who:newEventWho,important:false,note:''});
    linkedEventId = eid;
    showToast('📅 Termin "' + newEventName + '" erstellt');
  } else if(newEventName && !newEventDate) {
    showToast('Bitte Datum für den neuen Termin wählen'); return;
  }
  HP.notes.unshift({
    id:'n'+Date.now(),
    title, body, color:document.getElementById('note-color')?.value||'yellow',
    linkedEventId: linkedEventId||'',
    created:new Date().toISOString()
  });
  HP_save();closeModal();renderPinboard();render();
}

function openEditNote(id){
  const n=(HP.notes||[]).find(x=>x.id===id); if(!n) return;
  showModal('<h3>✏️ Notiz bearbeiten</h3><input type="hidden" id="note-color" value="'+n.color+'">'+
    '<div class="modal-row"><label>Farbe</label><div style="display:flex;gap:6px">'+noteColorBtns(n.color)+'</div></div>'+
    '<div class="modal-row"><label>Titel</label><input class="modal-in" id="note-title" value="'+(n.title||'')+'"></div>'+
    '<div class="modal-row"><label>Notiz (optional)</label><textarea class="modal-in" id="note-body" rows="4" style="resize:vertical;font-family:Inter,sans-serif">'+n.body+'</textarea></div>'+
    buildNoteTaskSection(n.linkedEventId||n.linkedTaskId||'')+
    '<div class="modal-btns" style="justify-content:space-between">'+
    '<button class="mbtn" style="background:var(--rbg);border:1px solid var(--red);color:var(--red)" onclick="deleteNote(\''+id+'\')">🗑</button>'+
    '<button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
    '<button class="mbtn mbtn-confirm" onclick="saveEditNote(\''+id+'\')">✓ Speichern</button></div>');
}

function saveEditNote(id){
  const n=(HP.notes||[]).find(x=>x.id===id); if(!n){closeModal();return;}
  const title=document.getElementById('note-title')?.value.trim(); if(!title){showToast('Bitte Titel eingeben');return;}
  n.title=title;
  n.body=document.getElementById('note-body')?.value.trim()||'';
  n.color=document.getElementById('note-color')?.value||n.color;
  // Handle new event
  const newEventName = document.getElementById('note-new-event-name')?.value.trim();
  const newEventDate = document.getElementById('note-new-event-date')?.value;
  const newEventWho = document.getElementById('note-new-event-who')?.value || 'shared';
  let linkedEventId = document.getElementById('note-event-id')?.value || '';
  if(newEventName && newEventDate) {
    const eid = 'ev' + Date.now();
    if(!HP.events) HP.events = [];
    HP.events.push({id:eid,emoji:'📅',name:newEventName,date:newEventDate,time:'',who:newEventWho,important:false,note:''});
    linkedEventId = eid;
    showToast('📅 Termin "' + newEventName + '" erstellt');
  } else if(newEventName && !newEventDate) {
    showToast('Bitte Datum für den neuen Termin wählen'); return;
  }
  n.linkedEventId = linkedEventId;
  HP_save();closeModal();renderPinboard();render();
}
function deleteNote(id){
  const n=(HP.notes||[]).find(x=>x.id===id); if(!n) return;
  if(n.linkedEventId && (HP.events||[]).some(e=>e.id===n.linkedEventId)){
    showModal('<h3>🗑 Notiz löschen</h3>'+
      '<p style="font-size:.85rem;color:var(--muted);margin-bottom:14px">Diese Notiz ist mit einem Termin verknüpft. Soll der Termin ebenfalls gelöscht werden?</p>'+
      '<div class="modal-btns" style="justify-content:space-between;flex-wrap:wrap;gap:8px">'+
      '<button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
      '<button class="mbtn" onclick="confirmDeleteNote(\''+id+'\',false)">Nur Notiz löschen</button>'+
      '<button class="mbtn" style="background:var(--rbg);border:1px solid var(--red);color:var(--red)" onclick="confirmDeleteNote(\''+id+'\',true)">Notiz &amp; Termin löschen</button>'+
      '</div>');
    return;
  }
  confirmDeleteNote(id,false);
}
function confirmDeleteNote(id,alsoEvent){
  const n=(HP.notes||[]).find(x=>x.id===id);
  if(alsoEvent && n && n.linkedEventId) {
    HP.events=(HP.events||[]).filter(e=>e.id!==n.linkedEventId);
    if(HP.eventStatus) delete HP.eventStatus[n.linkedEventId];
    if(HP.eventNotes) delete HP.eventNotes[n.linkedEventId];
    if(HP.eventComments) delete HP.eventComments[n.linkedEventId];
  }
  HP.notes=(HP.notes||[]).filter(x=>x.id!==id);
  HP_save();closeModal();renderPinboard();render();
  if(typeof renderMonth==='function')renderMonth();
  showToast(alsoEvent?'🗑 Notiz & Termin gelöscht':'🗑 Notiz gelöscht');
}


// ═══════════════════════════════════════════════
// EINMALIGE TERMINE - Event Management
// ═══════════════════════════════════════════════

const EVENT_REMINDER_OPTS=[['','Standard (15 Min vorher)'],['off','Keine'],['0','Zur Uhrzeit'],['5','5 Min vorher'],['15','15 Min vorher'],['30','30 Min vorher'],['60','1 Std vorher'],['240','4 Std vorher'],['480','8 Std vorher'],['720','12 Std vorher'],['1440','1 Tag vorher'],['10080','1 Woche vorher']];
function eventReminderOptions(selected) {
  return EVENT_REMINDER_OPTS.map(([v,l])=>'<option value="'+v+'"'+((selected||'')===v?' selected':'')+'>'+l+'</option>').join('');
}

function choreRecurRow(current) {
  return '<div class="modal-row"><label>Wiederholung</label>'+
    '<select class="modal-in" id="ev-recur">'+
    CHORE_INTERVALS.map(([k,l])=>'<option value="'+k+'"'+((current||'months:3')===k?' selected':'')+'>'+l+'</option>').join('')+
    '</select></div>';
}

function openAddEvent(prefillDate='', chore=false) {
  showModal(
    '<h3>'+(chore?'🧹 Neue Haushaltsaufgabe':'📅 Neuer Termin')+'</h3>'+
    '<input type="hidden" id="ev-chore" value="'+(chore?'1':'0')+'">'+
    '<div class="modal-row"><label>Emoji & Name</label>'+
    '<div style="display:flex;gap:7px">'+
    emojiPickerBtnHTML('ev-emoji',chore?'🧹':'📅')+
    '<input class="modal-in" id="ev-name" placeholder="'+(chore?'z.B. Fenster putzen…':'z.B. Arzttermin, Abendessen…')+'" style="flex:1"></div>'+
    emojiPickerMenuHTML('ev-emoji')+
    '</div>'+
    '<div class="modal-row"><label>'+(chore?'Nächste Fälligkeit':'Datum')+'</label>'+
    '<input class="modal-in" type="date" id="ev-date" value="'+prefillDate+'"></div>'+
    (chore?choreRecurRow(''):'')+
    '<div class="modal-row"><div style="display:flex;gap:8px">'+
    '<div style="flex:1"><label>Von (optional)</label><input class="modal-in" type="time" id="ev-time"></div>'+
    '<div style="flex:1"><label>Bis (optional)</label><input class="modal-in" type="time" id="ev-time-end"></div>'+
    '</div></div>'+
    '<div class="modal-row"><label>Für wen</label>'+
    '<select class="modal-in" id="ev-who">'+
    '<option value="p1">'+HP.names.p1+'</option>'+
    '<option value="p2">'+HP.names.p2+'</option>'+
    '<option value="shared" selected>Gemeinsam</option>'+
    '</select></div>'+
    '<div class="modal-row"><label>Erinnerung</label>'+
    '<select class="modal-in" id="ev-reminder">'+eventReminderOptions(chore?'10080':'')+'</select></div>'+
    '<div class="modal-row"><label style="display:flex;align-items:center;gap:8px;cursor:pointer">'+
    '<input type="checkbox" id="ev-important" style="accent-color:var(--red);width:16px;height:16px">'+
    '<span style="color:var(--red);font-weight:500">🚨 Wichtig</span></label></div>'+
    '<div class="modal-btns">'+
    '<button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
    '<button class="mbtn mbtn-confirm" onclick="saveNewEvent()">✓ Speichern</button>'+
    '</div>'
  );
  setTimeout(()=>document.getElementById('ev-name')?.focus(),60);
}

function saveNewEvent() {
  const emoji=document.getElementById('ev-emoji')?.value.trim()||'📅';
  const name=document.getElementById('ev-name')?.value.trim();
  const date=document.getElementById('ev-date')?.value;
  const time=document.getElementById('ev-time')?.value||'';
  const timeEnd=document.getElementById('ev-time-end')?.value||'';
  const who=document.getElementById('ev-who')?.value||'shared';
  const reminder=document.getElementById('ev-reminder')?.value||'';
  const important=document.getElementById('ev-important')?.checked||false;
  const isChore=document.getElementById('ev-chore')?.value==='1';
  if(!name){showToast('Bitte Name eingeben');return;}
  if(!date){showToast('Bitte Datum wählen');return;}
  if(!HP.events) HP.events=[];
  const ev={id:'ev'+Date.now(),emoji,name,date,time,timeEnd,who,reminder,important,note:''};
  if(isChore){
    const [unit,value]=(document.getElementById('ev-recur')?.value||'months:3').split(':');
    ev.chore=true; ev.recur={unit,value:parseInt(value)};
  }
  HP.events.push(ev);
  HP_save();closeModal();render();
  if(typeof renderEventsList==='function') renderEventsList();
  if(isChore&&typeof renderHouseholdList==='function') renderHouseholdList();
  showToast(emoji+' '+name+' am '+date+' gespeichert');
}

function openEditEvent(id) {
  const e=(HP.events||[]).find(x=>x.id===id); if(!e) return;
  const chore=!!e.chore;
  showModal(
    '<h3>'+(chore?'✏️ Haushaltsaufgabe bearbeiten':'✏️ Termin bearbeiten')+'</h3>'+
    '<input type="hidden" id="ev-chore" value="'+(chore?'1':'0')+'">'+
    '<div class="modal-row"><label>Emoji & Name</label>'+
    '<div style="display:flex;gap:7px">'+
    emojiPickerBtnHTML('ev-emoji',e.emoji)+
    '<input class="modal-in" id="ev-name" value="'+e.name+'" style="flex:1"></div>'+
    emojiPickerMenuHTML('ev-emoji')+
    '</div>'+
    '<div class="modal-row"><label>'+(chore?'Nächste Fälligkeit':'Datum')+'</label>'+
    '<input class="modal-in" type="date" id="ev-date" value="'+e.date+'"></div>'+
    (chore?choreRecurRow(e.recur?e.recur.unit+':'+e.recur.value:''):'')+
    '<div class="modal-row"><div style="display:flex;gap:8px">'+
    '<div style="flex:1"><label>Von (optional)</label><input class="modal-in" type="time" id="ev-time" value="'+(e.time||'')+'"></div>'+
    '<div style="flex:1"><label>Bis (optional)</label><input class="modal-in" type="time" id="ev-time-end" value="'+(e.timeEnd||'')+'"></div>'+
    '</div></div>'+
    '<div class="modal-row"><label>Für wen</label>'+
    '<select class="modal-in" id="ev-who">'+
    '<option value="p1"'+(e.who==='p1'?' selected':'')+'>'+HP.names.p1+'</option>'+
    '<option value="p2"'+(e.who==='p2'?' selected':'')+'>'+HP.names.p2+'</option>'+
    '<option value="shared"'+(e.who==='shared'?' selected':'')+'>Gemeinsam</option>'+
    '</select></div>'+
    '<div class="modal-row"><label>Erinnerung</label>'+
    '<select class="modal-in" id="ev-reminder">'+eventReminderOptions(e.reminder)+'</select></div>'+
    '<div class="modal-row"><label style="display:flex;align-items:center;gap:8px;cursor:pointer">'+
    '<input type="checkbox" id="ev-important"'+(e.important?' checked':'')+' style="accent-color:var(--red);width:16px;height:16px">'+
    '<span style="color:var(--red);font-weight:500">🚨 Wichtig</span></label></div>'+
    '<div class="modal-btns" style="justify-content:space-between">'+
    '<button class="mbtn" style="background:var(--rbg);border:1px solid var(--red);color:var(--red)" data-eid="'+e.id+'" onclick="deleteEvent(this.dataset.eid)">🗑 Löschen</button>'+
    '<button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
    '<button class="mbtn mbtn-confirm" data-eid="'+e.id+'" onclick="saveEditEvent(this.dataset.eid)">✓ Speichern</button>'+
    '</div>'
  );
}

function openEventModal(id) {
  const e=(HP.events||[]).find(x=>x.id===id); if(!e) return;
  const st=getEventStatus(id), note=(HP.eventNotes||{})[id]||'';
  const stBtns=[['open','⬜ Offen'],['wip','🟡 In Arbeit'],['blocked','🔴 Blockiert'],['done','✅ Erledigt']]
    .map(([s,l])=>'<button class="st-btn'+(st===s?' sel-'+s:'')+'" onclick="setEventStatus(\''+id+'\',\''+s+'\',this)">'+l+'</button>').join('');
  showModal('<h3>'+e.emoji+' '+e.name+'</h3>'+
    '<div class="modal-row"><label>Status</label><div class="st-btns">'+stBtns+'</div></div>'+
    '<div class="modal-row"><label style="display:flex;align-items:center;gap:8px;cursor:pointer">'+
    '<input type="checkbox" id="ev-important"'+(e.important?' checked':'')+' style="accent-color:var(--red);width:16px;height:16px">'+
    '<span style="font-size:.82rem;font-weight:500;color:var(--red)">🚨 Wichtig — Termin wird rot markiert</span>'+
    '</label></div>'+
    '<div class="modal-row" id="ev-block-sec" style="'+(st!=='blocked'?'display:none':'')+' ">'+
    '<label>Was fehlt / warum blockiert?</label>'+
    '<input class="modal-in" id="ev-block-note" placeholder="z.B. Termin fehlt noch…" value="'+note+'">'+
    '<button class="mbtn mbtn-confirm" style="margin-top:8px;width:100%;background:var(--shared)" onclick="addBlockedEventToShop(\''+id+'\')">🛒 Zur Einkaufsliste</button></div>'+
    '<div class="modal-row" id="ev-comment-section">'+
    '<label>💬 Kommentar</label>'+
    '<textarea class="modal-in" id="ev-comment" rows="2" placeholder="Notiz zum Termin…" style="resize:vertical;font-family:Inter,sans-serif;font-size:.79rem">'+((HP.eventComments||{})[id]||'')+'</textarea>'+
    '</div>'+
    '<div class="modal-btns" style="justify-content:space-between">'+
    '<button class="mbtn" style="background:var(--surface);border:1px solid var(--border)" onclick="openEditEvent(\''+id+'\')">✏️ Bearbeiten</button>'+
    '<button class="mbtn mbtn-cancel" onclick="closeModal()">Schliessen</button>'+
    '<button class="mbtn mbtn-confirm" onclick="saveEventModalDetails(\''+id+'\');closeModal()">Speichern</button>'+
    '</div>'
  );
}

function saveEventModalDetails(id) {
  const e=(HP.events||[]).find(x=>x.id===id); if(!e) return;
  e.important=document.getElementById('ev-important')?.checked||false;
  const blockNote=document.getElementById('ev-block-note'); if(blockNote){if(!HP.eventNotes)HP.eventNotes={};HP.eventNotes[id]=blockNote.value;}
  const comment=document.getElementById('ev-comment')?.value||'';
  if(!HP.eventComments) HP.eventComments={};
  if(comment) HP.eventComments[id]=comment; else delete HP.eventComments[id];
  HP_save();render();
  if(typeof renderEventsList==='function') renderEventsList();
}

function setEventStatus(id,status,btn) {
  const e=(HP.events||[]).find(x=>x.id===id);
  if(e && e.chore && e.recur && status==='done'){
    e.date=advanceDateKey(e.date,e.recur.unit,e.recur.value);
    if(HP.eventStatus) delete HP.eventStatus[id];
    HP_save();closeModal();render();
    if(typeof renderMonth==='function')renderMonth();
    if(typeof renderHouseholdList==='function')renderHouseholdList();
    showToast('✅ '+e.name+' erledigt — nächste Fälligkeit: '+e.date);
    return;
  }
  if(!HP.eventStatus) HP.eventStatus={};
  HP.eventStatus[id]=status;
  document.querySelectorAll('#modal-ov .st-btn').forEach(b=>b.className='st-btn');
  btn.className='st-btn sel-'+status;
  const bs=document.getElementById('ev-block-sec'); if(bs) bs.style.display=status==='blocked'?'':'none';
  HP_save();
}

function addBlockedEventToShop(id) {
  const e=(HP.events||[]).find(x=>x.id===id);
  const note=document.getElementById('ev-block-note')?.value||'';
  if(!HP.eventNotes) HP.eventNotes={};
  HP.eventNotes[id]=note; HP_save(); closeModal();
  const opts=CATS.map(c=>'<option value="'+c+'">'+catEmoji(c)+' '+c+'</option>').join('');
  showModal('<h3>🛒 Zur Einkaufsliste</h3>'+
    '<div class="modal-row"><label>Artikel</label><input class="modal-in" id="bl-name" value="'+note+'" placeholder="z.B. Blumenerde"></div>'+
    '<div class="modal-row"><div style="display:flex;gap:8px">'+
    '<div style="flex:1"><label>Menge</label><input class="modal-in" id="bl-qty"></div>'+
    '<div style="flex:1"><label>Einheit</label><input class="modal-in" id="bl-unit"></div>'+
    '<div style="flex:1"><label>Kategorie</label><select class="modal-in" id="bl-cat">'+opts+'</select></div></div></div>'+
    '<div class="modal-btns"><button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
    '<button class="mbtn mbtn-confirm" style="background:var(--green);color:#000" onclick="confirmBlockedEventShop(\''+id+'\')">✓ Hinzufügen</button></div>');
}

function confirmBlockedEventShop(id) {
  const e=(HP.events||[]).find(x=>x.id===id);
  const name=document.getElementById('bl-name')?.value.trim();
  if(!name){closeModal();return;}
  if(!HP.eventNotes) HP.eventNotes={};
  HP.eventNotes[id]=name; HP_save(); closeModal();
  addShopItem(name,document.getElementById('bl-qty')?.value.trim()||'',document.getElementById('bl-unit')?.value.trim()||'',document.getElementById('bl-cat')?.value||'Sonstiges',id,e?e.emoji+' '+e.name:null);
  render();
}

function saveEditEvent(id) {
  const e=(HP.events||[]).find(x=>x.id===id); if(!e){closeModal();return;}
  e.emoji=document.getElementById('ev-emoji')?.value.trim()||e.emoji;
  e.name=document.getElementById('ev-name')?.value.trim()||e.name;
  e.date=document.getElementById('ev-date')?.value||e.date;
  e.time=document.getElementById('ev-time')?.value||'';
  e.timeEnd=document.getElementById('ev-time-end')?.value||'';
  e.who=document.getElementById('ev-who')?.value||e.who;
  e.reminder=document.getElementById('ev-reminder')?.value||'';
  e.important=document.getElementById('ev-important')?.checked||false;
  if(e.chore){
    const [unit,value]=(document.getElementById('ev-recur')?.value||'months:3').split(':');
    e.recur={unit,value:parseInt(value)};
  }
  HP_save();closeModal();render();
  if(typeof renderMonth==='function')renderMonth();
  if(typeof renderEventsList==='function') renderEventsList();
  if(typeof renderHouseholdList==='function') renderHouseholdList();
  showToast(e.chore?'Haushaltsaufgabe gespeichert':'Termin gespeichert');
}

// ═══════════════════════════════════════════════
// GEBURTSTAGE
// ═══════════════════════════════════════════════

function renderBirthdayList() {
  const el = document.getElementById('birthday-list');
  const el2b = document.getElementById('birthday-list-2');
  if(!el && !el2b) return;
  const bdays = (HP.birthdays||[]).slice().sort((a,b)=>{
    const an=parseInt(a.date.slice(5)), bn=parseInt(b.date.slice(5));
    return an-bn;
  });
  if(!bdays.length){
    const emptyHtml='<div style="font-size:.78rem;color:var(--muted);padding:8px 0">Noch keine Geburtstage eingetragen.</div>';
    if(el) el.innerHTML=emptyHtml;
    if(el2b) el2b.innerHTML=emptyHtml;
    return;
  }
  const today=dk(new Date());
  const html = bdays.map(b=>{
    const bdAge=b.year?new Date().getFullYear()-parseInt(b.year):'';
    const nextDate = getNextBirthday(b.date);
    const daysLeft = Math.round((new Date(nextDate+'T12:00:00')-new Date())/86400000);
    const isToday2 = daysLeft<=0&&daysLeft>-1;
    const isSoon = daysLeft<=7&&daysLeft>=0;
    return '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--panel);border:1px solid var(--border);border-radius:var(--rs);margin-bottom:6px'+(isToday2?';border-color:var(--today)':isSoon?';border-color:var(--amber)':'')+'">'+
      '<span style="font-size:1.1rem">🎂</span>'+
      '<div style="flex:1">'+
        '<div style="font-size:.82rem;font-weight:500">'+b.name+'</div>'+
        '<div style="font-size:.7rem;color:var(--muted)">'+b.date.slice(5).replace('-','.')+'.'+(b.year?' (Jg. '+b.year+')':'')+'</div>'+
      '</div>'+
      '<span style="font-size:.72rem;font-weight:600;color:'+(isToday2?'var(--today)':isSoon?'var(--amber)':'var(--muted)')+'">'+
        (isToday2?'🎉 Heute!':daysLeft===1?'Morgen':daysLeft<=7?'in '+daysLeft+' Tagen':'in '+daysLeft+' Tagen')+
      '</span>'+
      '<button data-bid=' + JSON.stringify(b.id) + ' onclick="openEditBirthday(this.dataset.bid)" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:.82rem;padding:3px 6px">✏️</button>'+
      '<button data-bid=' + JSON.stringify(b.id) + ' onclick="deleteBirthday(this.dataset.bid)" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:.82rem;padding:3px 6px">✕</button>'+
    '</div>';
  }).join('');
  if(el) el.innerHTML = html;
  if(el2b) el2b.innerHTML = html;
}

function getNextBirthday(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [,m,d] = dateStr.split('-');
  let next = new Date(today.getFullYear(),parseInt(m)-1,parseInt(d));
  if(next < today) next.setFullYear(today.getFullYear()+1);
  return dk(next);
}

function openAddBirthday() {
  showModal(
    '<h3>🎂 Geburtstag eintragen</h3>'+
    '<div class="modal-row"><label>Name</label>'+
    '<input class="modal-in" id="bd-name" placeholder="z.B. Oma Rosina"></div>'+
    '<div class="modal-row"><label>Geburtstag (Tag & Monat)</label>'+
    '<div style="display:flex;gap:8px">'+
    '<input class="modal-in" type="number" id="bd-day" placeholder="Tag" min="1" max="31" style="width:80px">'+
    '<input class="modal-in" type="number" id="bd-month" placeholder="Monat" min="1" max="12" style="width:80px">'+
    '<input class="modal-in" type="number" id="bd-year" placeholder="Jahrgang (optional)" style="flex:1"></div></div>'+
    '<div class="modal-btns">'+
    '<button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
    '<button class="mbtn mbtn-confirm" onclick="saveNewBirthday()">✓ Speichern</button>'+
    '</div>'
  );
  setTimeout(()=>document.getElementById('bd-name')?.focus(),60);
}

function saveNewBirthday() {
  const name = document.getElementById('bd-name')?.value.trim();
  const day = document.getElementById('bd-day')?.value.padStart(2,'0');
  const month = document.getElementById('bd-month')?.value.padStart(2,'0');
  const year = document.getElementById('bd-year')?.value.trim()||'';
  if(!name||!day||!month){showToast('Bitte Name, Tag und Monat eingeben');return;}
  if(!HP.birthdays) HP.birthdays=[];
  HP.birthdays.push({id:'bd'+Date.now(),name,date:'0000-'+month+'-'+day,year});
  HP_save();closeModal();renderBirthdayList();
  showToast('🎂 '+name+' gespeichert');
}

function openEditBirthday(id) {
  const b=(HP.birthdays||[]).find(x=>x.id===id); if(!b) return;
  const [,m,d]=b.date.split('-');
  showModal(
    '<h3>✏️ Geburtstag bearbeiten</h3>'+
    '<div class="modal-row"><label>Name</label>'+
    '<input class="modal-in" id="bd-name" value="'+b.name+'"></div>'+
    '<div class="modal-row"><label>Geburtstag</label>'+
    '<div style="display:flex;gap:8px">'+
    '<input class="modal-in" type="number" id="bd-day" value="'+parseInt(d)+'" min="1" max="31" style="width:80px">'+
    '<input class="modal-in" type="number" id="bd-month" value="'+parseInt(m)+'" min="1" max="12" style="width:80px">'+
    '<input class="modal-in" type="number" id="bd-year" placeholder="Jahrgang" value="'+(b.year||'')+'" style="flex:1"></div></div>'+
    '<div class="modal-btns" style="justify-content:space-between">'+
    '<button class="mbtn" style="background:var(--rbg);border:1px solid var(--red);color:var(--red)" data-bid=' + JSON.stringify(id) + ' onclick="deleteBirthday(this.dataset.bid)">🗑</button>'+
    '<button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
    '<button class="mbtn mbtn-confirm" data-bid=' + JSON.stringify(id) + ' onclick="saveEditBirthday(this.dataset.bid)">✓ Speichern</button>'+
    '</div>'
  );
}

function saveEditBirthday(id) {
  const b=(HP.birthdays||[]).find(x=>x.id===id); if(!b){closeModal();return;}
  b.name=document.getElementById('bd-name')?.value.trim()||b.name;
  const day=document.getElementById('bd-day')?.value.padStart(2,'0');
  const month=document.getElementById('bd-month')?.value.padStart(2,'0');
  b.date='0000-'+month+'-'+day;
  b.year=document.getElementById('bd-year')?.value.trim()||'';
  HP_save();closeModal();renderBirthdayList();
  showToast('Geburtstag gespeichert');
}

function deleteBirthday(id) {
  HP.birthdays=(HP.birthdays||[]).filter(x=>x.id!==id);
  HP_save();closeModal();renderBirthdayList();showToast('Gelöscht');
}

// Show birthday banners in today view
function renderBirthdayBanners() {
  const today=new Date();
  const m=String(today.getMonth()+1).padStart(2,'0');
  const d=String(today.getDate()).padStart(2,'0');
  const todayMD=m+'-'+d;
  const bdays=(HP.birthdays||[]).filter(b=>b.date.slice(5)===todayMD);
  const el=document.getElementById('birthday-banners');
  if(!el) return;
  el.innerHTML=bdays.map(b=>{
    const age=b.year?new Date().getFullYear()-parseInt(b.year):'';
    return '<div style="background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.3);border-radius:var(--r);padding:9px 14px;margin-bottom:8px;display:flex;align-items:center;gap:9px;font-size:.82rem">'+
      '🎂 <b>'+b.name+'</b> hat heute Geburtstag!'+(age?' <span style="color:var(--muted)">('+age+' Jahre)</span>':'')+
    '</div>';
  }).join('');
}

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





function buildContext(){
  const tasks=allTasks(), shopOpen=HP.shop.filter(i=>!i.bought);
  const today=new Date(); today.setHours(0,0,0,0);
  const di=(today.getDay()+6)%7;
  const todayT=tasks.filter(t=>t.days.includes(di));
  const weekMeals=[];
  getWeekDates(weekOffset).forEach((d,i)=>{const m=HP.meals[dk(d)]||{};if(Object.keys(m).length)weekMeals.push(DS[i]+': '+Object.values(m).map(x=>x.name).join(', '));});
  return ['Tasks: '+tasks.length,'Heute ('+DS[di]+'): '+todayT.map(t=>t.name).join(', '),'Einkauf offen: '+shopOpen.map(i=>i.name).join(', '),'Menü diese Woche: '+weekMeals.join(' | '),'Namen: p1='+HP.names.p1+', p2='+HP.names.p2].join('\n');
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
      const d=JSON.parse(ev.target.result);
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
  allTasks().filter(t=>!t.onceDate&&taskOccursOn(t,key)&&t.time).forEach(t=>{
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
  try{if(NOTIF_OK&&Notification.permission==='granted')subscribeToPush();}catch(e){}
  // Input listeners
  document.getElementById('af-name')?.addEventListener('keydown',e=>{if(e.key==='Enter')addTask();});
  document.getElementById('shop-add-name')?.addEventListener('keydown',e=>{if(e.key==='Enter')addShopItem();});
  document.getElementById('ai-input')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendAiMessage();}});
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
      <span style="font-size:.82rem;font-weight:500;min-width:80px;color:${currentColor}">${p.label}</span>
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
    '<label for="ic-' + i + '" style="flex:1;font-size:.79rem;cursor:pointer">' + ing.n + (ing.optional ? ' <span style="font-size:.65rem;color:var(--amber)">(optional)</span>' : '') + '</label>' +
    '<span style="font-size:.75rem;color:var(--muted);white-space:nowrap">' + ing.q + ' ' + ing.u + '</span></li>'
  ).join('');

  const stepsHtml = r.steps && r.steps.length
    ? '<div style="font-size:.65rem;text-transform:uppercase;letter-spacing:.09em;color:var(--muted);margin:14px 0 8px">Zubereitung</div>' +
      r.steps.map((s, i) =>
        '<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);font-size:.79rem;line-height:1.5">' +
        '<span style="background:var(--p1bg);color:var(--p1);border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:.68rem;font-weight:700;flex-shrink:0;margin-top:1px">' + (i+1) + '</span>' +
        '<span>' + s + '</span></div>'
      ).join('')
    : '';

  showModal(
    '<span style="font-size:2rem;text-align:center;display:block;margin-bottom:6px">' + r.emoji + '</span>' +
    '<h3 style="text-align:center">' + r.name + '</h3>' +
    '<div style="display:flex;gap:10px;justify-content:center;font-size:.73rem;color:var(--muted);margin-bottom:12px">' +
    '<span>⏱ ' + r.time + ' Min</span><span>👥 ' + r.pers + ' Pers.</span><span>' + r.tags.join(' · ') + '</span></div>' +
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