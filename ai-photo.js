let geminiSessionKey=sessionStorage.getItem('kaloriku_gemini_key')||'';
let geminiSessionModel=sessionStorage.getItem('kaloriku_gemini_model')||'gemini-3.8-flash';

function aiNorm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim()}
function aiTokens(s){return new Set(aiNorm(s).split(' ').filter(x=>x.length>1&&!['dan','dengan','yang','goreng','rebus','masak','porsi'].includes(x)))}
function aiFoodScore(foodName,query){
  const a=aiNorm(foodName),b=aiNorm(query);if(a===b)return 100;if(a.includes(b)||b.includes(a))return 85;
  const A=aiTokens(a),B=aiTokens(b);let hit=0;for(const t of B)if(A.has(t))hit++;
  const denom=Math.max(1,Math.max(A.size,B.size));return hit/denom*75-Math.abs(a.length-b.length)*.08;
}
function findBestFoodMatch(name){
  let best=null,score=-999;
  for(const f of allFoods){const s=aiFoodScore(f.name,name);if(s>score){score=s;best=f}}
  return score>=24?{food:best,score}:null;
}
async function blobBase64(blob){
  const buf=await blob.arrayBuffer();const bytes=new Uint8Array(buf);let bin='';
  const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)bin+=String.fromCharCode(...bytes.subarray(i,i+chunk));
  return btoa(bin);
}
function setAiStatus(text,type='info'){
  const el=$('aiPhotoStatus');if(!el)return;el.classList.remove('hidden','ai-error','ai-ok');if(type==='error')el.classList.add('ai-error');if(type==='ok')el.classList.add('ai-ok');el.textContent=text;
}
function updateAiKeyUI(){
  const input=$('geminiApiKey'),model=$('geminiModel'),status=$('aiKeyStatus');
  if(input && geminiSessionKey)input.value=geminiSessionKey;
  if(model)model.value=geminiSessionModel;
  if(status)status.textContent=geminiSessionKey?'Siap untuk sesi ini':'Belum disetel';
}
function saveAiSession(){
  const key=$('geminiApiKey').value.trim(),model=$('geminiModel').value;
  if(!key){toast('Masukkan Gemini API key');return}
  geminiSessionKey=key;geminiSessionModel=model;
  sessionStorage.setItem('kaloriku_gemini_key',key);sessionStorage.setItem('kaloriku_gemini_model',model);
  updateAiKeyUI();toast('AI siap untuk sesi ini');
}
function clearAiSession(){
  geminiSessionKey='';sessionStorage.removeItem('kaloriku_gemini_key');
  if($('geminiApiKey'))$('geminiApiKey').value='';updateAiKeyUI();toast('API key dihapus dari sesi');
}
async function analyzeFoodPhoto(){
  if(!photoDraftBlob){toast('Ambil atau pilih foto dulu');return}
  if(!geminiSessionKey){toast('Masukkan Gemini API key di Profil');go('profile');return}
  const btn=$('analyzePhotoBtn');btn.disabled=true;btn.textContent='Menganalisis…';
  setAiStatus('AI sedang mengenali komponen makanan dan memperkirakan porsinya. Hasil tetap perlu dikoreksi.');
  try{
    const b64=await blobBase64(photoDraftBlob);
    const schema={
      type:'OBJECT',
      properties:{
        meal_description:{type:'STRING'},
        foods:{type:'ARRAY',items:{type:'OBJECT',properties:{
          name:{type:'STRING'},
          estimated_grams:{type:'NUMBER'},
          min_grams:{type:'NUMBER'},
          max_grams:{type:'NUMBER'},
          confidence:{type:'NUMBER'},
          portion_description:{type:'STRING'},
          visual_basis:{type:'STRING'}
        },required:['name','estimated_grams','min_grams','max_grams','confidence','portion_description']}}
      },required:['foods']
    };
    const prompt='Analisis foto makanan ini untuk pencatatan kalori. Identifikasi setiap komponen makanan/minuman yang terlihat secara terpisah. Berikan nama makanan dalam Bahasa Indonesia yang umum dipakai di database pangan Indonesia. Perkirakan berat bagian yang dimakan dalam gram, serta rentang minimum dan maksimum yang realistis. confidence 0 sampai 1. Jangan menghitung kalori. Jangan mengklaim berat sebagai pasti. Jika saus/minyak/sambal terlihat signifikan, jadikan komponen terpisah. Jika tidak terlihat jelas, beri confidence rendah. Kembalikan hanya JSON sesuai schema.';
    const body={contents:[{role:'user',parts:[{text:prompt},{inline_data:{mime_type:photoDraftBlob.type||'image/jpeg',data:b64}}]}],generationConfig:{responseMimeType:'application/json',responseSchema:schema,temperature:.2}};
    const url='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(geminiSessionModel)+':generateContent';
    const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':geminiSessionKey},body:JSON.stringify(body)});
    if(!r.ok){const t=await r.text();throw new Error('Gemini '+r.status+': '+t.slice(0,180))}
    const j=await r.json(),txt=j.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'';
    if(!txt)throw new Error('AI tidak mengembalikan hasil');
    const parsed=JSON.parse(txt);applyAiSuggestions(parsed);
  }catch(e){console.error(e);setAiStatus('Analisis gagal: '+String(e.message||e),'error')}
  finally{btn.disabled=false;btn.textContent='✨ Analisis ulang dengan AI'}
}
function applyAiSuggestions(result){
  const foods=Array.isArray(result.foods)?result.foods:[];
  const matched=[],unmatched=[];
  for(const s of foods){
    const m=findBestFoodMatch(s.name);
    if(m){
      const sg=photoServingGrams(m.food),grams=Math.max(1,Math.round(Number(s.estimated_grams)||sg||100));
      matched.push({id:'pi_'+crypto.randomUUID(),food:m.food,servingGrams:sg||100,grams,qty:sg?grams/sg:grams/100,ai:{name:s.name,min:Math.round(Number(s.min_grams)||grams*.7),max:Math.round(Number(s.max_grams)||grams*1.3),confidence:Math.max(0,Math.min(1,Number(s.confidence)||0)),portion:s.portion_description||'',basis:s.visual_basis||'',matchScore:m.score}});
    }else unmatched.push(s);
  }
  photoDraftItems=matched;renderPhotoSelected();
  renderAiSuggestions(result,unmatched);
  if(result.meal_description&&!$('photoNote').value)$('photoNote').value=result.meal_description;
  const high=matched.filter(x=>x.ai.confidence>=.7).length;
  setAiStatus(`AI menemukan ${foods.length} komponen; ${matched.length} cocok ke database KaloriKu. ${high} ber-confidence tinggi. Koreksi gram/porsi sebelum simpan.`,'ok');
}
function renderAiSuggestions(result,unmatched){
  const el=$('aiSuggestions');if(!el)return;
  const rows=photoDraftItems.map(i=>`<div class="ai-suggestion"><div><strong>${esc(i.ai.name)}</strong><small>→ ${esc(i.food.name)}</small></div><div class="ai-range">≈ ${i.grams} g<br><small>${i.ai.min}–${i.ai.max} g · ${Math.round(i.ai.confidence*100)}%</small></div></div>`).join('');
  const miss=unmatched.map(s=>`<div class="ai-suggestion ai-unmatched"><div><strong>${esc(s.name)}</strong><small>Belum cocok otomatis ke database — cari manual bila perlu</small></div><div class="ai-range">≈ ${fmt(s.estimated_grams)} g</div></div>`).join('');
  el.innerHTML=(rows||miss)?`<div class="ai-suggestion-box"><div class="section-head no-pad"><h2>Saran AI</h2><span>estimasi visual</span></div>${rows}${miss}</div>`:'';
}
function decorateAiSelected(){
  document.querySelectorAll('.photo-selected-row').forEach((row,idx)=>{
    const i=photoDraftItems[idx];if(!i?.ai)return;
    const info=row.querySelector('.food-info small');if(info)info.innerHTML+=`<br><span class="ai-hint">AI: ${i.ai.min}–${i.ai.max} g · confidence ${Math.round(i.ai.confidence*100)}%</span>`;
  });
}
const _renderPhotoSelected=renderPhotoSelected;
renderPhotoSelected=function(){_renderPhotoSelected();decorateAiSelected()};

document.addEventListener('DOMContentLoaded',()=>{
  updateAiKeyUI();
  $('saveAiSessionBtn').onclick=saveAiSession;
  $('clearAiSessionBtn').onclick=clearAiSession;
  $('analyzePhotoBtn').onclick=analyzeFoodPhoto;
  $('photoPreview').addEventListener('load',()=>{$('analyzePhotoBtn').disabled=false});
});
