// ═══════════════════════════════════════════════
// HEIMPLANER – Einmalige Termine und Haushaltsaufgaben
//
// Herausgeloest aus heimplaner-app.js (vormals 2381 Zeilen).
// Reine Verschiebung, kein Verhalten geaendert.
// Die Reihenfolge der Skript-Tags in index.html ist bindend – siehe CLAUDE.md.
// ═══════════════════════════════════════════════


const EVENT_REMINDER_OPTS=[['','Standard (15 Min vorher)'],['off','Keine'],['0','Zur Uhrzeit'],['5','5 Min vorher'],['15','15 Min vorher'],['30','30 Min vorher'],['60','1 Std vorher'],['240','4 Std vorher'],['480','8 Std vorher'],['720','12 Std vorher'],['1440','1 Tag vorher'],['10080','1 Woche vorher']];
function eventReminderOptions(selected) {
  return EVENT_REMINDER_OPTS.map(([v,l])=>'<option value="'+v+'"'+((selected||'')===v?' selected':'')+'>'+l+'</option>').join('');
}

function toggleChoreWeekdayRow() {
  const unit=(document.getElementById('ev-recur')?.value||'').split(':')[0];
  const cb=document.getElementById('ev-recur-weekday');
  const cbRow=document.getElementById('ev-recur-weekday-cb-row');
  const row=document.getElementById('ev-recur-weekday-row');
  if(unit==='weeks') {
    if(cb) cb.checked=false;
    if(cbRow) cbRow.style.display='none';
    if(row) row.style.display='none';
  } else {
    if(cbRow) cbRow.style.display='';
    if(row) row.style.display=(cb&&cb.checked)?'flex':'none';
  }
}
function choreRecurRow(recur) {
  const unit=recur?recur.unit:'months', value=recur?recur.value:3, key=unit+':'+value;
  const hasWeekday=!!(recur && recur.weekday!=null && recur.nth!=null);
  const weekday=hasWeekday?recur.weekday:0, nth=hasWeekday?recur.nth:-1;
  const NTH_OPTS=[[1,'1.'],[2,'2.'],[3,'3.'],[4,'4.'],[-1,'letzter']];
  return '<div class="modal-row"><label>Wiederholung</label>'+
    '<select class="modal-in" id="ev-recur" onchange="toggleChoreWeekdayRow()">'+
    CHORE_INTERVALS.map(([k,l])=>'<option value="'+k+'"'+(key===k?' selected':'')+'>'+l+'</option>').join('')+
    '</select></div>'+
    '<div class="modal-row" id="ev-recur-weekday-cb-row" style="display:'+(unit==='weeks'?'none':'')+'"><label style="display:flex;align-items:center;gap:8px;cursor:pointer">'+
    '<input type="checkbox" id="ev-recur-weekday"'+(hasWeekday?' checked':'')+' onchange="toggleChoreWeekdayRow()" style="accent-color:var(--p1);width:16px;height:16px">'+
    '<span style="font-size:.82rem">Auf bestimmten Wochentag legen (z.B. letzter Sonntag)</span></label></div>'+
    '<div class="modal-row" id="ev-recur-weekday-row" style="display:'+(hasWeekday?'flex':'none')+';gap:8px">'+
    '<div style="flex:1"><label>Wochentag</label><select class="modal-in" id="ev-recur-wd">'+
    DL.map((l,i)=>'<option value="'+i+'"'+(weekday===i?' selected':'')+'>'+l+'</option>').join('')+
    '</select></div>'+
    '<div style="flex:1"><label>Welcher</label><select class="modal-in" id="ev-recur-nth">'+
    NTH_OPTS.map(([v,l])=>'<option value="'+v+'"'+(nth===v?' selected':'')+'>'+l+'</option>').join('')+
    '</select></div></div>';
}

function openAddEvent(prefillDate='', chore=false) {
  showModal(
    '<h3>'+(chore?'🧹 Neue Haushaltsaufgabe':'📅 Neuer Termin')+'</h3>'+
    '<input type="hidden" id="ev-chore" value="'+(chore?'1':'0')+'">'+
    '<div class="modal-row"><label>Emoji & Name</label>'+
    '<div style="display:flex;gap:7px">'+
    emojiPickerBtnHTML('ev-emoji',chore?'🧹':'📅')+
    '<input class="modal-in" id="ev-name" maxlength="200" placeholder="'+(chore?'z.B. Fenster putzen…':'z.B. Arzttermin, Abendessen…')+'" style="flex:1"></div>'+
    emojiPickerMenuHTML('ev-emoji')+
    '</div>'+
    '<div class="modal-row"><label>'+(chore?'Nächste Fälligkeit':'Datum')+'</label>'+
    '<input class="modal-in" type="date" id="ev-date" value="'+prefillDate+'"></div>'+
    (chore?choreRecurRow(null):'')+
    '<div class="modal-row"><div style="display:flex;gap:8px">'+
    '<div style="flex:1"><label>Von (optional)</label><input class="modal-in" type="time" id="ev-time"></div>'+
    '<div style="flex:1"><label>Bis (optional)</label><input class="modal-in" type="time" id="ev-time-end"></div>'+
    '</div></div>'+
    '<div class="modal-row"><label>Für wen</label>'+
    '<select class="modal-in" id="ev-who">'+
    '<option value="p1">'+esc(HP.names.p1)+'</option>'+
    '<option value="p2">'+esc(HP.names.p2)+'</option>'+
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
  setTimeout(()=>{document.getElementById('ev-name')?.focus(); if(chore) toggleChoreWeekdayRow();},60);
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
  const ev={id:'ev'+Date.now(),emoji,name,date,time,timeEnd,who,reminder,important,note:'',updatedAt:Date.now()};
  if(isChore){
    const [unit,value]=(document.getElementById('ev-recur')?.value||'months:3').split(':');
    ev.chore=true; ev.recur={unit,value:parseInt(value)};
    if(unit!=='weeks' && document.getElementById('ev-recur-weekday')?.checked){
      ev.recur.weekday=parseInt(document.getElementById('ev-recur-wd')?.value||'0');
      ev.recur.nth=parseInt(document.getElementById('ev-recur-nth')?.value||'-1');
    }
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
    '<input class="modal-in" id="ev-name" maxlength="200" value="'+esc(e.name)+'" style="flex:1"></div>'+
    emojiPickerMenuHTML('ev-emoji')+
    '</div>'+
    '<div class="modal-row"><label>'+(chore?'Nächste Fälligkeit':'Datum')+'</label>'+
    '<input class="modal-in" type="date" id="ev-date" value="'+esc(e.date)+'"></div>'+
    (chore?choreRecurRow(e.recur||null):'')+
    '<div class="modal-row"><div style="display:flex;gap:8px">'+
    '<div style="flex:1"><label>Von (optional)</label><input class="modal-in" type="time" id="ev-time" value="'+(e.time||'')+'"></div>'+
    '<div style="flex:1"><label>Bis (optional)</label><input class="modal-in" type="time" id="ev-time-end" value="'+(e.timeEnd||'')+'"></div>'+
    '</div></div>'+
    '<div class="modal-row"><label>Für wen</label>'+
    '<select class="modal-in" id="ev-who">'+
    '<option value="p1"'+(e.who==='p1'?' selected':'')+'>'+esc(HP.names.p1)+'</option>'+
    '<option value="p2"'+(e.who==='p2'?' selected':'')+'>'+esc(HP.names.p2)+'</option>'+
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
  if(chore) setTimeout(toggleChoreWeekdayRow,60);
}

function openEventModal(id) {
  const e=(HP.events||[]).find(x=>x.id===id); if(!e) return;
  const st=getEventStatus(id), note=(HP.eventNotes||{})[id]||'';
  const stBtns=[['open','⬜ Offen'],['wip','🟡 In Arbeit'],['blocked','🔴 Blockiert'],['done','✅ Erledigt']]
    .map(([s,l])=>'<button class="st-btn'+(st===s?' sel-'+s:'')+'" onclick="setEventStatus(\''+id+'\',\''+s+'\',this)">'+l+'</button>').join('');
  showModal('<h3>'+esc(e.emoji)+' '+esc(e.name)+'</h3>'+
    '<div class="modal-row"><label>Status</label><div class="st-btns">'+stBtns+'</div></div>'+
    '<div class="modal-row"><label style="display:flex;align-items:center;gap:8px;cursor:pointer">'+
    '<input type="checkbox" id="ev-important"'+(e.important?' checked':'')+' style="accent-color:var(--red);width:16px;height:16px">'+
    '<span style="font-size:.82rem;font-weight:500;color:var(--red)">🚨 Wichtig — Termin wird rot markiert</span>'+
    '</label></div>'+
    '<div class="modal-row" id="ev-block-sec" style="'+(st!=='blocked'?'display:none':'')+' ">'+
    '<label>Was fehlt / warum blockiert?</label>'+
    '<input class="modal-in" id="ev-block-note" maxlength="300" placeholder="z.B. Termin fehlt noch…" value="'+esc(note)+'">'+
    '<button class="mbtn mbtn-confirm" style="margin-top:8px;width:100%;background:var(--shared)" onclick="addBlockedEventToShop(\''+id+'\')">🛒 Zur Einkaufsliste</button></div>'+
    '<div class="modal-row" id="ev-comment-section">'+
    '<label>💬 Kommentar</label>'+
    '<textarea class="modal-in" id="ev-comment" rows="2" placeholder="Notiz zum Termin…" style="resize:vertical;font-family:Inter,sans-serif;font-size:.79rem">'+esc((HP.eventComments||{})[id]||'')+'</textarea>'+
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
  e.updatedAt=Date.now();
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
    e.date=advanceDateKey(e.date,e.recur.unit,e.recur.value,e.recur.weekday,e.recur.nth);
    e.updatedAt=Date.now();
    // Status, Blockiert-Notiz und Kommentar gehören zum jetzigen Fälligkeitstermin —
    // sonst taucht z.B. ein alter Blockiert-Grund beim nächsten Termin wieder auf.
    if(HP.eventStatus) delete HP.eventStatus[id];
    if(HP.eventNotes) delete HP.eventNotes[id];
    if(HP.eventComments) delete HP.eventComments[id];
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
    '<div class="modal-row"><label>Artikel</label><input class="modal-in" id="bl-name" maxlength="200" value="'+esc(note)+'" placeholder="z.B. Blumenerde"></div>'+
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
    if(unit!=='weeks' && document.getElementById('ev-recur-weekday')?.checked){
      e.recur.weekday=parseInt(document.getElementById('ev-recur-wd')?.value||'0');
      e.recur.nth=parseInt(document.getElementById('ev-recur-nth')?.value||'-1');
    }
  }
  e.updatedAt=Date.now();
  HP_save();closeModal();render();
  if(typeof renderMonth==='function')renderMonth();
  if(typeof renderEventsList==='function') renderEventsList();
  if(typeof renderHouseholdList==='function') renderHouseholdList();
  showToast(e.chore?'Haushaltsaufgabe gespeichert':'Termin gespeichert');
}
