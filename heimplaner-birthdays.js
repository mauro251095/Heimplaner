// ═══════════════════════════════════════════════
// HEIMPLANER – Geburtstage
//
// Herausgeloest aus heimplaner-app.js (vormals 2381 Zeilen).
// Reine Verschiebung, kein Verhalten geaendert.
// Die Reihenfolge der Skript-Tags in index.html ist bindend – siehe CLAUDE.md.
// ═══════════════════════════════════════════════


// ═══════════════════════════════════════════════
// GEBURTSTAGE
// ═══════════════════════════════════════════════

function renderBirthdayList() {
  const el = document.getElementById('birthday-list');
  const el2b = document.getElementById('birthday-list-2');
  if(!el && !el2b) return;
  // Neu berechnet bei jedem Rendern (nicht nur beim Speichern), damit die
  // Liste mit der Zeit "mitwandert" (z.B. beim Öffnen der Ansicht am Folgetag).
  const bdays = (HP.birthdays||[]).map(b=>{
    const nextDate = getNextBirthday(b.date);
    const daysLeft = Math.round((new Date(nextDate+'T12:00:00')-new Date())/86400000);
    return {...b, nextDate, daysLeft};
  }).sort((a,b)=>a.daysLeft-b.daysLeft);
  if(!bdays.length){
    const emptyHtml='<div style="font-size:.78rem;color:var(--muted);padding:8px 0">Noch keine Geburtstage eingetragen.</div>';
    if(el) el.innerHTML=emptyHtml;
    if(el2b) el2b.innerHTML=emptyHtml;
    return;
  }
  const html = bdays.map(b=>{
    // Alter, das die Person am NÄCHSTEN Geburtstag erreicht (Jahr von nextDate, nicht das aktuelle Jahr).
    const bdAge=b.year?parseInt(b.nextDate.slice(0,4))-parseInt(b.year):'';
    const isToday2 = b.daysLeft<=0&&b.daysLeft>-1;
    const isSoon = b.daysLeft<=7&&b.daysLeft>=0;
    const [,mm,dd]=b.date.split('-');
    return '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--panel);border:1px solid var(--border);border-radius:var(--rs);margin-bottom:6px'+(isToday2?';border-color:var(--today)':isSoon?';border-color:var(--amber)':'')+'">'+
      '<span style="font-size:1.1rem">🎂</span>'+
      '<div style="flex:1">'+
        '<div style="font-size:.82rem;font-weight:500">'+esc(b.name)+'</div>'+
        '<div style="font-size:.7rem;color:var(--muted)">'+esc(dd)+'.'+esc(mm)+'.'+(bdAge!==''?' (wird '+bdAge+')':'')+'</div>'+
      '</div>'+
      '<span style="font-size:.72rem;font-weight:600;color:'+(isToday2?'var(--today)':isSoon?'var(--amber)':'var(--muted)')+'">'+
        (isToday2?'🎉 Heute!':b.daysLeft===1?'Morgen':'in '+b.daysLeft+' Tagen')+
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
    '<input class="modal-in" id="bd-name" maxlength="200" placeholder="z.B. Oma Rosina"></div>'+
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
  HP.birthdays.push({id:'bd'+Date.now(),name,date:'0000-'+month+'-'+day,year,updatedAt:Date.now()});
  HP_save();closeModal();renderBirthdayList();
  showToast('🎂 '+name+' gespeichert');
}

function openEditBirthday(id) {
  const b=(HP.birthdays||[]).find(x=>x.id===id); if(!b) return;
  const [,m,d]=b.date.split('-');
  showModal(
    '<h3>✏️ Geburtstag bearbeiten</h3>'+
    '<div class="modal-row"><label>Name</label>'+
    '<input class="modal-in" id="bd-name" maxlength="200" value="'+esc(b.name)+'"></div>'+
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
  b.updatedAt=Date.now();
  HP_save();closeModal();renderBirthdayList();
  showToast('Geburtstag gespeichert');
}

function deleteBirthday(id) {
  const weg=(HP.birthdays||[]).find(x=>x.id===id);
  markDeleted('birthdays', id);
  HP.birthdays=(HP.birthdays||[]).filter(x=>x.id!==id);
  HP_save();closeModal();renderBirthdayList();
  showUndoToast('Geburtstag gelöscht', ()=>{
    if(!weg) return;
    unmarkDeleted('birthdays',id); weg.updatedAt=Date.now(); HP.birthdays.push(weg);
    HP_save();renderBirthdayList();render();showToast('Wiederhergestellt');
  });
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
      '🎂 <b>'+esc(b.name)+'</b> hat heute Geburtstag!'+(age?' <span style="color:var(--muted)">('+age+' Jahre)</span>':'')+
    '</div>';
  }).join('');
}
