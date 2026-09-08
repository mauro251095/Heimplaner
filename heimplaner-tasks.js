// ═══════════════════════════════════════════════
// HEIMPLANER – Aufgabenverwaltung, Emoji-Auswahl, Aufgaben-Modal
//
// Herausgeloest aus heimplaner-app.js (vormals 2381 Zeilen).
// Reine Verschiebung, kein Verhalten geaendert.
// Die Reihenfolge der Skript-Tags in index.html ist bindend – siehe CLAUDE.md.
// ═══════════════════════════════════════════════

// ── MANAGE ────────────────────────────────────
function renderManage() {
  ['p1','p2','shared'].forEach(who=>{
    const el=document.getElementById('tm-'+who); if(!el) return; el.innerHTML='';
    HP.tasks[who].forEach(task=>{
      const card=document.createElement('div'); card.className='tm-card';
      const dps=DS.map((d,i)=>'<span class="dp '+(task.days.includes(i)?'o'+(who==='shared'?'sh':who):'')+'" data-tid="'+esc(task.id)+'" data-who="'+who+'" data-day="'+i+'">'+d+'</span>').join('');
      card.innerHTML='<div class="tm-top"><span class="tm-name">'+esc(task.emoji)+' '+esc(task.name)+(task.time?' <span style="font-size:.65rem;color:var(--muted)">⏰'+esc(fmtTimeRange(task.time,task.timeEnd))+'</span>':'')+'</span>'+
        '<div class="tm-acts"><button class="wichtig-btn'+(task.important?' on':'')+'" data-tid="'+esc(task.id)+'" data-who="'+who+'" title="Wichtig">!</button>'+
        '<button class="tm-del" data-tid="'+esc(task.id)+'" data-who="'+who+'">✕</button></div></div>'+
        '<div class="day-pills">'+dps+'</div>';
      el.appendChild(card);
    });
    el.querySelectorAll('.dp').forEach(p=>{p.addEventListener('click',()=>{
      const t=HP.tasks[p.dataset.who].find(t=>t.id===p.dataset.tid); if(!t) return;
      const i=t.days.indexOf(+p.dataset.day); if(i>-1)t.days.splice(i,1); else t.days.push(+p.dataset.day);
      t.updatedAt=Date.now();
      HP_save();render();
    });});
    el.querySelectorAll('.wichtig-btn').forEach(b=>{b.addEventListener('click',()=>{
      const t=HP.tasks[b.dataset.who].find(t=>t.id===b.dataset.tid); if(t){t.important=!t.important;t.updatedAt=Date.now();HP_save();render();}
    });});
    el.querySelectorAll('.tm-del').forEach(b=>{b.addEventListener('click',()=>{
      markDeleted('tasks', b.dataset.tid);
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
      '<span style="font-size:1.1rem">'+esc(e.emoji)+'</span>'+
      '<div style="flex:1"><div style="font-size:.82rem;font-weight:500">'+esc(e.name)+'</div>'+
      '<div style="font-size:.7rem;color:var(--muted)">'+esc(e.date)+(e.time?' · ⏰'+esc(fmtTimeRange(e.time,e.timeEnd)):'')+'</div></div>'+
      '<span style="font-size:.7rem;color:'+whoColor+';font-weight:500">'+esc(whoLabel)+'</span>'+
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
      '<span style="font-size:1.1rem">'+esc(e.emoji)+'</span>'+
      '<div style="flex:1"><div style="font-size:.82rem;font-weight:500">'+esc(e.name)+'</div>'+
      '<div style="font-size:.7rem;color:var(--muted)">🔁 '+esc(recurLabel(e.recur))+' · Fällig: '+esc(e.date)+(e.time?' · ⏰'+esc(fmtTimeRange(e.time,e.timeEnd)):'')+'</div></div>'+
      '<span style="font-size:.7rem;color:'+whoColor+';font-weight:500">'+esc(whoLabel)+'</span>'+
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
    '<h3>✏️ ' + esc(label) + ' anpassen</h3>' +
    '<input type="hidden" id="rename-color" value="' + currentColor + '">' +
    '<div class="modal-row"><label>Name</label>' +
    '<input class="modal-in" id="rename-input" maxlength="40" value="' + esc(current) + '" style="border-color:' + currentColor + '"></div>' +
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
  HP.tasks[who].push({id:tid,emoji,name,days,prio,status:'open',time,timeEnd,reminder,updatedAt:Date.now()});
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
  showModal('<h3>'+esc(task.name)+'</h3>'+
    '<div class="modal-row"><label>Emoji</label>'+
    '<div style="display:flex;gap:7px">'+emojiPickerBtnHTML('tm-emoji',task.emoji)+'</div>'+
    emojiPickerMenuHTML('tm-emoji')+
    '</div>'+
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
    '<input class="modal-in" id="block-note" maxlength="300" placeholder="z.B. Blumenerde fehlt…" value="'+esc(note)+'">'+
    '<button class="mbtn mbtn-confirm" style="margin-top:8px;width:100%;background:var(--shared)" onclick="addBlockedToShop(\''+tid+'\')">🛒 Zur Einkaufsliste</button></div>'+
    '<div class="modal-row" id="comment-section">'+
    '<label>💬 Kommentar</label>'+
    '<textarea class="modal-in" id="task-comment" rows="2" placeholder="Notiz zum Task…" style="resize:vertical;font-family:Inter,sans-serif;font-size:.79rem">'+(((HP.taskComments||{})[tid]||{})[dateKey]||'')+'</textarea>'+
    '</div>'+
    '<div class="modal-row" style="display:flex;flex-direction:column;gap:6px;background:var(--rbg);border:1px solid var(--red);border-radius:var(--rs);padding:10px">'+
    (dateKey?'<button class="mbtn" style="width:100%;background:none;border:1px solid var(--red);color:var(--red)" onclick="deleteTaskOccurrence(\''+tid+'\',\''+dateKey+'\')">🗑 Nur den Termin am '+occLabel+' aus der Serie löschen</button>':'')+
    '<button class="mbtn" style="width:100%;background:var(--red);border:1px solid var(--red);color:#fff" onclick="deleteTaskSeries(\''+tid+'\')">🗑 Ganze Serie löschen</button>'+
    '</div>'+
    '<div class="modal-btns"><button class="mbtn mbtn-cancel" onclick="closeModal()">Schliessen</button>'+
    '<button class="mbtn mbtn-confirm" onclick="saveTaskDetails(\''+tid+'\',\''+dateKey+'\');closeModal()">Speichern</button></div>');
}
function deleteTaskOccurrence(tid,dateKey) {
  const task=allTasks().find(t=>t.id===tid); if(!task) return;
  const label=new Date(dateKey+'T12:00:00').toLocaleDateString('de-CH',{day:'numeric',month:'short'});
  if(!confirm('Nur "'+task.name+'" am '+label+' löschen?\nVergangene und zukünftige Termine dieser Serie bleiben bestehen.')) return;
  if(!HP.taskExceptions) HP.taskExceptions={};
  if(!HP.taskExceptions[tid]) HP.taskExceptions[tid]={};
  HP.taskExceptions[tid][dateKey]=true;
  if(HP.taskComments && HP.taskComments[tid]) {
    delete HP.taskComments[tid][dateKey];
    if(!Object.keys(HP.taskComments[tid]).length) delete HP.taskComments[tid];
  }
  HP_save();closeModal();render();
  if(typeof renderMonth==='function') renderMonth();
  showToast('🗑 Einzelner Termin entfernt');
}
function deleteTaskSeries(tid) {
  const task=allTasks().find(t=>t.id===tid); if(!task) return;
  if(!confirm('Die komplette Serie "'+task.name+'" (alle Wochentage) löschen?\nDies kann nicht rückgängig gemacht werden.')) return;
  markDeleted('tasks', tid);
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
function saveTaskDetails(tid,dateKey='') {
  const el=document.getElementById('block-note'); if(el) HP.taskNotes[tid]=el.value;
  const comment=document.getElementById('task-comment')?.value||'';
  if(!HP.taskComments) HP.taskComments={};
  if(!HP.taskComments[tid]) HP.taskComments[tid]={};
  if(comment) HP.taskComments[tid][dateKey]=comment;
  else delete HP.taskComments[tid][dateKey];
  if(!Object.keys(HP.taskComments[tid]).length) delete HP.taskComments[tid];
  const t=document.getElementById('tm-time')?.value||'', r=document.getElementById('tm-rem')?.value||'';
  const te=document.getElementById('tm-time-end')?.value||'';
  const imp=document.getElementById('tm-important')?.checked||false;
  const emoji=document.getElementById('tm-emoji')?.value||'⭐';
  ['p1','p2','shared'].forEach(w=>{const task=HP.tasks[w].find(x=>x.id===tid);if(task){task.time=t;task.timeEnd=te;task.reminder=r;task.important=imp;task.emoji=emoji;task.updatedAt=Date.now();}});
  HP_save();
  render();
}
function addBlockedToShop(tid) {
  const task=allTasks().find(t=>t.id===tid);
  const note=document.getElementById('block-note')?.value||'';
  HP.taskNotes[tid]=note; HP_save(); closeModal();
  const opts=CATS.map(c=>'<option value="'+c+'">'+catEmoji(c)+' '+c+'</option>').join('');
  showModal('<h3>🛒 Zur Einkaufsliste</h3>'+
    '<div class="modal-row"><label>Artikel</label><input class="modal-in" id="bl-name" maxlength="200" value="'+esc(note)+'" placeholder="z.B. Blumenerde"></div>'+
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
