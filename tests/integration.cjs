const {JSDOM}=require('jsdom');const fidb=require('fake-indexeddb');const fs=require('fs');const assert=require('node:assert/strict');const {webcrypto}=require('node:crypto');
(async()=>{
 const dom=new JSDOM(fs.readFileSync('index.html','utf8').replace(/<script[^>]*><\/script>/g,''),{url:'https://test.local/',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;const E=code=>require('vm').runInContext(code,dom.getInternalVMContext());await new Promise(r=>w.addEventListener('load',r));
 w.indexedDB=fidb.indexedDB;w.IDBKeyRange=fidb.IDBKeyRange;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.structuredClone=structuredClone;Object.defineProperty(w,'crypto',{value:webcrypto});w.isSecureContext=true;w.matchMedia=()=>({matches:false});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 w.HTMLElement.prototype.scrollIntoView=function(){};w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};
 w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.fetch=async url=>{if(String(url).startsWith('./'))return {ok:true,json:async()=>JSON.parse(fs.readFileSync(String(url).slice(2),'utf8'))};throw Error('External request not mocked');};
 const errors=[];w.addEventListener('error',e=>errors.push(e.message));
 for(const f of ['nutrition-tools.js','db.js','app.js','photo.js','ai-photo.js','v14.js','v15.js','v16.js','v17.js','v20.js','v24.js','v27.js','v28.js','v29.js','v210.js','v212.js'])E(fs.readFileSync(f,'utf8'));
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
 // Provenance cannot promote unverified TKPI or recipes into verified data.
 // Update button gives durable feedback, recovers after errors, and waits for installation.
 const mockRegistration={waiting:null,installing:null,update:async()=>{}};
 Object.defineProperty(w.navigator,'serviceWorker',{configurable:true,value:{controller:{},getRegistration:async()=>mockRegistration}});
 E('v28Registration=null;v28UpdateRequested=false;v28WaitingWorker=null');
 await E('v28CheckForUpdate()');assert.match(w.document.getElementById('v28CheckStatus').textContent,/Pemeriksaan selesai/);
 let finishUpdate;mockRegistration.update=()=>new Promise(resolve=>{finishUpdate=resolve});
 const checking=E('v28CheckForUpdate()');await new Promise(resolve=>setImmediate(resolve));assert.equal(w.document.getElementById('v28CheckUpdate').disabled,true);finishUpdate();await checking;assert.equal(w.document.getElementById('v28CheckUpdate').disabled,false);
 mockRegistration.update=async()=>{throw Error('network')};await E('v28CheckForUpdate()');assert.match(w.document.getElementById('v28CheckStatus').textContent,/gagal/);assert.equal(w.document.getElementById('v28CheckUpdate').disabled,false);
 mockRegistration.update=async()=>{};mockRegistration.waiting={postMessage(){}};await E('v28CheckForUpdate()');assert.match(w.document.getElementById('v28CheckStatus').textContent,/Versi baru siap/);assert.equal(w.document.getElementById('v28ProfileApply').classList.contains('hidden'),false);
 const installing=new w.EventTarget();installing.state='installing';w.testInstalling=installing;const installed=E('v28WaitForInstall(window.testInstalling)');installing.state='installed';installing.dispatchEvent(new w.Event('statechange'));await installed;
 await assert.rejects(E('v28WithTimeout(new Promise(()=>{}),5)'),/timeout/);
 Object.defineProperty(w.navigator,'onLine',{configurable:true,value:false});await E('v28CheckForUpdate()');assert.match(w.document.getElementById('v28CheckStatus').textContent,/offline/);Object.defineProperty(w.navigator,'onLine',{configurable:true,value:true});delete w.navigator.serviceWorker;
 E('v28Registration=null;v28WaitingWorker=null');
 assert.match(E("v29Quality({source_type:'tkpi',calories:100,protein:0,carbs:25,fat:0}).status"),/Belum diverifikasi/);
 assert.match(E("v29Quality({source_type:'tkpi',macro_verification_status:'primary_pdf_crosschecked',calories:100,protein:0,carbs:25,fat:0}).status"),/Energi dan makro/);
 assert.match(E("v29Quality({source_type:'estimate',calories:500,protein:0,carbs:0,fat:0}).warning"),/4–4–9/);
 assert.match(E("v29Quality({source_type:'label',calories:null,protein:0,carbs:0,fat:0}).warning"),/tidak valid/);
 assert.equal(E("v29SourceDetails({source_url:'javascript:alert(1)',name:'x'}).includes('href=')"),false);
 assert.match(E("v29Quality({source_type:'tkpi',macro_verification_status:'primary_pdf_crosschecked',verification_status:'printed_source_anomaly',calories:316,protein:60.1,carbs:22.4,fat:6.5}).warning"),/tercetak/);
 assert.match(E("v29SourceDetails({verification_note:'<script>bad</script>',usage_note:'Bahan kering'} )"),/&lt;script&gt;bad&lt;\/script&gt;/);
 E(`$('foodSearch').value='tleur goreng';renderAddResults();`);
 const suggestion=w.document.querySelector('#addResults .v29-suggestions button');assert.ok(suggestion);
 const suggestionCount=E('logs.length');suggestion.click();assert.equal(E('logs.length'),suggestionCount);assert.equal(w.document.querySelector('#addResults .v29-suggestions'),null);
 const favId=E('allFoods[0].id');await E('toggleFav(allFoods[0].id)');assert.ok((await E("dbGetKV('favorites')")).includes(favId));
 const favCount=E('logs.length');w.document.querySelector('#v29Favorites button').click();assert.equal(E('logs.length'),favCount);assert.equal(E("$('qtyInput').value"),'1');
 await E(`(async()=>{const f=allFoods[0];const l={id:'copy-source',date:offsetDate(localDate(),-1),meal:'Sarapan',foodId:f.id,name:f.name,serving:f.serving,qty:1,calories:f.calories,protein:f.protein,carbs:f.carbs,fat:f.fat,createdAt:1};await dbPut('logs',l);logs.push(l);const photo={...l,id:'copy-photo-source',mealPhotoId:'photo-copy'};await dbPut('logs',photo);logs.push(photo);})()`);
 const copyCount=E('logs.length');E('copyYesterday()');assert.equal(E('logs.length'),copyCount);assert.equal(w.document.querySelectorAll('#v29CopyRows > div').length,1);assert.match(w.document.getElementById('v29CopyNote').textContent,/1 item terkait foto/);
 E("$('v29CopyDialog').close()");assert.equal(E('logs.length'),copyCount);
 E('copyYesterday()');w.document.querySelector('[data-copy-qty]').value='2.5';
 await E('v29SaveCopy({preventDefault(){}})');assert.equal(E('logs.length'),copyCount+1);assert.equal(E('logs.at(-1).qty'),2.5);assert.equal(E('logs.at(-1).date'),E('localDate()'));assert.equal(E('logs.at(-1).mealPhotoId'),undefined);
 const copied=await E('v20Snapshot()');assert.deepEqual(Array.from(E('v17ValidateBackup').call(null,copied).errors),[]);
 E('copyYesterday()');await E(`dbPut('logs',{...v29CopyDraft[0],qty:7})`);const preStale=await E("dbAll('logs')");await E('v29SaveCopy({preventDefault(){}})');assert.equal((await E("dbAll('logs')")).length,preStale.length);assert.equal(w.document.getElementById('v29CopyDialog').open,true);
 assert.equal(E('logs.length'),copyCount+1);
 // Editing a recipe replaces its catalog entry and preserves recorded intake.
 E(`$('v29CopyDialog').close();for(const d of document.querySelectorAll('dialog'))d.open=false;`);
 const recipeBefore=E(`structuredClone(customFoods.find(f=>f.name==='Resep uji'))`),oldLog=E('structuredClone(logs.find(l=>l.foodId===customFoods.find(f=>f.name==="Resep uji").id))');
 const foodCount=E('customFoods.length');E(`v15EditProduct(customFoods.find(f=>f.name==='Resep uji').id);$('v24RecipePortions').value='4';$('v24CookedWeight').value='100';`);
 assert.equal(w.document.getElementById('v24RecipeDialog').open,true);await E('v24SaveRecipe({preventDefault(){}})');
 const edited=await E(`dbAll('customFoods')`),editedRecipe=edited.find(f=>f.id===recipeBefore.id);assert.equal(E('customFoods.length'),foodCount);assert.equal(editedRecipe.calories,recipeBefore.calories/2);assert.equal(editedRecipe.servingGrams,25);
 assert.deepEqual(JSON.parse(JSON.stringify(E('logs.find(l=>l.id==="'+oldLog.id+'")'))),JSON.parse(JSON.stringify(oldLog)));
 E(`v210OpenRecipe(customFoods.find(f=>f.name==='Resep uji').id);`);await E(`dbPut('customFoods',{...v210RecipeOriginal,name:'Changed elsewhere'})`);await E('v24SaveRecipe({preventDefault(){}})');assert.equal(w.document.getElementById('v24RecipeDialog').open,true);assert.match(w.document.getElementById('v24RecipePreview').textContent,/buka ulang/);
 E(`$('v24RecipeDialog').close();`);
 // Comparison reflects replacement semantics and legacy fields that stay intact.
 const diff=E(`v210RestoreDiff({logs:[{id:'a',qty:1},{id:'b',qty:1}],customFoods:[],weights:[],favorites:['a'],packs:[],foodMeasures:{a:{butir:10}},waterRecords:{'2026-10-01':500},profile:{age:30},waterGoal:2000},{logs:[{id:'a',qty:2},{id:'c',qty:1}],customFoods:[],weights:[],favorites:[],profile:{age:40}})`);
 assert.deepEqual(JSON.parse(JSON.stringify(diff.rows[0])),{label:'Catatan makanan',added:1,changed:1,removed:1,same:0});assert.equal(diff.rows.find(r=>r.label==='Hari catatan air').kept,true);assert.equal(diff.rows.find(r=>r.label==='Takaran pribadi').removed,1);assert.equal(diff.profileChanged,true);assert.equal(diff.waterGoalKept,true);
 const restoreSnapshot=await E('v20Snapshot()');w.reviewFile={name:'test-backup.json',size:100,text:async()=>JSON.stringify(restoreSnapshot)};
 await E('v17OpenRestorePreview(window.reviewFile)');assert.ok(E('v210RestoreRevision!==null'));assert.match(w.document.getElementById('v210RestoreDiff').textContent,/TambahUbahHapusSama/);
 const manualBefore=await E(`(async()=>{await dbPut('logs',{...logs[0],id:'new-after-manual-preview'});return (await dbAll('logs')).length;})()`);await E('v17ExecuteRestore()');assert.equal((await E("dbAll('logs')")).length,manualBefore);assert.match(w.document.getElementById('v17RestoreMessage').textContent,/Data lokal berubah/);
 E(`$('v17RestoreDialog').close()`);assert.equal(E('v210RestoreRevision'),null);
 // Closing while a file is being read cannot re-enable an obsolete preview.
 w.delayedFile={name:'delayed.json',size:100,text:()=>new Promise(resolve=>{w.finishFile=()=>resolve(JSON.stringify(restoreSnapshot))})};const pendingReview=E('v17OpenRestorePreview(window.delayedFile)');E(`$('v17RestoreDialog').close()`);w.finishFile();await pendingReview;assert.equal(E('v17PendingBackup'),null);assert.equal(w.document.getElementById('v17RestoreConfirm').disabled,true);
 E('v210ApplyTextSize("1.3")');assert.equal(w.document.documentElement.style.fontSize,'20.8px');E('v210ApplyTextSize("99")');assert.equal(w.document.documentElement.style.fontSize,'16px');
 const css=fs.readFileSync('styles.css','utf8');assert.ok(css.includes('min-height:44px'));assert.ok(css.includes('var(--v210-viewport-height'));assert.equal(w.document.getElementById('toast').getAttribute('aria-live'),'polite');
 Object.defineProperty(w,'visualViewport',{configurable:true,value:{height:300}});E("$('v24RecipeDialog').showModal()");w.document.getElementById('v24RecipeName').focus();E('v210Viewport()');assert.equal(w.document.body.classList.contains('v210-keyboard'),true);w.document.getElementById('v24RecipeName').blur();E('v210Viewport()');assert.equal(w.document.body.classList.contains('v210-keyboard'),false);
 // Dashboard dates keep calories, water, photos and new-entry dates coherent.
 E(`$('v24RecipeDialog').close();currentPage='today';logs=[{id:'dash-today',date:localDate(),meal:'Sarapan',name:'Data hari ini',qty:1,calories:100,protein:10,carbs:10,fat:2,createdAt:1},{id:'dash-yesterday',date:offsetDate(localDate(),-1),meal:'Sarapan',name:'Data kemarin',qty:1,calories:250,protein:20,carbs:30,fat:5,createdAt:2}];v15WaterRecords={[localDate()]:500,[offsetDate(localDate(),-1)]:250};mealPhotos=[];dashboardSetDate(localDate());`);
 assert.equal(w.document.getElementById('todayCal').textContent,'100');
 w.document.getElementById('dashboardYesterday').click();assert.equal(w.document.getElementById('todayCal').textContent,'250');assert.equal(w.document.getElementById('v15WaterConsumed').textContent,'250 ml');assert.match(w.document.getElementById('pageTitle').textContent,/Kemarin/);assert.equal(w.document.getElementById('copyYesterdayBtn').classList.contains('hidden'),true);
 E('openAdd()');assert.equal(w.document.getElementById('entryDate').value,E('offsetDate(localDate(),-1)'));E(`$('addDialog').close();openWeight()`);assert.equal(w.document.getElementById('weightDate').value,E('offsetDate(localDate(),-1)'));E(`$('weightDialog').close()`);
 await E('v15WaterChange(250)');assert.equal(E('v15WaterRecords[offsetDate(localDate(),-1)]'),500);assert.equal(E('v15WaterRecords[localDate()]'),500);
 w.URL.createObjectURL=()=> 'blob:test-dashboard';w.URL.revokeObjectURL=()=>{};
 E(`mealPhotos=[{id:'dash-photo-y',date:offsetDate(localDate(),-1),createdAt:1,note:'Foto kemarin',items:[],image:new Blob()}];renderPhotoMeals()`);assert.match(w.document.getElementById('todayPhotoMeals').textContent,/Foto kemarin/);
 w.document.getElementById('dashboardToday').click();assert.equal(w.document.getElementById('todayCal').textContent,'100');assert.equal(w.document.getElementById('todayPhotoMeals').textContent,'');assert.equal(w.document.getElementById('dashboardNext').disabled,true);
 E('dashboardSetDate(offsetDate(localDate(),1))');assert.equal(E('dashboardSelectedDate()'),E('localDate()'));E("dashboardSetDate('2026-02-30')");assert.equal(E('dashboardSelectedDate()'),E('localDate()'));
 w.document.getElementById('dashboardPrev').click();w.document.getElementById('dashboardNext').click();assert.equal(E('dashboardSelectedDate()'),E('localDate()'));
 const dashboardTestBar=w.document.getElementById('dashboardDateBar'),touch=(type,x,y)=>{const event=new w.Event(type);Object.defineProperty(event,type==='touchstart'?'touches':'changedTouches',{value:[{clientX:x,clientY:y}]});dashboardTestBar.dispatchEvent(event);};touch('touchstart',100,100);touch('touchend',180,105);assert.equal(E('dashboardSelectedDate()'),E('offsetDate(localDate(),-1)'));touch('touchstart',180,100);touch('touchend',100,105);assert.equal(E('dashboardSelectedDate()'),E('localDate()'));touch('touchstart',100,100);touch('touchend',110,200);assert.equal(E('dashboardSelectedDate()'),E('localDate()'));
 // Corner history follows the dashboard date; monthly data respects missing and zero values.
 w.scrollTo=()=>{};
 w.document.getElementById('dashboardHistory').click();assert.equal(E('historyDate'),E('dashboardSelectedDate()'));assert.equal(E('currentPage'),'history');
 E(`go('today');logs=[{date:'2024-02-29',qty:2,calories:100,protein:5,carbs:1,fat:1}];weights=[{date:'2024-02-29',weight:70.5}];v15WaterRecords={'2024-02-28':0,'2024-02-29':500};recapSelectedMonth='2024-02';renderRecap()`);
 assert.equal(E('recapData("2024-02").days.length'),29);assert.equal(E('recapData("2024-02").mean'),200);assert.equal(E('recapData("2024-02").protein'),10);assert.equal(E('recapData("2024-02").water'),250);assert.equal(E('recapData("2024-02").days[0].cal'),null);assert.equal(E('recapData("2024-02").days[28].weight'),70.5);
 assert.equal(E('recapShift("2024-01",-1)'),'2023-12');assert.equal(E('recapData("2023-02").days.length'),28);assert.equal(E('recapData("2023-02").mean'),null);assert.equal(E('recapData("2024-13")'),null);
 w.document.getElementById('recapNext').click();assert.equal(E('recapSelectedMonth'),'2024-03');w.document.getElementById('recapPrev').click();assert.equal(E('recapSelectedMonth'),'2024-02');
 w.document.querySelector('[data-recap-date="2024-02-29"]').click();assert.equal(E('historyDate'),'2024-02-29');
 E(`go('today');recapSelectedMonth=localDate().slice(0,7);logs=[];renderToday()`);assert.equal(w.document.getElementById('recapNext').disabled,true);assert.match(w.document.getElementById('recapSummary').textContent,/0 hari/);
 // Barcode lookup distinguishes API absence, incomplete nutrients and connection failures.
 const barcodeFetch=w.fetch;
 E(`$('scannerDialog').showModal()`);
 w.fetch=async()=>({ok:false,status:404});await E("lookupBarcode('8998866204385')");assert.match(w.document.getElementById('scanStatus').textContent,/8998866204385.*belum tersedia/);assert.equal(w.document.getElementById('manualBarcode').value,'8998866204385');
 w.fetch=async()=>{throw new TypeError('Network failed')};await E("lookupBarcode('8998866204385')");assert.match(w.document.getElementById('scanStatus').textContent,/Koneksi.*gagal/);assert.equal(w.document.getElementById('manualLookup').disabled,false);
 w.fetch=async()=>({ok:false,status:503});await E("lookupBarcode('8998866204385')");assert.match(w.document.getElementById('scanStatus').textContent,/HTTP 503/);
 const barcodeCount=E('customFoods.length');w.fetch=async()=>({ok:true,status:200,json:async()=>({product:{product_name:'Produk parsial',nutriments:{'energy-kcal_100g':100}}})});await E("lookupBarcode('8998866204385')");assert.match(w.document.getElementById('scanStatus').textContent,/belum lengkap/);assert.equal(E('customFoods.length'),barcodeCount);
 w.document.getElementById('barcodeAddLabel').click();assert.equal(w.document.getElementById('customDialog').open,true);assert.equal(w.document.getElementById('customBarcode').value,'8998866204385');assert.equal(w.document.getElementById('customName').value,'Produk parsial');E("$('customDialog').close();$('scannerDialog').showModal()");
 let finishBarcode;w.fetch=()=>new Promise(resolve=>{finishBarcode=resolve});const pendingBarcode=E("lookupBarcode('8998866204385')");E('stopScanner()');finishBarcode({ok:false,status:404});await pendingBarcode;assert.equal(w.document.getElementById('scannerDialog').open,false);assert.equal(w.document.getElementById('manualLookup').disabled,false);
 w.fetch=async()=>({ok:true,status:200,json:async()=>({product:{product_name:'Produk lengkap uji',nutriments:{'energy-kcal_100g':100,proteins_100g:0,carbohydrates_100g:25,fat_100g:0}}})});E("$('scannerDialog').showModal()");await E("lookupBarcode('8998866204385')");assert.equal(E("customFoods.find(f=>f.barcode==='8998866204385').protein"),0);assert.equal(w.document.getElementById('foodSearch').value,'Produk lengkap uji');
 w.fetch=async()=>{throw Error('Local lookup must not use network')};await E("lookupBarcode('8 998866 204385')");assert.equal(w.document.getElementById('foodSearch').value,'Produk lengkap uji');
 await E("lookupBarcode('abc')");assert.match(w.document.getElementById('scanStatus').textContent,/8–14 digit/);w.fetch=barcodeFetch;
 // Regression: use complete 100g data if serving nutrition is partial; never mix bases.
 const barcodeRegressionFetch=w.fetch;
 w.fetch=async()=>({ok:true,status:200,json:async()=>({product:{product_name:'Basis 100g uji',serving_size:'30 g',nutriments:{'energy-kcal_serving':30,'energy-kcal_100g':100,proteins_100g:5,carbohydrates_100g:15,fat_100g:2}}})});
 await E("lookupBarcode('8990000000013')");assert.equal(E("customFoods.find(f=>f.barcode==='8990000000013').serving"),'100 g/ml');assert.equal(E("customFoods.find(f=>f.barcode==='8990000000013').calories"),100);assert.equal(E("customFoods.find(f=>f.barcode==='8990000000013').protein"),5);
 w.fetch=async()=>({ok:true,status:200,json:async()=>({product:{product_name:'Basis porsi uji',serving_size:'30 g',nutriments:{'energy-kcal_serving':30,proteins_serving:0,carbohydrates_serving:6,fat_serving:1,'energy-kcal_100g':100,proteins_100g:5,carbohydrates_100g:15,fat_100g:2}}})});
 await E("lookupBarcode('8990000000044')");assert.equal(E("customFoods.find(f=>f.barcode==='8990000000044').serving"),'30 g');assert.equal(E("customFoods.find(f=>f.barcode==='8990000000044').calories"),30);assert.equal(E("customFoods.find(f=>f.barcode==='8990000000044').protein"),0);
 // Regression: editing a barcode cannot attach a previous product name to the new number.
 E("$('addDialog').close();$('scannerDialog').showModal()");
 w.fetch=async()=>({ok:true,status:200,json:async()=>({product:{product_name:'Produk A',nutriments:{}}})});await E("lookupBarcode('8990000000020')");
 w.document.getElementById('manualBarcode').value='8990000000037';w.document.getElementById('barcodeAddLabel').click();assert.equal(w.document.getElementById('customDialog').open,false);assert.match(w.document.getElementById('scanStatus').textContent,/berubah/);
 await E("lookupBarcode('8990000000020')");w.document.getElementById('manualBarcode').value='8990000000037';w.document.getElementById('manualBarcode').dispatchEvent(new w.Event('input'));assert.equal(w.document.getElementById('barcodeAddLabel').classList.contains('hidden'),true);assert.equal(E('barcodeProductName'),'');
 let finishEditedBarcode;w.fetch=()=>new Promise(resolve=>{finishEditedBarcode=resolve});const oldBarcode=E("lookupBarcode('8990000000020')");w.document.getElementById('manualBarcode').value='8990000000037';w.document.getElementById('manualBarcode').dispatchEvent(new w.Event('input'));finishEditedBarcode({ok:true,status:200,json:async()=>({product:{product_name:'Nama lama',nutriments:{}}})});await oldBarcode;assert.equal(w.document.getElementById('barcodeAddLabel').classList.contains('hidden'),true);assert.match(w.document.getElementById('scanStatus').textContent,/berubah/);assert.equal(w.document.getElementById('manualLookup').disabled,false);
 w.fetch=async()=>({ok:true,status:200,json:async()=>({product:{product_name:'Produk B',nutriments:{}}})});await E("lookupBarcode('8990000000037')");w.document.getElementById('barcodeAddLabel').click();assert.equal(w.document.getElementById('customName').value,'Produk B');assert.equal(w.document.getElementById('customBarcode').value,'8990000000037');E("$('customDialog').close()");w.fetch=barcodeRegressionFetch;
 // Regression: zero-water days and empty months are consistent across reports.
 E("logs=[];v15WaterRecords={'2024-02-01':0,'2024-02-02':500,'2024-02-30':900,'2024-02-03':null,'2024-02-04':-5}");assert.equal(E('recapData("2024-02").water'),250);assert.equal(E('v17MonthReport("2024-02").waterMean'),250);assert.equal(E('v17MonthReport("2024-02").waterDays'),2);assert.equal(E('recapData("2024-01").water'),null);assert.equal(E('v17MonthReport("2024-01").waterMean'),null);
 E("v15WaterRecords={'2024-02-01':0}");assert.equal(E('recapData("2024-02").water'),0);assert.equal(E('v17MonthReport("2024-02").waterMean'),0);
 E("v15WaterRecords={[localDate()]:500,[offsetDate(localDate(),1)]:1000}");assert.equal(E('recapData(localDate().slice(0,7)).water'),500);assert.equal(E('v17MonthReport(localDate().slice(0,7)).waterMean'),500);
 // Closing either form must not persist valid data or be blocked by required fields.
 E("$('customForm').reset();$('customName').value='Batal produk';$('customServing').value='100 g';$('customCal').value='100';$('customP').value='0';$('customC').value='25';$('customF').value='0';openCustom()");
 const cancelFoods=E('customFoods.length'),cancelStoredFoods=(await E("dbAll('customFoods')")).length;
 w.document.querySelector('#customForm .sheet-head button').click();assert.equal(w.document.getElementById('customDialog').open,false);assert.equal(E('customFoods.length'),cancelFoods);assert.equal((await E("dbAll('customFoods')")).length,cancelStoredFoods);
 E("$('customForm').reset();openCustom()");w.document.querySelector('#customForm .sheet-head button').click();assert.equal(w.document.getElementById('customDialog').open,false);
 E("$('weightDate').value='2024-03-01';$('weightValue').value='71';$('weightDialog').showModal()");
 const cancelWeights=E('JSON.stringify(weights)'),cancelStoredWeights=JSON.stringify(await E("dbAll('weights')"));
 w.document.querySelector('#weightForm .sheet-head button').click();assert.equal(w.document.getElementById('weightDialog').open,false);assert.equal(E('JSON.stringify(weights)'),cancelWeights);assert.equal(JSON.stringify(await E("dbAll('weights')")),cancelStoredWeights);
 E("$('weightValue').value='';$('weightDialog').showModal()");w.document.querySelector('#weightForm .sheet-head button').click();assert.equal(w.document.getElementById('weightDialog').open,false);
 // Explicit Save still persists the weight and updates the monthly view.
 E("$('weightDate').value='2024-03-01';$('weightValue').value='71';$('weightDialog').showModal()");await E('saveWeight({preventDefault(){}})');assert.equal((await E("dbAll('weights')")).find(x=>x.date==='2024-03-01').weight,71);
 // Pack writes roll back all items and sync revision on a second-item failure.
 E("packs=[{id:'atomic-pack',items:[{foodId:'p1',name:'Paket satu',qty:1,calories:100},{foodId:'p2',name:'Paket dua',qty:1,calories:200}]}];$('entryDate').value=localDate();$('mealSelect').value='Makan Siang'");
 const packMemory=E('JSON.stringify(logs)'),packStorage=JSON.stringify(await E("dbAll('logs')")),packRevision=await E("dbGetKV('v24DataRevision',0)");
 const originalPut=fidb.IDBObjectStore.prototype.put,originalAdd=fidb.IDBObjectStore.prototype.add;let packWrites=0;
 fidb.IDBObjectStore.prototype.add=function(...args){if(this.name==='logs'&&++packWrites===2)throw Error('Second pack item failed');return originalAdd.apply(this,args)};
 try{await E("addPack('atomic-pack')")}finally{fidb.IDBObjectStore.prototype.add=originalAdd}
 assert.equal(E('JSON.stringify(logs)'),packMemory);assert.equal(JSON.stringify(await E("dbAll('logs')")),packStorage);assert.equal(await E("dbGetKV('v24DataRevision',0)"),packRevision);assert.match(w.document.getElementById('toast').textContent,/Paket gagal disimpan/);assert.equal(E('packSaveBusy'),false);
 // Two overlapping calls save exactly one pack; retry after rollback is complete.
 await Promise.all([E("addPack('atomic-pack')"),E("addPack('atomic-pack')")]);
 assert.equal(E("logs.filter(l=>l.foodId==='p1').length"),1);assert.equal(E("logs.filter(l=>l.foodId==='p2').length"),1);assert.equal((await E("dbAll('logs')")).filter(l=>l.foodId==='p1').length,1);assert.equal(await E("dbGetKV('v24DataRevision',0)"),packRevision+1);
 // A weight storage failure retains the form and values without changing data.
 E("$('weightDate').value='2024-03-02';$('weightValue').value='72';$('weightDialog').showModal()");
 const weightMemory=E('JSON.stringify(weights)'),weightStorage=JSON.stringify(await E("dbAll('weights')"));
 fidb.IDBObjectStore.prototype.put=function(...args){if(this.name==='weights')throw Error('Weight storage failed');return originalPut.apply(this,args)};
 try{await E('saveWeight({preventDefault(){}})')}finally{fidb.IDBObjectStore.prototype.put=originalPut}
 assert.equal(E('JSON.stringify(weights)'),weightMemory);assert.equal(JSON.stringify(await E("dbAll('weights')")),weightStorage);assert.equal(w.document.getElementById('weightDialog').open,true);assert.equal(w.document.getElementById('weightValue').value,'72');assert.match(w.document.getElementById('weightSaveStatus').textContent,/gagal disimpan/);assert.equal(w.document.querySelector('#weightForm button[type=submit]').disabled,false);
 let weightWrites=0;fidb.IDBObjectStore.prototype.put=function(...args){if(this.name==='weights')weightWrites++;return originalPut.apply(this,args)};
 try{await Promise.all([E('saveWeight({preventDefault(){}})'),E('saveWeight({preventDefault(){}})')])}finally{fidb.IDBObjectStore.prototype.put=originalPut}
 assert.equal(weightWrites,1);assert.equal(w.document.getElementById('weightDialog').open,false);assert.equal((await E("dbAll('weights')")).find(x=>x.date==='2024-03-02').weight,72);assert.equal(E('weightSaveBusy'),false);
 assert.deepEqual(errors,[]);console.log('DOM + IndexedDB integration PASS: measures, recipe, gram log/edit, encrypted merge, water conflicts, atomic stale-revision rollback.');dom.window.close();
})().catch(e=>{console.error(e);process.exit(1);});
