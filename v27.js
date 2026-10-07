/* Local sync activity and shortcuts. No automatic network requests. */
let v27StatusSequence=0;
async function v27RecordSync(kind,revision=null){
 if(!v20AccountId)return;
 const account=v20AccountId,key='v27SyncActivity:'+account;
 try{
 const state=await dbGetKV(key,{});
 if(kind==='upload'){state.lastUpload=Date.now();state.uploadedLocalRevision=revision;state.needsUpload=false;}
 if(kind==='download')state.lastDownload=Date.now();
 if(kind==='merge'){state.lastMerge=Date.now();state.needsUpload=true;}
 if(kind==='delete'){state.uploadedLocalRevision=null;state.needsUpload=true;}
 await dbSetKV(key,state);await v27RenderSync();
 }catch{toast('Sinkronisasi diproses, tetapi riwayat aktivitas gagal disimpan.');}
}
async function v27RenderSync(){
 const el=$('v27SyncActivity');if(!el)return;
 const sequence=++v27StatusSequence,account=v20AccountId;
 if(!account){el.textContent='Hubungkan akun untuk melihat riwayat unggah dan unduh perangkat ini.';return}
 try{
  const [state,revision]=await Promise.all([dbGetKV('v27SyncActivity:'+account,{}),dbGetKV('v24DataRevision',0)]);
  if(sequence!==v27StatusSequence||account!==v20AccountId)return;
  const time=n=>Number.isFinite(n)?new Date(n).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):'Belum tercatat';
  const count=Number.isSafeInteger(state.uploadedLocalRevision)?Math.max(0,revision-state.uploadedLocalRevision):null;
  el.replaceChildren();
  for(const text of ['Unggah terakhir: '+time(state.lastUpload),'Unduh terakhir: '+time(state.lastDownload),count===null?'Belum ada unggahan tercatat dari perangkat ini.':count+' perubahan lokal sejak unggahan terakhir.']){const p=document.createElement('p');p.textContent=text;el.append(p);}
  if(state.needsUpload||count>0){const p=document.createElement('p');p.className='info-note';p.textContent=state.needsUpload?'Hasil gabungan belum diunggah. Tekan Unggah ke cloud agar perangkat lain menerima hasilnya.':'Ada perubahan lokal yang belum diunggah.';el.append(p);}
  const note=document.createElement('small');note.className='muted';note.textContent='Perubahan dihitung per penyimpanan, bukan jumlah catatan. Status ini tidak memeriksa perubahan baru di perangkat lain.';el.append(note);
 }catch{if(sequence===v27StatusSequence)el.textContent='Riwayat sinkronisasi belum dapat dibaca.';}
}
function v27RepeatCandidates(){
 const foods=new Map(allFoods.map(f=>[f.id,f])),counts=new Map();
 for(const l of logs){if(l.mealPhotoId||!foods.has(l.foodId))continue;let item=counts.get(l.foodId);if(!item){item={food:foods.get(l.foodId),count:0,latest:l};counts.set(l.foodId,item)}item.count++;if((l.createdAt||0)>(item.latest.createdAt||0))item.latest=l;}
 return [...counts.values()].sort((a,b)=>b.count-a.count||(b.latest.createdAt||0)-(a.latest.createdAt||0)).slice(0,5);
}
function v27RenderRepeat(){
 const el=$('v27RepeatList');if(!el)return;el.replaceChildren();
 const items=v27RepeatCandidates();$('v27RepeatCard').classList.toggle('hidden',!items.length);
 for(const item of items){const row=document.createElement('div');row.className='v27-repeat-row';const text=document.createElement('span');text.textContent=item.food.name;const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent='Catat lagi';b.setAttribute('aria-label','Catat lagi '+item.food.name);b.onclick=()=>v27OpenRepeat(item.food.id);row.append(text,b);el.append(row);}
}
function v27OpenRepeat(id){
 const item=v27RepeatCandidates().find(x=>x.food.id===id);if(!item)return;
 openAdd();$('entryDate').value=selectedEntryDate();$('qtyUnit').value='porsi';$('qtyInput').value=Number.isFinite(item.latest.qty)&&item.latest.qty>0?item.latest.qty:1;
 if([...$('mealSelect').options].some(x=>x.value===item.latest.meal))$('mealSelect').value=item.latest.meal;
 $('foodSearch').value=item.food.name;renderAddResults();
 toast('Periksa tanggal, waktu makan, dan jumlah; tekan ＋ untuk mencatat.');
}
document.addEventListener('DOMContentLoaded',()=>{v27RenderSync();v27RenderRepeat();});
window.addEventListener('kaloriku:datachanged',()=>{v27RenderSync();});
window.addEventListener('focus',()=>{v27RenderSync();});
