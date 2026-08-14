/* SDSCPA shared learning helpers — progress, certificates, glossary.
   Loaded by every lab via <script src="../shared/learn.js"></script>.
   Keep dependency-free; labs are otherwise standalone. */
(function(){
'use strict';
/* ── Student profiles ─────────────────────────────────────────────
   A normalized ID maps to the same browser-storage namespace and server
   record on every visit. The raw ID is sent only when opening the profile;
   subsequent progress updates use its one-way namespace token. All app
   localStorage and IndexedDB calls are transparently scoped to that token. */
const ACTIVE_PROFILE_KEY='sdscpa_active_profile_v1';
const PROFILE_PREFIX='sdscpa_profile_v1:';
const PROFILE_DB_PREFIX='sdscpa-profile-v1-';
const MIGRATION_KEY='sdscpa_profiles_migrated_v1';
const PROFILE_MODE_KEY='sdscpa_profile_mode_v1';
const PROFILE_MODE_REMOTE='remote';
const PROFILE_MODE_LOCAL='local';
let rawLocalStorage=null, rawSessionStorage=null, rawIndexedDB=null;
try{ rawLocalStorage=window.localStorage; }catch(e){}
try{ rawSessionStorage=window.sessionStorage; }catch(e){}
try{ rawIndexedDB=window.indexedDB; }catch(e){}

function normalizeStudentId(value){
  return String(value==null?'':value).trim().toUpperCase();
}
function validStudentId(value){ return /^[A-Z0-9][A-Z0-9-]{2,31}$/.test(normalizeStudentId(value)); }
function profileToken(value){
  const text=normalizeStudentId(value);
  // Two independent 32-bit FNV-1a passes make a stable, non-reversible key.
  let a=0x811c9dc5, b=0x9e3779b9;
  for(let i=0;i<text.length;i++){
    const code=text.charCodeAt(i);
    a=Math.imul(a^code,0x01000193);
    b=Math.imul(b^(code+i),0x85ebca6b);
  }
  return (a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');
}
function activeProfile(){
  try{ return rawSessionStorage && rawSessionStorage.getItem(ACTIVE_PROFILE_KEY) || ''; }
  catch(e){ return ''; }
}
function activeProfileMode(){
  try{ return rawSessionStorage && rawSessionStorage.getItem(PROFILE_MODE_KEY) || PROFILE_MODE_LOCAL; }
  catch(e){ return PROFILE_MODE_LOCAL; }
}
function scopedKey(key){ const token=activeProfile(); return token ? PROFILE_PREFIX+token+':'+String(key) : ''; }
function scopedKeys(){
  const token=activeProfile();
  if(!rawLocalStorage || !token) return [];
  const prefix=PROFILE_PREFIX+token+':', keys=[];
  try{
    for(let i=0;i<rawLocalStorage.length;i++){
      const key=rawLocalStorage.key(i);
      if(key && key.indexOf(prefix)===0) keys.push(key.slice(prefix.length));
    }
  }catch(e){}
  return keys;
}
const profileStorage={
  get length(){ return scopedKeys().length; },
  key(index){ return scopedKeys()[Number(index)] || null; },
  getItem(key){
    const scoped=scopedKey(key);
    if(!rawLocalStorage || !scoped) return null;
    try{ return rawLocalStorage.getItem(scoped); }catch(e){ return null; }
  },
  setItem(key,value){
    const scoped=scopedKey(key);
    if(!rawLocalStorage || !scoped) return;
    try{ rawLocalStorage.setItem(scoped,String(value)); }catch(e){}
  },
  removeItem(key){
    const scoped=scopedKey(key);
    if(!rawLocalStorage || !scoped) return;
    try{ rawLocalStorage.removeItem(scoped); }catch(e){}
  },
  clear(){
    if(!rawLocalStorage) return;
    scopedKeys().forEach(key=>{ try{ rawLocalStorage.removeItem(scopedKey(key)); }catch(e){} });
  }
};
try{ Object.defineProperty(window,'localStorage',{configurable:true,value:profileStorage}); }catch(e){}

function scopedDbName(name){
  const token=activeProfile();
  return token ? PROFILE_DB_PREFIX+token+'-'+String(name) : PROFILE_DB_PREFIX+'signed-out-'+String(name);
}
if(rawIndexedDB){
  const profileIndexedDB={
    open(name,version){ return version===undefined ? rawIndexedDB.open(scopedDbName(name)) : rawIndexedDB.open(scopedDbName(name),version); },
    deleteDatabase(name){ return rawIndexedDB.deleteDatabase(scopedDbName(name)); },
    cmp(first,second){ return rawIndexedDB.cmp(first,second); },
    async databases(){
      if(typeof rawIndexedDB.databases!=='function') return [];
      const token=activeProfile(), prefix=PROFILE_DB_PREFIX+token+'-';
      const databases=await rawIndexedDB.databases();
      return databases.filter(db=>db.name && db.name.indexOf(prefix)===0)
        .map(db=>Object.assign({},db,{name:db.name.slice(prefix.length)}));
    }
  };
  try{ Object.defineProperty(window,'indexedDB',{configurable:true,value:profileIndexedDB}); }catch(e){}
}

function migrateLegacyLocalStorage(token){
  if(!rawLocalStorage) return;
  try{
    if(rawLocalStorage.getItem(MIGRATION_KEY)) return;
    const keys=[];
    for(let i=0;i<rawLocalStorage.length;i++){
      const key=rawLocalStorage.key(i);
      if(key && key!==MIGRATION_KEY && key.indexOf(PROFILE_PREFIX)!==0) keys.push(key);
    }
    keys.forEach(key=>{
      rawLocalStorage.setItem(PROFILE_PREFIX+token+':'+key,rawLocalStorage.getItem(key));
    });
    keys.forEach(key=>rawLocalStorage.removeItem(key));
    rawLocalStorage.setItem(MIGRATION_KEY,'1');
  }catch(e){}
}
async function openExistingDatabase(name){
  if(!rawIndexedDB) return null;
  if(typeof rawIndexedDB.databases==='function'){
    try{
      const databases=await rawIndexedDB.databases();
      if(!databases.some(db=>db.name===name)) return null;
    }catch(e){}
  }
  return new Promise(resolve=>{
    const request=rawIndexedDB.open(name);
    let created=false;
    request.onupgradeneeded=()=>{ created=true; };
    request.onsuccess=()=>{
      const db=request.result;
      if(created){ db.close(); rawIndexedDB.deleteDatabase(name); resolve(null); }
      else resolve(db);
    };
    request.onerror=()=>resolve(null);
  });
}
async function migrateLegacyDatabase(token,name){
  const source=await openExistingDatabase(name);
  if(!source) return;
  try{
    const stores=Array.from(source.objectStoreNames);
    if(!stores.length){ source.close(); return; }
    const schemas=stores.map(storeName=>{
      const tx=source.transaction(storeName,'readonly'), store=tx.objectStore(storeName);
      return { name:storeName, keyPath:store.keyPath, autoIncrement:store.autoIncrement };
    });
    const records={};
    await Promise.all(stores.map(storeName=>new Promise((resolve,reject)=>{
      const request=source.transaction(storeName,'readonly').objectStore(storeName).getAll();
      request.onsuccess=()=>{ records[storeName]=request.result||[]; resolve(); };
      request.onerror=()=>reject(request.error);
    })));
    source.close();
    const targetName=PROFILE_DB_PREFIX+token+'-'+name;
    await new Promise((resolve,reject)=>{
      const request=rawIndexedDB.open(targetName,1);
      request.onupgradeneeded=()=>schemas.forEach(schema=>{
        if(!request.result.objectStoreNames.contains(schema.name))
          request.result.createObjectStore(schema.name,{keyPath:schema.keyPath,autoIncrement:schema.autoIncrement});
      });
      request.onsuccess=()=>{
        const db=request.result;
        if(!stores.length){ db.close(); resolve(); return; }
        const tx=db.transaction(stores,'readwrite');
        stores.forEach(storeName=>records[storeName].forEach(record=>tx.objectStore(storeName).put(record)));
        tx.oncomplete=()=>{ db.close(); resolve(); };
        tx.onerror=()=>{ db.close(); reject(tx.error); };
      };
      request.onerror=()=>reject(request.error);
    });
    rawIndexedDB.deleteDatabase(name);
  }catch(e){ try{ source.close(); }catch(_){} }
}
async function activateProfile(studentId){
  const normalized=normalizeStudentId(studentId);
  if(!validStudentId(normalized)) throw new Error('Enter at least 3 letters or numbers. Hyphens are okay.');
  if(!rawLocalStorage) throw new Error('This browser is blocking local storage. Enable site storage to save student work.');
  const token=profileToken(normalized);
  migrateLegacyLocalStorage(token);
  const needsDbMigration=rawLocalStorage && rawLocalStorage.getItem(MIGRATION_KEY)==='1'
    && !rawLocalStorage.getItem(MIGRATION_KEY+':db');
  if(needsDbMigration){
    await migrateLegacyDatabase(token,'soundCueLab');
    await migrateLegacyDatabase(token,'sdscpa-pattern-imports');
    try{ rawLocalStorage.setItem(MIGRATION_KEY+':db','1'); }catch(e){}
  }
  if(!rawSessionStorage) throw new Error('This browser is blocking local session storage.');
  rawSessionStorage.setItem(ACTIVE_PROFILE_KEY,token);
  rawSessionStorage.setItem(PROFILE_MODE_KEY,PROFILE_MODE_REMOTE);
  try{
    const localProgress=JSON.parse(profileStorage.getItem(KEY) || '{}');
    const result=await requestJson('/api/profiles/open',{studentId:normalized,progress:localProgress});
    if(result.profileToken!==token) throw new Error('The progress server returned the wrong student profile.');
    profileStorage.setItem(KEY,JSON.stringify(result.progress || {}));
  }catch(error){
    rawSessionStorage.removeItem(ACTIVE_PROFILE_KEY);
    rawSessionStorage.removeItem(PROFILE_MODE_KEY);
    throw error;
  }
}
function activateLocalOnly(){
  if(!rawLocalStorage) throw new Error('This browser is blocking local storage. Enable site storage to save student work.');
  if(!rawSessionStorage) throw new Error('This browser is blocking local session storage.');
  const token=profileToken('LOCAL-ONLY');
  migrateLegacyLocalStorage(token);
  rawSessionStorage.setItem(ACTIVE_PROFILE_KEY,token);
  rawSessionStorage.setItem(PROFILE_MODE_KEY,PROFILE_MODE_LOCAL);
}
function switchProfile(){
  try{ if(rawSessionStorage) rawSessionStorage.removeItem(ACTIVE_PROFILE_KEY); }catch(e){}
  try{ if(rawSessionStorage) rawSessionStorage.removeItem(PROFILE_MODE_KEY); }catch(e){}
  location.reload();
}

const KEY = 'sdscpa_progress';

function wait(milliseconds){ return new Promise(resolve=>setTimeout(resolve,milliseconds)); }
async function requestJson(url,body){
  let lastError=null;
  for(let attempt=1;attempt<=3;attempt++){
    try{
      const response=await fetch(url,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(body)
      });
      const result=await response.json().catch(()=>({}));
      if(!response.ok){
        const error=new Error(result.error || 'The progress server returned status '+response.status+'.');
        error.status=response.status;
        throw error;
      }
      return result;
    }catch(error){
      lastError=error;
      if(attempt<3){
        console.warn('Progress sync attempt failed',{url,attempt,error:error && error.message});
        await wait(attempt*250);
      }
    }
  }
  const message=lastError && lastError.message ? lastError.message : 'Unknown connection error.';
  throw new Error('Could not reach saved progress after 3 attempts. '+message+' You can try again or use Local only.');
}

function showSyncWarning(error){
  ensureCss();
  let warning=document.querySelector('.sdscpa-sync-warning');
  if(!warning){
    warning=document.createElement('div');
    warning.className='sdscpa-sync-warning';
    warning.setAttribute('role','alert');
    document.body.appendChild(warning);
  }
  warning.textContent='This device was updated, but progress could not sync to /data. '+
    (error && error.message ? error.message : 'Try signing in again when the connection is restored.');
}

function syncCompletion(labId,detail){
  if(activeProfileMode()!==PROFILE_MODE_REMOTE) return Promise.resolve();
  return requestJson('/api/progress/complete',{profileToken:activeProfile(),labId,detail})
    .catch(showSyncWarning);
}

function syncRemoval(labId){
  if(activeProfileMode()!==PROFILE_MODE_REMOTE) return Promise.resolve({synced:true});
  return requestJson('/api/progress/remove',{profileToken:activeProfile(),labId})
    .then(()=>({synced:true}))
    .catch(error=>{ showSyncWarning(error); return {synced:false}; });
}

function getProgress(){
  try{ return JSON.parse(localStorage.getItem(KEY) || '{}'); }catch(e){ return {}; }
}
function markDone(labId, detail){
  try{
    const p = getProgress();
    const prev = p[labId] || {};
    const next = Object.assign({}, prev, detail || {}, {
      done: true,
      date: new Date().toISOString().slice(0,10)
    });
    // keep the best score ever earned
    if (typeof prev.score === 'number' && typeof next.score === 'number')
      next.score = Math.max(prev.score, next.score);
    p[labId] = next;
    localStorage.setItem(KEY, JSON.stringify(p));
    return syncCompletion(labId,next);
  }catch(e){ showSyncWarning(e); return Promise.resolve({synced:false}); }
}
function markIncomplete(labId){
  try{
    const p=getProgress();
    delete p[labId];
    localStorage.setItem(KEY,JSON.stringify(p));
    return syncRemoval(labId);
  }catch(e){ showSyncWarning(e); return Promise.resolve(); }
}

/* ── Certificate (canvas PNG download), generalized from Line Mixing Lab ── */
function rr(g,x,y,w,h,r){
  g.beginPath();
  g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r);
  g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath();
}
/* opts: {lab, name, line, stats:[[label,value,color],...], file} */
function certificate(opts){
  const name = (opts.name||'').trim() || 'Student';
  const dateStr = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  const CW=1200, CH=820;
  const off=document.createElement('canvas'); off.width=CW; off.height=CH;
  const g=off.getContext('2d');
  g.fillStyle='#0d0d10'; g.fillRect(0,0,CW,CH);
  g.fillStyle='#13131a'; rr(g,32,32,CW-64,CH-64,16); g.fill();
  const stripe=['#7AC143','#F7941E','#ED1C45','#EC008C','#92278F','#2E3192','#00AEEF'];
  const brd=g.createLinearGradient(0,0,CW,0);
  stripe.forEach((c,i,a)=>brd.addColorStop(i/(a.length-1),c));
  g.strokeStyle=brd; g.lineWidth=6; rr(g,32,32,CW-64,CH-64,16); g.stroke();
  g.fillStyle=brd; g.fillRect(32,32,CW-64,6);
  g.textAlign='center';
  g.font='900 68px "Arial Black",Arial,sans-serif'; g.fillStyle='#EC008C'; g.fillText('SDSCPA',CW/2,150);
  g.font='400 14px Arial'; g.fillStyle='#55556a'; g.fillText('C E R T I F I C A T E   O F   C O M P L E T I O N',CW/2,188);
  g.font='700 36px Arial'; g.fillStyle='#dde0ec'; g.fillText(opts.lab,CW/2,252);
  g.strokeStyle='#2a2a38'; g.lineWidth=1; g.beginPath(); g.moveTo(140,278); g.lineTo(CW-140,278); g.stroke();
  g.font='300 17px Arial'; g.fillStyle='#55556a'; g.fillText('This certifies that',CW/2,328);
  g.font='700 54px Georgia,serif'; g.fillStyle='#ffffff'; g.fillText(name,CW/2,406);
  g.font='300 17px Arial'; g.fillStyle='#55556a';
  g.fillText(opts.line||'',CW/2,454);
  const boxes=(opts.stats||[]).slice(0,4);
  if(boxes.length){
    const bw=250, bh=92, gapx=18, totalW=bw*boxes.length+gapx*(boxes.length-1), sx=CW/2-totalW/2, by=494;
    boxes.forEach((b,i)=>{
      const bx=sx+i*(bw+gapx);
      g.fillStyle='#1a1a24'; rr(g,bx,by,bw,bh,10); g.fill();
      g.strokeStyle='#2a2a3a'; g.lineWidth=1; rr(g,bx,by,bw,bh,10); g.stroke();
      g.font='800 34px Arial'; g.fillStyle=b[2]||'#3b82f6'; g.fillText(String(b[1]),bx+bw/2,by+50);
      g.font='400 11px Arial'; g.fillStyle='#55556a'; g.fillText(b[0],bx+bw/2,by+76);
    });
  }
  g.strokeStyle='#1e1e2a'; g.lineWidth=1; g.beginPath(); g.moveTo(140,CH-72); g.lineTo(CW-140,CH-72); g.stroke();
  g.font='400 13px Arial'; g.fillStyle='#33334a'; g.fillText(dateStr,CW/2,CH-46);
  off.toBlob(blob=>{
    if(!blob) return;
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=(opts.file||'SDSCPA-Certificate')+'.png';
    a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  },'image/png');
}

/* ── Confetti burst: cheap celebration for completions ── */
function confetti(){
  const cv=document.createElement('canvas');
  cv.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999';
  cv.width=innerWidth; cv.height=innerHeight;
  document.body.appendChild(cv);
  const g=cv.getContext('2d');
  const colors=['#7AC143','#F7941E','#ED1C45','#EC008C','#92278F','#2E3192','#00AEEF','#fbbf24'];
  const parts=Array.from({length:110},()=>({
    x:cv.width/2+(Math.random()-.5)*cv.width*.4,
    y:cv.height*.35,
    vx:(Math.random()-.5)*11,
    vy:-Math.random()*10-3,
    s:4+Math.random()*5,
    r:Math.random()*Math.PI,
    vr:(Math.random()-.5)*.3,
    c:colors[Math.floor(Math.random()*colors.length)]
  }));
  const t0=performance.now();
  (function frame(t){
    const dt=(t-t0)/1400;
    g.clearRect(0,0,cv.width,cv.height);
    parts.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy; p.vy+=.35; p.r+=p.vr;
      g.save(); g.translate(p.x,p.y); g.rotate(p.r);
      g.globalAlpha=Math.max(0,1-dt);
      g.fillStyle=p.c; g.fillRect(-p.s/2,-p.s/2,p.s,p.s*.6);
      g.restore();
    });
    if(dt<1) requestAnimationFrame(frame); else cv.remove();
  })(t0);
}

const NAME_KEY='sdscpa_student_name';
function savedName(){ try{ return localStorage.getItem(NAME_KEY)||''; }catch(e){ return ''; } }

/* ── Certificate prompt dialog: asks for the student's name, then downloads ── */
function certificateDialog(opts){
  ensureCss();
  confetti();
  const wrap=document.createElement('div'); wrap.className='sdscpa-modal-wrap';
  wrap.innerHTML =
    '<div class="sdscpa-modal" role="dialog" aria-label="Certificate">'+
      '<h3>🎉 '+esc(opts.heading||'Nice work!')+'</h3>'+
      '<p>'+esc(opts.line||'')+'</p>'+
      '<label>Your name (for the certificate)</label>'+
      '<input type="text" maxlength="40" placeholder="First Last">'+
      '<div class="sdscpa-modal-btns">'+
        '<button class="sdscpa-btn-dim" data-x="close">Not now</button>'+
        '<button class="sdscpa-btn-go" data-x="dl">Download certificate</button>'+
      '</div>'+
    '</div>';
  document.body.appendChild(wrap);
  const inp=wrap.querySelector('input');
  inp.value=savedName();
  inp.focus();
  wrap.addEventListener('click',e=>{
    if(e.target===wrap || e.target.dataset.x==='close'){ wrap.remove(); return; }
    if(e.target.dataset.x==='dl'){
      try{ if(inp.value.trim()) localStorage.setItem(NAME_KEY, inp.value.trim()); }catch(_){}
      certificate(Object.assign({}, opts, {name: inp.value}));
      wrap.remove();
    }
  });
}

/* ── Glossary modal ──
   attachGlossary({button, labName, goal, terms:[[term, definition],...]})
   If button is omitted a floating 📖 pill is created bottom-right. */
function attachGlossary(cfg){
  ensureCss();
  let btn = cfg.button;
  if(!btn){
    btn=document.createElement('button');
    btn.className='sdscpa-gloss-pill';
    btn.type='button';
    btn.title='Glossary — what do these words mean?';
    btn.textContent='📖 Words';
    document.body.appendChild(btn);
  }
  btn.addEventListener('click',()=>openGlossary(cfg));
  return btn;
}
function openGlossary(cfg){
  ensureCss();
  const wrap=document.createElement('div'); wrap.className='sdscpa-modal-wrap';
  const rows=(cfg.terms||[]).map(t=>
    '<div class="sdscpa-term"><dt>'+esc(t[0])+'</dt><dd>'+esc(t[1])+'</dd></div>').join('');
  wrap.innerHTML =
    '<div class="sdscpa-modal sdscpa-gloss" role="dialog" aria-label="Glossary">'+
      '<h3>📖 '+esc(cfg.labName||'Glossary')+' — Words to know</h3>'+
      (cfg.goal?'<p class="sdscpa-goal">🎯 '+esc(cfg.goal)+'</p>':'')+
      '<input type="search" placeholder="Type to search…" class="sdscpa-gloss-search">'+
      '<dl class="sdscpa-gloss-list">'+rows+'</dl>'+
      '<div class="sdscpa-flash"></div>'+
      '<div class="sdscpa-modal-btns">'+
        '<button class="sdscpa-btn-dim" data-x="flash">🎴 Test me</button>'+
        '<button class="sdscpa-btn-dim" data-x="close">Close</button>'+
      '</div>'+
    '</div>';
  document.body.appendChild(wrap);
  const search=wrap.querySelector('input');
  search.addEventListener('input',()=>{
    const q=search.value.toLowerCase();
    wrap.querySelectorAll('.sdscpa-term').forEach(el=>{
      el.style.display = el.textContent.toLowerCase().includes(q)?'':'none';
    });
  });
  wrap.addEventListener('click',e=>{
    if(e.target===wrap || e.target.dataset.x==='close') wrap.remove();
    else if(e.target.dataset.x==='flash') startFlash(cfg, wrap);
    else if(e.target.dataset.x==='list'){
      wrap.querySelector('.sdscpa-flash').innerHTML='';
      wrap.querySelector('.sdscpa-gloss-list').style.display='';
      search.style.display='';
      wrap.querySelector('[data-x=flash]').style.display='';
    }
  });
  document.addEventListener('keydown',function onk(e){
    if(e.key==='Escape'){ wrap.remove(); document.removeEventListener('keydown',onk); }
  });
}

/* Flash-card quiz over the glossary: show a definition, pick the term. */
function startFlash(cfg, wrap){
  const pool=(cfg.terms||[]).slice();
  if(pool.length<4) return;
  const qs=pool.slice().sort(()=>Math.random()-.5).slice(0,Math.min(5,pool.length));
  let at=0, right=0;
  const box=wrap.querySelector('.sdscpa-flash');
  wrap.querySelector('.sdscpa-gloss-list').style.display='none';
  wrap.querySelector('.sdscpa-gloss-search').style.display='none';
  wrap.querySelector('[data-x=flash]').style.display='none';
  function ask(){
    if(at>=qs.length){
      box.innerHTML='<div class="sdscpa-flash-end">'+
        (right===qs.length?'🌟 ':'')+'You got <b>'+right+' of '+qs.length+'</b> right.'+
        (right===qs.length?' Perfect!':' The list is right here — take another look and try again.')+
        '</div><div class="sdscpa-modal-btns" style="justify-content:center">'+
        '<button class="sdscpa-btn-dim" data-x="list">Back to the list</button>'+
        '<button class="sdscpa-btn-go" data-x="flash">Try again</button></div>';
      return;
    }
    const q=qs[at];
    const options=[q].concat(pool.filter(t=>t!==q).sort(()=>Math.random()-.5).slice(0,3)).sort(()=>Math.random()-.5);
    box.innerHTML='<div class="sdscpa-flash-q"><span class="sdscpa-flash-n">'+(at+1)+' / '+qs.length+'</span>“'+esc(q[1])+'”</div>'+
      options.map((o,i)=>'<button class="sdscpa-flash-opt" data-i="'+i+'">'+esc(o[0])+'</button>').join('')+
      '<div class="sdscpa-flash-fb"></div>';
    box.querySelectorAll('.sdscpa-flash-opt').forEach((btn,i)=>{
      btn.addEventListener('click',()=>{
        if(box.dataset.locked) return;
        box.dataset.locked='1';
        const ok=options[i]===q;
        if(ok) right++;
        btn.classList.add(ok?'good':'bad');
        if(!ok) box.querySelectorAll('.sdscpa-flash-opt')[options.indexOf(q)].classList.add('good');
        box.querySelector('.sdscpa-flash-fb').textContent=ok?'✓ That’s it!':'✗ It’s “'+q[0]+'” — worth a re-read.';
        setTimeout(()=>{ delete box.dataset.locked; at++; ask(); }, ok?800:1900);
      });
    });
  }
  ask();
}

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function mountProfileUi(){
  ensureCss();
  if(activeProfile()){
    const button=document.createElement('button');
    button.type='button';
    button.className='sdscpa-profile-switch';
    button.innerHTML='⇄ <span class="sdscpa-profile-switch-full">Switch profile</span><span class="sdscpa-profile-switch-short">Switch</span>';
    button.setAttribute('aria-label','Switch student profile');
    button.addEventListener('click',switchProfile);
    const topbar=document.getElementById('topbar') || document.querySelector('.topbar');
    if(topbar){ button.classList.add('sdscpa-profile-switch-inline'); topbar.appendChild(button); }
    else document.body.appendChild(button);
    return;
  }
  const wrap=document.createElement('div');
  wrap.className='sdscpa-profile-gate';
  wrap.innerHTML=
    '<form class="sdscpa-profile-card" aria-labelledby="sdscpa-profile-title">'+
      '<div class="sdscpa-profile-mark">S</div>'+
      '<h2 id="sdscpa-profile-title">Student sign in</h2>'+
      '<p>Enter your student ID to load your lab progress on any device. A new ID is added to progress tracking automatically.</p>'+
      '<label for="sdscpa-student-id">Student ID</label>'+
      '<input id="sdscpa-student-id" name="student-id" type="text" inputmode="text" minlength="3" maxlength="32" '+
        'pattern="[A-Za-z0-9](?:[A-Za-z0-9]|-){2,31}" autocomplete="off" autocapitalize="characters" spellcheck="false" required '+
        'aria-describedby="sdscpa-profile-note sdscpa-profile-error">'+
      '<div class="sdscpa-profile-error" id="sdscpa-profile-error" aria-live="polite"></div>'+
      '<button type="submit" class="sdscpa-profile-go">Open my profile</button>'+
      '<div class="sdscpa-profile-divider"><span>or</span></div>'+
      '<button type="button" class="sdscpa-profile-local">Local only</button>'+
      '<p class="sdscpa-profile-warning" id="sdscpa-profile-note"><strong>Warning:</strong> Local-only work stays in this browser. It will not transfer with an ID and may be lost if site data is cleared or this device is reset.</p>'+
    '</form>';
  document.body.appendChild(wrap);
  document.documentElement.classList.add('sdscpa-profile-locked');
  const form=wrap.querySelector('form'), input=wrap.querySelector('input');
  const error=wrap.querySelector('.sdscpa-profile-error'), button=wrap.querySelector('.sdscpa-profile-go');
  const localButton=wrap.querySelector('.sdscpa-profile-local');
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    error.textContent='';
    button.disabled=true;
    localButton.disabled=true;
    button.textContent='Opening…';
    try{
      await activateProfile(input.value);
      location.reload();
    }catch(e){
      error.textContent=e && e.message ? e.message : 'That profile could not be opened.';
      button.disabled=false;
      localButton.disabled=false;
      button.textContent='Open my profile';
      input.focus();
      input.select();
    }
  });
  localButton.addEventListener('click',()=>{
    error.textContent='';
    try{
      activateLocalOnly();
      location.reload();
    }catch(e){
      error.textContent=e && e.message ? e.message : 'Local-only mode could not be opened.';
    }
  });
  setTimeout(()=>input.focus(),0);
}

let cssDone=false;
function ensureCss(){
  if(cssDone) return; cssDone=true;
  const st=document.createElement('style');
  st.textContent =
'.sdscpa-modal-wrap{position:fixed;inset:0;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;z-index:9990;padding:16px}'+
'.sdscpa-modal{background:#16161c;border:1px solid #333;border-radius:14px;padding:22px 24px;max-width:520px;width:100%;color:#f0f0f0;font-family:system-ui,Segoe UI,sans-serif;box-shadow:0 18px 60px rgba(0,0,0,.6);max-height:86vh;display:flex;flex-direction:column}'+
'.sdscpa-modal h3{margin:0 0 8px;font-size:19px}'+
'.sdscpa-modal p{margin:0 0 14px;color:#aab;font-size:13.5px;line-height:1.55}'+
'.sdscpa-modal label{display:block;font-size:10.5px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:#888;margin-bottom:5px}'+
'.sdscpa-modal input[type=text],.sdscpa-modal input[type=search]{width:100%;box-sizing:border-box;background:#0a0a0a;border:1px solid #333;color:#f0f0f0;border-radius:8px;padding:9px 11px;font-size:14px;margin-bottom:14px}'+
'.sdscpa-modal input:focus{outline:none;border-color:#3b82f6}'+
'.sdscpa-modal-btns{display:flex;gap:10px;justify-content:flex-end;margin-top:4px}'+
'.sdscpa-btn-go{background:#3b82f6;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size:13.5px;font-weight:700;cursor:pointer}'+
'.sdscpa-btn-go:hover{background:#2f6fdb}'+
'.sdscpa-btn-dim{background:none;color:#888;border:1px solid #333;border-radius:8px;padding:9px 14px;font-size:13.5px;cursor:pointer}'+
'.sdscpa-btn-dim:hover{color:#fff;border-color:#555}'+
'.sdscpa-gloss{max-width:560px}'+
'.sdscpa-goal{background:#101822;border:1px solid #1f3a5f;border-radius:8px;padding:9px 12px;color:#cfe0f5!important}'+
'.sdscpa-gloss-list{margin:0;overflow-y:auto;flex:1;padding-right:4px}'+
'.sdscpa-term{padding:9px 2px;border-bottom:1px solid #26262c}'+
'.sdscpa-term dt{font-weight:700;font-size:13.5px;color:#fbbf24;margin:0 0 3px}'+
'.sdscpa-term dd{margin:0;font-size:13px;line-height:1.5;color:#c8c8d0}'+
'.sdscpa-gloss-pill{position:fixed;right:14px;bottom:14px;z-index:9980;background:#1a1a1a;color:#f0f0f0;border:1px solid #333;border-radius:999px;padding:8px 14px;font-size:12.5px;font-weight:700;cursor:pointer;box-shadow:0 4px 18px rgba(0,0,0,.5);font-family:system-ui,Segoe UI,sans-serif}'+
'.sdscpa-gloss-pill:hover{border-color:#3b82f6}'+
'.sdscpa-flash-q{font-size:14px;line-height:1.55;color:#e8e8f0;margin:6px 0 12px;font-style:italic}'+
'.sdscpa-flash-n{display:block;font-style:normal;font-size:10px;font-weight:800;letter-spacing:1.2px;color:#888;margin-bottom:6px}'+
'.sdscpa-flash-opt{display:block;width:100%;text-align:left;background:#0f0f14;border:1px solid #333;border-radius:8px;color:#f0f0f0;font-size:13px;font-weight:600;padding:10px 12px;margin-bottom:7px;cursor:pointer}'+
'.sdscpa-flash-opt:hover{border-color:#3b82f6}'+
'.sdscpa-flash-opt.good{border-color:#22c55e;background:rgba(34,197,94,.14)}'+
'.sdscpa-flash-opt.bad{border-color:#ef4444;background:rgba(239,68,68,.12)}'+
'.sdscpa-flash-fb{font-size:12px;color:#aab;min-height:16px;margin-top:4px}'+
'.sdscpa-flash-end{font-size:14px;line-height:1.6;color:#e8e8f0;text-align:center;padding:16px 0}'+
'.sdscpa-profile-locked{overflow:hidden}'+
'.sdscpa-profile-gate{position:fixed;inset:0;z-index:10050;display:flex;align-items:center;justify-content:center;padding:18px;background:#0a0a0a;background-image:radial-gradient(700px 420px at 50% 15%,rgba(59,130,246,.15),transparent 72%)}'+
'.sdscpa-profile-card{width:100%;max-width:410px;padding:28px;background:#16161c;border:1px solid #34343d;border-radius:16px;color:#f0f0f0;font-family:system-ui,Segoe UI,sans-serif;box-shadow:0 24px 80px rgba(0,0,0,.7)}'+
'.sdscpa-profile-mark{display:flex;width:46px;height:46px;align-items:center;justify-content:center;margin-bottom:18px;border-radius:11px;background:linear-gradient(135deg,#ED1C45,#92278F,#00AEEF);color:white;font:900 25px Arial,sans-serif}'+
'.sdscpa-profile-card h2{margin:0 0 7px;font-size:22px}'+
'.sdscpa-profile-card p{margin:0 0 18px;color:#aab;font-size:13.5px;line-height:1.55}'+
'.sdscpa-profile-card label{display:block;margin-bottom:6px;color:#fbbf24;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase}'+
'.sdscpa-profile-card input{width:100%;box-sizing:border-box;margin:0;background:#0a0a0a;border:1px solid #3d3d48;border-radius:9px;color:#fff;font:700 17px ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:1px;padding:12px 13px}'+
'.sdscpa-profile-card input:focus{outline:none;border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.16)}'+
'.sdscpa-profile-error{min-height:20px;padding-top:5px;color:#f87171;font-size:12px}'+
'.sdscpa-profile-go{width:100%;margin-top:5px;padding:11px 16px;background:#3b82f6;border:0;border-radius:9px;color:#fff;font-size:14px;font-weight:800;cursor:pointer}'+
'.sdscpa-profile-go:hover{background:#2f6fdb}'+
'.sdscpa-profile-go:disabled{opacity:.6;cursor:wait}'+
'.sdscpa-profile-divider{display:flex;align-items:center;gap:10px;margin:14px 0;color:#666;font-size:11px;text-transform:uppercase}'+
'.sdscpa-profile-divider:before,.sdscpa-profile-divider:after{content:"";height:1px;flex:1;background:#333}'+
'.sdscpa-profile-local{width:100%;padding:10px 16px;background:transparent;border:1px solid #555;border-radius:9px;color:#ddd;font-size:13px;font-weight:750;cursor:pointer}'+
'.sdscpa-profile-local:hover{border-color:#fbbf24;color:#fff}'+
'.sdscpa-profile-local:disabled{opacity:.6;cursor:wait}'+
'.sdscpa-profile-card .sdscpa-profile-warning{margin:11px 0 0;padding:9px 10px;border:1px solid rgba(251,191,36,.32);border-radius:8px;background:rgba(251,191,36,.07);color:#c6b98e;font-size:11.5px}'+
'.sdscpa-profile-card .sdscpa-profile-warning strong{color:#fbbf24}'+
'.sdscpa-sync-warning{position:fixed;left:12px;right:12px;bottom:12px;z-index:10020;max-width:680px;margin:auto;padding:10px 13px;border:1px solid #f59e0b;border-radius:8px;background:#291d08;color:#fde68a;font:600 12px/1.45 system-ui,Segoe UI,sans-serif;box-shadow:0 5px 24px rgba(0,0,0,.5)}'+
'.sdscpa-profile-switch{position:fixed;top:10px;right:12px;z-index:9985;padding:7px 11px;background:#1a1a1a;border:1px solid #444;border-radius:7px;color:#ddd;font:700 11px system-ui,Segoe UI,sans-serif;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.45)}'+
'.sdscpa-profile-switch.sdscpa-profile-switch-inline{position:static;flex:0 0 auto;margin-left:8px;box-shadow:none}'+
'.sdscpa-profile-switch-short{display:none}'+
'.sdscpa-profile-switch:hover{border-color:#fbbf24;color:#fff}'+
'@media(max-width:600px){.sdscpa-profile-switch{top:8px;right:8px;padding:6px 8px;font-size:10px}.sdscpa-profile-switch.sdscpa-profile-switch-inline{margin-left:2px}.sdscpa-profile-switch-full{display:none}.sdscpa-profile-switch-short{display:inline}.sdscpa-profile-card{padding:23px}}'+
'@media(max-width:340px){#topbar{gap:6px!important;padding-left:7px!important;padding-right:7px!important}.sdscpa-profile-switch.sdscpa-profile-switch-inline{margin-left:0!important}}'+
'@media(max-width:440px){#topbar .brand{display:none}}';
  document.head.appendChild(st);
}

window.SDSCPA = { getProgress, markDone, markIncomplete, certificate, certificateDialog, attachGlossary, openGlossary,
  activeProfile, activeProfileMode, activateProfile, activateLocalOnly, switchProfile, profileToken };
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mountProfileUi,{once:true});
else mountProfileUi();
})();
