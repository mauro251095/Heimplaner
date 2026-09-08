// ═══════════════════════════════════════════════
// HEIMPLANER – Budget: Buchungen, Limits, Jahresstatistik
//
// Herausgeloest aus heimplaner-app.js (vormals 2381 Zeilen).
// Reine Verschiebung, kein Verhalten geaendert.
// Die Reihenfolge der Skript-Tags in index.html ist bindend – siehe CLAUDE.md.
// ═══════════════════════════════════════════════

// ── BUDGET ────────────────────────────────────
let budgetMonthOffset=0, budgetTab='p1';

function budgetDefaultDateForOffset(off) {
  if (off===0) return dk(new Date());
  const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()+off);
  return dk(d);
}

function initBudgetView() {
  syncNames();
  const catSel=document.getElementById('bg-add-cat');
  if (catSel && !catSel.options.length) {
    catSel.innerHTML=BUDGET_CATS.map(c=>'<option value="'+c+'">'+BUDGET_CAT_EMOJI[c]+' '+c+'</option>').join('');
  }
  const personSel=document.getElementById('bg-add-person');
  if (personSel) personSel.value=loggedInPersonKey();
  const dateInput=document.getElementById('bg-add-date');
  if (dateInput) dateInput.value=budgetDefaultDateForOffset(budgetMonthOffset);
  setBudgetTab(loggedInPersonKey());
  renderBudget();
}

function budgetMonthShift(delta) {
  budgetMonthOffset+=delta;
  const dateInput=document.getElementById('bg-add-date');
  if (dateInput) dateInput.value=budgetDefaultDateForOffset(budgetMonthOffset);
  renderBudget();
}

function setBudgetTab(p) {
  budgetTab=p;
  document.querySelectorAll('.budget-tab').forEach(b=>b.classList.toggle('active',b.dataset.p===p));
  document.querySelectorAll('.budget-col').forEach(c=>c.classList.toggle('bcol-active',c.dataset.p===p));
}

function toggleBudgetCard(el) { el.classList.toggle('open'); }

function addBudgetEntry() {
  const person=document.getElementById('bg-add-person')?.value;
  const cat=document.getElementById('bg-add-cat')?.value;
  const comment=document.getElementById('bg-add-comment')?.value.trim()||'';
  const amountRaw=parseFloat((document.getElementById('bg-add-amount')?.value||'').replace(',','.'));
  const date=document.getElementById('bg-add-date')?.value||dk(new Date());
  if (!cat) { showToast('Bitte Kategorie wählen'); return; }
  if (!amountRaw || amountRaw<=0) { showToast('Bitte gültigen Betrag eingeben'); return; }
  if (!HP.budgetEntries) HP.budgetEntries=[];
  if (person==='shared') {
    const total=Math.round(amountRaw*100)/100;
    const half1=Math.round(total*100/2)/100;
    const half2=Math.round((total-half1)*100)/100;
    const groupId='bgs'+Date.now()+Math.random().toString(36).slice(2,7);
    HP.budgetEntries.push(mkBudgetEntry('p1',cat,half1,comment,date,groupId));
    HP.budgetEntries.push(mkBudgetEntry('p2',cat,half2,comment,date,groupId));
  } else {
    HP.budgetEntries.push(mkBudgetEntry(person,cat,Math.round(amountRaw*100)/100,comment,date,null));
  }
  HP_save();
  const amtEl=document.getElementById('bg-add-amount'); if(amtEl) amtEl.value='';
  const cmtEl=document.getElementById('bg-add-comment'); if(cmtEl) cmtEl.value='';
  renderBudget();
  showToast('Buchung hinzugefügt');
}

function mkBudgetEntry(person,cat,amount,comment,date,groupId) {
  return {id:'be'+Date.now()+Math.random().toString(36).slice(2,7),person,cat,amount,comment,date,sharedGroupId:groupId,updatedAt:Date.now()};
}

function deleteBudgetEntry(id) {
  const entry=(HP.budgetEntries||[]).find(e=>e.id===id); if(!entry) return;
  // Bei einer gemeinsamen Buchung hängen zwei Einträge zusammen (je eine
  // Hälfte pro Person) — beide müssen zusammen zurückkommen.
  let weg;
  if (entry.sharedGroupId) {
    weg=HP.budgetEntries.filter(e=>e.sharedGroupId===entry.sharedGroupId);
    weg.forEach(e=>markDeleted('budgetEntries',e.id));
    HP.budgetEntries=HP.budgetEntries.filter(e=>e.sharedGroupId!==entry.sharedGroupId);
  } else {
    weg=[entry];
    markDeleted('budgetEntries', id);
    HP.budgetEntries=HP.budgetEntries.filter(e=>e.id!==id);
  }
  HP_save(); closeModal(); renderBudget();
  showUndoToast(weg.length>1?'Gemeinsame Buchung gelöscht':'Buchung gelöscht', ()=>{
    weg.forEach(e=>{ unmarkDeleted('budgetEntries',e.id); e.updatedAt=Date.now(); HP.budgetEntries.push(e); });
    HP_save();renderBudget();showToast('Wiederhergestellt');
  });
}

function openEditBudgetEntry(id) {
  const entry=(HP.budgetEntries||[]).find(e=>e.id===id); if(!entry) return;
  const isShared=!!entry.sharedGroupId;
  const totalAmount=isShared
    ? HP.budgetEntries.filter(e=>e.sharedGroupId===entry.sharedGroupId).reduce((s,e)=>s+e.amount,0)
    : entry.amount;
  const opts=BUDGET_CATS.map(c=>'<option value="'+c+'"'+(entry.cat===c?' selected':'')+'>'+BUDGET_CAT_EMOJI[c]+' '+c+'</option>').join('');
  showModal('<h3>✏️ Buchung bearbeiten</h3>'+
    (isShared?'<div style="font-size:.75rem;color:var(--muted);margin-bottom:12px">Gemeinsame Buchung – der Betrag wird automatisch 50/50 zwischen Mauro &amp; Melissa aufgeteilt.</div>':'')+
    '<div class="modal-row"><label>Kategorie</label><select class="modal-in" id="be-cat">'+opts+'</select></div>'+
    '<div class="modal-row"><label>Kommentar</label><input class="modal-in" id="be-comment" maxlength="300" value="'+esc(entry.comment||'')+'"></div>'+
    '<div class="modal-row"><div style="display:flex;gap:8px">'+
    '<div style="flex:1"><label>Betrag (CHF)</label><input class="modal-in" id="be-amount" type="text" inputmode="decimal" value="'+totalAmount+'"></div>'+
    '<div style="flex:1"><label>Datum</label><input class="modal-in" id="be-date" type="date" value="'+entry.date+'"></div></div></div>'+
    '<div class="modal-btns" style="justify-content:space-between">'+
    '<button class="mbtn" style="background:var(--rbg);border:1px solid var(--red);color:var(--red)" onclick="deleteBudgetEntry(\''+id+'\')">🗑 Löschen</button>'+
    '<button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
    '<button class="mbtn mbtn-confirm" onclick="saveEditBudgetEntry(\''+id+'\')">✓ Speichern</button></div>');
}

function saveEditBudgetEntry(id) {
  const entry=(HP.budgetEntries||[]).find(e=>e.id===id); if(!entry){closeModal();return;}
  const cat=document.getElementById('be-cat')?.value||entry.cat;
  const comment=document.getElementById('be-comment')?.value.trim()||'';
  const date=document.getElementById('be-date')?.value||entry.date;
  const amount=parseFloat((document.getElementById('be-amount')?.value||'').replace(',','.'));
  if (!amount || amount<=0) { showToast('Bitte gültigen Betrag eingeben'); return; }
  if (entry.sharedGroupId) {
    const linked=HP.budgetEntries.filter(e=>e.sharedGroupId===entry.sharedGroupId);
    const total=Math.round(amount*100)/100, half1=Math.round(total*100/2)/100, half2=Math.round((total-half1)*100)/100;
    linked.forEach((e,i)=>{ e.cat=cat; e.comment=comment; e.date=date; e.amount=i===0?half1:half2; e.updatedAt=Date.now(); });
  } else {
    entry.cat=cat; entry.comment=comment; entry.date=date; entry.amount=Math.round(amount*100)/100; entry.updatedAt=Date.now();
  }
  HP_save(); closeModal(); renderBudget(); showToast('Buchung aktualisiert');
}

function openBudgetLimitsModal(person) {
  if (!HP.budgetLimits) HP.budgetLimits={p1:{},p2:{}};
  if (!HP.budgetLimits[person]) HP.budgetLimits[person]={};
  const rows=BUDGET_CATS.map(cat=>
    '<div class="modal-row"><label>'+BUDGET_CAT_EMOJI[cat]+' '+cat+'</label>'+
    '<input class="modal-in" type="number" step="1" min="0" value="'+budgetLimit(person,cat)+'" '+
    'oninput="updateBudgetLimit(\''+person+'\',\''+cat+'\',this.value)"></div>'
  ).join('');
  showModal('<h3>⚙️ Monatslimits – '+HP.names[person]+'</h3>'+
    '<div style="font-size:.75rem;color:var(--muted);margin-bottom:12px">Änderungen wirken sofort für den laufenden Monat, CHF.</div>'+
    rows+
    '<div class="modal-btns"><button class="mbtn mbtn-confirm" onclick="closeModal()">✓ Fertig</button></div>');
}

function updateBudgetLimit(person,cat,val) {
  if (!HP.budgetLimits) HP.budgetLimits={p1:{},p2:{}};
  if (!HP.budgetLimits[person]) HP.budgetLimits[person]={};
  HP.budgetLimits[person][cat]=parseFloat(val)||0;
  HP_save(); renderBudget();
}

function openBudgetYearStats(person) {
  const mk=currentMonthKey(budgetMonthOffset);
  const year=mk.split('-')[0];
  const monthShort=['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
  let rows='<tr><th>Kategorie</th>'+monthShort.map(m=>'<th>'+m+'</th>').join('')+'<th>Ist</th><th>Soll</th></tr>';
  let yearIst=0, yearSoll=0;
  BUDGET_CATS.forEach(cat=>{
    const limit=budgetLimit(person,cat), soll=limit*12;
    let ist=0;
    const cells=monthShort.map((_,mi)=>{
      const mkey=year+'-'+String(mi+1).padStart(2,'0');
      const sum=(HP.budgetEntries||[]).filter(e=>e.person===person&&e.cat===cat&&monthKey(e.date)===mkey).reduce((s,e)=>s+e.amount,0);
      ist+=sum;
      return '<td style="color:var(--muted)">'+(sum?fmtCHF(sum):'–')+'</td>';
    }).join('');
    yearIst+=ist; yearSoll+=soll;
    rows+='<tr><td>'+BUDGET_CAT_EMOJI[cat]+' '+cat+'</td>'+cells+
      '<td style="font-weight:600">'+fmtCHF(ist)+'</td><td style="color:var(--muted)">'+(soll?fmtCHF(soll):'–')+'</td></tr>';
  });
  rows+='<tr class="byt-total"><td>Total</td>'+monthShort.map(()=>'<td></td>').join('')+
    '<td>'+fmtCHF(yearIst)+'</td><td>'+(yearSoll?fmtCHF(yearSoll):'–')+'</td></tr>';
  showModal('<h3>📊 Jahresstatistik '+year+' – '+esc(HP.names[person])+'</h3>'+
    '<div style="overflow-x:auto"><table class="budget-yearstats-table">'+rows+'</table></div>'+
    '<div class="modal-btns"><button class="mbtn mbtn-cancel" onclick="closeModal()">Schliessen</button></div>', true);
}

function renderBudgetColumn(person, mk) {
  const col=document.getElementById('budget-col-'+person); if(!col) return;
  const name=HP.names[person];
  const entries=budgetEntriesFor(person,mk);
  let cardsHtml='', highestPct=-1, highestCat='', totalIst=0, totalLimit=0;
  BUDGET_CATS.forEach(cat=>{
    const catEntries=entries.filter(e=>e.cat===cat).sort((a,b)=>b.date.localeCompare(a.date)||b.updatedAt-a.updatedAt);
    const ist=catEntries.reduce((s,e)=>s+e.amount,0);
    const limit=budgetLimit(person,cat);
    totalIst+=ist; totalLimit+=limit;
    const pct=limit>0?Math.round(ist/limit*100):0;
    if (limit>0 && pct>highestPct) { highestPct=pct; highestCat=cat; }
    const barClass=limit<=0?'nolimit':pct>100?'over':pct>=80?'warn':'ok';
    const barWidth=limit<=0?0:Math.min(pct,100);
    const rowsHtml=catEntries.length ? catEntries.map(e=>
      '<div class="budget-entry-row">'+
        '<span class="ber-date">'+e.date.slice(8,10)+'.'+e.date.slice(5,7)+'</span>'+
        '<span class="ber-comment">'+esc(e.comment||'—')+'</span>'+
        '<span class="ber-amount">'+fmtCHF(e.amount)+'</span>'+
        '<button onclick="event.stopPropagation();openEditBudgetEntry(\''+e.id+'\')" title="Bearbeiten">✏️</button>'+
        '<button onclick="event.stopPropagation();deleteBudgetEntry(\''+e.id+'\')" title="Löschen">✕</button>'+
      '</div>').join('')
      : '<div class="budget-empty">Keine Buchungen</div>';
    cardsHtml+=
      '<div class="budget-card" onclick="toggleBudgetCard(this)">'+
        '<div class="bc-top"><span class="bc-title">'+BUDGET_CAT_EMOJI[cat]+' '+cat+'</span><span class="bc-chevron">▾</span></div>'+
        '<div class="budget-progress"><div class="budget-progress-fill '+barClass+'" style="width:'+barWidth+'%"></div></div>'+
        '<div class="bc-amounts">'+fmtCHF(ist)+' / '+(limit>0?fmtCHF(limit):'kein Limit')+'</div>'+
        '<div class="budget-card-body"><div class="budget-entries">'+rowsHtml+'</div></div>'+
      '</div>';
  });
  const totalPct=totalLimit>0?Math.round(totalIst/totalLimit*100):0;
  col.innerHTML=
    '<div class="budget-col-hd">'+
      '<span class="bc-person-name" style="color:var(--'+person+')">'+esc(name)+'</span>'+
      '<button class="bc-gear" onclick="openBudgetLimitsModal(\''+person+'\')" title="Limits bearbeiten">⚙️</button>'+
    '</div>'+
    cardsHtml+
    '<div class="budget-summary">'+
      '<div>Total: <b>'+fmtCHF(totalIst)+' / '+(totalLimit>0?fmtCHF(totalLimit):'–')+'</b>'+(totalLimit>0?' ('+totalPct+'%)':'')+'</div>'+
      (highestCat?'<div>Höchste Ausschöpfung: '+BUDGET_CAT_EMOJI[highestCat]+' '+highestCat+' ('+highestPct+'%)</div>':'')+
      '<button class="clear-btn" onclick="openBudgetYearStats(\''+person+'\')">📊 Jahresstatistik</button>'+
    '</div>';
}

function renderBudget() {
  const mk=currentMonthKey(budgetMonthOffset);
  const lbl=document.getElementById('budget-month-label'); if(lbl) lbl.textContent=monthLabel(mk);
  renderBudgetColumn('p1',mk);
  renderBudgetColumn('p2',mk);
}
