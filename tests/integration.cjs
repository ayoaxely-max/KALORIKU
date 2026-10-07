const {JSDOM}=require('jsdom');const fidb=require('fake-indexeddb');const fs=require('fs');const assert=require('node:assert/strict');const {webcrypto}=require('node:crypto');
(async()=>{
 const dom=new JSDOM(fs.readFileSync('index.html','utf8').replace(/<script[^>]*><\/script>/g,''),{url:'https://test.local/',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;const E=code=>require('vm').runInContext(code,dom.getInternalVMContext());await new Promise(r=>w.addEventListener('load',r));
 w.indexedDB=fidb.indexedDB;w.IDBKeyRange=fidb.IDBKeyRange;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.structuredClone=structuredClone;Object.defineProperty(w,'crypto',{value:webcrypto});w.isSecureContext=true;w.matchMedia=()=>({matches:false});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.fetch=async url=>{if(String(url).startsWith('./'))return {ok:true,json:async()=>JSON.parse(fs.readFileSync(String(url).slice(2),'utf8'))};throw Error('External request not mocked');};
 const errors=[];w.addEventListener('error',e=>errors.push(e.message));
 for(const f of ['nutrition-tools.js','db.js','app.js','photo.js','ai-photo.js','v14.js','v15.js','v16.js','v17.js','v20.js','v24.js','v27.js','v28.js'])E(fs.readFileSync(f,'utf8'));
 w.document.dispatchEvent(new w.Event('DOMContentLoaded',{bubbles:true}));
 for(let i=0;i<100&&!E('allFoods.length>2000');i++)await new Promise(r=>setTimeout(r,10));assert.equal(E('allFoods.length>2000'),true);
 await E(`(async()=>{v24OpenMeasure(allFoods.find(f=>f.name==='Tempe garit goreng').id);$('v24MeasureFields').querySelector('[data-measure="potong"]').value='60';await v24SaveMeasure({preventDefault(){}});})()`);
 assert.equal(E('Object.values(foodMeasures).some(x=>x.potong===60)'),true);
 await E(`(async()=>{$('v24RecipeOpen').click();$('v24RecipeName').value='Resep uji';const f=allFoods.find(f=>f.name==='Telur rebus (1 butir)');v24Ingredients=[{food:f,grams:100}];$('v24CookedWeight').value='90';$('v24RecipePortions').value='2';await v24SaveRecipe({preventDefault(){}});openAdd();$('qtyUnit').value='gram';$('qtyInput').value='45';await addFood(customFoods.find(f=>f.name==='Resep uji').id);})()`);
 assert.equal(E('logs[0].qty'),1);
 await E(`(async()=>{$('addDialog').close();editKaloriLog(logs[0].id);$('editLogUnit').value='gram';$('editLogAmount').value='90';await v14SaveEdit({preventDefault(){}});})()`);assert.equal(E('logs[0].qty'),2);
 await E(`(async()=>{const local=await v20Snapshot(),cloud=structuredClone(local);cloud.logs.push({...local.logs[0],id:'cloud-only',qty:1});cloud.waterRecords[localDate()]=750;await dbSetKV('v15WaterRecords',{[localDate()]:500});v15WaterRecords={[localDate()]:500};v20Secret='A'.repeat(43);v20AccountId='test';v20Token='test';const payload=await v20Encrypt(cloud);v20Api=async route=>route==='/sync/manifest'?{active:true,chunks:1,bytes:payload.length,upload:'test',revision:1}:route.startsWith('/sync/read')?{revision:1,data:payload}:{ok:true};await v20Download();})()`);
 assert.match(w.document.getElementById('v24MergeConflicts').textContent,/1 entri baru/);
 E(`$('v20BackupConfirmed').checked=true;v25RefreshMerge();`);assert.equal(w.document.getElementById('v20ReviewContinue').disabled,true);
 for(const select of w.document.querySelectorAll('#v25ConflictList select')){select.value='local';select.dispatchEvent(new w.Event('change'));}
 assert.equal(w.document.getElementById('v20ReviewContinue').disabled,false);
 await E('v20ReviewContinue()');assert.equal(E('logs.length'),2);assert.equal(E('v15WaterRecords[localDate()]'),500);assert.equal(E('v20Downloaded'),null);
 const guard=await E(`(async()=>{const s=await v20Snapshot();v24RestoreRevision=v24SnapshotRevision;await dbPut('logs',{...s.logs[0],id:'new-during-review'});v17PendingBackup=s;await v17ExecuteRestore();v24RestoreRevision=null;return {count:(await dbAll('logs')).length,pending:!!v17PendingBackup,message:$('v17RestoreMessage').textContent};})()`);assert.equal(guard.count,3);assert.equal(guard.pending,true);assert.match(guard.message,/Data lokal berubah/);
 await E(`(async()=>{const entry={...logs[0],id:'undo-test',name:'Nama makanan sangat panjang '.repeat(10)};await dbPut('logs',entry);logs.push(entry);await window.removeLog(entry.id);})()`);
 const bar=w.document.getElementById('v15UndoBar');assert.equal(w.getComputedStyle(bar).position,'static');assert.equal(bar.parentElement.className,'app-shell');assert.equal(bar.classList.contains('hidden'),false);assert.equal(E('logs.some(l=>l.id==="undo-test")'),false);
 await E('v15UndoDelete()');assert.equal(E('logs.some(l=>l.id==="undo-test")'),true);assert.equal(bar.classList.contains('hidden'),true);
 await E('window.removeLog("undo-test")');w.document.getElementById('v15UndoClose').click();assert.equal(bar.classList.contains('hidden'),true);assert.equal(E('logs.some(l=>l.id==="undo-test")'),false);
 const deletionCheck=await E(`(async()=>{const state=(await dbGetKV('v25DeletionStates',[])).find(s=>s.field==='logs'&&s.key==='undo-test');const old={...logs[0],id:'restore-test'};await dbPut('logs',old);logs.push(old);const backup=await v20Snapshot();await window.removeLog(old.id);v17PendingBackup=backup;await v17ExecuteRestore();return {deleted:state.deleted,restored:(await dbAll('logs')).some(l=>l.id===old.id),restoreState:(await dbGetKV('v25DeletionStates',[])).find(s=>s.key===old.id),valid:v17ValidateBackup(await v20Snapshot()).errors};})()`);assert.equal(deletionCheck.deleted,true);assert.equal(deletionCheck.restored,true);assert.equal(deletionCheck.restoreState.deleted,false);assert.deepEqual(Array.from(deletionCheck.valid),[]);
 const oldPhotoBase=await E(`(async()=>{const record={id:'legacy-photo',date:localDate(),meal:'Makan Siang',items:[{foodId:'legacy-food',name:'Legacy photo food',serving:'100 g',servingGrams:100,qty:.5,calories:200,protein:10,carbs:20,fat:8}],createdAt:1};const log={id:'legacy-log',mealPhotoId:record.id,foodId:'legacy-food',name:'Legacy photo food',serving:'50 g (foto)',qty:.5,date:localDate(),meal:'Makan Siang',calories:200,protein:10,carbs:20,fat:8,createdAt:1};mealPhotos.push(record);logs.push(log);await dbPut('mealPhotos',record);await dbPut('logs',log);return v14ServingGrams(log);})()`);assert.equal(oldPhotoBase,100);
 // Repeating prepares the normal entry form without silently creating a log.
 E(`renderToday();$('addDialog').close();`);
 const beforeRepeat=E('logs.length');w.document.querySelector('#v27RepeatList button').click();
 assert.equal(E('logs.length'),beforeRepeat);assert.equal(w.document.getElementById('addDialog').open,true);assert.equal(w.document.getElementById('qtyUnit').value,'porsi');assert.equal(w.document.getElementById('entryDate').value,E('localDate()'));assert.ok(Number(w.document.getElementById('qtyInput').value)>0);
 E(`$('foodSearch').value='tleur goreng';renderAddResults();`);assert.match(w.document.getElementById('addResults').textContent,/Ejaan mendekati/);
 E(`$('dbSearch').value='telur goreng';renderDatabase();`);assert.match(w.document.getElementById('dbResults').textContent,/Cocok kata/);
 await E('v27RenderSync()');assert.match(w.document.getElementById('v27SyncActivity').textContent,/Hasil gabungan belum diunggah/);
 const uploadState=await E(`(async()=>{const baseline=await dbGetKV('v24DataRevision',0);let mutated=false;v20KnownRevision=10;v20Api=async route=>{if(route==='/sync/head')return {active:true,revision:10};if(route==='/sync/chunk'&&!mutated){mutated=true;await dbPut('logs',{...logs[0],id:'during-upload'});}return {ok:true,revision:11};};await v20Upload();await v27RenderSync();return {baseline,state:await dbGetKV('v27SyncActivity:test'),revision:await dbGetKV('v24DataRevision',0),text:$('v27SyncActivity').textContent};})()`);
 assert.equal(uploadState.state.uploadedLocalRevision,uploadState.baseline);assert.equal(uploadState.revision-uploadState.baseline,1);assert.equal(uploadState.state.needsUpload,false);assert.match(uploadState.text,/1 perubahan lokal/);assert.ok(uploadState.state.lastUpload);assert.ok(uploadState.state.lastDownload);
 const previousUpload=uploadState.state.lastUpload;
 await E(`(async()=>{v20Api=async()=>{throw Error('Network test failure')};await v20Upload();})()`);assert.equal((await E("dbGetKV('v27SyncActivity:test')")).lastUpload,previousUpload);
 E(`v20AccountId='other-account';`);await E('v27RenderSync()');assert.match(w.document.getElementById('v27SyncActivity').textContent,/Belum ada unggahan/);assert.doesNotMatch(w.document.getElementById('v27SyncActivity').textContent,/Hasil gabungan/);

 // Inline measures persist and keep the other personal units.
 E(`$('dbSearch').value='Telur rebus';renderDatabase();`);
 const measureBox=w.document.querySelector('#dbResults .v28-measure');assert.ok(measureBox);
 const measureId=measureBox.dataset.food;
 measureBox.querySelector('[data-v28unit]').value='butir';measureBox.querySelector('[data-v28grams]').value='55';await E('v28SaveInline(document.querySelector("#dbResults .v28-measure"))');
 assert.equal((await E("dbGetKV('foodMeasures')"))[measureId].butir,55);
 const weekly=E(`v28WeeklyData([{date:localDate(),qty:1,calories:0,protein:0,carbs:0,fat:0},{date:offsetDate(localDate(),-1),qty:2,calories:100,protein:10,carbs:0,fat:0}],[{date:offsetDate(localDate(),-6),weight:70},{date:localDate(),weight:69}])`);
 assert.equal(weekly.recorded,2);assert.equal(weekly.calories,100);assert.equal(weekly.protein,10);assert.equal(weekly.weightChange,-1);assert.equal(weekly.days.filter(d=>!d.recorded).length,5);
 assert.equal(E('v28WeeklyData([],[]).calories'),null);assert.equal(E('v28WeeklyData([],[]).weightChange'),null);
 E('renderStats()');assert.match(w.document.getElementById('v15WeeklySummary').textContent,/Belum dicatat/);assert.match(w.document.getElementById('v15WeeklySummary').textContent,/Rerata protein/);assert.match(w.document.getElementById('avg7').textContent,/hari tercatat/);
 // Pending updates require a click, and a form or cloud operation blocks reload.
 E(`v28WaitingWorker={postMessage:()=>{window.updateMessageCount=(window.updateMessageCount||0)+1}};v20Busy=false;v17Restoring=false;`);
 for(const d of w.document.querySelectorAll('dialog'))d.open=false;
 w.document.getElementById('addDialog').open=true;E('v28ApplyUpdate()');assert.equal(w.updateMessageCount,undefined);
 w.document.getElementById('addDialog').open=false;const openMeasure=w.document.querySelector('.v28-measure');openMeasure.open=true;E('v28ApplyUpdate()');assert.equal(w.updateMessageCount,undefined);openMeasure.open=false;E('v20Busy=true;v28ApplyUpdate()');assert.equal(w.updateMessageCount,undefined);
 E('v20Busy=false;v28ApplyUpdate()');assert.equal(w.updateMessageCount,1);assert.equal(E('v28UpdateRequested'),true);
 const sw=fs.readFileSync('sw.js','utf8');assert.ok(sw.includes("event.data?.type==='SKIP_WAITING'"));assert.ok(!sw.slice(sw.indexOf("self.addEventListener('install'"),sw.indexOf("self.addEventListener('message'")).includes('skipWaiting'));
 assert.deepEqual(errors,[]);console.log('DOM + IndexedDB integration PASS: measures, recipe, gram log/edit, encrypted merge, water conflicts, atomic stale-revision rollback.');dom.window.close();
})().catch(e=>{console.error(e);process.exit(1);});
