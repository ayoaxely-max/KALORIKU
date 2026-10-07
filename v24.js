/* Food-specific measures and recipe calculator, using existing stores. */
let foodMeasures={},v24MeasureId=null,v24Ingredients=[];
function v24UnitFor(unit,f){if(unit==='porsi')return null;if(unit==='gram')return 1;return NutritionTools.measures(f,foodMeasures[f.id])[unit]??NaN;}
function v24MeasureInfo(f){const measures=NutritionTools.measures(f,foodMeasures[f.id]);return Object.entries(measures).map(([u,g])=>'1 '+u+' ≈ '+g.toLocaleString('id-ID',{maximumFractionDigits:2})+' g').join(' · ');}
window.v24OpenMeasure=id=>{
 const f=allFoods.find(f=>f.id===id);if(!f)return;v24MeasureId=id;
 $('v24MeasureTitle').textContent='Takaran: '+f.name;
 $('v24MeasureBase').textContent='Porsi gizi: '+f.serving+'. Isi berat bagian yang dimakan, tanpa tulang/kulit yang dibuang. Nilai ini hanya mengubah konversi takaran; bukan gizi per porsi.';
 $('v24MeasureFields').innerHTML=NutritionTools.units.map(u=>'<label>Gram per 1 '+u+'<input data-measure="'+u+'" type="number" min="0.01" max="10000" step="any" value="'+(foodMeasures[id]?.[u]||'')+'" placeholder="'+(NutritionTools.measures(f)[u]||'Belum diketahui')+'"></label>').join('');
 $('v24MeasureDialog').showModal();
};
async function v24SaveMeasure(e){
 e.preventDefault();const values={};for(const input of $('v24MeasureFields').querySelectorAll('input'))if(input.value){const n=Number(input.value);if(!NutritionTools.positive(n)||n>10000)return;values[input.dataset.measure]=n;}
 const next={...foodMeasures,[v24MeasureId]:values};
 try{await dbSetKV('foodMeasures',next);foodMeasures=next;$('v24MeasureDialog').close();renderDatabase();renderAddResults();toast('Takaran pribadi disimpan');}catch(e){toast('Takaran gagal disimpan');}
}
function v24SearchRecipe(){
 const q=$('v24RecipeSearch').value.trim();const candidates=q?allFoods.filter(f=>foodMatches(f,q)&&NutritionTools.servingGrams(f,foodMeasures[f.id])).sort((a,b)=>foodMatchRank(a,q)-foodMatchRank(b,q)).slice(0,25):[];
 $('v24RecipeResults').replaceChildren();
 for(const f of candidates){const b=document.createElement('button');b.type='button';b.className='secondary full';b.textContent=f.name+' · '+f.serving+' · '+foodSearchLabel(f,q);b.onclick=()=>{v24Ingredients.push({food:{...JSON.parse(JSON.stringify(f)),servingGrams:NutritionTools.servingGrams(f,foodMeasures[f.id])},grams:NutritionTools.servingGrams(f,foodMeasures[f.id])});$('v24RecipeSearch').value='';v24SearchRecipe();v24RenderRecipe();};$('v24RecipeResults').append(b);}
}
function v24RecipeCalculation(){return NutritionTools.recipe(v24Ingredients,Number($('v24CookedWeight').value),Number($('v24RecipePortions').value));}
function v24PreviewRecipe(){try{const r=v24RecipeCalculation();$('v24RecipePreview').textContent='Total: '+fmt(r.totals.calories)+' kcal · per porsi '+fmt(r.perPortion.calories)+' kcal ('+fmt(r.servingGrams)+' g) · per 100 g '+fmt(r.per100.calories)+' kcal. Protein '+fmt(r.perPortion.protein)+' g · Karbo '+fmt(r.perPortion.carbs)+' g · Lemak '+fmt(r.perPortion.fat)+' g per porsi.';}catch(e){$('v24RecipePreview').textContent=e.message;}}
function v24RenderRecipe(){
 $('v24RecipeItems').replaceChildren();
 v24Ingredients.forEach((item,i)=>{const row=document.createElement('div');row.className='card';const label=document.createElement('label');label.textContent=item.food.name+' — berat bahan (g)';const input=document.createElement('input');input.type='number';input.min='0.01';input.step='any';input.value=item.grams;input.oninput=()=>{item.grams=Number(input.value);v24PreviewRecipe();};label.append(input);const remove=document.createElement('button');remove.type='button';remove.className='secondary';remove.textContent='Hapus bahan';remove.onclick=()=>{v24Ingredients.splice(i,1);v24RenderRecipe();};row.append(label,remove);$('v24RecipeItems').append(row);});v24PreviewRecipe();
}
async function v24SaveRecipe(e){
 e.preventDefault();const button=$('v24RecipeSave');if(button.disabled)return;
 button.disabled=true;
 try{
  const r=v24RecipeCalculation(),name=$('v24RecipeName').value.trim();if(!name)throw Error('Isi nama resep.');
  const food={id:'recipe_'+crypto.randomUUID(),name,category:'Resep pribadi',serving:'1 porsi ('+r.servingGrams.toFixed(2)+' g)',servingGrams:r.servingGrams,...r.perPortion,source_type:'user',source_ref:'Dihitung dari bahan; berat matang ditimbang pengguna. Minyak yang dimakan perlu dimasukkan sebagai bahan.',recipe:{ingredients:JSON.parse(JSON.stringify(v24Ingredients)),cookedGrams:Number($('v24CookedWeight').value),portions:Number($('v24RecipePortions').value)},createdAt:Date.now()};
  await dbPut('customFoods',food);customFoods.push(food);allFoods=[...staticFoods,...customFoods];$('v24RecipeDialog').close();renderAll();toast('Resep disimpan ke database');
 }catch(e){$('v24RecipePreview').textContent=e.message;}finally{button.disabled=false;}
}
const v24OldFoodCard=foodCard;
foodCard=function(f,add=true,q=''){return v24OldFoodCard(f,add,q)+'<div class="food-meta">'+esc(v24MeasureInfo(f))+' <button class="text-btn" type="button" onclick="v24OpenMeasure(\''+esc(f.id)+'\')">Atur takaran</button></div>';};
document.addEventListener('DOMContentLoaded',async()=>{
 $('v24MeasureForm').onsubmit=v24SaveMeasure;
 $('v24RecipeOpen').onclick=()=>{v24Ingredients=[];$('v24RecipeForm').reset();v24SearchRecipe();v24RenderRecipe();$('v24RecipeDialog').showModal();};
 $('v24RecipeSearch').oninput=v24SearchRecipe;
 $('v24CookedWeight').oninput=v24PreviewRecipe;$('v24RecipePortions').oninput=v24PreviewRecipe;
 $('v24RecipeForm').onsubmit=v24SaveRecipe;
 $('qtyUnit').onchange=renderAddResults;
 try{foodMeasures=await dbGetKV('foodMeasures',{});}catch(e){toast('Takaran pribadi belum dapat dimuat');}
});
