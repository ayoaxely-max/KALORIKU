let v24RestoreRevision=null;
/* KaloriKu v1.7 — monthly reporting, source-aware optional nutrients and safer restore.
   No IndexedDB schema migration; older backups remain supported. */
const V17_FIELDS=[
 {key:'fiber',label:'Serat',unit:'g'},
 {key:'sugar',label:'Gula',unit:'g'},
 {key:'sodium',label:'Natrium',unit:'mg'},
 {key:'saturatedFat',label:'Lemak jenuh',unit:'g'}
];
let v17ReportMonth=localDate().slice(0,7);
let v17PendingBackup=null,v17Restoring=false;
function v17Numeric(v){return typeof v==='number'&&Number.isFinite(v)&&v>=0}
function v17NutrientSnapshot(item){
 const data={};for(const {key} of V17_FIELDS){if(v17Numeric(item?.[key]))data[key]=item[key];}return data;
}
function v17ReadOptionalNutrients(prefix){
 const data={};
 for(const {key} of V17_FIELDS){
  const el=$(prefix+key[0].toUpperCase()+key.slice(1));
  if(!el)continue;const raw=el.value.trim();
  if(raw==='')continue;const value=Number(raw);
  if(Number.isFinite(value)&&value>=0)data[key]=value;
 }
 return data;
}
function v17FromOFF(n,suffix){
 const out={};const keys=[
 ['fiber','fiber'],['sugar','sugars'],['sodium','sodium'],['saturatedFat','saturated-fat']];
 for(const [dest,source] of keys){
  const val=n[source+suffix];
  if(typeof val==='number'&&Number.isFinite(val)&&val>=0){
   out[dest]=dest==='sodium'?val*1000:val;
  }
 }
 return out;
}
function v17SumKnown(entries,key){
 let sum=0,count=0;for(const e of entries){
  if(v17Numeric(e[key])&&v17Numeric(e.qty)){sum+=e[key]*e.qty;count++}
 }return {sum,count,total:entries.length};
}
function v17MonthReport(month){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return null;
 const entries=logs.filter(x=>x.date?.startsWith(month+'-'));
 const dates=[...new Set(entries.map(x=>x.date))].sort();
 const n=dates.length;
 const sum=total(entries),calTarget=calcTarget().cal;
 const targetDays=dates.filter(d=>{
  const kcal=total(entries.filter(l=>l.date===d)).cal;
  return Math.abs(kcal-calTarget)<=calTarget*.15;
 }).length;
 const waters=Object.entries(v15WaterRecords)
  .filter(([d,value])=>d.startsWith(month+'-')&&Number(value)>0);
 const waterSum=waters.reduce((a,[,v])=>a+Number(v),0);
 const ws=weights.filter(x=>x.date?.startsWith(month+'-')).sort((a,b)=>a.date.localeCompare(b.date));
 const extras=Object.fromEntries(V17_FIELDS.map(f=>[f.key,v17SumKnown(entries,f.key)]));
 return {month,entries:entries.length,recordedDays:n,calories:sum.cal,calorieMean:n?sum.cal/n:null,
   protein:n?sum.p/n:null,carbs:n?sum.c/n:null,fat:n?sum.f/n:null,targetDays,
   waterDays:waters.length,waterMean:waters.length?waterSum/waters.length:null,
   weightStart:ws.length?ws[0].weight:null,weightEnd:ws.length?ws.at(-1).weight:null,extras};
}
function v17ReportSummary(r){
 const f=(x,unit='')=>x===null?'—':fmt(x)+unit;
 const weight=r.weightStart===null?'—':Number(r.weightEnd-r.weightStart).toFixed(1)+' kg';
 return '<div class="stats-grid">'+
 '<div class="stat"><span>Hari tercatat</span><b>'+r.recordedDays+'</b></div>'+
 '<div class="stat"><span>Rata-rata kalori / hari tercatat</span><b>'+f(r.calorieMean,' kkal')+'</b></div>'+
 '<div class="stat"><span>Dekat target kalori ±15%</span><b>'+r.targetDays+' hari</b></div>'+
 '<div class="stat"><span>Air minum / hari tercatat</span><b>'+f(r.waterMean,' ml')+'</b></div>'+
 '<div class="stat"><span>Protein harian tercatat</span><b>'+f(r.protein,' g')+'</b></div>'+
 '<div class="stat"><span>Perubahan BB dalam bulan</span><b>'+weight+'</b></div></div>'+
 '<p class="small muted">Rata-rata dihitung hanya dari hari dengan catatan, tidak menganggap hari kosong sebagai nol. Tidak menjamin semua asupan telah dicatat.</p>';
}
function v17NutrientRows(r){
 return V17_FIELDS.map(x=>{
  const a=r.extras[x.key],note=a.count?
    fmt(Math.round(a.sum*10)/10)+' '+x.unit:'Belum ada data';
  return '<div class="v17-nutrient-row"><div><strong>'+x.label+'</strong>'+
   '<small>'+(a.count?'Cakupan '+a.count+'/'+a.total+' item':'Belum tercatat pada bulan ini')+
   '</small></div><b>'+note+'</b></div>';
 }).join('');
}
function v17RecentMonths(){
 const now=parseDate(localDate()),vals=[];
 for(let i=5;i>=0;i--){
  const d=new Date(now.getFullYear(),now.getMonth()-i,1);
  const m=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  const r=v17MonthReport(m);vals.push(r);
 }
 const max=Math.max(100,...vals.map(x=>x.calorieMean||0));
 $('v17MonthTrend').innerHTML=vals.map(r=>
  '<button type="button" class="v17-month-line" data-month="'+r.month+'">'+
  '<span>'+esc(parseDate(r.month+'-01').toLocaleDateString('id-ID',{month:'short',year:'2-digit'}))+'</span>'+
  '<span class="v17-mini-track"><i style="width:'+Math.round(100*(r.calorieMean||0)/max)+'%"></i></span>'+
  '<strong>'+(r.calorieMean===null?'—':fmt(r.calorieMean)+' kkal')+'</strong></button>'
 ).join('');
 $('v17MonthTrend').querySelectorAll('[data-month]').forEach(b=>b.onclick=()=>{
  v17ReportMonth=b.dataset.month;v17RenderMonthly();
 });
}
function v17RenderMonthly(){
 const picker=$('v17MonthPicker');if(!picker)return;
 v17ReportMonth=v17ReportMonth||localDate().slice(0,7);
 if(v17ReportMonth>localDate().slice(0,7))v17ReportMonth=localDate().slice(0,7);
 picker.value=v17ReportMonth;picker.max=localDate().slice(0,7);
 const r=v17MonthReport(v17ReportMonth);if(!r)return;
 $('v17MonthlySummary').innerHTML=v17ReportSummary(r);
 $('v17MonthlyNutrients').innerHTML=v17NutrientRows(r);
 v17RecentMonths();
}
function v17BackupCheckDate(s){
 if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
 const d=new Date(s+'T00:00:00Z');
 return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s;
}
function v17ValidateBackup(x){
 const errors=[],warnings=[];
 if(!x||typeof x!=='object'||Array.isArray(x))return {errors:['File bukan objek backup JSON'],warnings};
 if(!Number.isInteger(x.version)||x.version<2||x.version>4)errors.push('Versi backup tidak didukung (perlu v2–v4)');
 if(!x.profile||typeof x.profile!=='object'||Array.isArray(x.profile))errors.push('Profil tidak tersedia');
 for(const field of ['logs','customFoods','weights']){
  if(!Array.isArray(x[field]))errors.push('Daftar '+field+' tidak valid');
 }
 for(const field of ['mealPhotos','favorites','packs']){
  if(x[field]!==undefined&&!Array.isArray(x[field]))errors.push('Daftar '+field+' tidak valid');
 }
 if(errors.length)return {errors,warnings};
 if(x.logs.length>50000||x.customFoods.length>20000||x.weights.length>10000||(x.mealPhotos||[]).length>2000)errors.push('Backup terlalu besar untuk pemulihan otomatis');
 for(const [field,arr,key] of [['logs',x.logs,'id'],['customFoods',x.customFoods,'id'],['weights',x.weights,'date'],['mealPhotos',x.mealPhotos||[],'id']]){
  const seen=new Set();
  for(const item of arr){
   if(!item||typeof item!=='object'||typeof item[key]!=='string'||!item[key]){errors.push('Entri '+field+' tidak memiliki '+key);break}
   if(seen.has(item[key])){errors.push('Duplikat '+key+' di '+field);break}seen.add(item[key]);
  }
 }
 for(const l of x.logs){
  if(!v17BackupCheckDate(l.date)||!v17Numeric(l.qty)||l.qty<=0||
     !['calories','protein','carbs','fat'].every(k=>v17Numeric(l[k]))){
     errors.push('Ada catatan makan dengan tanggal, jumlah, atau gizi tidak valid');break;
  }
 }
 for(const w of x.weights){
  if(!v17BackupCheckDate(w.date)||!Number.isFinite(Number(w.weight))||Number(w.weight)<=0){
   errors.push('Ada catatan berat badan tidak valid');break;
  }
 }
 for(const f of x.customFoods){
  if(typeof f.name!=='string'||!f.name.trim()||typeof f.serving!=='string'||
   !['calories','protein','carbs','fat'].every(k=>v17Numeric(f[k]))){
    errors.push('Ada makanan sendiri dengan data tidak valid');break;
  }
 }
 for(const p of (x.mealPhotos||[])){
  if(!v17BackupCheckDate(p.date)||!Array.isArray(p.items)||
   (p.imageData!==undefined&&p.imageData!==null&&
   (typeof p.imageData!=='string'||!/^data:image\/(?:jpeg|png|webp);base64,/i.test(p.imageData)))){
   errors.push('Ada foto makanan atau data gambar tidak valid');break;
  }
 }
 if(x.waterRecords!==undefined){
  if(!x.waterRecords||typeof x.waterRecords!=='object'||Array.isArray(x.waterRecords)){
   errors.push('Catatan air minum bukan objek');}
  else if(Object.entries(x.waterRecords).some(([d,v])=>!v17BackupCheckDate(d)||!v17Numeric(Number(v))||Number(v)>30000))
   errors.push('Ada catatan air minum tidak valid');
 }
 if(x.waterGoal!==undefined&&(!v17Numeric(Number(x.waterGoal))||Number(x.waterGoal)<250||Number(x.waterGoal)>6000))
  errors.push('Target air minum tidak valid');
 if(x.foodMeasures!==undefined){
  if(!x.foodMeasures||typeof x.foodMeasures!=='object'||Array.isArray(x.foodMeasures)||Object.entries(x.foodMeasures).some(([id,m])=>['__proto__','constructor','prototype'].includes(id)||!m||typeof m!=='object'||Array.isArray(m)||Object.entries(m).some(([u,n])=>!NutritionTools.units.includes(u)||!NutritionTools.positive(n)||n>10000)))errors.push('Takaran makanan tidak valid');
 }
 const ids=new Set((x.mealPhotos||[]).map(p=>p.id));
 const missing=x.logs.filter(l=>l.mealPhotoId&&!ids.has(l.mealPhotoId)).length;
 if(missing)warnings.push(missing+' catatan berhubungan dengan foto yang tidak ada di backup.');
 if(x.version<=3)warnings.push('Backup lama dapat dipulihkan; data nutrisi tambahan yang belum ada akan tetap kosong.');
 return {errors:[...new Set(errors)],warnings};
}
function v17SetBackupPreview(message,type='info'){
 const el=$('v17RestoreMessage');el.textContent=message;el.classList.toggle('v15-warning',type==='error');
}
async function v17OpenRestorePreview(file){
 if(!file)return;
 const picker=$('restoreFile');if(picker)picker.value='';
 v17PendingBackup=null;
 $('v17RestoreConfirm').disabled=true;
 $('v17RestoreDetails').textContent='Membaca dan memeriksa file…';
 $('v17RestoreDialog').showModal();
 try{
  if(file.size>300*1024*1024)throw Error('Ukuran file lebih dari 300 MB');
  const x=JSON.parse(await file.text()),check=v17ValidateBackup(x);
  const parts=[
   'File: '+file.name,
   'Versi backup: '+(x.version??'?'),
   'Catatan makanan: '+(x.logs?.length??'?'),
   'Makanan sendiri: '+(x.customFoods?.length??'?'),
   'Berat badan: '+(x.weights?.length??'?'),
   'Foto makanan: '+(x.mealPhotos?.length||0),
   'Catatan air: '+(x.waterRecords?Object.keys(x.waterRecords).length:'Tidak disertakan')
  ];
  $('v17RestoreDetails').textContent=parts.join('\n');
  if(check.errors.length){v17SetBackupPreview('Pemulihan dibatalkan: '+check.errors.join(' • '),'error');return}
  v17PendingBackup=x;
  v17SetBackupPreview((check.warnings.length?check.warnings.join(' ' )+' ':'')+
   'Pemulihan akan MENGGANTI riwayat makanan, foto, produk sendiri, berat, dan profil yang ada. '+
   'Pengaturan AI tidak dihapus. Buat backup saat ini terlebih dahulu jika belum.','info');
  $('v17RestoreConfirm').disabled=false;
 }catch(e){v17SetBackupPreview('Tidak bisa membaca backup: '+String(e.message||e),'error')}
}
async function v17ExecuteRestore(){
 if(v17Restoring||!v17PendingBackup)return;
 const x=v17PendingBackup,check=v17ValidateBackup(x);
 if(check.errors.length){v17SetBackupPreview(check.errors.join(' • '),'error');return}
 v17Restoring=true;$('v17RestoreConfirm').disabled=true;
 v17SetBackupPreview('Mempersiapkan foto, lalu memulihkan secara aman…');
 try{
  const photos=[];
  for(const p of (x.mealPhotos||[])){
   if(p.imageData&&p.imageData.length>30*1024*1024)throw Error('Salah satu foto terlalu besar');
   const image=p.imageData?await dataURLToBlob(p.imageData):null;
   photos.push({...p,image,imageData:undefined});
  }
  const d=await dbOpen();
  const stores=['logs','customFoods','weights','mealPhotos','kv'];
  await new Promise((resolve,reject)=>{
   const transaction=d.transaction(stores,'readwrite');
   transaction.oncomplete=resolve;
   transaction.onabort=()=>reject(transaction.error||Error('Transaksi dibatalkan'));
   transaction.onerror=()=>{/* onabort handles rollback */};
   const guard=transaction.objectStore('kv').get('v24DataRevision');
   guard.onsuccess=()=>{
   try{
    const currentRevision=Number(guard.result?.value)||0;
    if(v24RestoreRevision!==null&&currentRevision!==v24RestoreRevision)throw Error('Data lokal berubah. Tinjau ulang penggabungan.');
    transaction.objectStore('kv').put({key:'v24DataRevision',value:currentRevision+1});
    for(const k of stores.slice(0,4))transaction.objectStore(k).clear();
    for(const l of x.logs)transaction.objectStore('logs').put(l);
    for(const f of x.customFoods)transaction.objectStore('customFoods').put(f);
    for(const w of x.weights)transaction.objectStore('weights').put(w);
    for(const p of photos){const item={...p};delete item.imageData;transaction.objectStore('mealPhotos').put(item)}
    const kv=transaction.objectStore('kv');
    kv.put({key:'profile',value:x.profile});
    kv.put({key:'favorites',value:x.favorites||[]});
    kv.put({key:'packs',value:x.packs||[]});
    if(x.waterRecords!==undefined)kv.put({key:'v15WaterRecords',value:x.waterRecords});
    kv.put({key:'foodMeasures',value:x.foodMeasures||{}});
    if(x.waterGoal!==undefined)kv.put({key:'v15WaterGoal',value:Number(x.waterGoal)});
   }catch(e){transaction.abort();reject(e)}
   };
  });
  profile=x.profile;favorites=x.favorites||[];packs=x.packs||[];
  logs=x.logs;customFoods=x.customFoods;weights=x.weights;mealPhotos=photos;
  if(x.waterRecords!==undefined)v15WaterRecords=x.waterRecords;
  if(x.waterGoal!==undefined)v15WaterGoal=Number(x.waterGoal);
  foodMeasures=x.foodMeasures||{};
  allFoods=[...staticFoods,...customFoods];
  $('v17RestoreDialog').close();v17PendingBackup=null;
  renderAll();renderPhotoMeals();updatePhotoStorageStatus();v15RenderAudit();
  $('v15WaterGoalInput').value=v15WaterGoal;
  v17RenderMonthly();toast('Backup berhasil dipulihkan');
 }catch(e){console.error(e);v17SetBackupPreview('Pemulihan gagal; transaksi data dibatalkan: '+String(e.message||e),'error')}
 finally{v17Restoring=false;$('v17RestoreConfirm').disabled=!v17PendingBackup}
}
const v17OldRenderStats=renderStats;
renderStats=function(){v17OldRenderStats();v17RenderMonthly()};
document.addEventListener('DOMContentLoaded',()=>{
 $('v17MonthPicker').onchange=e=>{v17ReportMonth=e.target.value;v17RenderMonthly()};
 $('v17RestoreConfirm').onclick=v17ExecuteRestore;
 $('v17RestoreCancel').onclick=()=>{$('v17RestoreDialog').close();v17PendingBackup=null};
 $('v17RestoreDialog').addEventListener('close',()=>{v17PendingBackup=null});
 v17RenderMonthly();
});
