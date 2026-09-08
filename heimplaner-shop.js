// ═══════════════════════════════════════════════
// HEIMPLANER – Einkaufsliste inkl. Favoriten
//
// Herausgeloest aus heimplaner-app.js (vormals 2381 Zeilen).
// Reine Verschiebung, kein Verhalten geaendert.
// Die Reihenfolge der Skript-Tags in index.html ist bindend – siehe CLAUDE.md.
// ═══════════════════════════════════════════════

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
    sec.innerHTML='<div class="cat-title">'+(CAT_EMOJI[cat]||'📦')+' '+esc(cat)+'</div><div class="shop-grid"></div>';
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
  div.innerHTML='<div class="si-name">'+esc(item.name)+'</div>'+
    '<div class="si-qty">'+esc([item.qty,item.unit].filter(Boolean).join(' '))+'</div>'+
    (item.taskId?'<div class="si-task">🔗 '+esc(item.taskName||'Projekt')+'</div>':'')+
    '<div style="display:flex;align-items:center;gap:6px;margin-top:4px">'+
    '<div class="si-check" style="flex-shrink:0">'+(item.bought?'✓':'')+'</div>'+
    '<button onclick="event.stopPropagation();deleteShopItem(\''+item.id+'\')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:.75rem;padding:2px 4px;border-radius:4px;opacity:0.6" title="Löschen">✕</button>'+
    '<button onclick="event.stopPropagation();openEditShopItemById(\''+item.id+'\')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:.75rem;padding:2px 4px;border-radius:4px;opacity:0.6" title="Bearbeiten">✏️</button>'+
    '<button onclick="event.stopPropagation();saveShopItemTemplate(\''+item.id+'\')" style="background:none;border:none;color:var(--amber);cursor:pointer;font-size:1.15rem;line-height:1;padding:4px 6px;border-radius:4px;opacity:0.85" title="Zu Favoriten hinzufügen">⭐</button>'+
    '</div>';
  div.addEventListener('click',()=>{item.bought=!item.bought;item.updatedAt=Date.now();HP_save();renderShop();renderSidebarStats();});
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
  if(existing&&name){existing.qty=existing.qty?existing.qty+'+'+q:q;existing.updatedAt=Date.now();HP_save();renderShop();renderSidebarStats();showToast(n+' Menge angepasst');return;}
  HP.shop.push({id:'sh'+Date.now(),name:n,qty:q,unit:u,cat:c,bought:false,taskId:taskId||null,taskName:taskName||null,updatedAt:Date.now()});
  HP_save();
  if(!name){['shop-add-name','shop-add-qty','shop-add-unit'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});const sc=document.getElementById('shop-add-cat');if(sc)sc.value='';}
  renderShop();renderSidebarStats();showToast(n+' hinzugefügt');
}

function saveShopItemTemplate(id) {
  const item=HP.shop.find(i=>i.id===id); if(!item) return;
  if(!HP.savedShopItems) HP.savedShopItems=[];
  const existing=HP.savedShopItems.find(s=>s.name.toLowerCase()===item.name.toLowerCase());
  if(existing){existing.qty=item.qty;existing.unit=item.unit;existing.cat=item.cat;existing.updatedAt=Date.now();}
  else HP.savedShopItems.push({id:'ssi'+Date.now(),name:item.name,qty:item.qty,unit:item.unit,cat:item.cat,updatedAt:Date.now()});
  HP_save();showToast('⭐ "'+item.name+'" zu Favoriten hinzugefügt');
}

function openSavedShopItems() {
  const saved=HP.savedShopItems||[];
  const rows=saved.length
    ? saved.map(s=>'<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);font-size:.83rem">'+
        '<span style="flex:1">'+catEmoji(s.cat)+' '+esc(s.name)+(s.qty||s.unit?' <span style="color:var(--muted);font-size:.75rem">('+esc([s.qty,s.unit].filter(Boolean).join(' '))+')</span>':'')+'</span>'+
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
  const weg=(HP.savedShopItems||[]).find(x=>x.id===id);
  markDeleted('savedShopItems', id);
  HP.savedShopItems=(HP.savedShopItems||[]).filter(x=>x.id!==id);
  HP_save();openSavedShopItems();
  showUndoToast('Favorit gelöscht', ()=>{
    if(!weg) return;
    unmarkDeleted('savedShopItems',id); weg.updatedAt=Date.now(); HP.savedShopItems.push(weg);
    HP_save();openSavedShopItems();showToast('Wiederhergestellt');
  });
}

function openEditShopItemById(id) {
  const item = HP.shop.find(i => i.id === id);
  if(item) openEditShopItem(item);
}
function openEditShopItem(item) {
  const opts=CATS.map(c=>'<option value="'+c+'"'+(item.cat===c?' selected':'')+'>'+catEmoji(c)+' '+c+'</option>').join('');
  showModal('<h3>✏️ Artikel bearbeiten</h3>'+
    '<div class="modal-row"><label>Name</label><input class="modal-in" id="ei-name" maxlength="200" value="'+esc(item.name)+'"></div>'+
    '<div class="modal-row"><div style="display:flex;gap:8px">'+
    '<div style="flex:1"><label>Menge</label><input class="modal-in" id="ei-qty" value="'+esc(item.qty||'')+'"></div>'+
    '<div style="flex:1"><label>Einheit</label><input class="modal-in" id="ei-unit" value="'+esc(item.unit||'')+'"></div></div></div>'+
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
  item.updatedAt=Date.now();
  HP_save();closeModal();renderShop();showToast('Artikel aktualisiert');
}
function deleteShopItem(id){
  const weg=HP.shop.find(i=>i.id===id);
  markDeleted('shop',id);HP.shop=HP.shop.filter(i=>i.id!==id);
  HP_save();closeModal();renderShop();renderSidebarStats();
  showUndoToast('Artikel gelöscht', ()=>{
    if(!weg) return;
    unmarkDeleted('shop',id); HP.shop.push(weg); weg.updatedAt=Date.now();
    HP_save();renderShop();renderSidebarStats();showToast('Wiederhergestellt');
  });
}
function clearBought(){
  const weg=HP.shop.filter(i=>i.bought);
  if(!weg.length){showToast('Nichts zu entfernen');return;}
  weg.forEach(i=>markDeleted('shop',i.id));
  HP.shop=HP.shop.filter(i=>!i.bought);
  HP_save();renderShop();renderSidebarStats();
  // Sagt auch, WIE VIELE entfernt wurden - vorher passierte das stillschweigend.
  showUndoToast(weg.length+' Artikel entfernt', ()=>{
    weg.forEach(i=>{ unmarkDeleted('shop',i.id); i.updatedAt=Date.now(); HP.shop.push(i); });
    HP_save();renderShop();renderSidebarStats();showToast(weg.length+' wiederhergestellt');
  });
}
function showDuplicateModal(existing,q,u) {
  showModal('<h3>🛒 Bereits auf der Liste</h3>'+
    '<div class="dup-warn">⚠️ <b>'+esc(existing.name)+'</b> ist bereits auf der Liste ('+esc([existing.qty,existing.unit].filter(Boolean).join(' '))+').</div>'+
    '<p style="font-size:.8rem;color:var(--muted);margin-bottom:14px">Menge erhöhen'+(q?' (+'+q+(u?' '+u:'')+')':'')+' oder separat hinzufügen?</p>'+
    '<div class="modal-btns" style="justify-content:space-between">'+
    '<button class="mbtn mbtn-cancel" onclick="closeModal()">Abbrechen</button>'+
    '<button class="mbtn" style="background:var(--surface);color:var(--text)" onclick="addSeparate(\''+esc(existing.name)+'\',\''+esc(q)+'\',\''+esc(u)+'\')">Separat</button>'+
    '<button class="mbtn mbtn-confirm" onclick="increaseQty(\''+existing.id+'\',\''+q+'\')">Erhöhen</button></div>');
}
function increaseQty(id,q){const i=HP.shop.find(x=>x.id===id);if(i){i.qty=i.qty?i.qty+'+'+q:q;i.updatedAt=Date.now();}HP_save();closeModal();renderShop();showToast('Menge angepasst');}
function addSeparate(name,qty,unit){closeModal();HP.shop.push({id:'sh'+Date.now(),name,qty,unit,cat:'Sonstiges',bought:false,taskId:null,taskName:null,updatedAt:Date.now()});HP_save();renderShop();renderSidebarStats();showToast(name+' separat hinzugefügt');}
