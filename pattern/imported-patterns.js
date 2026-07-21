/* Local PDF pattern importer.
   Source pattern artwork stays in the user's browser (IndexedDB) and is never
   copied into this project. PDF rendering is provided by the bundled PDF.js. */
(function(){
  'use strict';

  const DB_NAME='sdscpa-pattern-imports';
  const STORE='patterns';
  const TARGET_DPI=120;
  const MAX_CANVAS_PIXELS=45_000_000;

  const OLEANDER_GUIDE=`## Before sewing

- The source pattern includes a 1/2-inch seam allowance and sizes 0/2 through 28/30.
- Suggested fabrics include crepe, jacquard, mikado, brocade, cotton sateen, or linen.
- Gather fusible interfacing, four ribbon ties, and a 24-inch invisible zipper.

## Step 1: Stabilize the bodice

Fuse interfacing to the outer upper-bodice pieces. Add bra cups to the lining if desired.

## Step 2: Assemble the upper bodice

Join each side-front to the center front at the princess seams. Add the side-back and center-back pieces. Press seams open and repeat for the lining.

## Step 3: Assemble the lower bodice

Join the lower front and back sections at the side seams. Press, then repeat for the lining.

## Step 4: Join upper and lower bodice

Sew the upper bodice to the lower bodice. Press the allowance downward and topstitch if desired.

## Steps 5-7: Add ribbon straps and lining

Cut four ribbon pieces at least 18 inches long. Staystitch one at each upper princess seam. Sew the lined and outer bodices together along the upper edge, enclosing the ribbons; clip curves, turn, and press.

## Steps 8-9: Build the skirt

Insert pockets into the skirt side seams, then join the skirt panels. Fold each pleat notch toward its marked center point and staystitch the pleats with pockets facing forward.

## Steps 10-12: Finish the waist and zipper

Attach the outer bodice to the skirt. Install the invisible zipper at center back, close the remaining seam, then turn under the bodice lining and slipstitch it along the zipper and waist.

## Step 13: Hem

Finish the skirt with a 1-inch hem.`;

  // Known sources can pre-fill an import without occupying the catalog. The
  // native Oleander generator uses its own key; importing the publisher PDF
  // creates a separate fixed reference pattern instead of replacing it.
  const sourcePresets={
    oleanderSource:{
      key:'imported-oleander-source',
      name:'Oleander Source PDF',
      description:'The fixed multi-size publisher PDF, imported locally as a reference pattern.',
      difficulty:3,
      tags:['dresses','imported'],
      techniques:['princess-seams','lining','pleats','in-seam-pockets','invisible-zipper'],
      illustration:'illustrations/oleander.svg',
      sourceUrl:'https://blog.moodfabrics.com/the-oleander-dress-free-sewing-pattern/',
      sourceLabel:'Mood Fabrics - Oleander Dress',
      filename:/MDF246.*Oleander|Oleander.*Pattern/i,
      columns:6,
      rows:5,
      skipPages:1,
      category:'dresses',
      sizeRange:'0/2-28/30',
      seamAllowanceMM:12.7,
      instructions:OLEANDER_GUIDE,
    }
  };
  const catalog={};

  const runtime={};
  let aboutRef=null, dataRef=null, callbacks={}, pendingPreset=null, pendingFile=null, detectedPages=0;

  function openDb(){
    return new Promise((resolve,reject)=>{
      if(!window.indexedDB){ reject(new Error('Browser storage is unavailable')); return; }
      const request=indexedDB.open(DB_NAME,1);
      request.onupgradeneeded=()=>request.result.createObjectStore(STORE,{keyPath:'key'});
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error('Could not open pattern storage'));
    });
  }
  async function dbGetAll(){
    const db=await openDb();
    return await new Promise((resolve,reject)=>{
      const request=db.transaction(STORE,'readonly').objectStore(STORE).getAll();
      request.onsuccess=()=>resolve(request.result||[]);
      request.onerror=()=>reject(request.error);
    }).finally(()=>db.close());
  }
  async function dbPut(record){
    const db=await openDb();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put(record);
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error);
    }).finally(()=>db.close());
  }

  function aboutFromPreset(preset){
    return {
      name:preset.name,
      description:preset.description,
      difficulty:preset.difficulty,
      tags:preset.tags.slice(),
      techniques:preset.techniques.slice(),
      imported:true,
      sourceUrl:preset.sourceUrl||'',
      sourceLabel:preset.sourceLabel||'',
      illustration:preset.illustration||'illustrations/imported.svg',
      sizeRange:preset.sizeRange||'',
      seamAllowanceMM:preset.seamAllowanceMM||0,
    };
  }
  function registerCatalog(about,data){
    aboutRef=about; dataRef=data;
    for(const preset of Object.values(catalog)){
      about[preset.key]=aboutFromPreset(preset);
      if(preset.instructions) data.instructions[preset.key]=preset.instructions;
    }
  }
  function registerRecord(record){
    runtime[record.key]=record;
    if(aboutRef) aboutRef[record.key]=record.about;
    if(dataRef && record.instructions) dataRef.instructions[record.key]=record.instructions;
  }
  async function restore(){
    try{
      const records=await dbGetAll();
      records.forEach(registerRecord);
      return records.length;
    }catch(error){
      console.warn('Imported pattern storage unavailable',error);
      return 0;
    }
  }

  function slug(value){
    return String(value||'pattern').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50)||'pattern';
  }
  function xml(value){
    return String(value==null?'':value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
  }
  function dataUriToBytes(value){ return value.length; }

  function renderSvg(key,studentName){
    const record=runtime[key];
    if(!record) return null;
    const width=record.widthMM, height=record.heightMM;
    const label=String(studentName||'').trim().slice(0,60);
    let watermarks='';
    if(label){
      const font=Math.max(7,Math.min(14,Math.min(record.pageWidthMM,record.pageHeightMM)*.065));
      for(let row=0;row<record.rows;row++) for(let col=0;col<record.columns;col++){
        const x=(col+.5)*record.pageWidthMM, y=(row+.5)*record.pageHeightMM;
        watermarks+='<text x="'+x+'" y="'+y+'" text-anchor="middle" dominant-baseline="middle" transform="rotate(-28 '+x+' '+y+')" font-family="Arial,sans-serif" font-size="'+font+'" font-weight="700" letter-spacing="1" fill="#4b5563" fill-opacity=".22" data-student-watermark="true">'+xml(label)+'</text>';
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'+width+'mm" height="'+height+'mm" viewBox="0 0 '+width+' '+height+'">'+
      '<rect width="100%" height="100%" fill="#fff"/><image x="0" y="0" width="'+width+'" height="'+height+'" preserveAspectRatio="none" href="'+record.imageData+'"/>'+watermarks+'</svg>';
  }

  function setStatus(message,error){
    const node=document.getElementById('importStatus');
    if(node){ node.textContent=message; node.classList.toggle('error',!!error); }
  }
  function setBusy(busy){
    const button=document.getElementById('importSubmit');
    const cancel=document.getElementById('importCancel');
    if(button){ button.disabled=busy; button.textContent=busy?'Importing...':'Import pattern'; }
    if(cancel) cancel.disabled=busy;
  }
  function field(id,value){ const node=document.getElementById(id); if(node) node.value=value; }
  function detectPreset(fileName){ return Object.values(sourcePresets).find(item=>item.filename&&item.filename.test(fileName))||null; }

  async function inspectFile(file){
    if(!window.pdfjsLib) throw new Error('The PDF importer did not load');
    const task=pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())});
    try{
      const pdf=await task.promise;
      const page=await pdf.getPage(1);
      const viewport=page.getViewport({scale:1});
      return {pages:pdf.numPages,widthMM:viewport.width/72*25.4,heightMM:viewport.height/72*25.4};
    }finally{ await task.destroy(); }
  }

  async function prepareFile(file){
    if(!file) return;
    pendingFile=file;
    const preset=pendingPreset||detectPreset(file.name);
    pendingPreset=preset;
    setStatus('Reading PDF...'); setBusy(true);
    try{
      const info=await inspectFile(file);
      detectedPages=info.pages;
      const skip=preset?preset.skipPages:0;
      const columns=preset?preset.columns:1;
      const rows=preset?preset.rows:Math.max(1,info.pages-skip);
      field('importName',preset?preset.name:file.name.replace(/\.pdf$/i,'').replace(/[-_]+/g,' '));
      field('importColumns',columns); field('importRows',rows); field('importSkip',skip);
      field('importDifficulty',preset?preset.difficulty:3);
      field('importCategory',preset?preset.category:'costumes');
      setStatus(info.pages+' pages detected - page size '+(info.widthMM/25.4).toFixed(2)+' x '+(info.heightMM/25.4).toFixed(2)+' in.');
      document.getElementById('importDialog').showModal();
    }catch(error){
      setStatus(String(error.message||error),true);
      callbacks.toast?.('Could not read that PDF: '+String(error.message||error),true);
    }finally{ setBusy(false); }
  }

  async function importPdf(file,config,onProgress){
    const bytes=new Uint8Array(await file.arrayBuffer());
    const task=pdfjsLib.getDocument({data:bytes});
    let pdf;
    try{
      pdf=await task.promise;
      const required=config.columns*config.rows;
      if(config.skipPages+required>pdf.numPages) throw new Error('This layout needs '+required+' pattern pages after skipping '+config.skipPages+', but the PDF has only '+pdf.numPages+' pages.');
      const first=await pdf.getPage(config.skipPages+1);
      const base=first.getViewport({scale:1});
      const basePixels=base.width*config.columns*base.height*config.rows;
      const dpi=Math.min(TARGET_DPI,72*Math.sqrt(MAX_CANVAS_PIXELS/basePixels));
      const scale=dpi/72;
      const viewport=first.getViewport({scale});
      const pageW=Math.round(viewport.width), pageH=Math.round(viewport.height);
      const canvas=document.createElement('canvas');
      canvas.width=pageW*config.columns; canvas.height=pageH*config.rows;
      const context=canvas.getContext('2d',{alpha:false});
      context.fillStyle='#fff'; context.fillRect(0,0,canvas.width,canvas.height);
      const pageCanvas=document.createElement('canvas'); pageCanvas.width=pageW; pageCanvas.height=pageH;
      const pageContext=pageCanvas.getContext('2d',{alpha:false});
      for(let index=0;index<required;index++){
        onProgress?.(index,required);
        const page=index===0?first:await pdf.getPage(config.skipPages+index+1);
        const vp=page.getViewport({scale});
        if(Math.abs(vp.width-viewport.width)>1||Math.abs(vp.height-viewport.height)>1) throw new Error('All imported pattern pages must have the same dimensions.');
        pageContext.save(); pageContext.fillStyle='#fff'; pageContext.fillRect(0,0,pageW,pageH); pageContext.restore();
        await page.render({canvasContext:pageContext,viewport:vp,background:'#fff'}).promise;
        context.drawImage(pageCanvas,(index%config.columns)*pageW,Math.floor(index/config.columns)*pageH);
      }
      onProgress?.(required,required);
      const imageData=canvas.toDataURL('image/png');
      const pageWidthMM=base.width/72*25.4, pageHeightMM=base.height/72*25.4;
      const preset=config.preset;
      const key=preset?preset.key:'imported-'+slug(config.name);
      const generic={
        name:config.name,
        description:'A fixed-size pattern imported locally from '+file.name+'. Measurements and design options are preserved from the source PDF.',
        difficulty:config.difficulty,
        tags:[config.category,'imported'], techniques:['imported-pdf'], imported:true,
        sourceUrl:'', sourceLabel:'Local PDF', illustration:'illustrations/imported.svg', sizeRange:'', seamAllowanceMM:0,
      };
      const record={
        key,name:config.name,about:preset?aboutFromPreset(preset):generic,
        instructions:preset?.instructions||'',
        originalFileName:file.name,columns:config.columns,rows:config.rows,skipPages:config.skipPages,
        pageCount:pdf.numPages,pageWidthMM,pageHeightMM,widthMM:pageWidthMM*config.columns,heightMM:pageHeightMM*config.rows,
        dpi:Number(dpi.toFixed(1)),imageData,bytes:dataUriToBytes(imageData),importedAt:new Date().toISOString(),
      };
      registerRecord(record);
      try{ await dbPut(record); }catch(error){ console.warn('Could not persist imported pattern',error); }
      canvas.width=canvas.height=pageCanvas.width=pageCanvas.height=0;
      return record;
    }finally{ await task.destroy(); }
  }

  function requestImport(presetKey){
    pendingPreset=presetKey?(catalog[presetKey]||sourcePresets[presetKey]||Object.values(sourcePresets).find(item=>item.key===presetKey)||null):null;
    pendingFile=null; detectedPages=0;
    const input=document.getElementById('patternPdfFile');
    input.value=''; input.click();
  }

  function initUI(options){
    callbacks=options||{};
    if(window.pdfjsLib){
      pdfjsLib.GlobalWorkerOptions.workerSrc=new URL('vendor/pdfjs/pdf.worker.min.js',location.href).href;
    }
    document.getElementById('btnImportPdf').onclick=()=>requestImport(null);
    document.getElementById('patternPdfFile').onchange=event=>prepareFile(event.target.files&&event.target.files[0]);
    document.getElementById('importCancel').onclick=()=>document.getElementById('importDialog').close();
    document.getElementById('importForm').onsubmit=async event=>{
      event.preventDefault();
      if(!pendingFile) return;
      const number=id=>Number(document.getElementById(id).value);
      const config={
        preset:pendingPreset,name:document.getElementById('importName').value.trim()||'Imported pattern',
        columns:Math.max(1,Math.round(number('importColumns'))),rows:Math.max(1,Math.round(number('importRows'))),
        skipPages:Math.max(0,Math.round(number('importSkip'))),difficulty:Math.max(1,Math.min(5,Math.round(number('importDifficulty')))),
        category:document.getElementById('importCategory').value,
      };
      if(config.columns*config.rows>detectedPages-config.skipPages){ setStatus('The grid needs more pages than this PDF provides.',true); return; }
      setBusy(true);
      try{
        const record=await importPdf(pendingFile,config,(done,total)=>setStatus(done===total?'Compressing assembled pattern...':'Assembling page '+(done+1)+' of '+total+'...'));
        document.getElementById('importDialog').close();
        callbacks.onImported?.(record.key);
        callbacks.toast?.(record.name+' imported at '+record.dpi+' dpi.');
      }catch(error){
        console.error('PDF import failed',error); setStatus(String(error.message||error),true);
      }finally{ setBusy(false); }
    };
  }

  window.PatternImports={
    catalog,sourcePresets,runtime,registerCatalog,restore,initUI,requestImport,renderSvg,
    isImported:key=>!!catalog[key]||!!runtime[key],
    hasLoaded:key=>!!runtime[key],
    get:key=>runtime[key]||null,
    names:base=>[...new Set([...Object.keys(base).filter(key=>key!=='library'),...Object.keys(catalog),...Object.keys(runtime)])],
    illustration:key=>(runtime[key]?.about||catalog[key])?.illustration||'illustrations/imported.svg',
  };
})();
