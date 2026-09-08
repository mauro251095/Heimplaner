// ═══════════════════════════════════════════════
// HEIMPLANER – Pinnwand / Notizen
//
// Herausgeloest aus heimplaner-app.js (vormals 2381 Zeilen).
// Reine Verschiebung, kein Verhalten geaendert.
// Die Reihenfolge der Skript-Tags in index.html ist bindend – siehe CLAUDE.md.
// ═══════════════════════════════════════════════

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
      (n.title?'<div class="pin-title">'+esc(n.title)+'</div>':'')+
      (n.body?'<div class="pin-body">'+esc(n.body)+'</div>':'')+
      (linked?'<div class="pin-date" style="opacity:.8">🔗 '+esc(linked.emoji)+' '+esc(linked.name)+(dueDate?' · Fällig: '+esc(dueDate):'')+'</div>':'')+
      '</div>';
  }).join('')+'</div>';
}
const NOTE_COLORS=['yellow','blue','pink','green','purple'];
const NOTE_BG_PREVIEW={yellow:'#fde68a',blue:'#bfcfff',pink:'#ffcce5',green:'#bbf7d0',purple:'#ddd6fe'};
function noteColorBtns(selected){return NOTE_COLORS.map(c=>'<span onclick="document.querySelectorAll(\'.nc-btn\').forEach(x=>x.style.borderColor=\'transparent\');this.style.borderColor=\'#fff\';document.getElementById(\'note-color\').value=\''+c+'\'" class="nc-btn" style="display:inline-block;width:22px;height:22px;border-radius:50%;cursor:pointer;background:'+NOTE_BG_PREVIEW[c]+';border:2px solid '+(selected===c?'#fff':'transparent')+';transition:all .15s"></span>').join('');}
function buildNoteTaskSection(linkedEventId) {
  const events = HP.events || [];
  const eventOpts = '<option value="">— kein Termin —</option>' +
    events.map(e => '<option value="' + esc(e.id) + '"' + (e.id === linkedEventId ? ' selected' : '') + '>' +
      esc(e.emoji) + ' ' + esc(e.name) + ' (' + esc(e.date) + ')</option>'
    ).join('');
  return '<div class="modal-row"><label>Bestehenden Termin verknüpfen</label>' +
    '<select class="modal-in" id="note-event-id">' + eventOpts + '</select></div>' +
    '<div class="modal-row"><label style="font-size:.7rem;color:var(--muted)">— oder neuen Termin erstellen —</label>' +
    '<div style="display:flex;gap:6px">' +
    '<input class="modal-in" id="note-new-event-name" placeholder="Terminname…" style="flex:1">' +
    '<input class="modal-in" type="date" id="note-new-event-date" style="width:140px">' +
    '<select class="modal-in" id="note-new-event-who" style="width:110px">' +
    '<option value="p1">'+esc(HP.names.p1)+'</option><option value="p2">'+esc(HP.names.p2)+'</option>'+
    '<option value="shared" selected>Gemeinsam</option>'+
    '</select>' +
    '</div></div>';
}

function openAddNote(){
  showModal('<h3>📌 Neue Notiz</h3><input type="hidden" id="note-color" value="yellow">'+
    '<div class="modal-row"><label>Farbe</label><div style="display:flex;gap:6px">'+noteColorBtns('yellow')+'</div></div>'+
    '<div class="modal-row"><label>Titel</label><input class="modal-in" id="note-title" maxlength="200" placeholder="Titel…"></div>'+
    '<div class="modal-row"><label>Notiz (optional)</label><textarea class="modal-in" id="note-body" rows="4" maxlength="5000" placeholder="Text…" style="resize:vertical;font-family:Inter,sans-serif"></textarea></div>'+
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
    HP.events.push({id:eid,emoji:'📅',name:newEventName,date:newEventDate,time:'',who:newEventWho,important:false,note:'',updatedAt:Date.now()});
    linkedEventId = eid;
    showToast('📅 Termin "' + newEventName + '" erstellt');
  } else if(newEventName && !newEventDate) {
    showToast('Bitte Datum für den neuen Termin wählen'); return;
  }
  HP.notes.unshift({
    id:'n'+Date.now(),
    title, body, color:document.getElementById('note-color')?.value||'yellow',
    linkedEventId: linkedEventId||'',
    created:new Date().toISOString(),
    updatedAt:Date.now()
  });
  HP_save();closeModal();renderPinboard();render();
}

function openEditNote(id){
  const n=(HP.notes||[]).find(x=>x.id===id); if(!n) return;
  showModal('<h3>✏️ Notiz bearbeiten</h3><input type="hidden" id="note-color" value="'+esc(n.color)+'">'+
    '<div class="modal-row"><label>Farbe</label><div style="display:flex;gap:6px">'+noteColorBtns(n.color)+'</div></div>'+
    '<div class="modal-row"><label>Titel</label><input class="modal-in" id="note-title" maxlength="200" value="'+esc(n.title||'')+'"></div>'+
    '<div class="modal-row"><label>Notiz (optional)</label><textarea class="modal-in" id="note-body" rows="4" maxlength="5000" style="resize:vertical;font-family:Inter,sans-serif">'+esc(n.body)+'</textarea></div>'+
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
    HP.events.push({id:eid,emoji:'📅',name:newEventName,date:newEventDate,time:'',who:newEventWho,important:false,note:'',updatedAt:Date.now()});
    linkedEventId = eid;
    showToast('📅 Termin "' + newEventName + '" erstellt');
  } else if(newEventName && !newEventDate) {
    showToast('Bitte Datum für den neuen Termin wählen'); return;
  }
  n.linkedEventId = linkedEventId;
  n.updatedAt = Date.now();
  HP_save();closeModal();renderPinboard();render();
}
function deleteNote(id){
  const n=(HP.notes||[]).find(x=>x.id===id); if(!n) return;
  if(n.linkedEventId && (HP.events||[]).some(e=>e.id===n.linkedEventId)){
    showModal('<h3>🗑 Notiz löschen</h3>'+
      '<p style="font-size:.85rem;color:var(--muted);margin-bottom:14px">Diese Notiz ist mit einem Termin verknüpft. Soll der Termin ebenfalls gelöscht werden?</p>'+
      '<div class="modal-btns" style="justify-content:space-between;flex-wrap:wrap;gap:8px">'+
      '<button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
      '<button class="mbtn" style="background:var(--subtle2);color:var(--text)" onclick="confirmDeleteNote(\''+id+'\',false)">Nur Notiz löschen</button>'+
      '<button class="mbtn" style="background:var(--rbg);border:1px solid var(--red);color:var(--red)" onclick="confirmDeleteNote(\''+id+'\',true)">Notiz &amp; Termin löschen</button>'+
      '</div>');
    return;
  }
  confirmDeleteNote(id,false);
}
function confirmDeleteNote(id,alsoEvent){
  const n=(HP.notes||[]).find(x=>x.id===id);
  if(alsoEvent && n && n.linkedEventId) {
    markDeleted('events', n.linkedEventId);
    HP.events=(HP.events||[]).filter(e=>e.id!==n.linkedEventId);
    if(HP.eventStatus) delete HP.eventStatus[n.linkedEventId];
    if(HP.eventNotes) delete HP.eventNotes[n.linkedEventId];
    if(HP.eventComments) delete HP.eventComments[n.linkedEventId];
  }
  markDeleted('notes', id);
  HP.notes=(HP.notes||[]).filter(x=>x.id!==id);
  HP_save();closeModal();renderPinboard();render();
  if(typeof renderMonth==='function')renderMonth();
  showToast(alsoEvent?'🗑 Notiz & Termin gelöscht':'🗑 Notiz gelöscht');
}


// ═══════════════════════════════════════════════
// EINMALIGE TERMINE - Event Management
// ═══════════════════════════════════════════════
