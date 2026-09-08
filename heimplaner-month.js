// ═══════════════════════════════════════════════
// HEIMPLANER – Monatskalender und Tagesdetail
//
// Herausgeloest aus heimplaner-app.js (vormals 2381 Zeilen).
// Reine Verschiebung, kein Verhalten geaendert.
// Die Reihenfolge der Skript-Tags in index.html ist bindend – siehe CLAUDE.md.
// ═══════════════════════════════════════════════

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
      ...dayBdaysM.map(b=>'<div class="mc-event mc-birthday">🎂 '+esc(b.name)+'</div>'),
      ...mergeTimelineItems(dayEvents,dayT).map(({kind,data})=>{
        if(kind==='event'){
          const e=data, est=getEventStatus(e.id), esi=est==='wip'?' 🟡':est==='blocked'?' 🔴':'';
          return '<div class="mc-event '+(e.important?'mc-event-important':'e'+(e.who==='shared'?'sh':e.who)+' mc-event-once')+'">'+esc(e.emoji)+' '+esc(e.name)+esi+'</div>';
        }
        const t=data, tst=getStatus(t.id), tsi=tst==='wip'?' 🟡':tst==='blocked'?' 🔴':'';
        return '<div class="mc-event '+(t.important?'mc-event-important':'e'+(t.who==='shared'?'sh':t.who))+'">'+esc(t.emoji)+' '+esc(t.name)+tsi+'</div>';
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
      '<span style="color:'+(e.important?'var(--red)':e.who==='p1'?'var(--p1)':e.who==='p2'?'var(--p2)':'var(--shared)')+'">'+esc(e.emoji)+'</span>'+
      '<div style="flex:1"><div style="font-weight:500">'+esc(e.name)+'</div>'+
      (linkedNote?'<div style="font-size:.7rem;color:var(--muted);margin-top:2px;cursor:pointer" onclick="event.stopPropagation();openEditNote(\''+esc(linkedNote.id)+'\')" title="Verknüpfte Notiz öffnen">🔗 '+
      esc(linkedNote.title||linkedNote.body.slice(0,30)+(linkedNote.body.length>30?'…':''))+'</div>':'')+
      '</div>'+
      (e.time?'<span style="font-size:.7rem;color:var(--muted)">⏰'+esc(fmtTimeRange(e.time,e.timeEnd))+'</span>':'')+
      '<button data-eid="'+esc(e.id)+'" onclick="openEditEvent(this.dataset.eid)" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:.75rem;padding:2px 5px" title="Bearbeiten">✏️</button>'+
      '<button data-eid="'+esc(e.id)+'" onclick="deleteEvent(this.dataset.eid);closeModal()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:.75rem;padding:2px 5px" title="Löschen">✕</button>'+
      '</div>';
    }
    const t=data;
    return '<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-bottom:1px solid var(--border);font-size:.81rem;border-radius:6px;margin-bottom:2px;cursor:pointer" onclick="closeModal();openTaskModal(\''+esc(t.id)+'\',\''+key+'\')">'+
        '<span style="color:'+(t.who==='p1'?'var(--p1)':t.who==='p2'?'var(--p2)':'var(--shared)')+'">'+esc(t.emoji)+'</span>'+
        '<span style="flex:1">'+esc(t.name)+'</span>'+(t.time?'<span style="font-size:.7rem;color:var(--muted)">⏰'+esc(fmtTimeRange(t.time,t.timeEnd))+'</span>':'')+
        (isDone(date,t.id)?'<span style="color:var(--green)">✓</span>':'')+'</div>';
  }).join('') : '<div style="font-size:.78rem;color:var(--muted);padding:6px 0">Keine Termine oder Aufgaben</div>';
  const mealsHtml=['Frühstück','Mittag','Abend'].map(s=>'<div style="display:flex;gap:8px;padding:4px 0;font-size:.79rem">'+
    '<span style="color:var(--muted);width:70px;flex-shrink:0">'+s+'</span>'+
    '<span>'+(meals[s]?esc(meals[s].emoji)+' '+esc(meals[s].name):'—')+'</span></div>').join('');
  showModal('<h3>'+label+'</h3>'+
    '<div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.09em;color:var(--muted);margin:12px 0 6px">Termine &amp; Aufgaben</div>'+itemsHtml+
    '<div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.09em;color:var(--muted);margin:12px 0 6px">Menü</div>'+mealsHtml+
    '<div class="modal-btns" style="justify-content:space-between">'+
    '<button class="mbtn mbtn-cancel" onclick="closeModal()">Schliessen</button>'+

    '<button class="mbtn" style="background:var(--gbg);border:1px solid var(--green);color:var(--green)" onclick="exportDayICS(\''+key+'\');closeModal()">📅 Kalender</button></div>');
}
