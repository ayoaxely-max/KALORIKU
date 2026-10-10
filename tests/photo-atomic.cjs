const {JSDOM}=require('jsdom');const fidb=require('fake-indexeddb');const fs=require('fs');const assert=require('node:assert/strict');const {webcrypto}=require('node:crypto');
(async()=>{
 const dom=new JSDOM(fs.readFileSync('index.html','utf8').replace(/<script[^>]*><\/script>/g,''),{url:'https://test.local/',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;const E=code=>require('vm').runInContext(code,dom.getInternalVMContext());await new Promise(r=>w.addEventListener('load',r));
 w.indexedDB=fidb.indexedDB;w.IDBKeyRange=fidb.IDBKeyRange;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.structuredClone=structuredClone;Object.defineProperty(w,'crypto',{value:webcrypto});w.isSecureContext=true;w.matchMedia=()=>({matches:false});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 w.HTMLElement.prototype.scrollIntoView=function(){};w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};
 w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.fetch=async url=>{if(String(url).startsWith('./'))return {ok:true,json:async()=>JSON.parse(fs.readFileSync(String(url).slice(2),'utf8'))};throw Error('External request not mocked');};
 const errors=[];w.addEventListener("unhandledrejection",e=>e.preventDefault());w.addEventListener('error',e=>errors.push(e.message));
 for(const f of ['nutrition-tools.js','db.js','app.js','photo.js','ai-photo.js','v14.js','v15.js','v16.js','v17.js','v20.js','v24.js','v27.js','v28.js','v29.js','v210.js','v212.js'])E(fs.readFileSync(f,'utf8'));
 w.document.dispatchEvent(new w.Event('DOMContentLoaded',{bubbles:true}));
 for(let i=0;i<100&&!E('allFoods.length>2000');i++)await new Promise(r=>setTimeout(r,10));assert.equal(E('allFoods.length>2000'),true);

 w.scrollTo=()=>{};

 const originalAdd=fidb.IDBObjectStore.prototype.add,originalPut=fidb.IDBObjectStore.prototype.put;
 const food={id:'atomic-photo-food',name:'Atomic photo food',serving:'100 g',servingGrams:100,calories:100,protein:10,carbs:10,fat:2};w.testFood=food;
 const draft=()=>E("for(const d of document.querySelectorAll('dialog'))d.open=false;photoDraftBlob=new Blob(['test']);photoDraftItems=[{id:'photo-item-a',food:window.testFood,servingGrams:100,grams:0.1,qty:1},{id:'photo-item-b',food:window.testFood,servingGrams:100,grams:50,qty:1}];$('photoEntryDate').value=localDate();$('photoMeal').value='Makan Siang';$('photoDialog').showModal()");
 let count=0;const check=async(name,fn)=>{await fn();count++;console.log('PASS '+name)};
 await check('fractional photo amounts are never inflated',async()=>{assert.equal(E('photoItemQty({grams:0.1,servingGrams:100})'),0.001);assert.equal(E('photoItemQty({qty:0.005})'),0.005);draft();w.photoAmountChanged('photo-item-a','grams','0.1');assert.equal(E('photoDraftItems[0].grams'),0.1);assert.equal(w.document.querySelector('#photoSelected input').value,'0.1');});
 await check('invalid amount blocks save',async()=>{draft();E('photoDraftItems[0].grams=0');const n=(await E('dbAll("mealPhotos")')).length;await E('savePhotoMeal()');assert.equal((await E('dbAll("mealPhotos")')).length,n);assert.equal(w.document.getElementById('photoDialog').open,true)});
 await check('second intake failure rolls back photo, every log, revision and memory',async()=>{
  draft();const mem=E('JSON.stringify({logs,mealPhotos})'),beforeLogs=JSON.stringify(await E('dbAll("logs")')),beforePhotos=JSON.stringify(await E('dbAll("mealPhotos")')),revision=await E('dbGetKV("v24DataRevision",0)');let writes=0;
  fidb.IDBObjectStore.prototype.add=function(...args){if(this.name==='logs'&&++writes===2)throw Error('second log failure');return originalAdd.apply(this,args)};
  try{await E('savePhotoMeal()')}finally{fidb.IDBObjectStore.prototype.add=originalAdd}
  assert.equal(E('JSON.stringify({logs,mealPhotos})'),mem);assert.equal(JSON.stringify(await E('dbAll("logs")')),beforeLogs);assert.equal(JSON.stringify(await E('dbAll("mealPhotos")')),beforePhotos);assert.equal(await E('dbGetKV("v24DataRevision",0)'),revision);assert.equal(w.document.getElementById('photoDialog').open,true);assert.equal(E('photoDraftItems.length'),2);assert.equal(E('photoSaveBusy'),false);assert.equal(w.document.getElementById('savePhotoMealBtn').disabled,false);assert.match(w.document.getElementById('toast').textContent,/gagal disimpan/);
 });
 await check('retry and overlapping submit commit exactly one complete photo meal',async()=>{
  const revision=await E('dbGetKV("v24DataRevision",0)'),n=E('mealPhotos.length'),m=E('logs.length');await Promise.all([E('savePhotoMeal()'),E('savePhotoMeal()')]);assert.equal(E('mealPhotos.length'),n+1);assert.equal(E('logs.length'),m+2);assert.equal(await E('dbGetKV("v24DataRevision",0)'),revision+1);assert.equal(E('mealPhotos.at(-1).items[0].grams'),0.1);assert.equal(E('mealPhotos.at(-1).items[0].qty'),0.001);assert.equal(E('logs.at(-2).qty'),0.001);assert.equal(E('logs.at(-2).serving'),'0.1 g (foto)');
 });
 await check('edit failure leaves photo and log unchanged, keeps form for retry',async()=>{
  E("window.editId=logs.at(-2).id;editKaloriLog(window.editId);$('editLogUnit').value='gram';$('editLogAmount').value='0.5'");const mem=E('JSON.stringify({logs,mealPhotos})'),revision=await E('dbGetKV("v24DataRevision",0)'),beforeLogs=JSON.stringify(await E('dbAll("logs")')),beforePhotos=JSON.stringify(await E('dbAll("mealPhotos")'));
  fidb.IDBObjectStore.prototype.put=function(...args){if(this.name==='logs')throw Error('edit log failure');return originalPut.apply(this,args)};
  try{await E('v14SaveEdit({preventDefault(){}})')}finally{fidb.IDBObjectStore.prototype.put=originalPut}
  assert.equal(E('JSON.stringify({logs,mealPhotos})'),mem);assert.equal(JSON.stringify(await E('dbAll("logs")')),beforeLogs);assert.equal(JSON.stringify(await E('dbAll("mealPhotos")')),beforePhotos);assert.equal(await E('dbGetKV("v24DataRevision",0)'),revision);assert.equal(w.document.getElementById('editLogDialog').open,true);assert.equal(w.document.getElementById('editLogAmount').value,'0.5');assert.equal(E('v14EditBusy'),false);
 });
 await check('edit retry and double submit keep both records precise',async()=>{
  const revision=await E('dbGetKV("v24DataRevision",0)');await Promise.all([E('v14SaveEdit({preventDefault(){}})'),E('v14SaveEdit({preventDefault(){}})')]);assert.equal(await E('dbGetKV("v24DataRevision",0)'),revision+1);const l=E('logs.find(x=>x.id===window.editId)'),p=E('mealPhotos.find(x=>x.id===logs.find(l=>l.id===window.editId).mealPhotoId)');assert.equal(l.qty,0.005);assert.equal(p.items[0].qty,0.005);assert.equal(p.items[0].grams,0.5);assert.equal(l.serving,'0.5 g (foto)');assert.equal(p.items[0].total.cal,l.calories*l.qty);
 });
 await check('stale photo edit does not overwrite another committed change',async()=>{
  E("editKaloriLog(window.editId);$('editLogAmount').value='2';$('editLogUnit').value='porsi'");await E("dbPut('logs',{...logs.find(x=>x.id===window.editId),qty:3})");const revision=await E('dbGetKV("v24DataRevision",0)'),photo=JSON.stringify(await E('dbAll("mealPhotos")'));await E('v14SaveEdit({preventDefault(){}})');assert.equal(JSON.stringify(await E('dbAll("mealPhotos")')),photo);assert.equal(await E('dbGetKV("v24DataRevision",0)'),revision);assert.equal((await E('dbAll("logs")')).find(x=>x.id===w.editId).qty,3);assert.equal(w.document.getElementById('editLogDialog').open,true);assert.match(w.document.getElementById('toast').textContent,/Muat ulang/);
 });
 await check('camera-form cancellation is blocked while write is pending',async()=>{
  draft();const real=E('dbWritePhotoMeal');w.writeGate=null;w.gatedWrite=(...args)=>new Promise(resolve=>{w.writeGate=()=>real(...args).then(resolve)});E('dbWritePhotoMeal=window.gatedWrite');const pending=E('savePhotoMeal()');const event=new w.Event('cancel',{cancelable:true});w.document.getElementById('photoDialog').dispatchEvent(event);assert.equal(event.defaultPrevented,true);E('closePhotoMeal()');assert.equal(w.document.getElementById('photoDialog').open,true);w.writeGate();await pending;w.restoredWrite=real;E('dbWritePhotoMeal=window.restoredWrite');assert.equal(E('photoSaveBusy'),false);
 });
 assert.deepEqual(errors,[]);console.log('PHOTO REGRESSION '+count+' PASS');dom.window.close();
})().catch(e=>{console.error(e);process.exit(1)});
