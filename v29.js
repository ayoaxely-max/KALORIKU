/* Source provenance, explicit spelling suggestions and reviewed shortcuts. */
function v29Quality(f){
 const type=f.source_type||f.sourceType||'estimate',pending='Belum diverifikasi dari sumber primer';
 const bad=['calories','protein','carbs','fat'].some(k=>typeof f[k]!=='number'||!Number.isFinite(f[k])||f[k]<0);
 const conflict=f.source_code_conflict||f.verification_status==='printed_source_conflict';
 const flagged=['printed_source_anomaly','independent_source_needed'].includes(f.macro_verification_status);
 let status=pending;
 if(type==='estimate')status='Estimasi resep dan porsi';
 else if(type==='user')status=f.recipe?'Perhitungan resep pribadi':'Input pengguna';
 else if(type==='label')status='Input dari label produk';
 else if(type==='openfoodfacts')status='Data komunitas; cocokkan dengan kemasan';
 else if(type==='calculated')status='Konversi porsi; mengikuti kualitas data asal';
 else if(type==='tkpi'&&f.macro_verification_status==='primary_pdf_crosschecked')status='Energi dan makro dicocokkan dengan PDF primer';
 else if(type==='tkpi'&&(f.verification_status==='transcription_crosschecked_original_pending'||f.macro_verification_status==='transcription_crosschecked_original_pending'))status='Cocok dengan salinan tabel; sumber primer belum diperiksa lengkap';
 const printedAnomaly=f.verification_status==='printed_source_anomaly'&&f.macro_verification_status==='primary_pdf_crosschecked';
 if(printedAnomaly)status='Sesuai PDF primer; terdapat anomali pada angka tercetak';
 return {status,warning:bad?'Nilai gizi kosong, negatif, atau tidak valid':conflict?'Konflik sumber; perlu pemeriksaan ulang':printedAnomaly?'Anomali energi–makro tercetak di TKPI; angka sumber dipertahankan':(flagged||nutrientMismatch(f))?'Kalori dan makro berbeda dari perkiraan 4–4–9; perlu ditinjau':''};
}
function v29SourceDetails(f){
 const q=v29Quality(f);let link='';
 try{const u=new URL(f.source_url);if(u.protocol==='https:'||u.protocol==='http:')link='<a target="_blank" rel="noopener noreferrer" href="'+esc(u.href)+'">Buka sumber rujukan</a>';}catch{}
 return '<details class="v29-quality"><summary>Sumber &amp; kualitas: '+esc(q.status)+'</summary><p>'+esc(f.source_ref||f.source||'Sumber rinci belum dicatat.')+'</p><p class="small muted">Dasar nilai: '+esc(f.nutrient_basis||f.serving)+'. Status ini tidak memverifikasi seluruh zat gizi atau ketepatan porsi yang dimakan.</p>'+(f.verification_note?'<p>'+esc(f.verification_note)+'</p>':'')+(f.usage_note?'<p>'+esc(f.usage_note)+'</p>':'')+link+'</details>'+(q.warning?'<p class="v29-warning" role="status">⚠ '+esc(q.warning)+'</p>':'');
}
const v29BaseFoodCard=foodCard;
foodCard=function(f,add=true,q=''){return v29BaseFoodCard(f,add,q)+v29SourceDetails(f);};
function v29Suggestions(q){
 if(!foodSearchNorm(q))return [];
 const results=allFoods.filter(f=>foodMatches(f,q)).sort((a,b)=>foodMatchRank(a,q)-foodMatchRank(b,q));
 if(!results.length||foodMatchRank(results[0],q)<6)return [];
 return results.slice(0,3);
}
function v29RenderSuggestions(inputId,resultsId){
 const el=$(resultsId),old=el.querySelector('.v29-suggestions');if(old)old.remove();
 const foods=v29Suggestions($(inputId).value);if(!foods.length)return;
 const box=document.createElement('div');box.className='v29-suggestions';
 const p=document.createElement('p');p.textContent='Maksud Anda salah satu makanan ini? Periksa nama dan porsi.';box.append(p);
 for(const f of foods){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=f.name;b.onclick=()=>{$(inputId).value=f.name;inputId==='dbSearch'?renderDatabase():renderAddResults();};box.append(b);}
 el.prepend(box);
}
const v29BaseDatabase=renderDatabase;
renderDatabase=function(){v29BaseDatabase();v29RenderSuggestions('dbSearch','dbResults');};
const v29BaseAdd=renderAddResults;
renderAddResults=function(){v29BaseAdd();v29RenderSuggestions('foodSearch','addResults');};
function v29OpenFavorite(id){
 const f=allFoods.find(x=>x.id===id);if(!f)return;
 openAdd();$('entryDate').value=localDate();$('qtyInput').value='1';$('qtyUnit').value='porsi';$('foodSearch').value=f.name;renderAddResults();
 toast('Periksa waktu makan dan porsi, lalu tekan ＋ untuk menyimpan.');
}
function v29RenderFavorites(){
 const el=$('v29Favorites');if(!el)return;el.replaceChildren();
 const foods=favorites.map(id=>allFoods.find(f=>f.id===id)).filter(Boolean);
 if(!foods.length){el.textContent='Tekan ☆ pada kartu makanan untuk menambah favorit.';return;}
 for(const f of foods){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=f.name;b.onclick=()=>v29OpenFavorite(f.id);el.append(b);}
}
const v29BaseToday=renderToday;
renderToday=function(){v29BaseToday();v29RenderFavorites();};
const v29BaseToggle=toggleFav;
toggleFav=async function(id){await v29BaseToggle(id);v29RenderFavorites();};
let v29CopyDraft=[],v29CopyBusy=false;
copyYesterday=function(){
 const date=offsetDate(localDate(),-1),items=logs.filter(l=>l.date===date&&!l.mealPhotoId),photos=logs.filter(l=>l.date===date&&l.mealPhotoId).length;
 if(!items.length){toast(photos?'Catatan foto perlu dicatat ulang melalui Foto makanan.':'Kemarin belum ada catatan.');return;}
 v29CopyDraft=structuredClone(items);$('v29CopyDate').value=localDate();$('v29CopyDate').max=localDate();$('v29CopySave').disabled=false;
 $('v29CopyNote').textContent='Pilih makanan dan sesuaikan porsi. Nilai gizi memakai catatan asal. Catatan pada tanggal tujuan tetap ada.'+(photos?' '+photos+' item terkait foto tidak disalin; catat ulang melalui Foto makanan.':'');
 const el=$('v29CopyRows');el.replaceChildren();
 for(const [i,l] of v29CopyDraft.entries()){
  const row=document.createElement('div');row.className='v29-copy-row';row.dataset.index=i;
  row.innerHTML='<label class="v29-copy-choice"><input type="checkbox" data-copy-check checked> '+esc(l.name)+'</label><p class="small muted">1 porsi = '+esc(l.serving)+'</p><div class="grid2"><label>Jumlah porsi<input data-copy-qty type="number" min="0.01" step="any" value="'+l.qty+'"></label><label>Waktu makan<select data-copy-meal>'+['Sarapan','Makan Siang','Makan Malam','Snack','Minuman'].map(m=>'<option'+(l.meal===m?' selected':'')+'>'+m+'</option>').join('')+'</select></label></div>';
  el.append(row);
 }
 $('v29CopyDialog').showModal();
};
async function v29SaveCopy(e){
 e.preventDefault();if(v29CopyBusy)return;
 const date=$('v29CopyDate').value;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||localDate(parseDate(date))!==date||date>localDate()){toast('Pilih tanggal yang valid sampai hari ini.');return;}
 const rows=[...$('v29CopyRows').children].filter(r=>r.querySelector('[data-copy-check]').checked);
 if(!rows.length){toast('Pilih minimal satu makanan.');return;}
 const entries=[];
 for(const row of rows){const old=v29CopyDraft[Number(row.dataset.index)],qty=Number(row.querySelector('[data-copy-qty]').value);
  if(!Number.isFinite(qty)||qty<=0||qty>1000){toast('Jumlah porsi harus lebih dari 0 sampai 1.000.');return;}
  if(!old||!logs.some(l=>l.id===old.id&&NutritionTools.canonical(l)===NutritionTools.canonical(old))){toast('Catatan asal berubah. Tutup dan buka ulang pratinjau.');return;}
  entries.push({...old,id:'l_'+crypto.randomUUID(),date,qty,meal:row.querySelector('[data-copy-meal]').value,createdAt:Date.now()+entries.length});
 }
 v29CopyBusy=true;$('v29CopySave').disabled=true;
 try{await dbPutLogsReviewed(entries,v29CopyDraft.filter(l=>rows.some(r=>v29CopyDraft[Number(r.dataset.index)].id===l.id)));logs.push(...entries);$('v29CopyDialog').close();v29CopyDraft=[];renderToday();renderHistory();renderStats();toast(entries.length+' item disalin setelah diperiksa.');}
 catch{toast('Salin gagal atau catatan asal berubah. Buka ulang pratinjau; tidak ada item yang disimpan sebagian.');}
 finally{v29CopyBusy=false;$('v29CopySave').disabled=false;}
}
document.addEventListener('DOMContentLoaded',()=>{$('v29CopyForm').addEventListener('submit',v29SaveCopy);v29RenderFavorites();});
