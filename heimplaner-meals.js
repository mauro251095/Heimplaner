// ═══════════════════════════════════════════════
// HEIMPLANER – Menueplan, Rezeptbibliothek, bettybossi-Importer
//
// Herausgeloest aus heimplaner-app.js (vormals 2381 Zeilen).
// Reine Verschiebung, kein Verhalten geaendert.
// Die Reihenfolge der Skript-Tags in index.html ist bindend – siehe CLAUDE.md.
// ═══════════════════════════════════════════════

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
          '<span class="me" style="pointer-events:none">'+esc(m.emoji)+'</span>'+
          '<span class="mn2" style="pointer-events:none">'+esc(m.name)+'</span>'+
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
    '<input class="modal-in" id="mp-emoji" placeholder="🍽️" maxlength="2" style="width:48px;text-align:center" value="'+esc(existing?.emoji&&existing.emoji!=='🍽️'?existing.emoji:'')+'">'+
    '<input class="modal-in" id="mp-name" maxlength="200" placeholder="z.B. Älplermagronen" style="flex:1" value="'+esc(existing?.name||'')+'">'+
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
    '<h3>📖 "'+esc(m.name)+'" zur Bibliothek</h3>'+
    '<div class="modal-row"><label>Emoji & Name</label><div style="display:flex;gap:7px">'+
    '<input class="modal-in" id="cr-emoji" placeholder="🍽️" maxlength="2" style="width:48px;text-align:center" value="'+esc(m.emoji)+'">'+
    '<input class="modal-in" id="cr-name" maxlength="200" placeholder="Name" style="flex:1" value="'+esc(m.name)+'"></div></div>'+
    '<div class="modal-row"><div style="display:flex;gap:7px">'+
    '<div style="flex:1"><label>Zeit (Min)</label><input class="modal-in" id="cr-time" type="number" value="30"></div>'+
    '<div style="flex:1"><label>Personen</label><input class="modal-in" id="cr-pers" type="number" value="2"></div>'+
    '<div style="flex:1"><label>Kategorie</label><select class="modal-in" id="cr-cat">'+
    cats.map(c=>'<option'+(c===defaultCat?' selected':'')+'>'+c+'</option>').join('')+
    '</select></div></div></div>'+
    '<div class="modal-row"><label>Zutaten (Name, Menge, Einheit – eine pro Zeile)</label>'+
    '<textarea class="modal-in" id="cr-ings" rows="5" maxlength="4000" placeholder="Pasta, 300, g&#10;Tomatensauce, 1, Dose" style="resize:vertical;font-family:Inter,sans-serif"></textarea></div>'+
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
    tags:['eigenes'],ing,custom:true,updatedAt:Date.now()};
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
        HP.shop.push({id:'sh'+Date.now()+Math.random(),name:ing.n,qty:ing.q,unit:ing.u,cat:guessCat(ing.n),bought:false,taskId:null,taskName:m.emoji+' '+m.name,updatedAt:Date.now()});added++;
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
          HP.shop.push({id:'sh'+Date.now()+Math.random(),name:ing.n,qty:ing.q,unit:ing.u,cat:guessCat(ing.n),bought:false,taskId:null,taskName:m.emoji+' '+m.name,updatedAt:Date.now()});added++;
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
  if(fe) fe.innerHTML=cats.map(c=>'<button class="rfbtn'+(c===recipeFilter?' active':'')+'" onclick="setRecipeFilter(\''+esc(c)+'\')">'+esc(c)+'</button>').join('')+
    '<button class="rfbtn" style="background:var(--p2bg);border-color:var(--p2);color:var(--p2)" onclick="openAddCustomRecipe()">+ Eigenes Rezept</button>'+
    '<button class="rfbtn" style="background:var(--surface);border-color:var(--border)" onclick="openImportRecipe()">📋 Rezept importieren</button>';
  const q=(document.getElementById('recipe-search')?.value||'').toLowerCase();
  const filtered=all.filter(r=>(recipeFilter==='Alle'||r.cat===recipeFilter)&&(!q||r.name.toLowerCase().includes(q)||r.tags.some(t=>t.includes(q))));
  const grid=document.getElementById('recipes-grid'); if(!grid) return; grid.innerHTML='';
  filtered.forEach(r=>{
    const card=document.createElement('div'); card.className='rc';
    const isPending=!!pendingMealSlot;
    card.innerHTML='<div class="rc-top">'+esc(r.emoji)+'</div><div class="rc-body">'+
      '<div class="rc-name">'+esc(r.name)+(r.custom?'<span style="font-size:.6rem;color:var(--amber);margin-left:5px">eigenes</span>':'')+'</div>'+
      '<div class="rc-meta"><span>⏱ '+esc(r.time)+' Min</span><span>👥 '+esc(r.pers)+' Pers.</span></div>'+
      '<div class="rc-tags">'+r.tags.map(t=>'<span class="rc-tag">'+esc(t)+'</span>').join('')+'</div>'+
      '<button class="rc-addbtn" onclick="event.stopPropagation();openRecipeDetail(\''+r.id+'\')">🛒 Zutaten wählen</button>'+
      '<button class="rc-addbtn" style="margin-top:4px;background:var(--p2bg);border-color:var(--p2);color:var(--p2)" onclick="event.stopPropagation();'+(isPending?'assignMealFromRecipe(allRecipes().find(x=>x.id===\''+r.id+'\'))':'openMealPlanModal(\''+r.id+'\')')+'">'+(isPending?'✓ Für Menüplan wählen':'📅 Zum Menüplan')+'</button>'+
      (r.custom?'<button class="rc-addbtn" style="margin-top:4px;background:var(--surface);border-color:var(--border)" onclick="event.stopPropagation();openEditCustomRecipe(\''+r.id+'\')">✏️ Bearbeiten</button>':'')+
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
      HP.shop.push({id:'sh'+Date.now()+Math.random(),name:ing.n,qty:ing.q,unit:ing.u,cat:guessCat(ing.n),bought:false,taskId:null,taskName:r.emoji+' '+r.name,updatedAt:Date.now()});added++;
    }
  });
  HP_save();closeModal();renderSidebarStats();showToast(added+' Zutaten von "'+r.name+'" hinzugefügt');
}
function openMealPlanModal(rid) {
  const r=allRecipes().find(x=>x.id===rid); if(!r) return;
  const dates=getWeekDates(weekOffset);
  const opts=dates.map((d,i)=>['Frühstück','Mittag','Abend'].map(s=>'<option value="'+dk(d)+'||'+s+'">'+DS[i]+' '+d.getDate()+'. – '+s+'</option>').join('')).join('');
  showModal('<h3>'+esc(r.emoji)+' '+esc(r.name)+'</h3>'+
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
function customRecipeModalHTML(title, saveOnclick, prefill) {
  const cats=['Frühstück','Salate','Pasta','Hauptspeisen','Grill','Suppen','Snacks','Desserts'];
  const p=prefill||{};
  const ingText=(p.ing||[]).map(i=>[i.n,i.q,i.u].filter(x=>x!==undefined&&x!=='').join(', ')).join('\n');
  const stepsText=(p.steps||[]).join('\n');
  return '<h3>'+title+'</h3>'+
    '<div class="modal-row"><label>Emoji & Name</label><div style="display:flex;gap:7px">'+
    '<input class="modal-in" id="cr-emoji" placeholder="🍽️" maxlength="2" style="width:48px;text-align:center" value="'+esc(p.emoji||'')+'">'+
    '<input class="modal-in" id="cr-name" maxlength="200" placeholder="Name" style="flex:1" value="'+esc(p.name||'')+'"></div></div>'+
    '<div class="modal-row"><div style="display:flex;gap:7px">'+
    '<div style="flex:1"><label>Zeit (Min)</label><input class="modal-in" id="cr-time" type="number" value="'+(p.time!=null?p.time:30)+'"></div>'+
    '<div style="flex:1"><label>Personen</label><input class="modal-in" id="cr-pers" type="number" value="'+(p.pers!=null?p.pers:2)+'"></div>'+
    '<div style="flex:1"><label>Kategorie</label><select class="modal-in" id="cr-cat">'+cats.map(c=>'<option'+(p.cat===c?' selected':'')+'>'+esc(c)+'</option>').join('')+'</select></div></div></div>'+
    '<div class="modal-row"><label>Zutaten (Name, Menge, Einheit – eine pro Zeile)</label>'+
    '<textarea class="modal-in" id="cr-ings" rows="5" maxlength="4000" placeholder="Pasta, 300, g&#10;Tomatensauce, 1, Dose" style="resize:vertical;font-family:Inter,sans-serif">'+esc(ingText)+'</textarea></div>'+
    '<div class="modal-row"><label>Ablauf (ein Schritt pro Zeile)</label>'+
    '<textarea class="modal-in" id="cr-steps" rows="5" maxlength="8000" placeholder="Wasser aufkochen und Pasta darin kochen.&#10;Sauce erhitzen und mit der Pasta mischen." style="resize:vertical;font-family:Inter,sans-serif">'+esc(stepsText)+'</textarea></div>'+
    '<div class="modal-btns"><button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
    '<button class="mbtn mbtn-confirm" onclick="'+saveOnclick+'">✓ Speichern</button></div>';
}
function openAddCustomRecipe() {
  showModal(customRecipeModalHTML('📖 Eigenes Rezept', 'saveCustomRecipe()'));
}
function openEditCustomRecipe(id) {
  const r=(HP.customRecipes||[]).find(x=>x.id===id); if(!r) return;
  showModal(customRecipeModalHTML('✏️ Rezept bearbeiten', "saveEditCustomRecipe('"+id+"')", r));
}
function readCustomRecipeForm() {
  const emoji=document.getElementById('cr-emoji')?.value.trim()||'🍽️';
  const name=document.getElementById('cr-name')?.value.trim();
  const ing=(document.getElementById('cr-ings')?.value||'').split('\n').filter(l=>l.trim()).map(l=>{const p=l.split(',').map(x=>x.trim());return{n:p[0]||l,q:p[1]||'',u:p[2]||''};});
  const steps=(document.getElementById('cr-steps')?.value||'').split('\n').map(s=>s.trim()).filter(Boolean);
  const cat=document.getElementById('cr-cat')?.value||'Hauptspeisen';
  const time=parseInt(document.getElementById('cr-time')?.value)||30;
  const pers=parseInt(document.getElementById('cr-pers')?.value)||2;
  if(!name){showToast('Bitte Namen eingeben');return null;}
  if(!ing.length){showToast('Bitte mindestens eine Zutat eingeben');return null;}
  if(!steps.length){showToast('Bitte mindestens einen Zubereitungsschritt eingeben');return null;}
  return {emoji,name,ing,steps,cat,time,pers};
}
function saveCustomRecipe() {
  const f=readCustomRecipeForm(); if(!f) return;
  if(!HP.customRecipes)HP.customRecipes=[];
  HP.customRecipes.push({id:'cr'+Date.now(),...f,tags:['eigenes'],custom:true,updatedAt:Date.now()});
  HP_save();closeModal();renderRecipes();showToast(f.emoji+' '+f.name+' hinzugefügt');
}

// ── REZEPT-IMPORT (bettybossi.ch, reiner Text-Parser) ──────────
// Kein KI-Aufruf, kein Netzwerk-Request: arbeitet ausschliesslich auf Text, den
// die Nutzer:in selbst von der Seite kopiert und hier einfügt. bettybossi.ch
// gruppiert Zutaten pro Zubereitungsschritt statt in einer Gesamtliste:
// "N. ZutatName" / "Menge Einheit" (wiederholt) / Fliesstext-Absatz (der Schritt
// selbst). Zeit & Portionenzahl stehen im kopierten Text nicht als Wert drin
// (JS-Widget, wird bei einem reinen Copy-Paste nicht mitkopiert) — dafür in der
// Vorschau Default-Werte, die von Hand geprüft/angepasst werden müssen.
function looksLikeStepSentence(line) {
  return line.length>25 && /[.!?]\s*$/.test(line.trim());
}
function parseQtyLine(line) {
  const t=(line||'').trim();
  if (!t) return {q:'', u:''};
  if (/^wenig$/i.test(t)) return {q:'wenig', u:''};
  const m=t.match(/^([\d.,]+(?:\s*[-–]\s*[\d.,]+)?)\s*(.*)$/);
  if (m && m[1]) return {q:m[1].trim(), u:(m[2]||'').trim()||'Stk'};
  return {q:'', u:t};
}
function parseBettyBossiRecipe(raw) {
  const lines=(raw||'').split('\n').map(l=>l.replace(/\r/g,''));
  const firstStepIdx=lines.findIndex(l=>/^\s*\d+\.\s/.test(l));
  const name=(lines.slice(0, firstStepIdx>=0?firstStepIdx:lines.length).find(l=>l.trim())||'').trim();
  const ing=[], steps=[];
  if (firstStepIdx<0) return {name, ing, steps};
  const markers=[];
  lines.forEach((l,i)=>{ if(/^\s*\d+\.\s/.test(l)) markers.push(i); });
  markers.forEach((start,mi)=>{
    const end=mi+1<markers.length ? markers[mi+1] : lines.length;
    const block=lines.slice(start,end);
    block[0]=block[0].replace(/^\s*\d+\.\s*/,'');
    let stepIdx=-1;
    for (let i=block.length-1;i>=0;i--) { if (looksLikeStepSentence(block[i])) { stepIdx=i; break; } }
    if (stepIdx===-1) { for (let i=block.length-1;i>=0;i--) { if (block[i].trim()) { stepIdx=i; break; } } }
    const stepText=stepIdx>=0 ? block[stepIdx].trim() : '';
    const ingLines=stepIdx>=0 ? block.slice(0,stepIdx) : block;
    for (let i=0;i<ingLines.length;i+=2) {
      const ingName=(ingLines[i]||'').trim(); if (!ingName) continue;
      const qu=parseQtyLine(ingLines[i+1]);
      ing.push({n:ingName, q:qu.q, u:qu.u});
    }
    if (stepText) steps.push(stepText);
  });
  return {name, ing, steps};
}
function openImportRecipe() {
  showModal('<h3>📋 Rezept importieren</h3>'+
    '<p style="font-size:.78rem;color:var(--muted);margin-bottom:10px">Rezepttext von bettybossi.ch markieren, kopieren und hier einfügen. Läuft komplett lokal im Browser, es wird keine Seite nachgeladen.</p>'+
    '<div class="modal-row"><textarea class="modal-in" id="import-raw" rows="12" maxlength="20000" placeholder="Rezepttext hier einfügen…" style="resize:vertical;font-family:Inter,sans-serif"></textarea></div>'+
    '<div class="modal-btns"><button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
    '<button class="mbtn mbtn-confirm" onclick="previewImportedRecipe()">→ Vorschau</button></div>');
}
function previewImportedRecipe() {
  const raw=document.getElementById('import-raw')?.value||'';
  const parsed=parseBettyBossiRecipe(raw);
  if (!parsed.name && !parsed.ing.length && !parsed.steps.length) { showToast('Konnte nichts erkennen – bitte Text prüfen'); return; }
  showModal(customRecipeModalHTML('📋 Vorschau – bitte prüfen & ergänzen', 'saveImportedRecipe()',
    {emoji:'🍽️', name:parsed.name, cat:'Hauptspeisen', time:30, pers:4, ing:parsed.ing, steps:parsed.steps}));
  showToast('Zeit & Personenzahl bitte prüfen – bettybossi.ch kopiert diese Werte nicht mit');
}
function saveImportedRecipe() {
  const f=readCustomRecipeForm(); if(!f) return;
  if(!HP.customRecipes)HP.customRecipes=[];
  HP.customRecipes.push({id:'cr'+Date.now(),...f,tags:['eigenes','importiert'],custom:true,updatedAt:Date.now()});
  HP_save();closeModal();renderRecipes();showToast(f.emoji+' '+f.name+' importiert');
}
function saveEditCustomRecipe(id) {
  const r=(HP.customRecipes||[]).find(x=>x.id===id); if(!r){closeModal();return;}
  const f=readCustomRecipeForm(); if(!f) return;
  Object.assign(r,f);
  r.updatedAt=Date.now();
  HP_save();closeModal();renderRecipes();showToast('Rezept aktualisiert');
}
function deleteCustomRecipe(id){
  const weg=(HP.customRecipes||[]).find(r=>r.id===id);
  markDeleted('customRecipes',id);HP.customRecipes=(HP.customRecipes||[]).filter(r=>r.id!==id);
  HP_save();renderRecipes();
  showUndoToast('Rezept gelöscht', ()=>{
    if(!weg) return;
    unmarkDeleted('customRecipes',id); weg.updatedAt=Date.now(); HP.customRecipes.push(weg);
    HP_save();renderRecipes();showToast('Wiederhergestellt');
  });
}
