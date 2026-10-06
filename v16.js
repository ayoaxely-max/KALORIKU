/* KaloriKu 1.6 — calendar, historical hydration, weight-goal progress and custom food management.
   Reuses existing IndexedDB stores; does not clear or migrate user data. */
let v16CalendarMonth=historyDate.slice(0,7);
function v16DaySummary(date){
 const entries=logs.filter(l=>l.date===date);
 return {entries:entries.length,kcal:total(entries).cal,water:Number(v15WaterRecords[date])||0};
}
function v16RenderCalendar(){
 const el=$('v16CalendarGrid');if(!el)return;
 const month=v16CalendarMonth||historyDate.slice(0,7);
 const [year,m]=month.split('-').map(Number);
 const first=new Date(year,m-1,1),days=new Date(year,m,0).getDate();
 const offset=(first.getDay()+6)%7;
 $('v16CalendarTitle').textContent=first.toLocaleDateString('id-ID',{month:'long',year:'numeric'});
 $('v16MonthNext').disabled=month>=localDate().slice(0,7);
 const weekdays=['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
 const head=weekdays.map(d=>'<span class="v16-weekday">'+d+'</span>').join('');
 let cells='';for(let i=0;i<offset;i++)cells+='<span class="v16-empty" aria-hidden="true"></span>';
 for(let day=1;day<=days;day++){
   const date=month+'-'+String(day).padStart(2,'0');
   const disabled=date>localDate(),info=v16DaySummary(date);
   const hasFood=info.entries>0,hasWater=info.water>0;
   const active=date===historyDate?' selected':'';
   const today=date===localDate()?' today':'';
   const description=day+' '+$('v16CalendarTitle').textContent+
    ', '+info.entries+' makanan, '+fmt(info.kcal)+' kkal, '+fmt(info.water)+' ml air';
   cells+='<button type="button" class="v16-day'+active+today+'" data-v16date="'+date+
      '" aria-label="'+description+'" aria-pressed="'+(active?'true':'false')+'" '+(disabled?'disabled':'')+'>'+
      '<strong>'+day+'</strong><span class="v16-dots">'+(hasFood?'<i class="food"></i>':'')+(hasWater?'<i class="water"></i>':'')+'</span></button>';
 }
 el.innerHTML=head+cells;
 el.querySelectorAll('button[data-v16date]').forEach(b=>b.onclick=()=>{
   historyDate=b.dataset.v16date;
   v16CalendarMonth=historyDate.slice(0,7);
   renderHistory();
 });
}
function v16MoveMonth(delta){
 const [year,month]=(v16CalendarMonth||historyDate.slice(0,7)).split('-').map(Number);
 const d=new Date(year,month-1+delta,1);
 const next=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
 if(next>localDate().slice(0,7))return;
 v16CalendarMonth=next;v16RenderCalendar();
}
function v16RenderHistoryWater(){
 if(!$('v16HistoryWaterTotal'))return;
 const date=historyDate;
 const ml=Math.max(0,Number(v15WaterRecords[date])||0);
 $('v16HistoryWaterDate').textContent=parseDate(date).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
 $('v16HistoryWaterTotal').textContent=fmt(ml)+' ml';
 $('v16HistoryWaterGoal').textContent=fmt(v15WaterGoal)+' ml target pribadi';
 $('v16HistoryWaterBar').style.width=Math.min(100,ml/Math.max(v15WaterGoal,1)*100)+'%';
 $('v16HistoryWaterMinus').disabled=ml<=0||v15WaterBusy;
 $('v16HistoryWaterAdd').disabled=v15WaterBusy;
}
async function v16EditHistoryWater(multiplier){
 const raw=$('v16HistoryWaterAmount').value.trim(),amount=Number(raw);
 if(!raw||!Number.isInteger(amount)||amount<1||amount>3000){toast('Masukkan jumlah 1–3000 ml');return}
 if(v15WaterBusy)return;
 const date=historyDate,before=Math.max(0,Number(v15WaterRecords[date])||0);
 const after=Math.max(0,Math.min(30000,before+amount*multiplier));
 if(after===before)return;
 v15WaterBusy=true;v16RenderHistoryWater();
 try{
   const next={...v15WaterRecords,[date]:after};
   await dbSetKV('v15WaterRecords',next);
   v15WaterRecords=next;
   if(date===localDate())v15RenderWater();
   v16RenderCalendar();v15RenderWeekly();
   toast('Air minum '+date+' disimpan');
 }catch(e){console.error(e);toast('Air minum gagal disimpan')}
 finally{v15WaterBusy=false;v15RenderWater();v16RenderHistoryWater()}
}
function v16RenderWeightGoal(){
 const target=Number(profile.weightTarget),el=$('v16WeightProgress');
 if(!el)return;
 if(!Number.isFinite(target)||target<=0){
   el.innerHTML='<p class="small muted">Tentukan target berat badan di Profil untuk memantau progres.</p>';return;
 }
 const entries=[...weights].filter(w=>Number(w.weight)>0).sort((a,b)=>a.date.localeCompare(b.date));
 const current=entries.length?Number(entries.at(-1).weight):Number(profile.weight);
 const start=entries.length?Number(entries[0].weight):current;
 if(!Number.isFinite(current)||!Number.isFinite(start)){el.innerHTML='<p class="muted">Catat berat badan lebih dahulu.</p>';return}
 const denominator=target-start;
 const percent=Math.abs(denominator)<.001?(Math.abs(current-target)<.05?100:0):
   Math.max(0,Math.min(100,(current-start)/denominator*100));
 const diff=target-current;
 let trend='';
 if(entries.length>=2){
   const a=entries[0],b=entries.at(-1);
   const span=Math.round((parseDate(b.date)-parseDate(a.date))/86400000);
   if(span>=7){
     const weekly=(Number(b.weight)-Number(a.weight))/span*7;
     trend='<p class="small muted">Tren aktual '+(weekly>=0?'+':'')+weekly.toFixed(2)+' kg/minggu berdasarkan '+span+' hari; bukan prediksi penurunan berat badan.</p>';
   }
 }
 el.innerHTML='<div class="stats-grid">'+
   '<div class="stat"><span>Berat terbaru</span><b>'+current.toFixed(1)+' kg</b></div>'+
   '<div class="stat"><span>Target pribadi</span><b>'+target.toFixed(1)+' kg</b></div>'+
   '<div class="stat"><span>Selisih ke target</span><b>'+Math.abs(diff).toFixed(1)+' kg</b></div>'+
   '<div class="stat"><span>Progres dari catatan awal</span><b>'+Math.round(percent)+'%</b></div></div>'+
   '<div class="progress v16-goal-bar"><span style="width:'+percent+'%"></span></div>'+trend+
   '<p class="small muted">Progres menggunakan penimbangan pertama hingga terbaru; angka ini bukan saran target kesehatan.</p>';
}
function v16RenderCustomList(){
 const el=$('v16CustomList');if(!el)return;
 const foods=[...customFoods].sort((a,b)=>a.name.localeCompare(b.name,'id'));
 if(!foods.length){el.innerHTML='<p class="empty">Belum ada makanan atau produk sendiri.</p>';return}
 el.innerHTML=foods.map(f=>'<div class="v16-custom-row"><div class="food-info"><strong>'+esc(f.name)+
    '</strong><small>'+esc(f.serving)+' · '+fmt(f.calories)+' kkal · '+esc(sourceLabel(f.source_type))+
    '</small></div><button type="button" class="secondary" data-v16edit="'+esc(f.id)+'">Edit</button>'+
    '<button type="button" class="del" aria-label="Hapus '+esc(f.name)+'" data-v16delete="'+esc(f.id)+'">×</button></div>').join('');
 el.querySelectorAll('[data-v16edit]').forEach(b=>b.onclick=()=>{
   $('v16CustomDialog').close();v15EditProduct(b.dataset.v16edit);
 });
 el.querySelectorAll('[data-v16delete]').forEach(b=>b.onclick=()=>v16DeleteCustom(b.dataset.v16delete));
}
async function v16DeleteCustom(id){
 const food=customFoods.find(f=>f.id===id);
 if(!food)return;
 const uses=logs.filter(l=>l.foodId===id).length;
 const msg='Hapus '+food.name+' dari database sendiri?\n'+
  (uses?'Ada '+uses+' catatan lama menggunakan makanan ini. Catatan lama akan tetap tersimpan.':'Data ini tidak ada dalam catatan makanan.')+
  '\nPenghapusan dari database tidak dapat dibatalkan kecuali dengan backup.';
 if(!confirm(msg))return;
 try{
   await dbDelete('customFoods',id);
   customFoods=customFoods.filter(f=>f.id!==id);
   allFoods=[...staticFoods,...customFoods];
   if(favorites.includes(id)){favorites=favorites.filter(x=>x!==id);await dbSetKV('favorites',favorites)}
   renderDatabase();renderAddResults();v15RenderAudit();v16RenderCustomList();
   $('foodCountProfile').textContent=fmt(allFoods.length)+' entri';
   toast('Makanan sendiri dihapus; riwayat tidak berubah');
 }catch(e){console.error(e);toast('Makanan gagal dihapus')}
}
const v16BaseRenderHistory=renderHistory;
renderHistory=function(){
 v16BaseRenderHistory();
 v16CalendarMonth=historyDate.slice(0,7);
 v16RenderCalendar();v16RenderHistoryWater();
};
const v16BaseRenderStats=renderStats;
renderStats=function(){v16BaseRenderStats();v16RenderWeightGoal()};
const v16BaseRenderProfile=renderProfile;
renderProfile=function(){v16BaseRenderProfile();$('v16WeightTarget').value=profile.weightTarget??'';v16RenderWeightGoal()};
const v16BaseWaterRender=v15RenderWater;
v15RenderWater=function(){v16BaseWaterRender();v16RenderHistoryWater();v16RenderCalendar()};
document.addEventListener('DOMContentLoaded',()=>{
 $('v16MonthPrev').onclick=()=>v16MoveMonth(-1);
 $('v16MonthNext').onclick=()=>v16MoveMonth(1);
 $('v16HistoryWaterAdd').onclick=()=>v16EditHistoryWater(1);
 $('v16HistoryWaterMinus').onclick=()=>v16EditHistoryWater(-1);
 $('v16AddOnDate').onclick=()=>{
   openAdd();
   $('entryDate').value=historyDate;
 };
 $('v16ManageCustom').onclick=()=>{$('v16CustomDialog').showModal();v16RenderCustomList()};
 $('v16CloseCustom').onclick=()=>$('v16CustomDialog').close();
 v16RenderCalendar();v16RenderHistoryWater();v16RenderWeightGoal();
});
