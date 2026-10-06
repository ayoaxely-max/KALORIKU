/* KaloriKu v1.5 — hydration, weekly insights, reversible deletion, nutrition quality checks.
   Hydration and goals live in existing IndexedDB kv store: no database migration. */
let v15WaterRecords={},v15WaterGoal=2000,v15WaterBusy=false;
let v15Deleted=null,v15UndoTimer=null;
let v15EditingProduct=null;
const v15SafeNumber=x=>Math.max(0,Number(x)||0);
function v15NutritionFlag(item){
  const c=v15SafeNumber(item.calories),p=v15SafeNumber(item.protein),
        carb=v15SafeNumber(item.carbs),f=v15SafeNumber(item.fat);
  const fromMacros=p*4+carb*4+f*9;
  if(fromMacros>Math.max(60,c+65,c*1.45)){
    return 'Kalori dari makronutrien ≈ '+fmt(fromMacros)+' kkal, tetapi kalori tercantum '+fmt(c)+' kkal. Periksa apakah nilai per 100 g dan per porsi tercampur, serta cek label produk.';
  }
  return '';
}
function v15NutritionInputAlert(){
  const f={calories:$('customCal').value,protein:$('customP').value,
    carbs:$('customC').value,fat:$('customF').value};
  const alert=$('v15NutritionAlert'),warning=v15NutritionFlag(f);
  alert.textContent=warning||'';
  alert.classList.toggle('hidden',!warning);
}
function v15RenderWater(){
  const today=localDate(),ml=Number(v15WaterRecords[today])||0;
  $('v15WaterConsumed').textContent=fmt(ml)+' ml';
  $('v15WaterGoalText').textContent='Target pribadi '+fmt(v15WaterGoal)+' ml';
  $('v15WaterProgress').style.width=Math.min(100,100*ml/Math.max(1,v15WaterGoal))+'%';
  $('v15WaterMinus').disabled=ml<=0||v15WaterBusy;
  for(const id of ['v15Water250','v15Water500','v15WaterCustomButton'])$(id).disabled=v15WaterBusy;
  $('v15WaterCustomMinus').disabled=v15WaterBusy||ml<=0;
}
async function v15WaterChange(amount){
  if(v15WaterBusy||!Number.isFinite(amount)||!amount)return;
  const date=localDate(),value=Math.max(0,Math.min(30000,(Number(v15WaterRecords[date])||0)+amount));
  v15WaterBusy=true;v15RenderWater();
  try{
    const next={...v15WaterRecords,[date]:value};
    await dbSetKV('v15WaterRecords',next);
    v15WaterRecords=next;
  }catch(e){console.error(e);toast('Gagal menyimpan air minum')}
  finally{v15WaterBusy=false;v15RenderWater();v15RenderWeekly()}
}
async function v15SaveWaterGoal(){
  const v=Number($('v15WaterGoalInput').value);
  if(!Number.isFinite(v)||v<250||v>6000){toast('Masukkan target 250–6000 ml');return}
  try{await dbSetKV('v15WaterGoal',v);v15WaterGoal=v;v15RenderWater();v15RenderWeekly();toast('Target air pribadi tersimpan')}
  catch(e){console.error(e);toast('Target tidak tersimpan')}
}
function v15RenderWeekly(){
  const dates=Array.from({length:7},(_,i)=>offsetDate(localDate(),i-6));
  const countDays=dates.filter(d=>logs.some(l=>l.date===d));
  const goal=calcTarget();
  const recorded=countDays.length;
  const sum=countDays.reduce((a,d)=>a+total(logs.filter(l=>l.date===d)).cal,0);
  const proteinDays=countDays.filter(d=>total(logs.filter(l=>l.date===d)).p>=goal.protein).length;
  const near=countDays.filter(d=>{
    const cal=total(logs.filter(l=>l.date===d)).cal;
    return Math.abs(cal-goal.cal)<=goal.cal*.15;
  }).length;
  const drinkDates=dates.filter(d=>(Number(v15WaterRecords[d])||0)>0);
  const drinkAvg=drinkDates.length?drinkDates.reduce((n,d)=>n+Number(v15WaterRecords[d]),0)/drinkDates.length:0;
  $('v15WeeklySummary').innerHTML=
    '<div class="stats-grid">'+
    '<div class="stat"><span>Hari dengan catatan makan</span><b>'+recorded+' / 7</b></div>'+
    '<div class="stat"><span>Rerata hari tercatat</span><b>'+(recorded?fmt(sum/recorded):'—')+' kcal</b></div>'+
    '<div class="stat"><span>Mendekati target ±15%</span><b>'+near+' hari</b></div>'+
    '<div class="stat"><span>Target protein terpenuhi</span><b>'+proteinDays+' hari</b></div>'+
    '<div class="stat"><span>Rerata minum (hari tercatat)</span><b>'+(drinkDates.length?fmt(drinkAvg)+' ml':'—')+'</b></div>'+
    '</div><p class="small muted">Hari tanpa catatan tidak dianggap 0 kalori. Catatan minum terpisah dari makanan/minuman berkalori.</p>';
}
function v15RenderAudit(){
  const problemFoods=customFoods.map(f=>({f,message:v15NutritionFlag(f)})).filter(x=>x.message);
  const el=$('v15NutritionAudit');
  if(!problemFoods.length){el.innerHTML='<p class="small muted">Tidak ditemukan ketidaksesuaian besar antara kalori dan makro pada makanan/produk sendiri. Pemeriksaan ini bukan validasi label.</p>';return}
  el.innerHTML='<p class="small muted">'+problemFoods.length+' produk perlu ditinjau. Tidak ada data yang diubah otomatis.</p>'+
    problemFoods.slice(0,15).map(({f,message})=>
      '<div class="v15-audit-row"><strong>'+esc(f.name)+'</strong><span class="small">'+esc(message)+'</span><button type="button" class="secondary" data-v15fix="'+esc(f.id)+'">Perbaiki</button></div>'
    ).join('');
  el.querySelectorAll('[data-v15fix]').forEach(b=>b.onclick=()=>v15EditProduct(b.dataset.v15fix));
}
function v15EditProduct(id){
  const f=customFoods.find(x=>x.id===id);if(!f)return;
  v15EditingProduct=id;
  $('v15EditProductName').value=f.name;
  $('v15EditProductServing').value=f.serving||'';
  $('v15EditProductCal').value=f.calories;
  $('v15EditProductP').value=f.protein||0;
  $('v15EditProductC').value=f.carbs||0;
  $('v15EditProductF').value=f.fat||0;
  $('v15EditProductWarning').textContent=v15NutritionFlag(f);
  $('v15ProductDialog').showModal();
}
async function v15SaveProduct(event){
  event.preventDefault();
  const f=customFoods.find(x=>x.id===v15EditingProduct);
  if(!f)return;
  const revised={...f,name:$('v15EditProductName').value.trim(),
    serving:$('v15EditProductServing').value.trim(),
    calories:Number($('v15EditProductCal').value),
    protein:Number($('v15EditProductP').value),
    carbs:Number($('v15EditProductC').value),
    fat:Number($('v15EditProductF').value)};
  if(!revised.name||!revised.serving||[revised.calories,revised.protein,revised.carbs,revised.fat].some(x=>!Number.isFinite(x)||x<0)){toast('Data produk tidak valid');return}
  const warning=v15NutritionFlag(revised);
  if(warning&&!confirm(warning+'\n\nSimpan meskipun masih berbeda?'))return;
  revised.originalSourceRef=f.originalSourceRef||f.source_ref||'';
  revised.source_type='user';
  revised.source_ref='Dikoreksi manual berdasarkan label produk';
  revised.lastUserEdit=new Date().toISOString();
  try{
    await dbPut('customFoods',revised);
    customFoods=customFoods.map(x=>x.id===f.id?revised:x);
    allFoods=[...staticFoods,...customFoods];
    $('v15ProductDialog').close();
    renderDatabase();renderAddResults();v15RenderAudit();
    toast('Produk diperbarui; catatan makan lama tidak diubah');
  }catch(e){console.error(e);toast('Gagal mengubah produk')}
}
function v15UndoVisible(){
  $('v15UndoBar').classList.remove('hidden');
  $('v15UndoText').textContent='Catatan '+v15Deleted.name+' dihapus';
  if(v15UndoTimer)clearTimeout(v15UndoTimer);
  v15UndoTimer=setTimeout(()=>{$('v15UndoBar').classList.add('hidden');v15Deleted=null},20000);
}
window.removeLog=async function(id){
  const record=logs.find(x=>x.id===id);if(!record)return;
  if(record.mealPhotoId){toast('Untuk menghapus catatan foto, hapus melalui kartu Foto makanan');return}
  try{
    await dbDelete('logs',id);
    logs=logs.filter(x=>x.id!==id);
    v15Deleted={...record};
    renderToday();renderHistory();renderStats();
    v15UndoVisible();
  }catch(e){console.error(e);toast('Gagal menghapus catatan')}
};
async function v15UndoDelete(){
  if(!v15Deleted)return;
  const entry={...v15Deleted};
  try{
    await dbPut('logs',entry);
    logs=logs.filter(x=>x.id!==entry.id);
    logs.push(entry);
    v15Deleted=null;
    if(v15UndoTimer)clearTimeout(v15UndoTimer);
    $('v15UndoBar').classList.add('hidden');
    renderToday();renderHistory();renderStats();
    toast('Catatan dikembalikan');
  }catch(e){console.error(e);toast('Gagal mengembalikan catatan')}
}
const v15BaseRenderToday=renderToday;
renderToday=function(){v15BaseRenderToday();v15RenderWater()};
const v15BaseRenderStats=renderStats;
renderStats=function(){v15BaseRenderStats();v15RenderWeekly()};
document.addEventListener('DOMContentLoaded',async()=>{
  $('v15Water250').onclick=()=>v15WaterChange(250);
  $('v15Water500').onclick=()=>v15WaterChange(500);
  $('v15WaterMinus').onclick=()=>v15WaterChange(-250);
  function v15ManualWaterAmount(){
    const field=$('v15WaterCustom'),text=field.value.trim(),value=Number(text);
    if(!text||!Number.isInteger(value)||value<1||value>3000){toast('Isi jumlah air 1–3000 ml');return null}
    return value;
  }
  $('v15WaterCustomButton').onclick=()=>{
    const amount=v15ManualWaterAmount();if(amount!==null)v15WaterChange(amount);
  };
  $('v15WaterCustomMinus').onclick=()=>{
    const amount=v15ManualWaterAmount();if(amount===null)return;
    const existing=Number(v15WaterRecords[localDate()])||0;
    if(existing<=0){toast('Belum ada air yang dapat dikurangi');return}
    if(amount>existing)toast('Pengurangan dibatasi ke jumlah air yang tercatat');
    v15WaterChange(-amount);
  };
  $('v15WaterGoalSave').onclick=v15SaveWaterGoal;
  $('v15UndoButton').onclick=v15UndoDelete;
  $('v15CloseProductDialog').onclick=()=>$('v15ProductDialog').close();
  $('v15ProductForm').addEventListener('submit',v15SaveProduct);
  for(const id of ['customCal','customP','customC','customF']){
    $(id).addEventListener('input',v15NutritionInputAlert);
  }
  for(const id of ['v15EditProductCal','v15EditProductP','v15EditProductC','v15EditProductF']){
    $(id).addEventListener('input',()=>{
      $('v15EditProductWarning').textContent=v15NutritionFlag({
        calories:$('v15EditProductCal').value,protein:$('v15EditProductP').value,
        carbs:$('v15EditProductC').value,fat:$('v15EditProductF').value
      });
    });
  }
  try{
    const [records,goal]=await Promise.all([
      dbGetKV('v15WaterRecords',{}),dbGetKV('v15WaterGoal',2000)
    ]);
    v15WaterRecords=records&&typeof records==='object'&&!Array.isArray(records)?records:{};
    v15WaterGoal=Number(goal)>=250&&Number(goal)<=6000?Number(goal):2000;
  }catch(e){console.warn('Catatan air minum belum bisa dibaca',e)}
  $('v15WaterGoalInput').value=v15WaterGoal;
  v15RenderWater();v15RenderWeekly();v15RenderAudit();
});
