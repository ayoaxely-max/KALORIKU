/* Opt-in live API test. Uses two isolated IndexedDB instances and a random test-only account.
   No user recovery codes or personal data. Requires curl + network to the sync endpoint. */
const {JSDOM}=require('jsdom'),{IDBFactory,IDBKeyRange}=require('fake-indexeddb');
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto'),{execFile}=require('node:child_process'),{promisify}=require('node:util');
const execute=promisify(execFile),origin='https://ayoaxely-max.github.io';
async function device(){
 const dom=new JSDOM(fs.readFileSync('index.html','utf8').replace(/<script[^>]*><\/script>/g,''),{url:origin+'/KALORIKU/',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;await new Promise(r=>w.addEventListener('load',r));const E=code=>vm.runInContext(code,dom.getInternalVMContext());
 w.Blob=Blob;w.FileReader=class{readAsDataURL(blob){blob.arrayBuffer().then(bytes=>{this.result='data:'+blob.type+';base64,'+Buffer.from(bytes).toString('base64');this.onload?.();},error=>{this.error=error;this.onerror?.();});}};
 w.indexedDB=new IDBFactory();w.IDBKeyRange=IDBKeyRange;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.structuredClone=structuredClone;Object.defineProperty(w,'crypto',{value:webcrypto});w.isSecureContext=true;w.matchMedia=()=>({matches:false});w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});
 let offline=false;
 w.fetch=async (url,request={})=>{
  if(String(url).startsWith('./'))return {ok:true,json:async()=>JSON.parse(fs.readFileSync(String(url).slice(2),'utf8'))};
  if(String(url).startsWith('data:')){const [prefix,data]=url.split(',');return {ok:true,blob:async()=>new w.Blob([Buffer.from(data,'base64')],{type:prefix.split(':')[1].split(';')[0]})};}
  if(offline)throw Error('Synthetic connection interruption');
  const args=['--silent','--show-error','--max-time','30','-w','\n%{http_code}','-X',request.method||'GET','-H','Origin: '+origin];
  for(const [key,value] of Object.entries(request.headers||{}))args.push('-H',key+': '+value);
  if(request.body!==undefined)args.push('--data-binary',request.body);
  args.push(String(url));const {stdout}=await execute('curl',args,{maxBuffer:16000000});const newline=stdout.lastIndexOf('\n'),status=Number(stdout.slice(newline+1)),body=stdout.slice(0,newline);return {ok:status>=200&&status<300,status,json:async()=>JSON.parse(body)};
 };
 for(const f of ['nutrition-tools.js','db.js','app.js','photo.js','ai-photo.js','v14.js','v15.js','v16.js','v17.js','v20.js','v24.js'])E(fs.readFileSync(f,'utf8'));
 w.document.dispatchEvent(new w.Event('DOMContentLoaded',{bubbles:true}));for(let i=0;i<100&&!E('allFoods.length>2000');i++)await new Promise(r=>setTimeout(r,10));assert.equal(E('allFoods.length>2000'),true);
 return {E,dom,offline:value=>{offline=value;}};
}
async function review(d,choices={}){const {E}=d;await E('v20Download()');assert.equal(E('!!v20Downloaded'),true);E(`for(const c of v24MergePreview.merged.conflicts)v25ConflictChoices[c.id]='cloud';`);for(const [key,value] of Object.entries(choices))E(`v25ConflictChoices[${JSON.stringify(key)}]=${JSON.stringify(value)};`);E(`v25RefreshMerge();$('v20BackupConfirmed').checked=true;`);await E('v20ReviewContinue()');assert.equal(E('v20Downloaded'),null);}
(async()=>{
 if(process.env.RUN_LIVE_SYNC!=='1'){console.log('Live cloud test skipped. Run RUN_LIVE_SYNC=1 node tests/live-sync.cjs.');return;}
 const a=await device(),b=await device();let attached=false;
 try{
  const secret=webcrypto.getRandomValues(new Uint8Array(32));const code=Buffer.from(secret).toString('base64url');await a.E(`v20Attach(${JSON.stringify(code)},true)`);attached=true;
  await a.E(`(async()=>{const date=localDate(),f={id:'recipe-test',name:'Synthetic recipe',category:'Resep pribadi',serving:'1 porsi (100 g)',servingGrams:100,calories:200,protein:10,carbs:20,fat:8,recipe:{ingredients:[],cookedGrams:100,portions:1},source_type:'user'};await dbPut('customFoods',f);customFoods.push(f);allFoods=[...staticFoods,...customFoods];for(const id of ['shared1','shared2','delete-me']){const l={id,date,meal:'Makan Siang',foodId:f.id,name:f.name,serving:f.serving,servingGrams:100,qty:1,calories:200,protein:10,carbs:20,fat:8,createdAt:1};await dbPut('logs',l);logs.push(l);}await dbPut('weights',{date,weight:70});weights=[{date,weight:70}];await dbSetKV('foodMeasures',{'recipe-test':{porsi:100}});foodMeasures={'recipe-test':{porsi:100}};const image=new Blob([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='),c=>c.charCodeAt(0))],{type:'image/png'});const photo={id:'photo-test',date,meal:'Makan Siang',note:'Synthetic photo',image,items:[{id:'pi-test',foodId:f.id,name:f.name,serving:f.serving,servingGrams:100,qty:1,calories:200,protein:10,carbs:20,fat:8,total:{cal:200,p:10,c:20,f:8}}],createdAt:1};await dbPut('mealPhotos',photo);mealPhotos.push(photo);const log={...logs[0],id:'photo-log',mealPhotoId:photo.id,photoItemId:'pi-test'};await dbPut('logs',log);logs.push(log);})()`);
  await a.E('v20Upload()');assert.equal(a.E('v20KnownRevision'),1,a.E("$('v20Status').textContent"));
  await b.E(`v20Attach(${JSON.stringify(code)})`);await b.E('v20Upload()');assert.match(b.E("$('v20Status').textContent"),/diblokir/);await review(b);assert.equal(b.E('logs.length'),4);assert.ok(b.E('mealPhotos[0].image.size')>0);assert.equal(b.E('customFoods[0].recipe.cookedGrams'),100);
  await a.E(`(async()=>{for(const [id,qty] of [['shared1',2],['shared2',4]]){const l={...logs.find(l=>l.id===id),qty};await dbPut('logs',l);logs=logs.map(old=>old.id===id?l:old);}await dbSetKV('v15WaterRecords',{[localDate()]:500});await dbSetKV('foodMeasures',{'recipe-test':{porsi:110}});editKaloriLog('photo-log');$('editLogUnit').value='porsi';$('editLogAmount').value='2';await v14SaveEdit({preventDefault(){}});})()`);
  await b.E(`(async()=>{for(const [id,qty] of [['shared1',3],['shared2',5]]){const l={...logs.find(l=>l.id===id),qty};await dbPut('logs',l);logs=logs.map(old=>old.id===id?l:old);}await window.removeLog('delete-me');if(v15UndoTimer)clearTimeout(v15UndoTimer);await dbSetKV('v15WaterRecords',{[localDate()]:750});await dbPut('weights',{date:localDate(),weight:71});await dbSetKV('foodMeasures',{'recipe-test':{porsi:90}});editKaloriLog('photo-log');$('editLogUnit').value='porsi';$('editLogAmount').value='3';await v14SaveEdit({preventDefault(){}});})()`);
  await b.E('v20Upload()');assert.equal(b.E('v20KnownRevision'),2);await a.E('v20Upload()');assert.match(a.E("$('v20Status').textContent"),/diblokir/);
  const id=(field,key)=>JSON.stringify([field,key]);const date=a.E('localDate()');await review(a,{[id('logs','shared1')]:'cloud',[id('logs','shared2')]:'local',[id('waterRecords',date)]:'cloud',[id('weights',date)]:'local',[id('mealPhotos','photo-test')]:'cloud'});
  assert.equal(a.E('logs.some(l=>l.id===\"delete-me\")'),false);assert.equal(a.E('logs.find(l=>l.id===\"shared1\").qty'),3);assert.equal(a.E('logs.find(l=>l.id===\"shared2\").qty'),4);assert.equal(a.E('logs.find(l=>l.id===\"photo-log\").qty'),3);assert.equal(a.E('mealPhotos[0].items[0].qty'),3);assert.equal(a.E('v15WaterRecords[localDate()]'),750);assert.equal(a.E('weights[0].weight'),70);
  await a.E('v20Upload()');assert.equal(a.E('v20KnownRevision'),3);await review(b);assert.equal(b.E('logs.find(l=>l.id===\"shared2\").qty'),4);assert.equal(b.E('logs.some(l=>l.id===\"delete-me\")'),false);
  // Undo the deletion on its originating device, then propagate the higher marker revision.
  await b.E('v15UndoDelete()');assert.equal(b.E('logs.some(l=>l.id===\"delete-me\")'),true);await b.E('v20Upload()');assert.equal(b.E('v20KnownRevision'),4);await review(a);assert.equal(a.E('logs.some(l=>l.id===\"delete-me\")'),true);
  const before=await a.E('v20Snapshot()');a.offline(true);await a.E('v20Download()');assert.match(a.E("$('v20Status').textContent"),/Unduhan gagal/);a.offline(false);assert.equal(a.E('logs.length'),before.logs.length);
  await a.E('v20Upload()');assert.equal(a.E('v20KnownRevision'),5);
  const revisionGuard=await a.E(`(async()=>{const m=await v20Api('/sync/manifest');try{await v20Api('/sync/commit',{method:'POST',data:{uploadId:m.upload,total:m.chunks,expectedRevision:m.revision-1}});return 0;}catch(e){return e.status;}})()`);assert.equal(revisionGuard,409);
  console.log('LIVE CLOUD PASS: two isolated stores; AES-GCM upload/download; recipe + photo + measures; mixed per-record choices; deletion propagation; undo propagation; stale revision rejected; interrupted connection preserves local data.');
 }finally{
  if(attached){try{a.offline(false);await a.E(`(async()=>{const h=await v20Api('/sync/head');if(h.active)await v20Api('/sync/delete',{method:'POST',data:{confirm:'DELETE CLOUD',expectedRevision:h.revision}});})()`);console.log('Test ciphertext cleaned from cloud.');}catch{console.log('Test account cleanup could not be confirmed.');}}
  a.dom.window.close();b.dom.window.close();
 }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
