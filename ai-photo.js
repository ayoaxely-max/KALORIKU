const DEFAULT_AI_BACKEND='https://kaloriku-ai.ayoaxely.workers.dev';
let aiBackendUrl='';

function aiNorm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim()}
function aiTokens(s){return new Set(aiNorm(s).split(' ').filter(x=>x.length>1&&!['dan','dengan','yang','goreng','rebus','masak','porsi'].includes(x)))}
function aiFoodScore(foodName,query){
  const a=aiNorm(foodName),b=aiNorm(query);if(a===b)return 100;if(a.includes(b)||b.includes(a))return 85;
  const A=aiTokens(a),B=aiTokens(b);let hit=0;for(const t of B)if(A.has(t))hit++;
  return hit/Math.max(1,Math.max(A.size,B.size))*75-Math.abs(a.length-b.length)*.08;
}
function findBestFoodMatch(name){
  let best=null,score=-999;for(const f of allFoods){const s=aiFoodScore(f.name,name);if(s>score){score=s;best=f}}
  return score>=80?{food:best,score}:null;
}
async function blobBase64(blob){
  const buf=await blob.arrayBuffer(),bytes=new Uint8Array(buf);let bin='';
  for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
  return btoa(bin);
}
function setAiStatus(text,type='info'){
  const el=$('aiPhotoStatus');if(!el)return;
  el.classList.remove('hidden','ai-error','ai-ok');
  if(type==='error')el.classList.add('ai-error');if(type==='ok')el.classList.add('ai-ok');
  el.textContent=text;
}
function normalizeBackendUrl(v){return String(v||'').trim().replace(/\/+$/,'')}
async function loadAiBackend(){
  aiBackendUrl=normalizeBackendUrl(await dbGetKV('aiBackendUrl',DEFAULT_AI_BACKEND));
  const input=$('aiBackendUrl');if(input)input.value=aiBackendUrl;
  updateAiBackendStatus(aiBackendUrl?'Tersimpan — belum dites':'Belum terhubung');
}
function updateAiBackendStatus(text,ok=false){
  const el=$('aiBackendStatus');if(!el)return;el.textContent=text;el.style.color=ok?'#166534':'';
}
async function saveAiBackend(){
  const url=normalizeBackendUrl($('aiBackendUrl').value);
  if(!/^https:\/\//i.test(url)){toast('Masukkan URL Worker HTTPS');return}
  aiBackendUrl=url;await dbSetKV('aiBackendUrl',url);await testAiBackend(true);
}
async function clearAiBackend(){
  aiBackendUrl=DEFAULT_AI_BACKEND;await dbSetKV('aiBackendUrl',DEFAULT_AI_BACKEND);$('aiBackendUrl').value=DEFAULT_AI_BACKEND;updateAiBackendStatus('Menggunakan backend default');toast('Kembali ke backend default');
}
async function testAiBackend(showToast=false){
  if(!aiBackendUrl){updateAiBackendStatus('Belum terhubung');return false}
  updateAiBackendStatus('Mengecek…');
  try{
    const r=await fetch(aiBackendUrl+'/health',{cache:'no-store'});
    const j=await r.json();
    if(!r.ok||!j.ok)throw new Error(j.error||'Backend gagal');
    if(!j.geminiConfigured)throw new Error('Gemini API key belum dipasang di Worker');
    updateAiBackendStatus('Terhubung · '+(j.model||'Gemini'),true);
    if(showToast)toast('Backend AI siap');
    return true;
  }catch(e){updateAiBackendStatus('Belum siap: '+String(e.message||e));if(showToast)toast('Backend AI belum siap');return false}
}
async function analyzeFoodPhoto(){
  if(!photoDraftBlob){toast('Ambil atau pilih foto dulu');return}
  if(!aiBackendUrl){toast('Atur URL backend AI di Profil');go('profile');return}
  const sourcePhoto=photoDraftBlob;
  const btn=$('analyzePhotoBtn');btn.disabled=true;btn.textContent='Menganalisis…';
  setAiStatus('AI mengenali makanan. Jika server sedang sibuk, aplikasi akan mencoba kembali secara otomatis.');
  try{
    const b64=await blobBase64(sourcePhoto);
    let succeeded=false;
    for(let attempt=0;attempt<2;attempt++){
      if(sourcePhoto!==photoDraftBlob)return; // Foto telah diganti / dialog ditutup.
      let response,body;
      try{
        response=await fetch(aiBackendUrl+'/analyze',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({imageBase64:b64,mimeType:sourcePhoto.type||'image/jpeg'}),
          signal:AbortSignal.timeout(50000)
        });
        body=await response.json().catch(()=>null);
      }catch(error){
        if(attempt===0){
          setAiStatus('Koneksi AI terputus. Mencoba sekali lagi…');
          await new Promise(resolve=>setTimeout(resolve,1800));
          continue;
        }
        throw new Error('Tidak dapat menghubungi AI. Periksa koneksi internet dan coba lagi.');
      }
      if(response.ok&&body?.ok){
        if(sourcePhoto!==photoDraftBlob)return;
        applyAiSuggestions(body.result);
        succeeded=true;
        break;
      }
      const transient=[429,502,503,504].includes(response.status)&&body?.retryable!==false;
      if(transient&&attempt===0){
        setAiStatus('Layanan AI sedang sibuk. Mencoba kembali otomatis (2/2)…');
        await new Promise(resolve=>setTimeout(resolve,1800));
        continue;
      }
      if(transient)throw new Error('Server AI sedang sibuk. Coba lagi beberapa menit atau masukkan komponen makanan secara manual.');
      if(body?.error==='gemini_not_configured')throw new Error('Backend AI belum dikonfigurasi. Periksa pengaturan AI di Profil.');
      throw new Error('Analisis belum berhasil. Silakan coba kembali atau pilih makanan secara manual.');
    }
    if(!succeeded&&sourcePhoto===photoDraftBlob)throw new Error('Analisis belum berhasil. Coba beberapa saat lagi.');
  }catch(error){
    if(sourcePhoto===photoDraftBlob){
      setAiStatus(String(error.message||'Analisis gagal. Silakan coba lagi.'),'error');
    }
  }finally{
    btn.disabled=!photoDraftBlob;
    btn.textContent='✨ Analisis ulang dengan AI';
  }
}
function applyAiSuggestions(result){
  const foods=Array.isArray(result?.foods)?result.foods:[],matched=[],unmatched=[];
  for(const s of foods){
    const m=findBestFoodMatch(s.name);
    if(m&&Number(s.confidence)>=.50){
      const sg=photoServingGrams(m.food),grams=Math.max(1,Math.round(Number(s.estimated_grams)||sg||100));
      matched.push({id:'pi_'+crypto.randomUUID(),food:m.food,servingGrams:sg,grams:sg?grams:null,qty:sg?grams/sg:1,ai:{name:s.name,grams,min:Math.round(Number(s.min_grams)||grams*.7),max:Math.round(Number(s.max_grams)||grams*1.3),confidence:Math.max(0,Math.min(1,Number(s.confidence)||0)),portion:s.portion_description||'',basis:s.visual_basis||'',matchScore:m.score}});
    }else unmatched.push(s);
  }
  photoDraftItems=matched;renderPhotoSelected();renderAiSuggestions(result,unmatched);
  if(result?.meal_description&&!$('photoNote').value)$('photoNote').value=result.meal_description;
  const high=matched.filter(x=>x.ai.confidence>=.7).length;
  setAiStatus(`AI menemukan ${foods.length} komponen; ${matched.length} cocok dengan syarat ketat. ${high} keyakinan visual tinggi. Periksa nama dan gram/porsi sebelum simpan. Hasil foto tidak dapat menentukan berat pasti.`,'ok');
}
function renderAiSuggestions(result,unmatched){
 const el=$('aiSuggestions');if(!el)return;
 const rows=photoDraftItems.filter(i=>i.ai).map(i=>'<div class="ai-suggestion"><div><strong>'+
   esc(i.ai.name)+'</strong><small>→ '+esc(i.food.name)+'</small><small>Referensi: '+
   esc(sourceLabel(i.food.source_type||i.food.sourceType))+'</small>'+
   (!i.servingGrams?'<small class="ai-hint">Estimasi '+fmt(i.ai.grams)+
      ' g TIDAK digunakan untuk menghitung kalori: database hanya punya nilai per porsi. Sesuaikan jumlah porsi.</small>':
      '<small>Estimasi berat '+fmt(i.ai.grams)+' g; koreksi gram di bawah.</small>')+
   '<button class="text-btn" type="button" data-v16find="'+esc(i.ai.name)+'">Cari padanan lain</button></div>'+
   '<div class="ai-range">≈ '+fmt(i.ai.grams)+' g<br><small>'+fmt(i.ai.min)+'–'+
   fmt(i.ai.max)+' g · keyakinan visual '+Math.round(i.ai.confidence*100)+'%</small></div></div>').join('');
 const miss=unmatched.map(s=>'<div class="ai-suggestion ai-unmatched"><div><strong>'+esc(s.name)+
    '</strong><small>Nama/kondisi foto belum cocok secara aman. Pilih manual, jangan asumsikan kalori.</small>'+
    '<button type="button" class="text-btn" data-v16find="'+esc(s.name)+'">Cari makanan ini</button></div>'+
    '<div class="ai-range">≈ '+fmt(s.estimated_grams)+' g</div></div>').join('');
 el.innerHTML=(rows||miss)?'<div class="ai-suggestion-box"><div class="section-head no-pad"><h2>Saran AI</h2><span>estimasi visual, bukan timbangan</span></div>'+rows+miss+'</div>':'';
 el.querySelectorAll('[data-v16find]').forEach(btn=>btn.onclick=()=>{
    $('photoSearch').value=btn.dataset.v16find;renderPhotoSearch();$('photoSearch').focus();
 });
}
function decorateAiSelected(){
  document.querySelectorAll('.photo-selected-row').forEach((row,idx)=>{
    const i=photoDraftItems[idx];if(!i?.ai)return;
    const info=row.querySelector('.food-info small');
    if(info)info.innerHTML+=`<br><span class="ai-hint">AI: ${i.ai.min}–${i.ai.max} g · confidence ${Math.round(i.ai.confidence*100)}%</span>`;
  });
}
const _renderPhotoSelected=renderPhotoSelected;
renderPhotoSelected=function(){_renderPhotoSelected();decorateAiSelected()};

document.addEventListener('DOMContentLoaded',async()=>{
  await loadAiBackend();
  $('saveAiBackendBtn').onclick=saveAiBackend;
  $('clearAiBackendBtn').onclick=clearAiBackend;
  $('analyzePhotoBtn').onclick=analyzeFoodPhoto;
  $('photoPreview').addEventListener('load',()=>{$('analyzePhotoBtn').disabled=false});
  if(aiBackendUrl)testAiBackend(false);
});