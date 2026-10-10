/* KaloriKu v1.4: correct food-log quantities without clearing records. */
let v14EditBusy=false;
let v14EditId=null,v14GramBase=null;
function v24PhotoItemIndex(log,rec){
 if(log.photoItemId)return rec.items.findIndex(i=>i.id===log.photoItemId);
 const matches=rec.items.map((item,index)=>({item,index})).filter(({item})=>item.foodId===log.foodId&&item.name===log.name&&['calories','protein','carbs','fat'].every(k=>item[k]===log[k]));
 if(matches.length===1)return matches[0].index;
 const quantities=matches.filter(({item})=>item.qty===log.qty);return quantities.length===1?quantities[0].index:-1;
}
function v14ServingGrams(rec){
 if(rec.servingGrams)return rec.servingGrams;
 if(rec.mealPhotoId){const photo=mealPhotos.find(p=>p.id===rec.mealPhotoId);if(photo){const i=v24PhotoItemIndex(rec,photo);return i>=0?photo.items[i].servingGrams||NutritionTools.servingGrams(photo.items[i]):null;}return null;}
 return NutritionTools.servingGrams(rec,foodMeasures[rec.foodId]);
}
function v14UnitGrams(unit,rec){return v24UnitFor(unit,{id:rec.foodId,serving:rec.serving,servingGrams:rec.servingGrams})}
window.editKaloriLog=function(id){
 if(v14EditBusy)return;
 const l=logs.find(x=>x.id===id);if(!l)return;
 v14EditId=id;v14GramBase=v14ServingGrams(l);
 $('editLogFood').textContent=l.name+' · '+l.serving;
 $('editLogDate').value=l.date;$('editLogDate').max=localDate();
 $('editLogMeal').value=l.meal;
 const linked=Boolean(l.mealPhotoId);
 $('editLogDate').disabled=linked;$('editLogMeal').disabled=linked;
 $('editLogUnit').value='porsi';
 $('editLogAmount').value=l.qty;
 v14ExplainEdit();$('editLogDialog').showModal();
};
function v14ExplainEdit(){
 const l=logs.find(x=>x.id===v14EditId);if(!l)return;
 const unit=$('editLogUnit').value,n=Number($('editLogAmount').value),g=v14UnitGrams(unit,l);
 const unavailable=unit!=='porsi'&&(!v14GramBase||Number.isNaN(g));
 $('editLogEstimate').textContent=unavailable?'Takaran atau berat porsi belum diketahui. Gunakan porsi, atau atur takaran di database.':unit==='porsi'?'Jumlah porsi seperti catatan awal.':g!==null?'≈ '+Math.round(n*g)+' g. Konversi takaran adalah perkiraan, bukan hasil penimbangan.':'';
 $('editLogAmount').setCustomValidity(unavailable?'Berat per porsi belum diketahui. Pilih satuan porsi.':'');
}
async function v14SaveEdit(event){
 event.preventDefault();if(v14EditBusy)return;
 const old=logs.find(x=>x.id===v14EditId);if(!old)return;
 const unit=$('editLogUnit').value,amount=Number($('editLogAmount').value);
 if(!Number.isFinite(amount)||amount<=0){toast('Jumlah harus lebih dari 0');return}
 const grams=v14UnitGrams(unit,old);
 if(Number.isNaN(grams)||(grams!==null&&!v14GramBase)){toast('Berat per porsi belum diketahui; gunakan satuan porsi');return}
 const qty=grams===null?amount:amount*grams/v14GramBase;
 if(!Number.isFinite(qty)||qty<=0||qty>500){toast('Jumlah tidak valid');return}
 const revised={...old,qty,date:old.mealPhotoId?old.date:$('editLogDate').value,meal:old.mealPhotoId?old.meal:$('editLogMeal').value};
 if(!revised.date||revised.date>localDate()){toast('Tanggal tidak valid');return}
 v14EditBusy=true;const controls=[...$('editLogDialog').querySelectorAll('input,select,button')].map(el=>[el,el.disabled]);controls.forEach(([el])=>el.disabled=true);
 try{
  let photoChange=null;
  if(old.mealPhotoId&&typeof mealPhotos!=='undefined'){
   const rec=mealPhotos.find(p=>p.id===old.mealPhotoId);
   if(!rec)throw Error('Foto terkait tidak ditemukan');
   if(rec){
    const index=v24PhotoItemIndex(old,rec);
    if(index<0||!rec.items[index])throw Error('Komponen foto tidak dapat disinkronkan');
    const item=rec.items[index],servingGrams=item.servingGrams||v14GramBase;
    const nextItem={...item,qty,grams:servingGrams?qty*servingGrams:item.grams,total:{cal:old.calories*qty,p:old.protein*qty,c:old.carbs*qty,f:old.fat*qty}};
    if(servingGrams)revised.serving=nextItem.grams+' g (foto)';
    const nextRec={...rec,items:rec.items.map((it,i)=>i===index?nextItem:it)};
    photoChange={previous:rec,next:nextRec};
   }
  }
  if(photoChange){await dbWritePhotoMeal(photoChange.next,[revised],{photo:photoChange.previous,logs:[old]});mealPhotos=mealPhotos.map(p=>p.id===photoChange.next.id?photoChange.next:p);}
  else await dbPut('logs',revised);
  logs=logs.map(x=>x.id===old.id?revised:x);
  $('editLogDialog').close();renderToday();renderHistory();renderStats();
  if(typeof renderPhotoMeals==='function')renderPhotoMeals();
  toast('Catatan diperbarui');
 }catch(e){toast(e.message?.startsWith('Data foto atau catatan berubah')?e.message:'Gagal menyimpan perubahan. Isian tetap tersedia; silakan coba lagi.')}
 finally{v14EditBusy=false;controls.forEach(([el,disabled])=>el.disabled=disabled);}
}
document.addEventListener('DOMContentLoaded',()=>{
 $('closeEditLog').onclick=()=>{if(!v14EditBusy)$('editLogDialog').close()};
 $('editLogDialog').addEventListener('cancel',e=>{if(v14EditBusy)e.preventDefault()});
 $('editLogForm').addEventListener('submit',v14SaveEdit);
 $('editLogUnit').onchange=()=>{
  if(v14EditId){const l=logs.find(x=>x.id===v14EditId);if(l){const g=v14UnitGrams($('editLogUnit').value,l);$('editLogAmount').value=g!==null&&v14GramBase?Number((l.qty*v14GramBase/g).toFixed(1)):l.qty}}
  v14ExplainEdit()
 };
 $('editLogAmount').oninput=v14ExplainEdit;
});