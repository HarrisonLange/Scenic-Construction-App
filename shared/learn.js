/* SDSCPA shared learning helpers — progress, certificates, glossary.
   Loaded by every lab via <script src="../shared/learn.js"></script>.
   Keep dependency-free; labs are otherwise standalone. */
(function(){
'use strict';
const KEY = 'sdscpa_progress';

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
  }catch(e){}
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
'.sdscpa-flash-end{font-size:14px;line-height:1.6;color:#e8e8f0;text-align:center;padding:16px 0}';
  document.head.appendChild(st);
}

window.SDSCPA = { getProgress, markDone, certificate, certificateDialog, attachGlossary, openGlossary };
})();
