// ═══════════════════════════════════════════════
// HEIMPLANER – Wochenuebersicht und Personenansicht
//
// Herausgeloest aus heimplaner-app.js (vormals 2381 Zeilen).
// Reine Verschiebung, kein Verhalten geaendert.
// Die Reihenfolge der Skript-Tags in index.html ist bindend – siehe CLAUDE.md.
// ═══════════════════════════════════════════════

// ── ALL VIEW ──────────────────────────────────
function renderAllView() { renderTodayBanner(); renderBirthdayBanners(); renderBlockedBanners(); renderWeekGrid(); }

function renderTodayBanner() {
  const today=new Date(); today.setHours(0,0,0,0);
  const di=(today.getDay()+6)%7, tasks=allTasks();
  const todayKey=dk(today);
  const dayEv=(HP.events||[]).filter(e=>e.date===todayKey);
  const dayT=tasks.filter(t=>taskOccursOn(t,todayKey));
  const doneC=dayT.filter(t=>getStatus(t.id,todayKey)==='done').length;
  const prioOpen=dayT.filter(t=>t.prio&&getStatus(t.id,todayKey)!=='done').length;
  const evChips=dayEv.map(e=>'<span class="tbc '+(e.important?'tbc-important':'tbc-'+e.who+' tbc-event')+'" onclick="openEventModal(\''+esc(e.id)+'\')">'+esc(e.emoji)+' '+esc(e.name)+'</span>').join('');
  const taskChips=dayT.map(t=>{
    const d=getStatus(t.id,todayKey)==='done';
    const si=getStatus(t.id,todayKey)==='wip'?'🟡':getStatus(t.id,todayKey)==='blocked'?'🔴':d?'✅':'';
    return '<span class="tbc '+(t.important?'tbc-important':'tbc-'+t.who)+(d?' done':'')+(t.prio?' tbc-prio':'')+'" onclick="openTaskModal(\''+esc(t.id)+'\',\''+todayKey+'\')">'+(t.prio?'● ':'')+esc(t.emoji)+' '+esc(t.name)+(si?' '+si:'')+'</span>';
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
  const blocked=allTasks().filter(t=>!t.onceDate&&taskOccursOn(t,todayKey)&&getStatus(t.id,todayKey)==='blocked');
  const el=document.getElementById('blocked-banners');
  if(el) el.innerHTML=blocked.map(t=>
    '<div class="blocked-banner" onclick="openTaskModal(\''+esc(t.id)+'\',\''+todayKey+'\')">🔴 <b>'+esc(t.emoji)+' '+esc(t.name)+'</b> ist blockiert'+
    (HP.taskNotes[t.id]?' <span style="color:var(--muted)">– '+esc(HP.taskNotes[t.id])+'</span>':'')+
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
    const doneT=dayT.filter(t=>getStatus(t.id,key)==='done');
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
      chip.innerHTML='<span class="chip-dot"></span><span style="flex:1">🎂 '+esc(b.name)+(bdAge?' ('+bdAge+')':'')+' </span>';
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
        const linkedNote=(HP.notes||[]).find(n=>n.linkedEventId===e.id);
        chip.className='task-chip '+(e.important?'c-important':'c'+e.who+' ev-once')+' s-'+est+(est==='done'?' done':'');
        chip.innerHTML='<span class="chip-dot"></span><span style="flex:1">'+esc(e.emoji)+' '+esc(e.name)+(e.time?'<span style="font-size:.6rem;opacity:.7;margin-left:3px">⏰'+esc(fmtTimeRange(e.time,e.timeEnd))+'</span>':'')+'</span>'+
          '<span class="chip-st">'+esi+'</span>'+(ecmt?'<span style="font-size:.65rem;opacity:.7">💬</span>':'')+
          (linkedNote?'<span style="font-size:.65rem;opacity:.7;flex-shrink:0;cursor:pointer" title="Verknüpfte Notiz öffnen" onclick="event.stopPropagation();openEditNote(\''+esc(linkedNote.id)+'\')">🔗</span>':'');
        chip.addEventListener('click',()=>openEventModal(e.id));
      } else {
        const t=data, st=getStatus(t.id,key), d=st==='done';
        const si=st==='wip'?'🟡':st==='blocked'?'🔴':'';
        chip.className='task-chip '+(t.important?'c-important':'c'+t.who)+' s-'+st+(d?' done':'');
        const cmt=((HP.taskComments||{})[t.id]||{})[key]||'';
        chip.innerHTML='<span class="chip-dot"></span><span style="flex:1">'+esc(t.emoji)+' '+esc(t.name)+(t.time?'<span style="font-size:.6rem;opacity:.7;margin-left:3px">⏰'+esc(fmtTimeRange(t.time,t.timeEnd))+'</span>':'')+' </span>'+'<span class="chip-st">'+si+'</span>'+(cmt?'<span style="font-size:.65rem;opacity:.7">💬</span>':'');
        chip.addEventListener('click',()=>openTaskModal(t.id,key));
      }
      tc.appendChild(chip);
    });
    // Then planned meals
    Object.entries(dayMeals).forEach(([slot,m])=>{
      const chip=document.createElement('div');
      chip.className='task-chip c-meal';
      chip.innerHTML='<span class="chip-dot"></span><span style="flex:1">🍽️ '+esc(m.name)+'</span><span style="font-size:.6rem;opacity:.6;flex-shrink:0">'+esc(slot)+'</span>';
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
  dates.forEach((date,di)=>{const key=dk(date);const dt=tasks.filter(t=>!t.onceDate&&taskOccursOn(t,key));tot+=dt.length;dt.forEach(t=>{if(getStatus(t.id,key)==='done')done++;});});
  const pct=tot?Math.round(done/tot*100):0;
  const hd=document.getElementById('pv-hd');
  if(hd) hd.innerHTML='<div class="pv-av pv-av-'+who+'">'+esc(n.charAt(0).toUpperCase())+'</div>'+
    '<div><div class="pv-name" style="color:'+color+'">'+esc(n)+'</div><div class="pv-sub">Persönliche Wochenübersicht</div></div>'+
    '<div class="pv-stats"><div class="pv-stat"><div class="psn" style="color:'+color+'">'+done+'</div><div class="psl">Erledigt</div></div>'+
    '<div class="pv-stat"><div class="psn">'+tot+'</div><div class="psl">Gesamt</div></div>'+
    '<div class="pv-stat"><div class="psn" style="color:var(--today)">'+pct+'%</div><div class="psl">Quote</div></div></div>'+
    '<button onclick="openQuickAddTask(\''+who+'\')" style="margin-left:12px;background:var(--p1bg);border:1px solid var(--p1);border-radius:var(--rs);color:var(--p1);font-family:Inter,sans-serif;font-size:.75rem;font-weight:600;padding:6px 12px;cursor:pointer;white-space:nowrap;flex-shrink:0">+ Aufgabe</button>';
  const pvDays=document.getElementById('pv-days'); if(!pvDays) return; pvDays.innerHTML='';
  dates.forEach((date,di)=>{
    const key=dk(date), tl=isToday(date), dayT=tasks.filter(t=>!t.onceDate&&taskOccursOn(t,key));
    const sorted=[...dayT].sort((a,b)=>a.prio&&!b.prio?-1:!a.prio&&b.prio?1:0);
    const row=document.createElement('div'); row.className='pv-day-row';
    row.innerHTML='<div class="pvdl'+(tl?' tlbl':'')+'"><div class="pvd">'+DS[di]+(tl?' · Heute':'')+'</div>'+
      '<div class="pvdt">'+date.toLocaleDateString('de-CH',{day:'numeric',month:'short'})+'</div></div>'+
      '<div class="pv-day-tasks'+(tl?' tbg':'')+'" id="pvt-'+di+'"></div>';
    pvDays.appendChild(row);
    const tc=row.querySelector('#pvt-'+di);
    if(!sorted.length){tc.innerHTML='<span class="empty-day">Frei 🎉</span>';return;}
    sorted.forEach(t=>{
      const st=getStatus(t.id,key), d=st==='done';
      const pill=document.createElement('div');
      pill.className='pv-pill '+(t.important?'p-important':(t.who==='shared'?'pshared':'p'+t.who[1]))+(d?' s-done':'')+(t.prio?' is-prio':'')+(st==='blocked'?' s-blocked':'');
      pill.innerHTML=esc(t.emoji)+' '+esc(t.name)+
        (st==='wip'?'<span class="pst wip">🟡</span>':st==='blocked'?'<span class="pst blk">🔴</span>':'')+
        (t.who==='shared'?'<span style="font-size:.62rem;opacity:.55"> gem.</span>':'');
      pill.addEventListener('click',()=>openTaskModal(t.id,key));
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
    '<option value="p1"'+(who==='p1'?' selected':'')+'>'+esc(HP.names.p1)+'</option>'+
    '<option value="p2"'+(who==='p2'?' selected':'')+'>'+esc(HP.names.p2)+'</option>'+
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
    HP.events.push({id:'ev'+Date.now(),emoji,name,date,time,timeEnd,who,reminder,important,note:'',updatedAt:Date.now()});
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
    HP.tasks[who].push({id:tid,emoji,name,days,prio,important,status:'open',time,timeEnd,reminder,updatedAt:Date.now()});
    HP_save();closeModal();render();showToast(emoji+' '+name+' hinzugefügt');
  }
}

function deleteEvent(id){
  // Nebendaten mitsichern, sonst käme der Termin beim Rückgängig ohne
  // Status, Notiz und Kommentare zurück.
  const weg=(HP.events||[]).find(e=>e.id===id);
  const nebendaten={
    status:(HP.eventStatus||{})[id],
    notiz:(HP.eventNotes||{})[id],
    kommentare:(HP.eventComments||{})[id]
  };
  markDeleted('events', id);
  HP.events=(HP.events||[]).filter(e=>e.id!==id);
  if(HP.eventStatus) delete HP.eventStatus[id];
  if(HP.eventNotes) delete HP.eventNotes[id];
  if(HP.eventComments) delete HP.eventComments[id];
  const neuZeichnen=()=>{
    render();
    if(typeof renderMonth==='function')renderMonth();
    if(typeof renderHouseholdList==='function')renderHouseholdList();
  };
  HP_save();neuZeichnen();
  showUndoToast('Termin gelöscht', ()=>{
    if(!weg) return;
    unmarkDeleted('events',id);
    weg.updatedAt=Date.now(); HP.events.push(weg);
    if(nebendaten.status!==undefined){ HP.eventStatus=HP.eventStatus||{}; HP.eventStatus[id]=nebendaten.status; }
    if(nebendaten.notiz!==undefined){ HP.eventNotes=HP.eventNotes||{}; HP.eventNotes[id]=nebendaten.notiz; }
    if(nebendaten.kommentare!==undefined){ HP.eventComments=HP.eventComments||{}; HP.eventComments[id]=nebendaten.kommentare; }
    HP_save();neuZeichnen();showToast('Wiederhergestellt');
  });
}
