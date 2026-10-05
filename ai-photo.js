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
  return score>=24?{food:best,score}:null;
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
  aiBackendUrl=normalizeBackendUrl(await dbGetKV('aiBackendUrl',''));
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
  aiBackendUrl='';await dbSetKV('aiBackendUrl','');$('aiBackendUrl').value='';updateAiBackendStatus('Belum terhubung');toast('URL backend dihapus');
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
  const btn=$('analyzePhotoBtn');btn.disabled=true;btn.textContent='Menganalisis…';
  setAiStatus('AI sedang mengenali komponen makanan dan memperkirakan porsinya. Hasil tetap perlu dikoreksi.');
  try{
    const b64=await blobBase64(photoDraftBlob);
    const r=await fetch(aiBackendUrl+'/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({imageBase64:b64,mimeType:photoDraftBlob.type||'image/jpeg'})});
    const j=await r.json();
    if(!r.ok||!j.ok)throw new Error(j.detail||j.error||('HTTP '+r.status));
    applyAiSuggestions(j.result);
  }catch(e){console.error(e);setAiStatus('Analisis gagal: '+String(e.message||e),'error')}
  finally{btn.disabled=false;btn.textContent='✨ Analisis ulang dengan AI'}
}
function applyAiSuggestions(result){
  const foods=Array.isArray(result?.foods)?result.foods:[],matched=[],unmatched=[];
  for(const s of foods){
    const m=findBestFoodMatch(s.name);
    if(m){
      const sg=photoServingGrams(m.food),grams=Math.max(1,Math.round(Number(s.estimated_grams)||sg||100));
      matched.push({id:'pi_'+crypto.randomUUID(),food:m.food,servingGrams:sg,grams:sg?grams:null,qty:sg?grams/sg:1,ai:{name:s.name,grams,min:Math.round(Number(s.min_grams)||grams*.7),max:Math.round(Number(s.max_grams)||grams*1.3),confidence:Math.max(0,Math.min(1,Number(s.confidence)||0)),portion:s.portion_description||'',basis:s.visual_basis||'',matchScore:m.score}});
    }else unmatched.push(s);
  }
  photoDraftItems=matched;renderPhotoSelected();renderAiSuggestions(result,unmatched);
  if(result?.meal_description&&!$('photoNote').value)$('photoNote').value=result.meal_description;
  const high=matched.filter(x=>x.ai.confidence>=.7).length;
  setAiStatus(`AI menemukan ${foods.length} komponen; ${matched.length} cocok ke database KaloriKu. ${high} confidence tinggi. Koreksi gram/porsi sebelum simpan.`,'ok');
}
function renderAiSuggestions(result,unmatched){
  const el=$('aiSuggestions');if(!el)return;
  const rows=photoDraftItems.map(i=>`<div class="ai-suggestion"><div><strong>${esc(i.ai.name)}</strong><small>→ ${esc(i.food.name)}</small></div><div class="ai-range">≈ ${i.ai.grams} g<br><small>${i.ai.min}–${i.ai.max} g · ${Math.round(i.ai.confidence*100)}%</small></div></div>`).join('');
  const miss=unmatched.map(s=>`<div class="ai-suggestion ai-unmatched"><div><strong>${esc(s.name)}</strong><small>Belum cocok otomatis ke database — cari manual bila perlu</small></div><div class="ai-range">≈ ${fmt(s.estimated_grams)} g</div></div>`).join('');
  el.innerHTML=(rows||miss)?`<div class="ai-suggestion-box"><div class="section-head no-pad"><h2>Saran AI</h2><span>estimasi visual</span></div>${rows}${miss}</div>`:'';
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