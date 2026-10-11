/* Local backup reminders, first-use guide, transfer help and saved barcode products. */
let v213BackupState=null,v213PendingBackup=null,v213BackupBusy=false,v213ConfirmBusy=false,v213Ready=false;
let v213EditingFood=null,v213EditBusy=false;
const v213Optional=[['fiber','Serat (g)'],['sugar','Gula (g)'],['sodium','Natrium (mg)'],['saturatedFat','Lemak jenuh (g)']];
function v213ValidBackupState(state){return state&&Number.isFinite(Date.parse(state.confirmedAt))&&Date.parse(state.confirmedAt)<=Date.now()&&Number.isFinite(Date.parse(state.exportedAt))?state:null;}
function v213RenderBackup(){
 const state=v213ValidBackupState(v213BackupState),hasData=logs.length||weights.length||customFoods.length||Object.keys(typeof v15WaterRecords==='undefined'?{}:v15WaterRecords).length;
 $('v213BackupStatus').textContent=state?'Backup terakhir dikonfirmasi: '+new Date(state.confirmedAt).toLocaleString('id-ID')+'.':'Belum ada backup yang dikonfirmasi pada perangkat ini.';
 $('v213BackupReminder').classList.toggle('hidden',!hasData||(state&&Date.now()-Date.parse(state.confirmedAt)<7*86400000));
 $('v213BackupReminderText').textContent=state?'Sudah 7 hari atau lebih sejak backup terakhir. Simpan cadangan terbaru.':'Catatan tersimpan di perangkat ini. Buat backup agar bisa dipulihkan jika ganti HP.';
}
backup=async function(){
 if(v213BackupBusy||v213ConfirmBusy)return;v213BackupBusy=true;$('backupBtn').disabled=true;
 try{
  const data=await v20Snapshot(),revision=v24SnapshotRevision;
  const filename=`KaloriKu_backup_${localDate()}.json`;
  download(filename,'application/json',JSON.stringify(data,null,2));
  v213PendingBackup={exportedAt:data.exportedAt,revision,filename};
  $('v213BackupConfirmStatus').textContent='Periksa folder Unduhan dan pastikan file '+filename+' tersimpan. Jika belum, tutup panduan ini lalu coba Backup JSON lagi.';
  if(!$('v213BackupConfirmDialog').open)$('v213BackupConfirmDialog').showModal();
 }catch(e){toast('Backup gagal: '+e.message);}
 finally{v213BackupBusy=false;$('backupBtn').disabled=false;}
};
async function v213ConfirmBackup(){
 if(v213ConfirmBusy||!v213PendingBackup)return;
 v213ConfirmBusy=true;$('v213BackupConfirmBtn').disabled=true;
 try{
  const state={...v213PendingBackup,confirmedAt:new Date().toISOString()};
  await dbSetKV('v213BackupState',state);v213BackupState=state;v213PendingBackup=null;
  $('v213BackupConfirmDialog').close();v213RenderBackup();toast('Tanggal backup dikonfirmasi. Simpan file di tempat yang aman.');
 }catch(e){$('v213BackupConfirmStatus').textContent='Konfirmasi belum dapat disimpan. File backup tetap bisa dipakai. Tekan File sudah tersimpan untuk mencoba lagi.';}
 finally{v213ConfirmBusy=false;$('v213BackupConfirmBtn').disabled=false;}
}
function v213CloseBackup(){if(v213ConfirmBusy)return;v213PendingBackup=null;$('v213BackupConfirmDialog').close();}
function v213BarcodeFoods(){const q=$('v213BarcodeSearch').value.trim().toLowerCase();return customFoods.filter(f=>f.barcode&&(!q||(f.name+' '+f.barcode).toLowerCase().includes(q))).sort((a,b)=>a.name.localeCompare(b.name,'id'));}
function v213RenderBarcodes(){
 const foods=v213BarcodeFoods(),list=$('v213BarcodeList');list.replaceChildren();$('v213BarcodeCount').textContent=customFoods.filter(f=>f.barcode).length;
 if(!foods.length){list.textContent='Belum ada produk barcode yang sesuai. Produk berhasil dipindai atau disimpan dari label akan muncul di sini.';return;}
 for(const f of foods){
  const row=document.createElement('div');row.className='log-row';const info=document.createElement('div');info.className='food-info';
  const name=document.createElement('strong');name.textContent=f.name;const meta=document.createElement('div');meta.className='food-meta';meta.textContent=f.barcode+' · '+f.serving+' · '+(f.source_type==='label'?'Label kemasan':'Data produk tersimpan');info.append(name,meta);
  const edit=document.createElement('button');edit.type='button';edit.className='secondary';edit.textContent='Koreksi';edit.setAttribute('aria-label','Koreksi '+f.name);edit.onclick=()=>v213OpenBarcodeEdit(f.id);row.append(info,edit);list.append(row);
 }
}
function v213OpenBarcodeEdit(id){
 if(v213EditBusy)return;const food=customFoods.find(f=>f.id===id&&f.barcode);if(!food)return;
 v213EditingFood=structuredClone(food);$('v213ProductName').value=food.name;$('v213ProductServing').value=food.serving;
 for(const key of ['calories','protein','carbs','fat',...v213Optional.map(x=>x[0])])$('v213Product_'+key).value=food[key]??'';
 $('v213ProductCode').textContent='Barcode: '+food.barcode;$('v213ProductStatus').textContent='';$('v213ProductDialog').showModal();
}
async function v213SaveBarcodeEdit(event){
 event.preventDefault();if(v213EditBusy||!v213EditingFood)return;
 const old=v213EditingFood,name=$('v213ProductName').value.trim(),serving=$('v213ProductServing').value.trim(),values={};
 if(!name||!serving){$('v213ProductStatus').textContent='Isi nama dan takaran yang sesuai label kemasan.';return;}
 for(const key of ['calories','protein','carbs','fat',...v213Optional.map(x=>x[0])]){
  const text=$('v213Product_'+key).value.trim();
  if(!text&&v213Optional.some(x=>x[0]===key))continue;
  const value=Number(text);if(!text||!Number.isFinite(value)||value<0){$('v213ProductStatus').textContent='Isi kalori dan makro dengan angka nol atau positif. Gizi tambahan boleh dikosongkan jika tidak diketahui.';return;}values[key]=value;
 }
 const food={...old,name,serving,calories:values.calories,protein:values.protein,carbs:values.carbs,fat:values.fat,source_type:'label',source_ref:'Label kemasan · '+old.barcode};
 for(const key of v213Optional.map(x=>x[0])){delete food[key];if(key in values)food[key]=values[key];}
 delete food.servingGrams;delete food.nutrient_source_method;
 v213EditBusy=true;const controls=[...$('v213ProductForm').querySelectorAll('input,button')].map(b=>[b,b.disabled]);controls.forEach(([b])=>b.disabled=true);
 $('v213ProductStatus').textContent='Menyimpan…';
 try{
  await dbMutation('customFoods',store=>{const r=store.get(old.id);r.onsuccess=()=>{try{if(NutritionTools.canonical(r.result)!==NutritionTools.canonical(old)){store.transaction.abort();return;}store.put(food);}catch{store.transaction.abort();}};},true,[{field:'customFoods',key:old.id,deleted:false}]);
  customFoods=customFoods.map(f=>f.id===food.id?food:f);allFoods=[...staticFoods,...customFoods];v213EditingFood=null;$('v213ProductDialog').close();renderDatabase();v213RenderBarcodes();toast('Produk diperbarui. Catatan makan lama tetap memakai nilai sebelumnya.');
 }catch(e){$('v213ProductStatus').textContent='Produk gagal disimpan atau sudah berubah. Isian tetap tersedia; coba lagi. Jika tetap gagal, tutup lalu buka ulang Koreksi.';}
 finally{v213EditBusy=false;controls.forEach(([b,disabled])=>b.disabled=disabled);}
}
function v213CloseProduct(){if(v213EditBusy)return;v213EditingFood=null;$('v213ProductDialog').close();}
const v213BaseProfile=renderProfile;renderProfile=function(){v213BaseProfile();v213RenderBackup();v213RenderBarcodes();};
const v213BaseDatabase=renderDatabase;renderDatabase=function(){v213BaseDatabase();v213RenderBarcodes();};
const v213BaseToday=renderToday;renderToday=function(){v213BaseToday();v213RenderBackup();};
document.addEventListener('DOMContentLoaded',async()=>{
 $('v213BackupConfirmBtn').onclick=v213ConfirmBackup;$('v213BackupConfirmClose').onclick=v213CloseBackup;
 $('v213BackupConfirmDialog').addEventListener('cancel',e=>{if(v213ConfirmBusy)e.preventDefault()});
 $('v213BackupConfirmDialog').addEventListener('close',()=>{v213PendingBackup=null});
 $('v213BackupReminderBtn').onclick=backup;$('v213GuideProfile').onclick=()=>go('profile');$('v213GuideRecord').onclick=openAdd;$('v213GuideInstall').onclick=installPWA;$('v213GuideBackup').onclick=backup;
 $('v213GuideShow').onclick=async()=>{try{await dbSetKV('v213GuideHidden',false);$('v213Guide').classList.remove('hidden');go('today');$('v213Guide').open=true;}catch{toast('Panduan belum dapat dibuka. Coba lagi.');}};
 $('v213GuideDismiss').onclick=async()=>{try{await dbSetKV('v213GuideHidden',true);$('v213Guide').classList.add('hidden');}catch{toast('Pilihan belum tersimpan. Coba lagi.');}};
 $('v213BarcodeSearch').oninput=v213RenderBarcodes;$('v213ProductForm').onsubmit=v213SaveBarcodeEdit;$('v213ProductClose').onclick=v213CloseProduct;
 $('v213ProductDialog').addEventListener('cancel',e=>{if(v213EditBusy)e.preventDefault()});
 window.addEventListener('kaloriku:datachanged',()=>setTimeout(()=>{v213RenderBackup();v213RenderBarcodes();},0));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)v213RenderBackup()});
 try{
  const [state,hidden,savedProfile]=await Promise.all([dbGetKV('v213BackupState'),dbGetKV('v213GuideHidden',false),dbGetKV('profile')]);
  v213BackupState=v213ValidBackupState(state);$('v213Guide').classList.toggle('hidden',hidden===true);$('v213Guide').open=!savedProfile&&!hidden;
 }catch{ $('v213BackupStatus').textContent='Status backup belum dapat dibaca. File backup Anda tetap bisa dipakai.'; }
 v213RenderBackup();v213RenderBarcodes();v213Ready=true;
});
