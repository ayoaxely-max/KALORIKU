let mealPhotos=[],photoDraftItems=[],photoDraftBlob=null,photoDraftUrl=null,photoDraftSource=null;

function photoServingGrams(food){return NutritionTools.servingGrams(food,foodMeasures[food.id])}
function photoItemQty(item){
  if(item.grams && item.servingGrams) return Math.max(.01,item.grams/item.servingGrams);
  return Math.max(.01,Number(item.qty)||1);
}
function photoItemCalories(item){return Number(item.food.calories||0)*photoItemQty(item)}
function photoItemMacros(item){
  const q=photoItemQty(item),f=item.food;
  return {cal:Number(f.calories||0)*q,p:Number(f.protein||0)*q,c:Number(f.carbs||0)*q,f:Number(f.fat||0)*q};
}
async function compressMealPhoto(file){
  if(!file) return null;
  const img=await createImageBitmap(file);
  const max=1280,scale=Math.min(1,max/Math.max(img.width,img.height));
  const w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,w,h);
  img.close?.();
  return await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.72));
}
function setPhotoPreview(blob){
  if(photoDraftUrl) URL.revokeObjectURL(photoDraftUrl);
  photoDraftUrl=blob?URL.createObjectURL(blob):null;
  $('photoPreviewWrap').classList.toggle('hidden',!blob);
  if(blob)$('photoPreview').src=photoDraftUrl;
}
function openPhotoMeal(){
  try{if($('addDialog')?.open)$('addDialog').close()}catch{}
  photoDraftItems=[];photoDraftBlob=null;photoDraftSource=null;setPhotoPreview(null);
  $('photoEntryDate').value=$('entryDate').value||localDate();$('photoEntryDate').max=localDate();
  $('photoSearch').value='';$('photoNote').value='';
  $('analyzePhotoBtn').disabled=true;
  $('analyzePhotoBtn').textContent='✨ Analisis foto dengan AI';
  $('aiSuggestions').innerHTML='';
  $('aiPhotoStatus').classList.add('hidden');
  if($('mealSelect'))$('photoMeal').value=$('mealSelect').value;
  renderPhotoSearch();renderPhotoSelected();
  $('photoDialog').showModal();
}
function closePhotoMeal(){
  if(photoDraftUrl)URL.revokeObjectURL(photoDraftUrl);
  photoDraftUrl=null;photoDraftBlob=null;photoDraftSource=null;photoDraftItems=[];
  $('photoDialog').close();
}
function renderPhotoSearch(){
  const q=$('photoSearch').value.trim().toLowerCase();
  if(!q){$('photoSearchResults').innerHTML='<div class="empty small">Cari makanan untuk menambahkan komponen.</div>';return}
  const a=allFoods.filter(f=>foodMatches(f,q)).sort((a,b)=>foodMatchRank(a,q)-foodMatchRank(b,q)).slice(0,30);
  $('photoSearchResults').innerHTML=a.map(f=>`<div class="log-row"><div class="food-info"><strong>${esc(f.name)}</strong><small>${esc(f.serving)} · ${fmt(f.calories)} kcal</small></div><button class="add-btn" onclick="addPhotoFood('${f.id}')">＋</button></div>`).join('')||'<div class="empty">Tidak ditemukan.</div>';
}
window.addPhotoFood=id=>{
  const food=allFoods.find(f=>f.id===id);if(!food)return;
  const sg=photoServingGrams(food);
  photoDraftItems.push({id:'pi_'+crypto.randomUUID(),food,servingGrams:sg,grams:sg||null,qty:1});
  $('photoSearch').value='';renderPhotoSearch();renderPhotoSelected();
};
window.removePhotoFood=id=>{photoDraftItems=photoDraftItems.filter(x=>x.id!==id);renderPhotoSelected()};
window.photoAmountChanged=(id,type,value)=>{
  const i=photoDraftItems.find(x=>x.id===id);if(!i)return;
  if(type==='grams')i.grams=Math.max(1,Number(value)||1);else i.qty=Math.max(.01,Number(value)||1);
  renderPhotoSelected();
};
function renderPhotoSelected(){
  const total=photoDraftItems.reduce((s,i)=>s+photoItemCalories(i),0);
  $('photoTotalKcal').textContent=`${fmt(total)} kcal`;
  $('photoSelected').innerHTML=photoDraftItems.length?photoDraftItems.map(i=>{
    const sg=i.servingGrams;
    const ctl=sg?`<label class="photo-amount">Berat perkiraan (g)<input type="number" min="1" step="1" value="${Math.round(i.grams||sg)}" onchange="photoAmountChanged('${i.id}','grams',this.value)"></label>`
      :`<label class="photo-amount">Jumlah porsi<input type="number" min="0.1" step="0.1" value="${i.qty}" onchange="photoAmountChanged('${i.id}','qty',this.value)"></label>`;
    return `<div class="photo-selected-row"><div class="food-info"><strong>${esc(i.food.name)}</strong><small>${esc(i.food.serving)} · ≈ ${fmt(photoItemCalories(i))} kcal</small></div>${ctl}<button class="del" onclick="removePhotoFood('${i.id}')">×</button></div>`;
  }).join(''):'<div class="empty small">Belum ada komponen makanan.</div>';
}
async function savePhotoMeal(){
  if(!photoDraftBlob){toast('Ambil atau pilih foto dulu');return}
  if(!photoDraftItems.length){toast('Tambahkan minimal satu makanan');return}
  const id='mp_'+crypto.randomUUID(),date=$('photoEntryDate').value||localDate(),meal=$('photoMeal').value,createdAt=Date.now();
  const items=photoDraftItems.map(i=>{
    const q=photoItemQty(i),m=photoItemMacros(i);
    return {id:i.id||'pi_'+crypto.randomUUID(),foodId:i.food.id,name:i.food.name,serving:i.food.serving,qty:q,grams:i.servingGrams?Math.round(i.grams||i.servingGrams):null,servingGrams:i.servingGrams,calories:+i.food.calories||0,protein:+i.food.protein||0,carbs:+i.food.carbs||0,fat:+i.food.fat||0,...v17NutrientSnapshot(i.food),total:m,aiEstimate:i.ai?{recognizedName:i.ai.name,estimatedGrams:i.ai.grams||i.grams||null,minGrams:i.ai.min,maxGrams:i.ai.max,confidence:i.ai.confidence,portion:i.ai.portion,basis:i.ai.basis,matchScore:i.ai.matchScore}:null};
  });
  const rec={id,date,meal,note:$('photoNote').value.trim(),image:photoDraftBlob,items,createdAt,photoOrigin:photoDraftSource,source:items.some(i=>i.aiEstimate)?'photo_ai_confirmed':'photo_manual_confirmed'};
  await dbPut('mealPhotos',rec);mealPhotos.push(rec);
  for(const i of items){
    const l={id:'l_'+crypto.randomUUID(),date,meal,foodId:i.foodId,name:i.name,serving:i.grams?`${i.grams} g (foto)`:i.serving,servingGrams:i.servingGrams,photoItemId:i.id,qty:i.qty,calories:i.calories,protein:i.protein,carbs:i.carbs,fat:i.fat,...v17NutrientSnapshot(i),createdAt:createdAt+Math.random(),mealPhotoId:id,entrySource:i.aiEstimate?'photo_ai':'photo',aiEstimate:i.aiEstimate};
    await dbPut('logs',l);logs.push(l);
  }
  closePhotoMeal();renderToday();renderHistory();renderStats();renderPhotoMeals();updatePhotoStorageStatus();toast('Foto dan makanan tersimpan');
}
async function deletePhotoMeal(id){
  const rec=mealPhotos.find(x=>x.id===id);if(!rec)return;
  const linked=logs.filter(l=>l.mealPhotoId===id);
  await dbDeleteMany(linked.map(l=>({store:'logs',key:l.id})).concat({store:'mealPhotos',key:id}));
  logs=logs.filter(l=>l.mealPhotoId!==id);
  mealPhotos=mealPhotos.filter(x=>x.id!==id);
  renderToday();renderHistory();renderStats();renderPhotoMeals();updatePhotoStorageStatus();toast('Foto makanan dihapus');
}
window.deletePhotoMeal=deletePhotoMeal;
function photoCard(rec){
  const url=URL.createObjectURL(rec.image);
  setTimeout(()=>URL.revokeObjectURL(url),30000);
  const kcal=rec.items.reduce((s,i)=>s+(i.total?.cal??i.calories*i.qty),0);
  return `<article class="card photo-meal-card"><img src="${url}" class="photo-meal-thumb" alt="Foto makanan"><div class="photo-meal-info"><strong>${esc(rec.note||rec.meal)}</strong><small>${rec.items.length} komponen · ≈ ${fmt(kcal)} kcal</small><div class="photo-tags">${rec.items.slice(0,4).map(i=>`<span>${esc(i.name)}${i.grams?` ${i.grams}g`:''}</span>`).join('')}</div></div><button class="del" onclick="deletePhotoMeal('${rec.id}')">×</button></article>`;
}
function renderPhotoMeals(){
  const el=$('todayPhotoMeals');if(!el)return;
  const a=mealPhotos.filter(x=>x.date===localDate()).sort((a,b)=>b.createdAt-a.createdAt);
  el.innerHTML=a.length?`<div class="section-head"><h2>Foto makanan</h2><span>${a.length} foto</span></div>`+a.map(photoCard).join(''):'';
}
async function updatePhotoStorageStatus(){
  const el=$('photoStorageStatus');if(!el)return;
  const bytes=mealPhotos.reduce((s,x)=>s+(x.image?.size||0),0);
  el.textContent=`${mealPhotos.length} foto · ${(bytes/1024/1024).toFixed(1)} MB`;
}
document.addEventListener('DOMContentLoaded',async()=>{
  await dbOpen();
  mealPhotos=await dbAll('mealPhotos');
  $('photoFoodBtn').onclick=openPhotoMeal;
  $('pickGalleryQuickBtn').onclick=()=>{openPhotoMeal();$('photoGalleryInput').click()};
  $('closePhotoDialog').onclick=closePhotoMeal;
  $('takePhotoBtn').onclick=()=>$('photoCameraInput').click();
  $('uploadPhotoBtn').onclick=()=>$('photoGalleryInput').click();
  async function chooseMealPhoto(event,origin){
    const input=event.target,file=input.files?.[0];
    input.value='';
    if(!file)return;
    if(!file.type.startsWith('image/')){toast('Pilih file gambar yang valid');return}
    const analyze=$('analyzePhotoBtn');
    analyze.disabled=true;
    toast('Memproses foto…');
    try{
      const compressed=await compressMealPhoto(file);
      if(!compressed)throw new Error('Tidak dapat memproses gambar');
      photoDraftBlob=compressed;
      photoDraftSource=origin;
      photoDraftItems=[];
      renderPhotoSelected();
      $('aiSuggestions').innerHTML='';
      $('aiPhotoStatus').classList.add('hidden');
      setPhotoPreview(compressed);
      analyze.disabled=false;
      analyze.textContent='✨ Analisis foto dengan AI';
      toast(origin==='gallery'?'Foto galeri siap':'Foto kamera siap');
    }catch(error){
      console.error(error);
      analyze.disabled=!photoDraftBlob;
      toast('Foto gagal diproses. Pilih foto lain.');
    }
  }
  $('photoCameraInput').onchange=e=>chooseMealPhoto(e,'camera');
  $('photoGalleryInput').onchange=e=>chooseMealPhoto(e,'gallery');
  $('photoSearch').oninput=renderPhotoSearch;
  $('savePhotoMealBtn').onclick=savePhotoMeal;
  renderPhotoMeals();updatePhotoStorageStatus();
});
