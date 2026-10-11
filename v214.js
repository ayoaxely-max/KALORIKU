/* Reviewed common meal amounts with an editable weight; no implicit ml-to-g conversion. */
let v214PortionFood=null,v214PortionUnit='gram',v214PortionBusy=false;
function v214OpenPortion(id){
 if(v214PortionBusy||addFoodBusy)return;
 const food=allFoods.find(f=>f.id===id);if(!food)return;
 v214PortionFood=structuredClone(food);
 const choices=NutritionTools.commonPortions(food,foodMeasures[id]);v214PortionUnit=choices.unit;
 $('v214PortionName').textContent=food.name;
 $('v214PortionBasis').textContent='Nilai gizi database untuk '+food.serving+'.';
 $('v214PortionNote').textContent=choices.estimated?'Pilihan praktis sekali makan (perkiraan). Ukuran sebenarnya bisa berbeda; ubah gramasi sesuai makanan Anda.':choices.unit==='gram'?'Pilihan berdasarkan berat porsi database. Ini bukan ukuran sekali makan yang sudah diukur.':'Berat dalam gram belum diketahui. Gunakan porsi sesuai database; minuman tidak otomatis dikonversi dari ml ke gram. Untuk gram, isi berat porsi melalui Atur takaran.';
 $('v214PortionLabel').textContent=choices.unit==='gram'?'Gramasi sendiri (g)':'Jumlah porsi sendiri';
 $('v214PortionAmount').min='0.000001';
 const list=$('v214PortionChoices');list.replaceChildren();
 for(const amount of choices.amounts){
  const button=document.createElement('button');button.type='button';button.className='chip';button.dataset.amount=amount;
  button.textContent=amount.toLocaleString('id-ID',{maximumFractionDigits:2})+(choices.unit==='gram'?' g':' porsi')+(choices.estimated&&amount===choices.normal?' · Umum':'');
  button.onclick=()=>{if(v214PortionBusy)return;$('v214PortionAmount').value=amount;v214PreviewPortion();};list.append(button);
 }
 if(choices.unit==='gram')for(const [unit,grams] of Object.entries(NutritionTools.measures(food,foodMeasures[id]))){
  if(unit==='porsi')continue;
  const button=document.createElement('button');button.type='button';button.className='chip';button.dataset.amount=grams;
  button.textContent='1 '+unit+' ≈ '+grams.toLocaleString('id-ID',{maximumFractionDigits:2})+' g';
  button.onclick=()=>{if(v214PortionBusy)return;$('v214PortionAmount').value=grams;v214PreviewPortion();};list.append(button);
 }
 let initial=choices.normal;
 const inputAmount=Number($('qtyInput').value),inputUnit=$('qtyUnit').value;
 if(inputAmount>0&&(inputUnit!=='porsi'||inputAmount!==1)){
  const conversion=v24UnitFor(inputUnit,food),base=NutritionTools.servingGrams(food,foodMeasures[id]);
  if(choices.unit==='gram'&&base&&(conversion===null||Number.isFinite(conversion)))initial=inputAmount*(conversion===null?base:conversion);
  else if(choices.unit==='porsi'&&inputUnit==='porsi')initial=inputAmount;
 }
 $('v214PortionAmount').value=initial;v214PreviewPortion();$('v214PortionDialog').showModal();
}
function v214PreviewPortion(){
 if(!v214PortionFood)return;
 const amount=Number($('v214PortionAmount').value),base=NutritionTools.servingGrams(v214PortionFood,foodMeasures[v214PortionFood.id]);
 const valid=Number.isFinite(amount)&&amount>0&&(v214PortionUnit==='porsi'||base>0);
 $('v214PortionSave').disabled=v214PortionBusy||!valid;
 for(const button of $('v214PortionChoices').querySelectorAll('button')){const selected=Number(button.dataset.amount)===amount;button.classList.toggle('on',selected);button.setAttribute('aria-pressed',selected);}
 if(!valid){$('v214PortionPreview').textContent='Masukkan jumlah yang lebih besar dari nol.';return;}
 const qty=v214PortionUnit==='gram'?amount/base:amount,f=v214PortionFood;
 const missing=NutritionTools.missingNutrients(f);
 $('v214PortionPreview').textContent=amount.toLocaleString('id-ID',{maximumFractionDigits:3})+(v214PortionUnit==='gram'?' g':' porsi')+' → '+NutritionTools.nutrientFields.slice(0,4).map(([key,label])=>label+' '+NutritionTools.nutrientText(f,key,qty)).join(' · ')+(missing.length?'. Belum diketahui: '+missing.join(', ')+'. Nilai kosong bukan nol.':'');
 if(NutritionTools.nutrientFields.slice(0,4).some(([key])=>!NutritionTools.knownNutrient(f[key])||!Number.isFinite(f[key]*qty))){$('v214PortionSave').disabled=true;$('v214PortionPreview').textContent+=' Lengkapi kalori dan makro sebelum mencatat.';}

}
function v214ClosePortion(){if(v214PortionBusy)return;v214PortionFood=null;$('v214PortionDialog').close();}
async function v214SavePortion(event){
 event.preventDefault();if(v214PortionBusy||!v214PortionFood)return;
 const food=v214PortionFood,amount=Number($('v214PortionAmount').value);
 if(!Number.isFinite(amount)||amount<=0){v214PreviewPortion();return;}
 if(NutritionTools.canonical(allFoods.find(f=>f.id===food.id))!==NutritionTools.canonical(food)){$('v214PortionPreview').textContent='Data makanan berubah. Tutup lalu pilih ulang makanan sebelum mencatat.';return;}
 v214PortionBusy=true;const controls=[...$('v214PortionForm').querySelectorAll('input,button')];controls.forEach(b=>b.disabled=true);
 try{
  if(await addFood(food.id,{amount,unit:v214PortionUnit})===true){v214PortionFood=null;$('v214PortionDialog').close();}
  else $('v214PortionPreview').textContent='Belum tersimpan. Gramasi tetap tersedia; coba Tambahkan lagi.';
 }finally{v214PortionBusy=false;controls.forEach(b=>b.disabled=false);}
}
document.addEventListener('DOMContentLoaded',()=>{
 $('v214PortionAmount').oninput=v214PreviewPortion;$('v214PortionForm').onsubmit=v214SavePortion;$('v214PortionClose').onclick=v214ClosePortion;
 $('v214PortionDialog').addEventListener('cancel',event=>{if(v214PortionBusy)event.preventDefault();});
 $('v214PortionDialog').addEventListener('close',()=>{if(!v214PortionBusy)v214PortionFood=null;});
});
