/* KaloriKu v1.4: correct food-log quantities without clearing records. */
let v14EditId=null,v14GramBase=null;
function v14ServingGrams(rec){const food=allFoods.find(f=>f.id===rec.foodId);const m=String(food?.serving||rec.serving||'').toLowerCase().replace(',','.').match(/(\d+(?:\.\d+)?)\s*g\b/);return m?Number(m[1]):null}
function v14UnitGrams(unit,name){if(unit==='gram')return 1;if(unit==='sdm')return 15;if(unit==='centong')return /nasi|beras/i.test(name)?100:70;if(unit==='potong')return 75;if(unit==='gelas')return 200;return null}
window.editKaloriLog=function(id){
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
 const unit=$('editLogUnit').value,n=Number($('editLogAmount').value),g=v14UnitGrams(unit,l.name);
 const unavailable=unit!=='porsi'&&!v14GramBase;
 $('editLogEstimate').textContent=unavailable?'Berat per porsi makanan ini belum diketahui. Gunakan satuan porsi.':unit==='porsi'?'Jumlah porsi seperti catatan awal.':g!==null?'≈ '+Math.round(n*g)+' g. Konversi takaran adalah perkiraan, bukan hasil penimbangan.':'';
 $('editLogAmount').setCustomValidity(unavailable?'Berat per porsi belum diketahui. Pilih satuan porsi.':'');
}
async function v14SaveEdit(event){
 event.preventDefault();
 const old=logs.find(x=>x.id===v14EditId);if(!old)return;
 const unit=$('editLogUnit').value,amount=Number($('editLogAmount').value);
 if(!Number.isFinite(amount)||amount<=0){toast('Jumlah harus lebih dari 0');return}
 const grams=v14UnitGrams(unit,old.name);
 if(grams!==null&&!v14GramBase){toast('Berat per porsi belum diketahui; gunakan satuan porsi');return}
 const qty=grams===null?amount:amount*grams/v14GramBase;
 if(!Number.isFinite(qty)||qty<=0||qty>500){toast('Jumlah tidak valid');return}
 const revised={...old,qty,date:old.mealPhotoId?old.date:$('editLogDate').value,meal:old.mealPhotoId?old.meal:$('editLogMeal').value};
 if(!revised.date||revised.date>localDate()){toast('Tanggal tidak valid');return}
 try{
  if(old.mealPhotoId&&typeof mealPhotos!=='undefined'){
   const rec=mealPhotos.find(p=>p.id===old.mealPhotoId);
   if(rec){
    const siblings=logs.filter(x=>x.mealPhotoId===old.mealPhotoId).sort((a,b)=>a.createdAt-b.createdAt);
    const index=siblings.findIndex(x=>x.id===old.id);
    if(index<0||!rec.items[index])throw Error('Komponen foto tidak dapat disinkronkan');
    const item=rec.items[index],servingGrams=item.servingGrams||v14GramBase;
    const nextItem={...item,qty,grams:servingGrams?Math.round(qty*servingGrams):item.grams,total:{cal:old.calories*qty,p:old.protein*qty,c:old.carbs*qty,f:old.fat*qty}};
    const nextRec={...rec,items:rec.items.map((it,i)=>i===index?nextItem:it)};
    await dbPut('mealPhotos',nextRec);mealPhotos=mealPhotos.map(p=>p.id===rec.id?nextRec:p);
   }
  }
  await dbPut('logs',revised);
  logs=logs.map(x=>x.id===old.id?revised:x);
  $('editLogDialog').close();renderToday();renderHistory();renderStats();
  if(typeof renderPhotoMeals==='function')renderPhotoMeals();
  toast('Catatan diperbarui');
 }catch(e){console.error(e);toast('Gagal menyimpan perubahan')}
}
document.addEventListener('DOMContentLoaded',()=>{
 $('closeEditLog').onclick=()=>$('editLogDialog').close();
 $('editLogForm').addEventListener('submit',v14SaveEdit);
 $('editLogUnit').onchange=()=>{
  if(v14EditId){const l=logs.find(x=>x.id===v14EditId);if(l){const g=v14UnitGrams($('editLogUnit').value,l.name);$('editLogAmount').value=g!==null&&v14GramBase?Number((l.qty*v14GramBase/g).toFixed(1)):l.qty}}
  v14ExplainEdit()
 };
 $('editLogAmount').oninput=v14ExplainEdit;
});