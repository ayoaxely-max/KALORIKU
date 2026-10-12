let photoSaveBusy=false;
let photoDraftRecord=null,photoDraftQueue=Promise.resolve(),photoSession=0,photoDraftPending=0;
function photoDraftStatus(text){$('photoDraftStatus').textContent=text;}
function photoPersistDraft(){
 if(!photoDraftBlob)return Promise.resolve();
 const session=photoSession;
 const snapshot={id:photoDraftRecord?.id||'mp_'+crypto.randomUUID(),date:$('photoEntryDate').value||localDate(),meal:$('photoMeal').value,note:$('photoNote').value.trim(),image:photoDraftBlob,items:[],draftItems:structuredClone(photoDraftItems),createdAt:photoDraftRecord?.createdAt||Date.now(),photoOrigin:photoDraftSource,source:'photo_draft'};
 photoDraftPending++;photoDraftStatus('Menyimpan draft foto…');
 const task=photoDraftQueue.catch(()=>{}).then(async()=>{
  if(session!==photoSession)return;
  // The first queued write allocates the ID used by every later revision.
  if(photoDraftRecord){snapshot.id=photoDraftRecord.id;snapshot.createdAt=photoDraftRecord.createdAt;}
  await dbWritePhotoMeal(snapshot,[],photoDraftRecord?{photo:photoDraftRecord,logs:[]}:null);
  photoDraftRecord=snapshot;
  mealPhotos=mealPhotos.filter(p=>p.id!==snapshot.id).concat(snapshot);
  photoDraftStatus('Draft foto tersimpan di perangkat. Bisa dilanjutkan dari dashboard.');renderPhotoMeals();updatePhotoStorageStatus();
 });
 task.then(()=>photoDraftPending--,()=>photoDraftPending--);
 photoDraftQueue=task;
 task.catch(()=>{if(session===photoSession)photoDraftStatus('Draft BELUM tersimpan. Jangan tutup aplikasi. Coba Simpan foto saja atau unduh foto.');});
 return task;
}
function photoScheduleDraft(){if(!photoSaveBusy&&photoDraftBlob&&photoDraftRecord)photoPersistDraft().catch(()=>{});}
function downloadDraftPhoto(){
 if(!photoDraftBlob)return;
 const url=URL.createObjectURL(photoDraftBlob),a=document.createElement('a');a.href=url;
 a.download='KaloriKu-foto-'+localDate()+(photoDraftBlob.type==='image/png'?'.png':photoDraftBlob.type==='image/webp'?'.webp':'.jpg');a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function resumePhotoDraft(id){
 if(photoSaveBusy)return;
 const rec=mealPhotos.find(p=>p.id===id&&p.items.length===0);if(!rec)return;
 openPhotoMeal(rec.photoOrigin||'camera');photoDraftRecord=structuredClone(rec);photoDraftBlob=rec.image;photoDraftSource=rec.photoOrigin;
 photoDraftItems=structuredClone(rec.draftItems||[]);$('photoEntryDate').value=rec.date;$('photoMeal').value=rec.meal;$('photoNote').value=rec.note||'';
 setPhotoPreview(rec.image);$('analyzePhotoBtn').disabled=false;renderPhotoSelected();
}

let mealPhotos=[],photoDraftItems=[],photoDraftBlob=null,photoDraftUrl=null,photoDraftSource=null;

function photoServingGrams(food){return NutritionTools.servingGrams(food,foodMeasures[food.id])}
function photoItemQty(item){
 const q=item.servingGrams?Number(item.grams)/item.servingGrams:Number(item.qty);
 return Number.isFinite(q)&&q>0?q:NaN;
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
function openPhotoMeal(source='camera'){
  if(photoSaveBusy)return;
  try{if($('addDialog')?.open)$('addDialog').close()}catch{}
  photoSession++;photoDraftRecord=null;photoDraftItems=[];photoDraftBlob=null;photoDraftSource=null;setPhotoPreview(null);photoDraftStatus('Foto akan disimpan otomatis setelah diambil.');
  $('takePhotoBtn').classList.toggle('hidden',source==='gallery');
  $('uploadPhotoBtn').classList.toggle('hidden',source!=='gallery');
  $('takePhotoBtn').textContent='📷 Ambil foto sekarang';$('uploadPhotoBtn').textContent='🖼️ Pilih foto dari galeri';
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
async function closePhotoMeal(force=false){
 if(photoSaveBusy&&force!==true)return;
 if(force!==true&&photoDraftBlob){
  photoSaveBusy=true;
  try{await photoPersistDraft();}catch{photoSaveBusy=false;return;}
  photoSaveBusy=false;
 }
 photoSession++;
 if(photoDraftUrl)URL.revokeObjectURL(photoDraftUrl);
 photoDraftUrl=null;photoDraftBlob=null;photoDraftSource=null;photoDraftItems=[];photoDraftRecord=null;
 $('photoDialog').close();
}
function renderPhotoSearch(){
  const q=$('photoSearch').value.trim().toLowerCase();
  if(!q){$('photoSearchResults').innerHTML='<div class="empty small">Cari makanan untuk menambahkan komponen.</div>';return}
  const a=allFoods.filter(f=>foodMatches(f,q)).sort((a,b)=>foodMatchRank(a,q)-foodMatchRank(b,q)).slice(0,30);
  $('photoSearchResults').innerHTML=a.map(f=>`<div class="log-row"><div class="food-info"><strong>${esc(f.name)}</strong>${foodSearchBadge(f,q)}<small>${esc(f.serving)} · ${fmt(f.calories)} kcal</small></div><button class="add-btn" onclick="addPhotoFood('${f.id}')">＋</button></div>`).join('')||'<div class="empty">Tidak ditemukan.</div>';
}
window.addPhotoFood=id=>{
  if(photoSaveBusy)return;
  const food=allFoods.find(f=>f.id===id);if(!food)return;
  const sg=photoServingGrams(food);
  photoDraftItems.push({id:'pi_'+crypto.randomUUID(),food,servingGrams:sg,grams:sg||null,qty:1});
  $('photoSearch').value='';renderPhotoSearch();renderPhotoSelected();
};
window.removePhotoFood=id=>{if(photoSaveBusy)return;photoDraftItems=photoDraftItems.filter(x=>x.id!==id);renderPhotoSelected()};
window.photoAmountChanged=(id,type,value)=>{
  if(photoSaveBusy)return;
  const i=photoDraftItems.find(x=>x.id===id);if(!i)return;
  const amount=Number(value);if(!Number.isFinite(amount)||amount<=0){toast('Jumlah harus lebih dari 0');renderPhotoSelected();return}
  if(type==='grams')i.grams=amount;else i.qty=amount;
  renderPhotoSelected();
};
function renderPhotoSelected(){
  const total=photoDraftItems.reduce((s,i)=>s+photoItemCalories(i),0);
  photoScheduleDraft();
  $('photoTotalKcal').textContent=`${fmt(total)} kcal`;
  $('photoSelected').innerHTML=photoDraftItems.length?photoDraftItems.map(i=>{
    const sg=i.servingGrams;
    const ctl=sg?`<label class="photo-amount">Berat perkiraan (g)<input type="number" min="0.01" step="any" value="${i.grams??sg}" onchange="photoAmountChanged('${i.id}','grams',this.value)"></label>`
      :`<label class="photo-amount">Jumlah porsi<input type="number" min="0.01" step="any" value="${i.qty}" onchange="photoAmountChanged('${i.id}','qty',this.value)"></label>`;
    return `<div class="photo-selected-row"><div class="food-info"><strong>${esc(i.food.name)}</strong><small>${esc(i.food.serving)} · ≈ ${fmt(photoItemCalories(i))} kcal</small></div>${ctl}<button class="del" onclick="removePhotoFood('${i.id}')">×</button></div>`;
  }).join(''):'<div class="empty small">Belum ada komponen makanan.</div>';
}
async function savePhotoMeal(photoOnly=false){
  photoOnly=photoOnly===true;
  if(photoSaveBusy)return;
  if(!photoDraftBlob){toast('Ambil atau pilih foto dulu');return}
  if(!photoOnly&&!photoDraftItems.length){toast('AI tidak wajib. Pilih Simpan foto saja atau tambahkan makanan manual.');return}
  if(!photoOnly&&photoDraftItems.some(i=>!Number.isFinite(photoItemQty(i)))){toast('Isi jumlah positif yang valid untuk setiap makanan');return}
  let id=photoDraftRecord?.id||'mp_'+crypto.randomUUID();const date=$('photoEntryDate').value||localDate(),meal=$('photoMeal').value,createdAt=Date.now();
  const items=(photoOnly?[]:photoDraftItems).map(i=>{
    const q=photoItemQty(i),m=photoItemMacros(i);
    return {id:i.id||'pi_'+crypto.randomUUID(),foodId:i.food.id,name:i.food.name,serving:i.food.serving,qty:q,grams:i.servingGrams?i.grams:null,servingGrams:i.servingGrams,calories:+i.food.calories||0,protein:+i.food.protein||0,carbs:+i.food.carbs||0,fat:+i.food.fat||0,...v17NutrientSnapshot(i.food),total:m,aiEstimate:i.ai?{recognizedName:i.ai.name,estimatedGrams:i.ai.grams||i.grams||null,minGrams:i.ai.min,maxGrams:i.ai.max,confidence:i.ai.confidence,portion:i.ai.portion,basis:i.ai.basis,matchScore:i.ai.matchScore}:null};
  });
  const rec={id,date,meal,note:$('photoNote').value.trim(),image:photoDraftBlob,items,createdAt,photoOrigin:photoDraftSource,source:photoOnly?'photo_draft':items.some(i=>i.aiEstimate)?'photo_ai_confirmed':'photo_manual_confirmed',...(photoOnly?{draftItems:structuredClone(photoDraftItems)}:{})};
  const entries=[];
  for(const i of items){
    const l={id:'l_'+crypto.randomUUID(),date,meal,foodId:i.foodId,name:i.name,serving:i.grams?`${i.grams} g (foto)`:i.serving,servingGrams:i.servingGrams,photoItemId:i.id,qty:i.qty,calories:i.calories,protein:i.protein,carbs:i.carbs,fat:i.fat,...v17NutrientSnapshot(i),createdAt:createdAt+Math.random(),mealPhotoId:id,entrySource:i.aiEstimate?'photo_ai':'photo',aiEstimate:i.aiEstimate};
    entries.push(l);
  }
  photoSaveBusy=true;const controls=[...$('photoDialog').querySelectorAll('input,select,textarea,button')].map(el=>[el,el.disabled]);controls.forEach(([el])=>el.disabled=true);
  try{
    await photoDraftQueue.catch(()=>{});
    if(photoDraftRecord){id=photoDraftRecord.id;rec.id=id;rec.createdAt=photoDraftRecord.createdAt;for(const entry of entries)entry.mealPhotoId=id;}
    await dbWritePhotoMeal(rec,entries,photoDraftRecord?{photo:photoDraftRecord,logs:[]}:null);mealPhotos=mealPhotos.filter(p=>p.id!==id).concat(rec);logs.push(...entries);
    closePhotoMeal(true);renderToday();renderHistory();renderStats();renderPhotoMeals();updatePhotoStorageStatus();toast(photoOnly?'Foto tersimpan. Kalori belum dicatat; lanjutkan kapan saja.':'Foto dan makanan tersimpan');
  }catch(e){toast('Foto dan makanan gagal disimpan. Isian tetap tersedia; silakan coba lagi.');}
  finally{photoSaveBusy=false;controls.forEach(([el,disabled])=>el.disabled=disabled);}
}
async function deletePhotoMeal(id){
  if(photoSaveBusy||$('photoDialog').open)return;
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
  return `<article class="card photo-meal-card"><img src="${url}" class="photo-meal-thumb" alt="Foto makanan"><div class="photo-meal-info"><strong>${esc(rec.note||rec.meal)}</strong><small>${rec.items.length?rec.items.length+' komponen · ≈ '+fmt(kcal)+' kcal':'Draft foto · kalori belum dicatat'}</small><div class="photo-tags">${rec.items.slice(0,4).map(i=>`<span>${esc(i.name)}${i.grams?` ${i.grams}g`:''}</span>`).join('')}</div>${!rec.items.length?`<small>${esc(rec.date)}</small><button type="button" class="secondary" onclick="resumePhotoDraft('${rec.id}')">Lanjutkan</button>`:''}</div><button class="del" onclick="deletePhotoMeal('${rec.id}')">×</button></article>`;
}
function renderPhotoMeals(){
  const el=$('todayPhotoMeals');if(!el)return;
  const a=mealPhotos.filter(x=>x.date===dashboardSelectedDate()||x.source==='photo_draft').sort((a,b)=>b.createdAt-a.createdAt);
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
  const startPhoto=source=>{if(photoSaveBusy)return;openPhotoMeal(source);$(source==='gallery'?'photoGalleryInput':'photoCameraInput').click()};
  $('photoFoodBtn').onclick=()=>startPhoto('camera');
  $('pickGalleryQuickBtn').onclick=()=>startPhoto('gallery');
  $('closePhotoDialog').onclick=()=>closePhotoMeal();
  $('photoDialog').addEventListener('cancel',e=>{e.preventDefault();closePhotoMeal();});
  window.addEventListener('beforeunload',e=>{if(photoDraftBlob&&(!photoDraftRecord||photoSaveBusy||photoDraftPending>0)){e.preventDefault();e.returnValue='';}});
  $('takePhotoBtn').onclick=()=>$('photoCameraInput').click();
  $('uploadPhotoBtn').onclick=()=>$('photoGalleryInput').click();
  async function chooseMealPhoto(event,origin){
    const input=event.target,file=input.files?.[0];
    input.value='';
    if(!file||photoSaveBusy)return;
    if(!file.type.startsWith('image/')){toast('Pilih file gambar yang valid');return}
    const analyze=$('analyzePhotoBtn');
    photoSaveBusy=true;analyze.disabled=true;
    toast('Memproses foto…');
    try{
      await photoDraftQueue.catch(()=>{});
      photoSession++;photoDraftRecord=null;photoDraftItems=[];photoDraftSource=origin;
      photoDraftBlob=/^image\/(jpeg|png|webp)$/i.test(file.type)?file:null;
      if(photoDraftBlob){setPhotoPreview(photoDraftBlob);await photoPersistDraft();}
      const compressed=await compressMealPhoto(file);
      if(!compressed)throw new Error('Tidak dapat memproses gambar');
      photoDraftBlob=compressed;
      photoDraftSource=origin;
      $('takePhotoBtn').textContent='📷 Ambil ulang foto';$('uploadPhotoBtn').textContent='🖼️ Ganti foto dari galeri';
      photoDraftItems=[];
      renderPhotoSelected();
      $('aiSuggestions').innerHTML='';
      $('aiPhotoStatus').classList.add('hidden');
      setPhotoPreview(compressed);await photoPersistDraft();
      analyze.disabled=false;
      analyze.textContent='✨ Analisis foto dengan AI';
      toast(origin==='gallery'?'Foto galeri siap':'Foto kamera siap');
    }catch(error){
      console.error(error);
      analyze.disabled=!photoDraftBlob;
      photoDraftStatus(photoDraftRecord?'Foto asli sudah tersimpan sebagai draft. Pemrosesan belum berhasil; lanjutkan nanti.':'Foto belum tersimpan. Jangan tutup aplikasi; coba Simpan foto saja atau unduh foto.');
    }finally{photoSaveBusy=false;analyze.disabled=!photoDraftBlob;
    }
  }
  $('photoCameraInput').onchange=e=>chooseMealPhoto(e,'camera');
  $('photoGalleryInput').onchange=e=>chooseMealPhoto(e,'gallery');
  $('photoSearch').oninput=renderPhotoSearch;
  $('savePhotoMealBtn').onclick=()=>savePhotoMeal();
  $('savePhotoOnlyBtn').onclick=()=>savePhotoMeal(true);$('downloadPhotoBtn').onclick=downloadDraftPhoto;
  for(const id of ['photoNote','photoEntryDate','photoMeal'])$(id).addEventListener('change',photoScheduleDraft);
  $('photoNote').addEventListener('input',photoScheduleDraft);
  renderPhotoMeals();updatePhotoStorageStatus();
});
