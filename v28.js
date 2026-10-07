/* Inline personal measures, weekly detail and explicit PWA updates. */
function v28WeeklyData(entries,weighings,end=localDate()){
 const days=Array.from({length:7},(_,i)=>{const date=offsetDate(end,i-6),items=entries.filter(l=>l.date===date);return {date,recorded:items.length>0,...total(items)};});
 const recorded=days.filter(d=>d.recorded),average=k=>recorded.length?recorded.reduce((n,d)=>n+d[k],0)/recorded.length:null;
 const ws=weighings.filter(w=>w.date>=days[0].date&&w.date<=end&&Number.isFinite(Number(w.weight))).sort((a,b)=>a.date.localeCompare(b.date));
 return {days,recorded:recorded.length,calories:average('cal'),protein:average('p'),weightChange:ws.length>=2?Number(ws.at(-1).weight)-Number(ws[0].weight):null,weightDates:ws.length>=2?[ws[0].date,ws.at(-1).date]:[]};
}
const v28BaseWeekly=v15RenderWeekly;
v15RenderWeekly=function(){
 v28BaseWeekly();const r=v28WeeklyData(logs,weights);
 const detail=document.createElement('div');detail.innerHTML='<div class="stats-grid"><div class="stat"><span>Rerata protein (hari tercatat)</span><b>'+(r.protein===null?'—':fmt(r.protein)+' g')+'</b></div><div class="stat"><span>Perubahan BB dalam rentang ini</span><b>'+(r.weightChange===null?'—':(r.weightChange>0?'+':'')+r.weightChange.toFixed(1)+' kg')+'</b></div></div>'+
 '<p class="small muted">'+(r.weightDates.length?'BB dibandingkan dari '+r.weightDates.join(' hingga ')+'. ':'Perubahan BB memerlukan dua tanggal penimbangan dalam rentang ini. ')+'Hari berisi catatan belum tentu mencakup seluruh asupan.</p>'+
 '<div class="v28-table-wrap"><table class="v28-week-table"><thead><tr><th>Tanggal</th><th>Kalori</th><th>Protein</th><th>Pencatatan</th></tr></thead><tbody>'+r.days.map(d=>'<tr><td>'+esc(parseDate(d.date).toLocaleDateString('id-ID',{day:'numeric',month:'short'}))+'</td><td>'+(d.recorded?fmt(d.cal)+' kcal':'—')+'</td><td>'+(d.recorded?fmt(d.p)+' g':'—')+'</td><td>'+(d.recorded?'Ada catatan':'Belum dicatat')+'</td></tr>').join('')+'</tbody></table></div>';
 $('v15WeeklySummary').append(detail);
};
function v28InlineMeasure(f){
 const units=NutritionTools.units.filter(u=>u!=='porsi'),selected=units.find(u=>foodMeasures[f.id]?.[u])||'potong';
 return '<details class="v28-measure" data-food="'+esc(f.id)+'"><summary>Takaran pribadi</summary><p class="small muted">Isi gram bagian yang dimakan per satu takaran. Konversi kalori memerlukan berat porsi gizi yang diketahui.</p><label>Takaran<select data-v28unit>'+units.map(u=>'<option'+(u===selected?' selected':'')+'>'+u+'</option>').join('')+'</select></label><label>Gram per 1 takaran<input data-v28grams type="number" min="0.01" max="10000" step="any" inputmode="decimal" value="'+(foodMeasures[f.id]?.[selected]||'')+'" placeholder="Hasil penimbangan"></label><button type="button" class="secondary full" data-v28save>Simpan takaran</button></details>';
}
const v28BaseFoodCard=foodCard;
foodCard=function(f,add=true,q=''){return v28BaseFoodCard(f,add,q)+v28InlineMeasure(f);};
async function v28SaveInline(box){
 const id=box.dataset.food,unit=box.querySelector('[data-v28unit]').value,grams=Number(box.querySelector('[data-v28grams]').value),button=box.querySelector('[data-v28save]');
 if(button.disabled)return;
 if(!NutritionTools.units.includes(unit)||unit==='porsi'||!NutritionTools.positive(grams)||grams>10000){toast('Isi berat lebih dari 0 sampai 10.000 gram.');return}
 button.disabled=true;
 try{const next={...foodMeasures,[id]:{...(foodMeasures[id]||{}),[unit]:grams}};await dbSetKV('foodMeasures',next);foodMeasures=next;renderDatabase();renderAddResults();toast('Takaran disimpan: 1 '+unit+' = '+grams+' g');}catch{toast('Takaran gagal disimpan.');}finally{button.disabled=false;}
}
let v28WaitingWorker=null,v28UpdateRequested=false,v28Reloaded=false,v28Registration=null,v28Checking=false,v28NeedsReload=false;
function v28CheckStatus(text){$('v28CheckStatus').textContent=text;}
function v28WithTimeout(promise,ms=15000){
 let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),ms);})]).finally(()=>clearTimeout(timer));
}
function v28WaitForInstall(worker){
 return new Promise((resolve,reject)=>{
  let timer;const finish=()=>{worker.removeEventListener('statechange',changed);clearTimeout(timer);};
  const changed=()=>{if(worker.state==='installed'||worker.state==='activated'){finish();resolve();}else if(worker.state==='redundant'){finish();reject(Error('install'));}};
  worker.addEventListener('statechange',changed);timer=setTimeout(()=>{finish();reject(Error('timeout'));},15000);changed();
 });
}
async function v28CheckForUpdate(){
 if(v28Checking)return;
 if(!navigator.onLine){v28CheckStatus('Sedang offline. Sambungkan internet lalu coba kembali.');return;}
 if(!('serviceWorker' in navigator)){v28CheckStatus('Pembaruan aplikasi tidak didukung browser ini. Buka KaloriKu melalui Chrome.');return;}
 v28Checking=true;const button=$('v28CheckUpdate');button.disabled=true;button.textContent='Memeriksa…';v28CheckStatus('Memeriksa pembaruan. Tunggu sebentar.');
 try{
  const registration=v28Registration||await v28WithTimeout(navigator.serviceWorker.getRegistration())||await v28WithTimeout(navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}));v28Registration=registration;
  await v28WithTimeout(registration.update());
  if(registration.installing){v28CheckStatus('Versi baru sedang diunduh.');await v28WaitForInstall(registration.installing);}
  if(registration.waiting&&navigator.serviceWorker.controller)v28OfferUpdate(registration.waiting);
  else v28CheckStatus('Pemeriksaan selesai. Belum ada pembaruan aplikasi yang tersedia.');
 }catch(e){v28CheckStatus(e.message==='timeout'?'Pemeriksaan terlalu lama. Periksa koneksi lalu coba lagi.':'Pembaruan gagal diperiksa atau diunduh. Periksa koneksi lalu coba lagi.');}
 finally{v28Checking=false;button.disabled=false;button.textContent='Periksa pembaruan';}
}
function v28OfferUpdate(worker){
 if(!worker||!navigator.serviceWorker?.controller)return;
 v28WaitingWorker=worker;v28NeedsReload=false;$('v28UpdateNotice').classList.remove('hidden');$('v28ApplyUpdate').disabled=false;
 $('v28ProfileApply').classList.remove('hidden');$('v28ProfileApply').disabled=false;v28CheckStatus('Versi baru siap. Tekan Perbarui sekarang setelah menyelesaikan formulir.');
}
function v28HasOpenForm(){return [...document.querySelectorAll('dialog')].some(d=>d.open)||!!document.querySelector('.v28-measure[open]');}
function v28ApplyUpdate(){
 const dialog=v28HasOpenForm();
 if(dialog||v20Busy||v17Restoring){v28CheckStatus('Selesaikan atau tutup formulir dan proses sinkronisasi sebelum memperbarui.');toast('Selesaikan atau tutup formulir dan proses sinkronisasi sebelum memperbarui.');return}
 if(v28NeedsReload){location.reload();return;}
 if(!v28WaitingWorker){v28CheckStatus('Periksa pembaruan terlebih dahulu.');return;}
 v28UpdateRequested=true;$('v28ApplyUpdate').disabled=true;$('v28ProfileApply').disabled=true;v28CheckStatus('Memasang pembaruan…');v28WaitingWorker.postMessage({type:'SKIP_WAITING'});
}
function v28ControllerChanged(){
 if(v28UpdateRequested&&!v28Reloaded){v28Reloaded=true;location.reload();}
 else if(!v28UpdateRequested){v28NeedsReload=true;v28WaitingWorker=null;$('v28UpdateNotice').classList.remove('hidden');$('v28UpdateText').textContent='Aplikasi diperbarui dari tab lain. Muat ulang setelah menyelesaikan formulir.';$('v28ApplyUpdate').disabled=false;$('v28ProfileApply').classList.remove('hidden');$('v28ProfileApply').disabled=false;v28CheckStatus('Aplikasi diperbarui dari tab lain. Tekan Perbarui sekarang setelah menyelesaikan formulir.');}
}
registerSW=async function(){
 if(!('serviceWorker' in navigator))return;
 try{
  let wasControlled=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(wasControlled||v28UpdateRequested)v28ControllerChanged();wasControlled=true;});
  const registration=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});v28Registration=registration;
  if(registration.waiting)v28OfferUpdate(registration.waiting);
  registration.addEventListener('updatefound',()=>{const worker=registration.installing;if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&registration.waiting)v28OfferUpdate(registration.waiting);});});
 }catch(e){console.warn('Pemeriksaan pembaruan gagal',e);}
};
document.addEventListener('DOMContentLoaded',()=>{
 $('v28ApplyUpdate').onclick=v28ApplyUpdate;
 $('v28ProfileApply').onclick=v28ApplyUpdate;
 $('v28UpdateLater').onclick=()=>{$('v28UpdateNotice').classList.add('hidden');};
 $('v28CheckUpdate').onclick=v28CheckForUpdate;
 document.addEventListener('click',e=>{if(e.target.closest('[data-v28save]'))v28SaveInline(e.target.closest('.v28-measure'));});
 document.addEventListener('change',e=>{if(!e.target.matches('[data-v28unit]'))return;const box=e.target.closest('.v28-measure');box.querySelector('[data-v28grams]').value=foodMeasures[box.dataset.food]?.[e.target.value]||'';});
});
