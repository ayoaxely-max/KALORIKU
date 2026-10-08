/* Compact dashboard and monthly recap; reads existing records without migration. */
let recapSelectedMonth=localDate().slice(0,7);
function recapShift(month,delta){
 const d=parseDate(month+'-01');d.setMonth(d.getMonth()+delta);return localDate(d).slice(0,7);
}
function recapData(month){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||Number(month.slice(0,4))<1000||month>localDate().slice(0,7))return null;
 const end=recapShift(month,1)+'-01',days=[];
 for(let date=month+'-01';date<end&&date<=localDate();date=offsetDate(date,1)){
  const items=logs.filter(l=>l.date===date),sum=total(items);
  const water=Object.hasOwn(v15WaterRecords,date)?Number(v15WaterRecords[date]):null;
  const weight=weights.find(w=>w.date===date)?.weight??null;
  days.push({date,cal:items.length?sum.cal:null,protein:items.length?sum.p:null,water,weight});
 }
 const foodDays=days.filter(d=>d.cal!==null),waterDays=days.filter(d=>d.water!==null);
 return {days,recorded:foodDays.length,mean:foodDays.length?foodDays.reduce((n,d)=>n+d.cal,0)/foodDays.length:null,protein:foodDays.length?foodDays.reduce((n,d)=>n+d.protein,0)/foodDays.length:null,water:waterDays.length?waterDays.reduce((n,d)=>n+d.water,0)/waterDays.length:null};
}
function recapOpenHistory(date){historyDate=date;go('history');window.scrollTo?.({top:0,behavior:'smooth'});}
function renderRecap(){
 const picker=$('recapMonth');if(!picker)return;
 if(recapSelectedMonth>localDate().slice(0,7))recapSelectedMonth=localDate().slice(0,7);
 picker.value=recapSelectedMonth;picker.max=localDate().slice(0,7);
 $('recapNext').disabled=recapSelectedMonth>=picker.max;
 $('recapPrev').disabled=recapSelectedMonth==='1000-01';
 const r=recapData(recapSelectedMonth);if(!r)return;
 const value=(n,u='')=>n===null?'—':fmt(n)+u;
 $('recapSummary').innerHTML='<div class="stats-grid">'+[['Hari catatan makan',r.recorded+' hari'],['Rata-rata kalori',value(r.mean,' kcal')],['Rata-rata protein',value(r.protein,' g')],['Rata-rata air tercatat',value(r.water,' ml')]].map(([label,v])=>'<div class="stat"><span>'+label+'</span><b>'+v+'</b></div>').join('')+'</div>';
 $('recapDays').innerHTML=r.days.map(d=>'<tr><th><button type="button" class="text-btn" data-recap-date="'+d.date+'">'+parseDate(d.date).toLocaleDateString('id-ID',{day:'numeric',month:'short'})+'</button></th><td>'+value(d.cal)+'</td><td>'+value(d.protein,' g')+'</td><td>'+value(d.water)+'</td><td>'+(d.weight===null?'—':Number(d.weight).toLocaleString('id-ID'))+'</td></tr>').join('');
}
const recapOldToday=renderToday;renderToday=function(){recapOldToday();renderRecap()};
const recapOldWater=v15RenderWater;v15RenderWater=function(){recapOldWater();renderRecap()};
const recapOldStats=renderStats;renderStats=function(){recapOldStats();renderRecap()};
document.addEventListener('DOMContentLoaded',()=>{
 $('dashboardHistory').onclick=()=>recapOpenHistory(dashboardSelectedDate());
 $('recapMonth').onchange=e=>{const month=e.target.value;if(recapData(month)){recapSelectedMonth=month;}renderRecap()};
 $('recapPrev').onclick=()=>{recapSelectedMonth=recapShift(recapSelectedMonth,-1);renderRecap()};
 $('recapNext').onclick=()=>{const month=recapShift(recapSelectedMonth,1);if(month<=localDate().slice(0,7))recapSelectedMonth=month;renderRecap()};
 $('recapDays').onclick=e=>{const b=e.target.closest('[data-recap-date]');if(b)recapOpenHistory(b.dataset.recapDate)};
 renderRecap();
});
