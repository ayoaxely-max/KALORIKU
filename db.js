const DB_NAME='kaloriku-pwa';const DB_VERSION=2;let _db;
function dbOpen(){if(_db)return Promise.resolve(_db);return new Promise((res,rej)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('kv'))d.createObjectStore('kv',{keyPath:'key'});if(!d.objectStoreNames.contains('logs')){const s=d.createObjectStore('logs',{keyPath:'id'});s.createIndex('date','date',{unique:false});s.createIndex('createdAt','createdAt',{unique:false})}if(!d.objectStoreNames.contains('customFoods'))d.createObjectStore('customFoods',{keyPath:'id'});if(!d.objectStoreNames.contains('weights'))d.createObjectStore('weights',{keyPath:'date'});if(!d.objectStoreNames.contains('mealPhotos')){const p=d.createObjectStore('mealPhotos',{keyPath:'id'});p.createIndex('date','date',{unique:false});p.createIndex('createdAt','createdAt',{unique:false})}};r.onsuccess=()=>{_db=r.result;_db.onversionchange=()=>{_db.close();_db=null};res(_db)};r.onerror=()=>rej(r.error)})}
async function tx(store,mode='readonly'){const d=await dbOpen();return d.transaction(store,mode).objectStore(store)}
async function dbGetKV(key,def=null){return new Promise(async(res,rej)=>{const s=await tx('kv');const r=s.get(key);r.onsuccess=()=>res(r.result?.value??def);r.onerror=()=>rej(r.error)})}
const v24DataKeys=new Set(['profile','favorites','packs','v15WaterRecords','v15WaterGoal','foodMeasures','v25DeletionStates']);
async function dbMutation(store,action,changesData=true,syncOperations=[]){
 const d=await dbOpen();
 return new Promise((resolve,reject)=>{
  const t=d.transaction(store==='kv'?['kv']:[store,'kv'],'readwrite');
  t.oncomplete=()=>{if(changesData)window.dispatchEvent(new Event('kaloriku:datachanged'));resolve();};t.onabort=()=>reject(t.error||Error('Transaksi dibatalkan'));t.onerror=()=>{};
  try{action(t.objectStore(store));v25WriteDeletionStates(t,syncOperations);if(changesData){const kv=t.objectStore('kv'),r=kv.get('v24DataRevision');r.onsuccess=()=>kv.put({key:'v24DataRevision',value:(Number(r.result?.value)||0)+1});}}catch(e){t.abort();reject(e);}
 });
}
async function dbSetKV(key,value){return dbMutation('kv',s=>s.put({key,value}),v24DataKeys.has(key));}
async function dbAll(store){return new Promise(async(res,rej)=>{const s=await tx(store);const r=s.getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})}
function v25WriteDeletionStates(transaction,operations){
 if(!operations.length)return;
 const kv=transaction.objectStore('kv'),request=kv.get('v25DeletionStates');
 request.onsuccess=()=>{try{let states=request.result?.value||[];
  for(const op of operations){const old=states.find(x=>x.field===op.field&&x.key===op.key);
   if(op.deleted||old?.deleted)states=NutritionTools.nextDeletion(states,op.field,op.key,op.deleted);
  }
  kv.put({key:'v25DeletionStates',value:states});
 }catch(e){transaction.abort();}
 };
}
async function dbPut(store,value){await dbMutation(store,s=>s.put(value),true,NutritionTools.syncFields.includes(store)?[{field:store,key:store==='weights'?value.date:value.id,deleted:false}]:[]);return value;}
async function dbDelete(store,key){return dbMutation(store,s=>s.delete(key),true,NutritionTools.syncFields.includes(store)?[{field:store,key,deleted:true}]:[]);}
async function dbDeleteMany(entries){
 const d=await dbOpen();
 return new Promise((resolve,reject)=>{
  const transaction=d.transaction([...new Set(entries.map(e=>e.store).concat('kv'))],'readwrite');
  transaction.oncomplete=()=>{window.dispatchEvent(new Event('kaloriku:datachanged'));resolve();};transaction.onabort=()=>reject(transaction.error||Error('Penghapusan dibatalkan'));transaction.onerror=()=>{};
  try{for(const e of entries)transaction.objectStore(e.store).delete(e.key);
   v25WriteDeletionStates(transaction,entries.filter(e=>NutritionTools.syncFields.includes(e.store)).map(e=>({field:e.store,key:e.key,deleted:true})));
   const kv=transaction.objectStore('kv'),r=kv.get('v24DataRevision');r.onsuccess=()=>kv.put({key:'v24DataRevision',value:(Number(r.result?.value)||0)+1});
  }catch(e){transaction.abort();reject(e);}
 });
}
async function dbClear(store){
 const items=await dbAll(store);return dbDeleteMany(items.map(x=>({store,key:store==='kv'?x.key:store==='weights'?x.date:x.id})));
}
async function dbLogsByDate(date){return new Promise(async(res,rej)=>{const s=await tx('logs');const r=s.index('date').getAll(IDBKeyRange.only(date));r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})}
// Review and save a copied menu atomically, including a source-record guard.
async function dbPutLogsReviewed(entries,sources){
 const d=await dbOpen();
 return new Promise((resolve,reject)=>{
  const t=d.transaction(['logs','kv'],'readwrite'),s=t.objectStore('logs');
  t.oncomplete=()=>{window.dispatchEvent(new Event('kaloriku:datachanged'));resolve();};t.onabort=()=>reject(t.error||Error('Catatan asal berubah'));t.onerror=()=>{};
  try{
   for(const old of sources){const request=s.get(old.id);request.onsuccess=()=>{if(NutritionTools.canonical(request.result)!==NutritionTools.canonical(old))t.abort();};}
   for(const entry of entries)s.add(entry);
   v25WriteDeletionStates(t,entries.map(l=>({field:'logs',key:l.id,deleted:false})));
   const kv=t.objectStore('kv'),revision=kv.get('v24DataRevision');revision.onsuccess=()=>kv.put({key:'v24DataRevision',value:(Number(revision.result?.value)||0)+1});
  }catch(e){t.abort();reject(e);}
 });
}
