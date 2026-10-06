/* KaloriKu v2.0 — opt-in encrypted device synchronization.
   Sync service sees ciphertext only; recovery code never leaves this browser.
   No automatic upload/download, no email login, no merge without user review. */
const V20_ENDPOINT='https://kaloriku-sync-v2.ayoaxely.workers.dev';
const V20_PART_LENGTH=90000,V20_PART_LIMIT=120;
let v20Secret=null,v20AccountId=null,v20Token=null,v20KnownRevision=null,v20Busy=false;
let v20Downloaded=null,v20PendingCloudRestore=null;
const v20Text=new TextEncoder();
function v20B64url(bytes){
 let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function v20FromB64url(s){
 if(!/^[A-Za-z0-9_-]+$/.test(s)||s.length>16000000)throw Error('Kode atau data terenkripsi tidak valid');
 const binary=atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4));
 const b=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)b[i]=binary.charCodeAt(i);
 return b;
}
async function v20Sha(message){
 const b=new Uint8Array(await crypto.subtle.digest('SHA-256',v20Text.encode(message)));
 return [...b].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function v20SetBusy(value){
 v20Busy=value;
 for(const id of ['v20Create','v20Connect','v20Upload','v20Download','v20Disconnect','v20ReviewContinue'])$(id).disabled=value;
 if(value)$('v20Progress').classList.remove('hidden');
 else $('v20Progress').classList.add('hidden');
}
function v20Status(message,error=false){
 $('v20Status').textContent=message;
 $('v20Status').classList.toggle('v15-warning',error);
}
function v20Progress(message){$('v20Progress').textContent=message;}
function v20Panel(){
 $('v20Connected').classList.toggle('hidden',!v20Secret);
 $('v20Disconnected').classList.toggle('hidden',!!v20Secret);
 $('v20Upload').disabled=!v20Secret||v20Busy;
 $('v20Download').disabled=!v20Secret||v20Busy;
 $('v20Disconnect').disabled=!v20Secret||v20Busy;
 $('v20AccountLabel').textContent=v20AccountId?'Akun terenkripsi '+v20AccountId.slice(0,8)+'…':'Belum terhubung';
 $('v20KnownRevision').textContent=v20KnownRevision===null?'Belum sinkron':'Revisi terakhir pada perangkat ini: '+v20KnownRevision;
}
async function v20KeyForSecret(secret){
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',v20Text.encode('kaloriku-e2ee-v2|'+secret)));
 return crypto.subtle.importKey('raw',bytes,{name:'AES-GCM'},false,['encrypt','decrypt']);
}
async function v20Api(route,{method='GET',data=null,secret=v20Secret,account=v20AccountId,token=v20Token}={}){
 if(!account||!token||!secret)throw Error('Hubungkan kode pemulihan dahulu');
 const request={method,cache:'no-store',headers:{Authorization:'Bearer '+token}};
 if(data!==null){request.headers['Content-Type']='application/json';request.body=JSON.stringify(data)}
 const url=V20_ENDPOINT+route+(route.includes('?')?'&':'?')+'account='+encodeURIComponent(account);
 let response;
 try{response=await fetch(url,request)}catch(e){throw Error('Layanan cloud tidak bisa dihubungi. Periksa koneksi internet dan coba lagi.')}
 let value;try{value=await response.json()}catch{throw Error('Respons cloud tidak valid')}
 if(!response.ok||!value.ok){const err=Error(value.error||('Cloud HTTP '+response.status));err.status=response.status;throw err}
 return value;
}
async function v20Attach(secret,created=false){
 const key=secret.trim();
 if(!/^[A-Za-z0-9_-]{43}$/.test(key))throw Error('Kode pemulihan harus 43 karakter');
 if(v20FromB64url(key).length!==32)throw Error('Kode pemulihan bukan 32 byte');
 const [account,token]=await Promise.all([
 v20Sha('kaloriku-account-v2|'+key),v20Sha('kaloriku-auth-v2|'+key)
 ]);
 const result=await v20Api('/sync/init',{method:'POST',secret:key,account,token,data:{}});
 await dbSetKV('v20Secret',key);
 v20Secret=key;v20AccountId=account;v20Token=token;
 const prev=await dbGetKV('v20KnownRevision',null);
 v20KnownRevision=prev?.account===account&&Number.isInteger(prev.revision)?prev.revision:null;
 v20Panel();
 v20Status(result.active?
  'Terhubung. Cloud memiliki revisi '+result.revision+'. '+(v20KnownRevision===null?'Unduh cloud terlebih dahulu sebelum mengunggah.':'Sinkronisasi manual siap.') :
  'Akun terenkripsi siap, belum ada data cloud. Tekan Unggah untuk mengirim cadangan terenkripsi.');
 return result;
}
async function v20Create(){
 if(!window.isSecureContext||!crypto?.subtle){v20Status('Browser harus mendukung HTTPS dan enkripsi.',true);return}
 if(!confirm('Buat akun sinkronisasi baru? Kode pemulihan akan menjadi satu-satunya kunci membuka data cloud. Simpan di tempat aman.'))return;
 v20SetBusy(true);
 try{
  const secret=v20B64url(crypto.getRandomValues(new Uint8Array(32)));
  await v20Attach(secret,true);
  $('v20NewKey').value=secret;
  $('v20NewKeyWrap').classList.remove('hidden');
  v20Status('Akun baru dibuat. Salin dan simpan kode pemulihan sebelum melakukan sinkronisasi.');
 }catch(e){v20Status('Gagal membuat akun: '+e.message,true)}
 finally{v20SetBusy(false);v20Panel()}
}
async function v20Connect(){
 v20SetBusy(true);
 try{await v20Attach($('v20RecoveryInput').value);$('v20NewKeyWrap').classList.add('hidden');$('v20RecoveryInput').value=''}
 catch(e){v20Status(e.message,true)}
 finally{v20SetBusy(false);v20Panel()}
}
async function v20Disconnect(){
 if(!confirm('Putuskan kode pemulihan pada perangkat ini? Data lokal dan cloud tetap ada. Pastikan kode pemulihan sudah Anda simpan.'))return;
 try{
  await dbSetKV('v20Secret',null);
  v20Secret=v20Token=v20AccountId=null;v20KnownRevision=null;
  $('v20NewKey').value='';$('v20NewKeyWrap').classList.add('hidden');
  v20Status('Perangkat dilepas. Catatan lokal tidak berubah.');
  v20Panel();
 }catch(e){v20Status('Tidak dapat melepas akun: '+e.message,true)}
}
async function v20Snapshot(){
 const photos=[];
 for(const p of mealPhotos){
  const {image,...rest}=p;
  photos.push({...rest,imageData:image?await blobToDataURL(image):null});
 }
 const waterRecords=await dbGetKV('v15WaterRecords',{});
 const waterGoal=await dbGetKV('v15WaterGoal',2000);
 return {version:4,exportedAt:new Date().toISOString(),profile,favorites,packs,logs,customFoods,weights,
   mealPhotos:photos,waterRecords,waterGoal};
}
async function v20Encrypt(snapshot){
 const key=await v20KeyForSecret(v20Secret);
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const bytes=v20Text.encode(JSON.stringify(snapshot));
 const data=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,bytes));
 return v20B64url(iv)+'.'+v20B64url(data);
}
async function v20Decrypt(payload){
 const pos=payload.indexOf('.');
 if(pos<10||pos>32)throw Error('Format berkas cloud tidak valid');
 const iv=v20FromB64url(payload.slice(0,pos)),encrypted=v20FromB64url(payload.slice(pos+1));
 if(iv.length!==12)throw Error('Nonce terenkripsi salah');
 const key=await v20KeyForSecret(v20Secret);
 let decrypted;
 try{decrypted=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,encrypted)}
 catch{throw Error('Gagal membuka enkripsi. Kode pemulihan salah atau data cloud rusak.')}
 return JSON.parse(new TextDecoder().decode(decrypted));
}
async function v20SaveRevision(revision){
 v20KnownRevision=revision;
 await dbSetKV('v20KnownRevision',{account:v20AccountId,revision});
 v20Panel();
}
async function v20Upload(){
 if(v20Busy||!v20Secret)return;
 v20SetBusy(true);
 try{
  v20Progress('Memeriksa perubahan cloud…');
  const head=await v20Api('/sync/head');
  if(head.revision>0&&v20KnownRevision!==head.revision){
   throw Error('Cloud sudah memiliki data yang belum disinkronkan di perangkat ini. Unduh dan tinjau cloud terlebih dahulu. Pengunggahan diblokir untuk mencegah data tertimpa.');
  }
  v20Progress('Membuat cadangan lengkap dan mengenkripsinya…');
  const snapshot=await v20Snapshot();
  const check=v17ValidateBackup(snapshot);
  if(check.errors.length)throw Error('Data lokal harus diperbaiki sebelum sinkronisasi: '+check.errors.join('; '));
  const payload=await v20Encrypt(snapshot);
  const total=Math.ceil(payload.length/V20_PART_LENGTH);
  if(total>V20_PART_LIMIT)throw Error('Data terlalu besar untuk cloud (maksimal sekitar 8 MB data terenkripsi). Backup JSON lokal tetap bisa dipakai.');
  const uploadId=crypto.randomUUID();
  for(let i=0;i<total;i++){
   v20Progress('Mengunggah bagian '+(i+1)+' / '+total+' (terenkripsi)…');
   await v20Api('/sync/chunk',{method:'POST',data:{uploadId,index:i,data:payload.slice(i*V20_PART_LENGTH,(i+1)*V20_PART_LENGTH)}});
  }
  v20Progress('Memastikan tidak ada perubahan dari perangkat lain…');
  const result=await v20Api('/sync/commit',{method:'POST',data:{uploadId,total,expectedRevision:head.revision}});
  await v20SaveRevision(result.revision);
  v20Status('Berhasil unggah revisi '+result.revision+'. Data termasuk foto dikirim terenkripsi. Perangkat lain dapat mengunduhnya.');
 }catch(e){v20Status('Unggah dibatalkan: '+e.message,true)}
 finally{v20SetBusy(false);v20Panel()}
}
async function v20Download(){
 if(v20Busy||!v20Secret)return;
 v20SetBusy(true);
 try{
  v20Downloaded=null;
  v20Progress('Memeriksa cadangan cloud…');
  const manifest=await v20Api('/sync/manifest');
  if(!manifest.active||!manifest.chunks||manifest.chunks>V20_PART_LIMIT)throw Error('Belum ada data cloud yang bisa diunduh');
  if(manifest.bytes>12000000)throw Error('Data cloud melewati batas aman');
  const parts=new Array(manifest.chunks);
  for(let i=0;i<manifest.chunks;i++){
   v20Progress('Mengunduh bagian '+(i+1)+' / '+manifest.chunks+'…');
   const part=await v20Api('/sync/read?upload='+encodeURIComponent(manifest.upload)+'&index='+i);
   if(part.revision!==manifest.revision)throw Error('Cloud berubah selama unduhan. Ulangi unduh.');
   parts[i]=part.data;
  }
  v20Progress('Membuka enkripsi dan memeriksa struktur…');
  const snapshot=await v20Decrypt(parts.join(''));
  const check=v17ValidateBackup(snapshot);
  if(check.errors.length)throw Error('Data cloud gagal divalidasi: '+check.errors.join('; '));
  v20Downloaded={snapshot,revision:manifest.revision};
  $('v20ReviewDetails').textContent=
    'Revisi cloud: '+manifest.revision+'\nTanggal: '+(snapshot.exportedAt||'—')+
    '\nCatatan makan: '+snapshot.logs.length+
    '\nFoto makanan: '+(snapshot.mealPhotos||[]).length+
    '\nProduk sendiri: '+snapshot.customFoods.length+
    '\nBerat badan: '+snapshot.weights.length+
    '\nCatatan air: '+Object.keys(snapshot.waterRecords||{}).length+
    '\n\nData lokal Anda saat ini: '+logs.length+' catatan makan, '+mealPhotos.length+' foto.'+
    '\nData akan DIGANTI, bukan digabung.';
  $('v20BackupConfirmed').checked=false;
  $('v20ReviewContinue').disabled=true;
  $('v20ReviewDialog').showModal();
  v20Status('Cadangan terenkripsi telah diunduh dan lolos pemeriksaan. Data lokal belum berubah.');
 }catch(e){v20Status('Unduhan gagal: '+e.message,true)}
 finally{v20SetBusy(false);v20Panel()}
}
function v20ReviewContinue(){
 if(!v20Downloaded||!$('v20BackupConfirmed').checked){toast('Simpan backup lokal terlebih dahulu');return}
 const {snapshot,revision}=v20Downloaded;
 v20PendingCloudRestore={account:v20AccountId,revision};
 v17PendingBackup=snapshot;
 $('v17RestoreDetails').textContent=
  'Sumber: Cloud terenkripsi\nRevisi: '+revision+
  '\nCatatan makan: '+snapshot.logs.length+'\nFoto makanan: '+(snapshot.mealPhotos||[]).length+
  '\nData lokal akan DIGANTI setelah Anda mengonfirmasi.';
 v17SetBackupPreview('Cadangan sudah diperiksa. Klik Ganti data dengan backup untuk melakukan pemulihan. Data tidak digabung.');
 $('v17RestoreConfirm').disabled=false;
 $('v20ReviewDialog').close();v20Downloaded=null;
 $('v17RestoreDialog').showModal();
}
document.addEventListener('DOMContentLoaded',async()=>{
 $('v20Create').onclick=v20Create;$('v20Connect').onclick=v20Connect;
 $('v20Upload').onclick=v20Upload;$('v20Download').onclick=v20Download;
 $('v20Disconnect').onclick=v20Disconnect;
 $('v20ReviewCancel').onclick=()=>{$('v20ReviewDialog').close();v20Downloaded=null};
 $('v20BackupConfirmed').onchange=v=>{$('v20ReviewContinue').disabled=!$('v20BackupConfirmed').checked};
 $('v20ReviewContinue').onclick=v20ReviewContinue;
 $('v20CopyKey').onclick=async()=>{
  const secret=$('v20NewKey').value;
  try{await navigator.clipboard.writeText(secret);toast('Kode pemulihan disalin')}
  catch{$('v20NewKey').focus();$('v20NewKey').select();toast('Silakan salin kode secara manual')}
 };
 const old=$('v17RestoreConfirm').onclick;
 $('v17RestoreConfirm').onclick=async()=>{
  const marker=v20PendingCloudRestore;
  await old();
  if(marker&&!v17PendingBackup){
   if(marker.account===v20AccountId)await v20SaveRevision(marker.revision);
   v20Status('Data cloud berhasil diterapkan. Revisi '+marker.revision+' siap disinkronkan manual dari perangkat ini.');
  }
  v20PendingCloudRestore=null;
 };
 $('v17RestoreCancel').addEventListener('click',()=>{v20PendingCloudRestore=null});
 $('v17RestoreDialog').addEventListener('close',()=>{if(!v17Restoring)v20PendingCloudRestore=null});
 if(!window.isSecureContext||!crypto?.subtle){v20Status('Sinkronisasi membutuhkan browser modern melalui HTTPS.',true);return}
 try{
  const saved=await dbGetKV('v20Secret',null);
  if(saved){try{await v20Attach(saved)}catch(e){v20Status('Kode tersimpan, tetapi cloud belum bisa dihubungi: '+e.message,true)}}
  else v20Status('Mode offline aktif. Akun cloud opsional; data tetap berada di perangkat.');
 }catch(e){v20Status('Tidak dapat membaca pengaturan sinkronisasi: '+e.message,true)}
 v20Panel();
});
