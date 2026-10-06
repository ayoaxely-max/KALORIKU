const DB_NAME='kaloriku-pwa';const DB_VERSION=2;let _db;
function dbOpen(){if(_db)return Promise.resolve(_db);return new Promise((res,rej)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('kv'))d.createObjectStore('kv',{keyPath:'key'});if(!d.objectStoreNames.contains('logs')){const s=d.createObjectStore('logs',{keyPath:'id'});s.createIndex('date','date',{unique:false});s.createIndex('createdAt','createdAt',{unique:false})}if(!d.objectStoreNames.contains('customFoods'))d.createObjectStore('customFoods',{keyPath:'id'});if(!d.objectStoreNames.contains('weights'))d.createObjectStore('weights',{keyPath:'date'});if(!d.objectStoreNames.contains('mealPhotos')){const p=d.createObjectStore('mealPhotos',{keyPath:'id'});p.createIndex('date','date',{unique:false});p.createIndex('createdAt','createdAt',{unique:false})}};r.onsuccess=()=>{_db=r.result;_db.onversionchange=()=>{_db.close();_db=null};res(_db)};r.onerror=()=>rej(r.error)})}
async function tx(store,mode='readonly'){const d=await dbOpen();return d.transaction(store,mode).objectStore(store)}
async function dbGetKV(key,def=null){return new Promise(async(res,rej)=>{const s=await tx('kv');const r=s.get(key);r.onsuccess=()=>res(r.result?.value??def);r.onerror=()=>rej(r.error)})}
const v24DataKeys=new Set(['profile','favorites','packs','v15WaterRecords','v15WaterGoal','foodMeasures']);
async function dbMutation(store,action,changesData=true){
 const d=await dbOpen();
 return new Promise((resolve,reject)=>{
  const t=d.transaction(store==='kv'?['kv']:[store,'kv'],'readwrite');
  t.oncomplete=()=>resolve();t.onabort=()=>reject(t.error||Error('Transaksi dibatalkan'));t.onerror=()=>{};
  try{action(t.objectStore(store));if(changesData){const kv=t.objectStore('kv'),r=kv.get('v24DataRevision');r.onsuccess=()=>kv.put({key:'v24DataRevision',value:(Number(r.result?.value)||0)+1});}}catch(e){t.abort();reject(e);}
 });
}
async function dbSetKV(key,value){return dbMutation('kv',s=>s.put({key,value}),v24DataKeys.has(key));}
async function dbAll(store){return new Promise(async(res,rej)=>{const s=await tx(store);const r=s.getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})}
async function dbPut(store,value){await dbMutation(store,s=>s.put(value));return value;}
async function dbDelete(store,key){return dbMutation(store,s=>s.delete(key));}
async function dbClear(store){return dbMutation(store,s=>s.clear());}
async function dbLogsByDate(date){return new Promise(async(res,rej)=>{const s=await tx('logs');const r=s.index('date').getAll(IDBKeyRange.only(date));r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})}