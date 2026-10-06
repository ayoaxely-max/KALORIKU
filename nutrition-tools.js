/* Pure calculations shared by UI and regression tests. Never infer grams from ml. */
const NutritionTools=(()=>{
 const units=['porsi','sdm','sdt','centong','potong','gelas','butir','buah'];
 const positive=n=>typeof n==='number'&&Number.isFinite(n)&&n>0;
 function servingGrams(f,overrides={}){
  if(positive(overrides.porsi))return overrides.porsi;
  if(positive(f.servingGrams))return f.servingGrams;
  const m=String(f.serving||'').replace(',','.').match(/(\d+(?:\.\d+)?)\s*g\b/i);
  return m&&Number(m[1])>0?Number(m[1]):null;
 }
 function measures(f,overrides={}){
  const out={};const g=servingGrams(f,overrides);
  // Only the leading serving unit qualifies: '1 tusuk (3 butir)' is not 1 butir.
  const m=String(f.serving||'').match(/^\s*(\d+(?:[.,]\d+)?)\s+(sdm|sdt|centong|potong|gelas|butir|buah)\b/i);
  const named=String(f.name||'').match(/\((\d+)\s+(butir|potong|buah)\)/i);
  const ambiguous=named&&m&&named[2].toLowerCase()===m[2].toLowerCase()&&Number(named[1])!==Number(m[1]);
  if(g&&m&&!ambiguous){const n=Number(m[1].replace(',','.'));if(n>0)out[m[2].toLowerCase()]=g/n;}
  for(const [u,n] of Object.entries(f.measures||{}))if(units.includes(u)&&positive(n))out[u]=n;
  for(const [u,n] of Object.entries(overrides))if(units.includes(u)&&positive(n))out[u]=n;
  return out;
 }
 function recipe(items,cookedGrams,portions){
  if(!items.length||!positive(cookedGrams)||!positive(portions))throw Error('Isi bahan, berat matang, dan jumlah porsi dengan angka positif.');
  const keys=['calories','protein','carbs','fat','fiber','sugar','sodium','saturatedFat'],totals={};
  for(const k of keys){
   if(items.every(i=>typeof i.food[k]==='number'&&Number.isFinite(i.food[k])&&i.food[k]>=0))totals[k]=0;
  }
  for(const i of items){
   const base=servingGrams(i.food);
   if(!base||!positive(i.grams))throw Error('Setiap bahan harus memiliki berat porsi yang diketahui.');
   for(const k of Object.keys(totals))totals[k]+=i.food[k]*i.grams/base;
  }
  if(Object.values(totals).some(n=>!Number.isFinite(n)))throw Error('Jumlah bahan terlalu besar.');
  return {totals,perPortion:Object.fromEntries(Object.entries(totals).map(([k,n])=>[k,n/portions])),per100:Object.fromEntries(Object.entries(totals).map(([k,n])=>[k,n*100/cookedGrams])),servingGrams:cookedGrams/portions};
 }
 function canonical(x){if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';if(x&&typeof x==='object')return '{'+Object.keys(x).filter(k=>x[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';return JSON.stringify(x);}
 const syncFields=['logs','customFoods','weights','mealPhotos'];
 const conflictId=(field,key)=>JSON.stringify([field,key]);
 function deletionUnion(a=[],b=[]){
  const result=new Map();
  for(const state of [...a,...b]){const id=conflictId(state.field,state.key),old=result.get(id);
   if(!old||state.version>old.version||(state.version===old.version&&(Number(state.deleted)>Number(old.deleted)||(state.deleted===old.deleted&&state.changeId>old.changeId))))result.set(id,{...state});
  }
  return [...result.values()].sort((a,b)=>conflictId(a.field,a.key).localeCompare(conflictId(b.field,b.key)));
 }
 function nextDeletion(states,field,key,deleted){
  const id=conflictId(field,key),old=states.find(x=>conflictId(x.field,x.key)===id);
  const version=(old?.version||0)+1;if(!Number.isSafeInteger(version))throw Error('Revisi penghapusan melewati batas aman.');
  const next={field,key,deleted,version,changeId:crypto.randomUUID(),changedAt:Date.now()};
  return states.filter(x=>conflictId(x.field,x.key)!==id).concat(next);
 }
 function merge(local,cloud,policy='local'){
  const options=typeof policy==='string'?{default:policy,choices:{}}:policy;
  const result={...local,version:5,exportedAt:new Date().toISOString()},conflicts=[];let added=0,removed=0,unresolved=0;
  const states=deletionUnion(local.syncDeletions,cloud.syncDeletions),deleted=new Set(states.filter(x=>x.deleted).map(x=>conflictId(x.field,x.key)));
  result.syncDeletions=states;
  const alive=(field,item)=>!deleted.has(conflictId(field,field==='weights'?item.date:item.id));
  const choose=(field,key,a,b)=>{
   if(canonical(a)===canonical(b))return a;
   const id=conflictId(field,key),selection=options.choices?.[id]||options.default;
   if(!['local','cloud'].includes(selection))unresolved++;
   conflicts.push({id,field,key,local:a,cloud:b,selection:['local','cloud'].includes(selection)?selection:''});
   return selection==='cloud'?b:a;
  };
  const arrays=(field,key,la=local[field]||[],cb=cloud[field]||[])=>{
   const a=new Map(la.filter(x=>alive(field,x)).map(x=>[x[key],x]));
   for(const b of cb.filter(x=>alive(field,x))){if(a.has(b[key]))a.set(b[key],choose(field,b[key],a.get(b[key]),b));else{a.set(b[key],b);added++;}}
   return [...a.values()];
  };
  for(const [field,key] of [['customFoods','id'],['weights','date'],['packs','id']])result[field]=arrays(field,key);
  // Review each photo together with all of its component logs as one conflict.
  const groups=snapshot=>(snapshot.mealPhotos||[]).filter(p=>alive('mealPhotos',p)).map(photo=>({id:photo.id,photo,logs:(snapshot.logs||[]).filter(l=>l.mealPhotoId===photo.id&&alive('logs',l)).sort((a,b)=>a.id.localeCompare(b.id))}));
  const groupsMerged=arrays('mealPhotos','id',groups(local),groups(cloud));
  result.mealPhotos=groupsMerged.map(g=>g.photo);
  const loose=snapshot=>{const ids=new Set((snapshot.mealPhotos||[]).map(p=>p.id));return (snapshot.logs||[]).filter(l=>(!l.mealPhotoId||!ids.has(l.mealPhotoId))&&(!l.mealPhotoId||!deleted.has(conflictId('mealPhotos',l.mealPhotoId))));};
  result.logs=arrays('logs','id',loose(local),loose(cloud)).concat(groupsMerged.flatMap(g=>g.logs));
  for(const field of syncFields){const key=field==='weights'?'date':'id';removed+=new Set([...(local[field]||[]),...(cloud[field]||[])].filter(x=>!alive(field,x)||(field==='logs'&&x.mealPhotoId&&deleted.has(conflictId('mealPhotos',x.mealPhotoId)))).map(x=>x[key])).size;}
  for(const field of ['waterRecords','foodMeasures']){
   const a={...(local[field]||{})};
   for(const [key,b] of Object.entries(cloud[field]||{})){if(Object.hasOwn(a,key))a[key]=choose(field,key,a[key],b);else{Object.defineProperty(a,key,{value:b,enumerable:true,writable:true,configurable:true});added++;}}
   result[field]=a;
  }
  result.favorites=[...new Set([...(local.favorites||[]),...(cloud.favorites||[])])].filter(id=>!deleted.has(conflictId('customFoods',id)));
  for(const field of ['profile','waterGoal'])if(cloud[field]!==undefined)result[field]=local[field]===undefined?cloud[field]:choose(field,field,local[field],cloud[field]);
  return {snapshot:result,conflicts,added,removed,unresolved};
 }
 return {units,positive,servingGrams,measures,recipe,canonical,merge,syncFields,conflictId,deletionUnion,nextDeletion};
})();
if(typeof module!=='undefined')module.exports=NutritionTools;
