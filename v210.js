/* Editable recipes, restore differences and mobile accessibility. */
let v210RecipeOriginal=null;
const v210OldEditProduct=v15EditProduct;
v15EditProduct=function(id){const food=customFoods.find(f=>f.id===id);if(food?.recipe)v210OpenRecipe(id);else v210OldEditProduct(id);};
function v210OpenRecipe(id=null){
 const f=id?customFoods.find(x=>x.id===id):null;if(id&&!f?.recipe)return;
 if(f&&(!Array.isArray(f.recipe.ingredients)||f.recipe.ingredients.some(i=>!i?.food||typeof i.food!=='object'))){toast('Definisi bahan resep tidak valid. Periksa backup atau buat resep baru.');return;}
 v210RecipeOriginal=f?structuredClone(f):null;
 $('v24RecipeForm').reset();v24Ingredients=f?structuredClone(f.recipe.ingredients):[];
 $('v210RecipeTitle').textContent=f?'Edit resep':'Kalkulator resep';$('v24RecipeSave').textContent=f?'Simpan perubahan resep':'Simpan resep ke database';
 $('v210RecipeEditNote').classList.toggle('hidden',!f);
 if(f){$('v24RecipeName').value=f.name;$('v24CookedWeight').value=f.recipe.cookedGrams;$('v24RecipePortions').value=f.recipe.portions;}
 v24SearchRecipe();v24RenderRecipe();$('v24RecipeDialog').showModal();
}
const v210OldFoodCard=foodCard;
foodCard=function(f,add=true,q=''){
 return v210OldFoodCard(f,add,q)+(f.recipe&&customFoods.some(x=>x.id===f.id)?'<button class="secondary full" type="button" data-v210recipe="'+esc(f.id)+'">Edit bahan dan porsi resep</button>':'');
};
v24SaveRecipe=async function(e){
 e.preventDefault();const button=$('v24RecipeSave');if(button.disabled)return;button.disabled=true;
 try{
  const r=v24RecipeCalculation(),name=$('v24RecipeName').value.trim();if(!name)throw Error('Isi nama resep.');
  if(!['calories','protein','carbs','fat'].every(k=>Number.isFinite(r.perPortion[k])&&r.perPortion[k]>=0))throw Error('Nilai energi dan makro semua bahan harus tersedia.');
  const old=v210RecipeOriginal;
  const food={...(old||{}),id:old?.id||'recipe_'+crypto.randomUUID(),name,category:'Resep pribadi',serving:'1 porsi ('+r.servingGrams.toFixed(2)+' g)',servingGrams:r.servingGrams,source_type:'user',source_ref:'Dihitung dari bahan; berat matang ditimbang pengguna. Minyak yang dimakan perlu dimasukkan sebagai bahan.',recipe:{ingredients:structuredClone(v24Ingredients),cookedGrams:Number($('v24CookedWeight').value),portions:Number($('v24RecipePortions').value)},createdAt:old?.createdAt||Date.now(),lastUserEdit:new Date().toISOString()};
  for(const k of ['calories','protein','carbs','fat','fiber','sugar','sodium','saturatedFat'])delete food[k];Object.assign(food,r.perPortion);
  if(old)await dbMutation('customFoods',s=>{const request=s.get(old.id);request.onsuccess=()=>{if(NutritionTools.canonical(request.result)!==NutritionTools.canonical(old)){s.transaction.abort();return;}s.put(food);};});
  else await dbPut('customFoods',food);
  customFoods=old?customFoods.map(f=>f.id===old.id?food:f):[...customFoods,food];allFoods=[...staticFoods,...customFoods];
  $('v24RecipeDialog').close();v210RecipeOriginal=null;renderAll();v16RenderCustomList();v15RenderAudit();toast(old?'Resep diperbarui; catatan lama tetap.':'Resep disimpan ke database.');
 }catch(e){$('v24RecipePreview').textContent='Gagal menyimpan: '+(e.message||'Transaksi dibatalkan')+'. Jika resep asal berubah, tutup dan buka ulang editor.';}finally{button.disabled=false;}
};
function v210RestoreDiff(current,incoming){
 const rows=[];
 const add=(label,a,b,key)=>{
  const before=new Map(a.map(x=>[key(x),x])),after=new Map(b.map(x=>[key(x),x]));let added=0,changed=0,removed=0,same=0;
  for(const [id,value] of after){if(!before.has(id))added++;else if(NutritionTools.canonical(value)!==NutritionTools.canonical(before.get(id)))changed++;else same++;}
  for(const id of before.keys())if(!after.has(id))removed++;
  rows.push({label,added,changed,removed,same});
 };
 for(const [field,label,key] of [['logs','Catatan makanan','id'],['customFoods','Makanan sendiri / resep','id'],['weights','Berat badan','date'],['mealPhotos','Foto makanan','id'],['packs','Paket makanan','id']])add(label,current[field]||[],incoming[field]||[],x=>x[key]);
 add('Favorit',(current.favorites||[]).map(id=>({id})),(incoming.favorites||[]).map(id=>({id})),x=>x.id);
 for(const [field,label] of [['waterRecords','Hari catatan air'],['foodMeasures','Takaran pribadi']]){
  if(field==='waterRecords'&&incoming[field]===undefined){rows.push({label,kept:true});continue;}
  add(label,Object.entries(current[field]||{}),Object.entries(incoming[field]||{}),x=>x[0]);
 }
 return {rows,profileChanged:NutritionTools.canonical(current.profile)!==NutritionTools.canonical(incoming.profile),waterGoalChanged:incoming.waterGoal!==undefined&&Number(current.waterGoal)!==Number(incoming.waterGoal),waterGoalKept:incoming.waterGoal===undefined};
}
let v210RestoreRevision=null,v210RestoreSequence=0;
function v210RenderRestoreDiff(current,incoming){
 const d=v210RestoreDiff(current,incoming);
 $('v210RestoreDiff').innerHTML='<h3>Perubahan terhadap data saat ini</h3><div class="v28-table-wrap"><table class="v28-week-table"><thead><tr><th>Data</th><th>Tambah</th><th>Ubah</th><th>Hapus</th><th>Sama</th></tr></thead><tbody>'+d.rows.map(r=>'<tr><th>'+esc(r.label)+'</th>'+(r.kept?'<td colspan="4">Tetap; tidak disertakan dalam backup</td>':['added','changed','removed','same'].map(k=>'<td>'+r[k]+'</td>').join(''))+'</tr>').join('')+'</tbody></table></div><p>Profil: '+(d.profileChanged?'diganti dengan isi backup':'sama')+'. Target air: '+(d.waterGoalKept?'tetap; tidak disertakan':d.waterGoalChanged?'diubah':'sama')+'.</p><p class="small muted">Ubah berarti isi berbeda pada ID/tanggal yang sama. Ini pemulihan pengganti, bukan penggabungan. Status penghapusan disesuaikan agar hasil pemulihan dapat disinkronkan.</p>';
}
function v210ApplyTextSize(value){
 const scale=['1','1.15','1.3'].includes(String(value))?String(value):'1';document.documentElement.style.fontSize=(16*Number(scale))+'px';document.documentElement.style.setProperty('--nav',Math.round(74*Number(scale))+'px');$('v210TextSize').value=scale;
}
function v210Viewport(){
 const viewport=window.visualViewport;document.documentElement.style.setProperty('--v210-viewport-height',(viewport?.height||window.innerHeight)+'px');
 const focus=document.activeElement,editing=focus?.matches('input,textarea,select');
 document.body.classList.toggle('v210-keyboard',!!editing&&!!viewport&&viewport.height<window.innerHeight*.75);
 if(editing&&viewport)requestAnimationFrame(()=>focus.scrollIntoView({block:'nearest',inline:'nearest'}));
}
document.addEventListener('DOMContentLoaded',async()=>{
 $('v24RecipeOpen').onclick=()=>v210OpenRecipe();$('v24RecipeForm').onsubmit=v24SaveRecipe;
 document.addEventListener('click',e=>{const b=e.target.closest('[data-v210recipe]');if(b)v210OpenRecipe(b.dataset.v210recipe);});
 $('v17RestoreDialog').addEventListener('close',()=>{v210RestoreSequence++;v210RestoreRevision=null;$('v210RestoreDiff').replaceChildren();});
 $('v210TextSize').onchange=async e=>{v210ApplyTextSize(e.target.value);try{await dbSetKV('v210TextSize',e.target.value);}catch{toast('Ukuran teks diterapkan, tetapi belum dapat disimpan.');}};
 for(const b of document.querySelectorAll('[data-close]'))if(!b.getAttribute('aria-label'))b.setAttribute('aria-label','Tutup formulir');
 $('v17RestoreCancel').setAttribute('aria-label','Tutup pratinjau backup');
 $('toast').setAttribute('role','status');$('toast').setAttribute('aria-live','polite');
 window.visualViewport?.addEventListener('resize',v210Viewport);window.addEventListener('resize',v210Viewport);
 document.addEventListener('focusin',v210Viewport);document.addEventListener('focusout',()=>requestAnimationFrame(v210Viewport));v210Viewport();
 try{v210ApplyTextSize(await dbGetKV('v210TextSize','1'));}catch{}
});
