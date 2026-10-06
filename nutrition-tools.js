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
 function merge(local,cloud,prefer='local'){
  const result={...local,exportedAt:new Date().toISOString()},conflicts=[];let added=0;
  const choose=(field,key,a,b)=>{if(canonical(a)===canonical(b))return a;conflicts.push({field,key,local:a,cloud:b});return prefer==='cloud'?b:a;};
  const arrays=(field,key)=>{
   const a=new Map((local[field]||[]).map(x=>[x[key],x]));
   for(const b of cloud[field]||[]){if(a.has(b[key]))a.set(b[key],choose(field,b[key],a.get(b[key]),b));else{a.set(b[key],b);added++;}}
   result[field]=[...a.values()];
  };
  for(const [field,key] of [['customFoods','id'],['mealPhotos','id'],['logs','id'],['weights','date'],['packs','id']])arrays(field,key);
  // Keep photo + linked log group coherent under the chosen conflict policy.
  const photoConflicts=conflicts.filter(c=>c.field==='mealPhotos').map(c=>c.key);
  for(const id of photoConflicts){
   const source=prefer==='cloud'?cloud:local;
   const selected=(source.logs||[]).filter(l=>l.mealPhotoId===id);
   result.logs=result.logs.filter(l=>l.mealPhotoId!==id).concat(selected);
  }
  for(const field of ['waterRecords','foodMeasures']){
   const a={...(local[field]||{})};
   for(const [key,b] of Object.entries(cloud[field]||{})){if(Object.hasOwn(a,key))a[key]=choose(field,key,a[key],b);else{Object.defineProperty(a,key,{value:b,enumerable:true,writable:true,configurable:true});added++;}}
   result[field]=a;
  }
  result.favorites=[...new Set([...(local.favorites||[]),...(cloud.favorites||[])])];
  for(const field of ['profile','waterGoal'])if(cloud[field]!==undefined)result[field]=local[field]===undefined?cloud[field]:choose(field,field,local[field],cloud[field]);
  return {snapshot:result,conflicts,added};
 }
 return {units,positive,servingGrams,measures,recipe,canonical,merge};
})();
if(typeof module!=='undefined')module.exports=NutritionTools;
