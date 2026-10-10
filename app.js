const $=id=>document.getElementById(id);const fmt=n=>Math.round(Number(n)||0).toLocaleString('id-ID');const localDate=(d=new Date())=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`};const parseDate=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};const offsetDate=(s,delta)=>{const d=parseDate(s);d.setDate(d.getDate()+delta);return localDate(d)};const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let staticFoods=[],customFoods=[],allFoods=[],logs=[],weights=[],favorites=[],packs=[],profile={sex:'male',age:30,weight:70,height:170,activity:1.375,goal:-250};let dashboardDate=localDate();
function dashboardSelectedDate(){return dashboardDate;}
function selectedEntryDate(){return currentPage==='history'?historyDate:currentPage==='today'?dashboardSelectedDate():localDate();}
function dashboardSetDate(date){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||localDate(parseDate(date))!==date||date>localDate()){toast('Pilih tanggal yang valid sampai hari ini.');renderDashboardDate();return;}
 dashboardDate=date;renderToday();
}
function renderDashboardDate(){
 const date=dashboardSelectedDate(),today=localDate(),title=date===today?'Hari Ini':date===offsetDate(today,-1)?'Kemarin':'Catatan harian';
 $('dashboardDate').value=date;$('dashboardDate').max=today;$('dashboardNext').disabled=date>=today;$('dashboardToday').disabled=date===today;
 $('dashboardDateLabel').textContent=title+' · '+parseDate(date).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
 $('dashboardCalLabel').textContent=date===today?'KALORI HARI INI':'KALORI TANGGAL TERPILIH';$('dashboardMealTitle').textContent=date===today?'Makan hari ini':'Makan pada tanggal ini';
 $('copyYesterdayBtn').classList.toggle('hidden',date!==today);$('dashboardPastNote').classList.toggle('hidden',date===today);
 if(currentPage==='today'){$('pageTitle').textContent=title;$('pageSub').textContent=parseDate(date).toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});}
}
let currentPage='today',historyDate=localDate(),dbSource='Semua',dbCategory='Semua',addMode='recent',installPrompt=null,scannerStream=null,scanTimer=null;
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function foodSearchNorm(s){return String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\btelor\b/g,'telur').replace(/\bsego\b/g,'nasi').replace(/\bsambel\b/g,'sambal').replace(/\bgethuk\b/g,'getuk').replace(/\bmata sapi\b/g,'ceplok').replace(/\bmie\b/g,'mi').replace(/\bbakmie\b/g,'bakmi').replace(/\bsup\b/g,'sop').replace(/\btoge\b/g,'tauge').replace(/\btempeh\b/g,'tempe').replace(/\bcoklat\b/g,'cokelat').replace(/\bcappucino\b/g,'cappuccino').replace(/\bkwetiaw\b/g,'kwetiau').replace(/\bkrispi\b/g,'crispy').replace(/\bbaso\b/g,'bakso').replace(/\bnasgor\b|\bnasi grg\b/g,'nasi goreng').replace(/\bmigor\b|\bmi grg\b/g,'mi goreng').replace(/\bgrg\b/g,'goreng').replace(/\brbs\b/g,'rebus').replace(/\baym\b/g,'ayam').trim().replace(/\s+/g,' ')}
function foodSearchNames(f){return [f.name,...(Array.isArray(f.aliases)?f.aliases:[])].map(foodSearchNorm)}
// Restricted Damerau-Levenshtein: includes adjacent swapped letters.
function foodTypoDistance(a,b,limit){
 if(Math.abs(a.length-b.length)>limit)return limit+1;
 let prev=Array.from({length:b.length+1},(_,i)=>i),older=null;
 for(let i=1;i<=a.length;i++){
  const row=[i];let min=i;
  for(let j=1;j<=b.length;j++){
   let n=Math.min(prev[j]+1,row[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
   if(older&&i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])n=Math.min(n,older[j-2]+1);
   row[j]=n;min=Math.min(min,n);
  }
  if(min>limit)return limit+1;older=prev;prev=row;
 }
 return prev[b.length];
}
function foodSearchScore(f,q){
 const b=foodSearchNorm(q);if(!b)return 0;
 const signature=String(f.name)+'|'+JSON.stringify(f.aliases||[]);
 const cache=foodSearchScore.cache||(foodSearchScore.cache=new WeakMap());let entry=cache.get(f);
 if(!entry||entry.signature!==signature){entry={signature,names:foodSearchNames(f),query:null};cache.set(f,entry)}
 if(entry.query===b)return entry.score;
 const names=entry.names,main=names[0],words=b.split(' ');
 let score=Infinity;
 if(main===b)score=0;else if(main.startsWith(b))score=1;else if(names.includes(b))score=2;
 else if(names.some(a=>a.startsWith(b)))score=3;else if(main.includes(b))score=4;
 else if(names.some(a=>a.includes(b)||words.every(w=>a.split(' ').includes(w))))score=5;
 else if(b.replace(/ /g,'').length>=5&&names.some(a=>a.replace(/ /g,'').includes(b.replace(/ /g,'')))){const compact=b.replace(/ /g,'');score=main.replace(/ /g,'')===compact?5.1:names.some(a=>a.replace(/ /g,'')===compact)?5.2:5.5;}
 else {
  for(const name of names){
   const tokens=name.split(' ');let cost=0;let matched=true;
   for(const word of words){
    let best=Infinity;
    for(const token of tokens){
     if(token===word){best=0;break}
     if(word.length>=3&&token.startsWith(word)){best=Math.min(best,.25);continue}
     // Short words and numbers require exact spelling to avoid unrelated results.
     if(word.length<4||token.length<4||/\d/.test(word+token))continue;
     const limit=word.length>=7?2:1,n=foodTypoDistance(word,token,limit);
     if(n<=limit)best=Math.min(best,n);
    }
    if(!Number.isFinite(best)){matched=false;break}cost+=best;
   }
   if(matched)score=Math.min(score,6+cost+Math.max(0,tokens.length-words.length)*.01);
  }
 }
 entry.query=b;entry.score=score;return score;
}
function foodMatches(f,q){return Number.isFinite(foodSearchScore(f,q))}
function foodMatchRank(f,q){return foodSearchScore(f,q)}
function foodSearchLabel(f,q){
 if(!foodSearchNorm(q))return '';
 const score=foodSearchScore(f,q);if(!Number.isFinite(score))return '';
 return score>=6?'Ejaan mendekati':score>5&&score<6?'Spasi disesuaikan':'Cocok kata';
}
function foodSearchBadge(f,q){const label=foodSearchLabel(f,q);return label?'<span class="badge '+(label==='Ejaan mendekati'?'v27-approx':'v27-match')+'">'+label+'</span>':'';}
function sourceLabel(t){return t==='tkpi'?'TKPI':t==='calculated'?'TKPI (konversi)':t==='label'?'Label produk':t==='openfoodfacts'?'Open Food Facts':t==='user'?'Custom':'Estimasi'}function badge(f){const t=f.source_type||f.sourceType||'estimate',cl=t==='tkpi'||t==='calculated'?'tkpi':t==='label'?'label':t==='openfoodfacts'?'off':'';return `<span class="badge ${cl}">${t==='tkpi'?(f.verification_status==='name_code_matched_macro_pending'?'TKPI (kode cocok)':f.verification_status==='matched_duplicate_code_alias'?'TKPI (alias)':f.tkpi_code?'TKPI (rujukan)':'TKPI (kode belum dicatat)'):sourceLabel(t)}</span>`}function nutrientMismatch(f){const c=Number(f.calories),p=Number(f.protein),k=Number(f.carbs),fat=Number(f.fat);if(![c,p,k,fat].every(Number.isFinite))return false;return Math.abs((p+k)*4+fat*9-c)>Math.max(30,c*.2)}
function calcTarget(p=profile){const w=+p.weight,h=+p.height,a=+p.age;const bmr=p.sex==='male'?10*w+6.25*h-5*a+5:10*w+6.25*h-5*a-161;const tdee=bmr*(+p.activity);const cal=Math.max(1200,Math.round(tdee+(+p.goal)));const dProtein=Math.round(w*1.6),dFat=Math.round(cal*.27/9),dCarb=Math.max(0,Math.round((cal-dProtein*4-dFat*9)/4)),m=p.macroTargets||{};const safe=(v,d,max)=>v===undefined||v===null||v===''?d:Math.max(0,Math.min(max,Number(v)||0));const protein=safe(m.protein,dProtein,600),fat=safe(m.fat,dFat,300),carb=safe(m.carb,dCarb,900);return{bmr:Math.round(bmr),tdee:Math.round(tdee),cal,protein,fat,carb}}
function total(a){return a.reduce((x,l)=>({cal:x.cal+l.calories*l.qty,p:x.p+l.protein*l.qty,c:x.c+l.carbs*l.qty,f:x.f+l.fat*l.qty}),{cal:0,p:0,c:0,f:0})}
async function init(){staticFoods=await Promise.all([fetch('./data/foods.json',{cache:'reload'}).then(r=>r.json()),fetch('./data/foods-daily.json',{cache:'reload'}).then(r=>{if(!r.ok)throw Error('Katalog harian gagal dimuat');return r.json()}),fetch('./data/foods-regional.json',{cache:'reload'}).then(r=>{if(!r.ok)throw Error('Katalog daerah gagal dimuat');return r.json()}),fetch('./data/foods-extra.json',{cache:'reload'}).then(r=>r.ok?r.json():[]).catch(()=>[]),fetch('./data/foods-expanded.json',{cache:'reload'}).then(r=>{if(!r.ok)throw Error('Katalog tambahan gagal dimuat');return r.json()}),fetch('./data/foods-tkpi-2017.json',{cache:'reload'}).then(r=>{if(!r.ok)throw Error('Katalog TKPI 2017 gagal dimuat');return r.json()}),fetch('./data/foods-tkpi-2020.json',{cache:'reload'}).then(r=>{if(!r.ok)throw Error('Katalog TKPI 2020 gagal dimuat');return r.json()})]).then(([primary,daily,regional,extra,expanded,tkpi2017,tkpi2020])=>{const seen=new Set();return [...primary,...daily,...regional,...extra,...expanded,...tkpi2017,...tkpi2020].filter(f=>{const k=foodSearchNorm(f.name);if(seen.has(k))return false;seen.add(k);return true})});[customFoods,logs,weights,profile,favorites,packs]=await Promise.all([dbAll('customFoods'),dbAll('logs'),dbAll('weights'),dbGetKV('profile',profile),dbGetKV('favorites',[]),dbGetKV('packs',[])]);allFoods=[...staticFoods,...customFoods];historyDate=localDate();wire();updateOnline();renderAll();registerSW();}
function wire(){
 $('dashboardPrev').onclick=()=>dashboardSetDate(offsetDate(dashboardSelectedDate(),-1));$('dashboardNext').onclick=()=>{if(dashboardSelectedDate()<localDate())dashboardSetDate(offsetDate(dashboardSelectedDate(),1));};$('dashboardToday').onclick=()=>dashboardSetDate(localDate());$('dashboardYesterday').onclick=()=>dashboardSetDate(offsetDate(localDate(),-1));$('dashboardDate').onchange=e=>dashboardSetDate(e.target.value);
 let swipe=null;const dateBar=$('dashboardDateBar');dateBar.addEventListener('touchstart',e=>{swipe=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});dateBar.addEventListener('touchend',e=>{if(!swipe||e.changedTouches.length!==1){swipe=null;return;}const dx=e.changedTouches[0].clientX-swipe.x,dy=e.changedTouches[0].clientY-swipe.y;swipe=null;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)dashboardSetDate(offsetDate(dashboardSelectedDate(),dx>0?-1:1));},{passive:true});dateBar.addEventListener('touchcancel',()=>{swipe=null;});
document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>go(b.dataset.page));document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());$('fab').onclick=openAdd;$('copyYesterdayBtn').onclick=copyYesterday;$('openWeightQuick').onclick=openWeight;$('addWeightBtn').onclick=openWeight;$('histPrev').onclick=()=>{historyDate=offsetDate(historyDate,-1);renderHistory()};$('histNext').onclick=()=>{if(historyDate<localDate())historyDate=offsetDate(historyDate,1);renderHistory()};$('histDate').onchange=e=>{historyDate=e.target.value;renderHistory()};$('dbSearch').oninput=renderDatabase;$('addCustomBtn').onclick=()=>{delete $('customBarcode').dataset.code;delete $('customBarcode').dataset.format;openCustom()};$('foodSearch').oninput=renderAddResults;$('qtyInput').oninput=renderAddResults;$('quickInput').oninput=renderQuickPreview;document.querySelectorAll('#addModeChips .chip').forEach(b=>b.onclick=()=>{addMode=b.dataset.mode;document.querySelectorAll('#addModeChips .chip').forEach(x=>x.classList.toggle('on',x===b));renderAddResults()});$('customForm').addEventListener('submit',saveCustom);$('weightForm').addEventListener('submit',saveWeight);$('weightDialog').addEventListener('cancel',e=>{if(weightSaveBusy)e.preventDefault()});$('saveProfileBtn').onclick=saveProfile;$('backupBtn').onclick=backup;$('restoreBtn').onclick=()=>$('restoreFile').click();$('restoreFile').onchange=e=>restore(e.target.files[0]);$('csvBtn').onclick=exportCSV;$('sexSegment').onclick=e=>{if(e.target.dataset.v&&!profileSaveBusy)document.querySelectorAll('#sexSegment button').forEach(b=>b.classList.toggle('on',b===e.target))};$('scanBtn').onclick=startScanner;$('closeScanner').onclick=stopScanner;$('manualLookup').onclick=()=>lookupBarcode($('manualBarcode').value.trim());window.addEventListener('online',updateOnline);window.addEventListener('offline',updateOnline);window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;showInstall()});$('installBtn').onclick=installPWA;$('installBtn2').onclick=installPWA;window.addEventListener('appinstalled',()=>{installConfirmed=true;installPrompt=null;showInstall()});showInstall();}
function go(page){currentPage=page;document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===`page-${page}`));document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.page===page));const titles={today:['Hari Ini',new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'})],history:['Riwayat','Catatan konsumsi per hari'],database:['Database','Pangan, menu, dan produk'],stats:['Statistik','Tren konsumsi dan berat badan'],profile:['Profil','Target dan penyimpanan data']};$('pageTitle').textContent=titles[page][0];$('pageSub').textContent=titles[page][1];$('fab').classList.toggle('hidden',!['today','history'].includes(page));if(page==='today')renderToday();if(page==='history')renderHistory();if(page==='database')renderDatabase();if(page==='stats')renderStats();if(page==='profile')renderProfile()}
function renderAll(){renderToday();renderHistory();renderDatabase();renderStats();renderProfile();$('foodCountProfile').textContent=`${allFoods.length.toLocaleString('id-ID')} entri`;}
function renderToday(){renderDashboardDate();const a=logs.filter(l=>l.date===dashboardSelectedDate()).sort((x,y)=>x.createdAt-y.createdAt),t=total(a),g=calcTarget();$('todayCal').textContent=fmt(t.cal);$('targetCal').textContent=fmt(g.cal);$('calProgress').style.width=Math.min(100,t.cal/g.cal*100)+'%';const rem=g.cal-t.cal;$('remainingText').textContent=rem>=0?`Sisa ${fmt(rem)} kcal`:`Lebih ${fmt(-rem)} kcal`;$('todayItemCount').textContent=`${a.length} item`;$('todayKcalSmall').textContent=`${fmt(t.cal)} kcal`;$('macroRows').innerHTML=macroRow('Protein',t.p,g.protein)+macroRow('Karbohidrat',t.c,g.carb)+macroRow('Lemak',t.f,g.fat);$('todayLogs').innerHTML=mealGroups(a,true);if(typeof v27RenderRepeat==='function')v27RenderRepeat();if(typeof renderPhotoMeals==='function')renderPhotoMeals()}
function macroRow(n,v,g){return `<div class="macro-line"><div class="macro-top"><span>${n}</span><span>${fmt(v)} / ${g} g</span></div><div class="mini-progress"><span style="width:${(g>0?Math.min(100,v/g*100):(v>0?100:0))}%"></span></div></div>`}
function mealGroups(a,canPack=false){if(!a.length)return'<article class="card empty">Belum ada catatan.</article>';return ['Sarapan','Makan Siang','Makan Malam','Snack','Minuman'].map(m=>{const g=a.filter(x=>x.meal===m);if(!g.length)return'';const kcal=total(g).cal;return `<article class="card meal-card"><div class="meal-head"><strong>${m}</strong><small>${fmt(kcal)} kcal</small>${canPack?`<button class="text-btn" data-save-pack onclick="saveMealPack('${m}')">Simpan paket</button>`:''}</div>${g.map(logRow).join('')}</article>`}).join('')}
function logRow(l){return `<div class="log-row"><div class="log-info"><strong>${esc(l.name)}</strong><small>${l.qty} × ${esc(l.serving)}</small></div><b>${fmt(l.calories*l.qty)} kcal</b><button class="secondary log-edit-btn" type="button" onclick="editKaloriLog('${l.id}')">Edit</button><button class="del" onclick="removeLog('${l.id}')">×</button></div>`}
async function removeLog(id){await dbDelete('logs',id);logs=logs.filter(x=>x.id!==id);renderToday();renderHistory();renderStats()}
async function copyYesterday(){const y=offsetDate(localDate(),-1),a=logs.filter(x=>x.date===y);for(const l of a){const n={...l,id:'l_'+crypto.randomUUID(),date:localDate(),createdAt:Date.now()+Math.random()};await dbPut('logs',n);logs.push(n)}toast(a.length?`${a.length} item disalin`:'Kemarin belum ada catatan');renderToday();}
function renderHistory(){$('histDate').value=historyDate;const a=logs.filter(x=>x.date===historyDate).sort((x,y)=>x.createdAt-y.createdAt),t=total(a);$('histDateLabel').textContent=parseDate(historyDate).toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});$('histKcal').textContent=`${fmt(t.cal)} kcal · ${a.length} item`;$('histNext').disabled=historyDate>=localDate();$('historyLogs').innerHTML=mealGroups(a,false)}
function initFilterChips(){const sources=['Semua','TKPI','TKPI (konversi)','Estimasi','Label produk','Open Food Facts','Custom'],cats=['Semua',...new Set(allFoods.map(f=>f.category))];$('sourceChips').innerHTML=sources.map(s=>`<button class="chip ${s===dbSource?'on':''}" onclick="setDbSource('${s}')">${s}</button>`).join('');$('categoryChips').innerHTML=cats.map((s,i)=>`<button class="chip ${s===dbCategory?'on':''}" onclick="setDbCategory(${JSON.stringify(s)})">${esc(s)}</button>`).join('')}
window.setDbSource=s=>{dbSource=s;renderDatabase()};window.setDbCategory=s=>{dbCategory=s;renderDatabase()};
function renderDatabase(){initFilterChips();const q=$('dbSearch').value.trim().toLowerCase(),a=allFoods.filter(f=>(dbSource==='Semua'||sourceLabel(f.source_type||f.sourceType)===dbSource)&&(dbCategory==='Semua'||f.category===dbCategory)&&(!q||foodMatches(f,q))).sort((a,b)=>foodMatchRank(a,q)-foodMatchRank(b,q));const tkpi=allFoods.filter(f=>(f.source_type||f.sourceType)==='tkpi').length,calc=allFoods.filter(f=>f.source_type==='calculated').length,noCode=allFoods.filter(f=>f.source_type==='tkpi'&&!f.tkpi_code).length,uniqueTkpiCodes=new Set(allFoods.filter(f=>f.source_type==='tkpi'&&f.tkpi_code).map(f=>f.tkpi_code)).size,tkpiAliases=allFoods.filter(f=>f.source_type==='tkpi'&&f.tkpi_alias_of).length;$('dbStats').textContent=`${allFoods.length.toLocaleString('id-ID')} entri · ${tkpi} rujukan TKPI (${uniqueTkpiCodes} kode unik, ${tkpiAliases} alias; ${noCode} tanpa kode) · ${calc} konversi porsi · ${customFoods.length} custom/produk`;$('dbResults').innerHTML=a.slice(0,120).map(f=>`<article class="card food-card">${foodCard(f,false,q)}</article>`).join('')+(a.length>120?`<div class="empty">Menampilkan 120 dari ${a.length}. Persempit pencarian.</div>`:'')}
function foodCard(f,add=true,q=''){const fav=favorites.includes(f.id),meta=(f.source_type==='tkpi'&&f.bdd_percent)?` · BDD ${f.bdd_percent}%`:(f.source_type==='calculated'?' · Dihitung dari porsi 100 g BDD':''),edition=f.tkpi_edition,crosschecked=f.tkpi_edition_crosschecked,sourceCode=f.tkpi_code?` · ${esc(f.tkpi_code)}${edition?' (ed. '+edition+')':crosschecked?' (dicocokkan '+crosschecked+')':''}`:'',known=k=>typeof f[k]==='number'&&Number.isFinite(f[k])&&f[k]>=0,formatKnown=k=>Number(f[k]).toLocaleString('id-ID',{maximumFractionDigits:2}),nutrients=known('fiber')||known('sodium')?`<div class="food-meta">${known('fiber')?'Serat '+formatKnown('fiber')+' g':''}${known('fiber')&&known('sodium')?' · ':''}${known('sodium')?'Natrium '+formatKnown('sodium')+' mg':''} <span title="Nilai dari salinan tabel TKPI, bukan pengukuran langsung">· ${f.nutrient_source_method==='primary_pdf_row_visual_crosscheck'?'TKPI 2020 (PDF primer)':f.source_type==='tkpi'||f.source_type==='calculated'?'TKPI 2020 (salinan)':'Sesuai data per porsi'}</span></div>`:'',warn=f.source_code_conflict?'⚠ Kode tabel dan indeks TKPI berbeda':f.verification_status==='printed_source_conflict'?'⚠ Angka berbeda dengan tabel TKPI: perlu verifikasi':f.verification_status==='printed_source_anomaly'&&f.macro_verification_status==='primary_pdf_crosschecked'?'⚠ Anomali pada angka tercetak TKPI':nutrientMismatch(f)?'⚠ Kalori dan makro perlu verifikasi':'',flag=(f.verification_status==='name_code_matched_macro_pending'?'<div class="food-meta">Kode sumber cocok; angka gizi perlu audit per baris</div>':f.verification_status==='matched_duplicate_code_alias'?'<div class="food-meta">Alias kode sumber TKPI AP005 (bukan entri baru)</div>':'')+(f.macro_verification_status==='transcription_crosschecked_original_pending'?'<div class="food-meta">Energi dan makro cocok dengan salinan TKPI; PDF primer dan BDD belum diperiksa lengkap</div>':f.macro_verification_status==='primary_pdf_crosschecked'?'<div class="food-meta">Energi dan makro cocok dengan PDF TKPI Kemenkes</div>':'')+(warn?`<div class="food-meta" style="color:#b45309">${warn}</div>`:'');return `<div class="food-icon">🍽</div><div class="food-info"><strong>${esc(f.name)}</strong><div class="food-meta">${esc(f.serving)} · ${fmt(f.calories)} kcal · P ${fmt(f.protein)} · K ${fmt(f.carbs)} · L ${fmt(f.fat)}</div>${foodSearchBadge(f,q)} ${badge(f)}<span class="food-meta">${meta}${sourceCode}</span>${nutrients}${flag}</div><button type="button" aria-label="${esc((fav?'Hapus favorit ':'Tambah favorit ')+f.name)}" aria-pressed="${fav}" class="fav-btn ${fav?'on':''}" onclick="toggleFav('${f.id}')">${fav?'★':'☆'}</button>${add?`<button type="button" class="add-btn" ${addFoodBusy?'disabled':''} onclick="addFood('${f.id}')">＋</button>`:''}`}
let favoriteSaveBusy=false;
async function toggleFav(id){
 if(favoriteSaveBusy)return;favoriteSaveBusy=true;
 const nextFavorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];
 const buttons=[...document.querySelectorAll('.fav-btn')].map(b=>[b,b.disabled]);buttons.forEach(([b])=>b.disabled=true);
 try{await dbSetKV('favorites',nextFavorites);favorites=nextFavorites;renderAddResults();renderDatabase();}
 catch(e){toast('Favorit gagal disimpan. Silakan coba lagi.');}
 finally{favoriteSaveBusy=false;buttons.forEach(([b,disabled])=>b.disabled=disabled);}
}
function openAdd(){$('entryDate').value=selectedEntryDate();$('entryDate').max=localDate();$('addDialog').showModal();$('foodSearch').value='';$('quickInput').value='';renderQuickPreview();renderAddResults()}
function renderAddResults(){const q=$('foodSearch').value.trim().toLowerCase();let a=[];if(q)a=allFoods.filter(f=>foodMatches(f,q)).sort((a,b)=>foodMatchRank(a,q)-foodMatchRank(b,q));else if(addMode==='favorite')a=allFoods.filter(f=>favorites.includes(f.id));else if(addMode==='recent'){const ids=[...logs].sort((a,b)=>b.createdAt-a.createdAt).map(x=>x.foodId).filter((x,i,z)=>z.indexOf(x)===i).slice(0,20);a=ids.map(id=>allFoods.find(f=>f.id===id)).filter(Boolean)}else if(addMode==='packs'){renderPacks();return}else a=allFoods;$('addResults').innerHTML=a.slice(0,90).map(f=>`<div class="log-row">${foodCard(f,true,q)}</div>`).join('')||'<div class="empty">Belum ada item.</div>'}
function renderPacks(){$('addResults').innerHTML=packs.length?packs.map(p=>`<div class="log-row"><div class="food-info"><strong>${esc(p.name)}</strong><div class="food-meta">${p.items.length} item · ${fmt(p.items.reduce((s,i)=>s+i.calories*i.qty,0))} kcal</div></div><button class="add-btn" onclick="addPack('${p.id}')">＋</button></div>`).join(''):'<div class="empty">Belum ada paket. Simpan dari kelompok makan Hari Ini.</div>'}
let addFoodBusy=false,customSaveBusy=false;
async function addFood(id){if(addFoodBusy)return;const f=allFoods.find(x=>x.id===id);if(!f)return;const amount=Number($('qtyInput').value),unit=$('qtyUnit').value,unitGrams=typeof v14UnitGrams==='function'?v24UnitFor(unit,f):null,baseGrams=typeof v14ServingGrams==='function'?v14ServingGrams({foodId:f.id,serving:f.serving}):null;if(Number.isNaN(unitGrams)){toast('Takaran ini belum diketahui untuk makanan tersebut. Gunakan porsi/gram atau Atur takaran.');return}if(!Number.isFinite(amount)||amount<=0){toast('Jumlah harus positif');return}if(unitGrams!==null&&!baseGrams){toast('Berat porsi belum tersedia. Pilih porsi.');return}const q=unitGrams===null?amount:amount*unitGrams/baseGrams;if(!Number.isFinite(q)||q<=0){toast('Jumlah tidak valid');return}const l={id:'l_'+crypto.randomUUID(),date:$('entryDate').value||localDate(),meal:$('mealSelect').value,foodId:f.id,name:f.name,serving:f.serving,servingGrams:baseGrams,qty:q,calories:+f.calories,protein:+f.protein,carbs:+f.carbs,fat:+f.fat,...v17NutrientSnapshot(f),createdAt:Date.now()};addFoodBusy=true;document.querySelectorAll('#addResults .add-btn').forEach(b=>b.disabled=true);
 try{await dbPut('logs',l);logs.push(l);toast(`${f.name} ditambahkan`);renderToday();renderHistory();renderStats();renderAddResults();return true;}
 catch(e){toast('Makanan gagal ditambahkan. Periksa penyimpanan lalu coba lagi.');return false;}
 finally{addFoodBusy=false;document.querySelectorAll('#addResults .add-btn').forEach(b=>b.disabled=false);}
}
function parseQuick(s){const chunks=s.toLowerCase().replace(/\s+dan\s+/g,',').replace(/\s*\+\s*/g,',').split(',').map(x=>x.trim()).filter(Boolean),out=[];for(const ch of chunks){const m=ch.match(/(?:^|\s)(\d+(?:[.,]\d+)?)/),qty=m?Number(m[1].replace(',','.')):1,clean=ch.replace(/\b\d+(?:[.,]\d+)?\b/g,' ').replace(/\b(x|porsi|buah|butir|gelas|potong|centong|mangkuk|bungkus|tusuk)\b/g,' ').replace(/\s+/g,' ').trim();const candidates=clean?allFoods.filter(f=>foodMatches(f,clean)):[];candidates.sort((a,b)=>foodMatchRank(a,clean)-foodMatchRank(b,clean)||score(foodSearchNorm(a.name),foodSearchNorm(clean))-score(foodSearchNorm(b.name),foodSearchNorm(clean)));if(candidates[0])out.push({food:candidates[0],qty:Math.max(.1,qty),raw:ch})}return out}function score(name,q){if(name===q)return 0;if(name.startsWith(q))return 1;return Math.abs(name.length-q.length)+5}
function renderQuickPreview(){const s=$('quickInput').value.trim(),p=parseQuick(s);if(!s){$('quickPreview').innerHTML='';return}$('quickPreview').innerHTML=p.length?`<div class="info-note">${p.map(x=>`${esc(x.food.name)} × ${x.qty}`).join('<br>')}<button class="primary full" style="margin-top:8px" onclick="commitQuick()">Catat semua</button></div>`:'<div class="info-note" style="background:#fff7ed;color:#92400e">Belum ada makanan yang cocok.</div>'}
let quickCommitBusy=false;
window.commitQuick=async()=>{
 if(quickCommitBusy||addFoodBusy)return;
 const p=parseQuick($('quickInput').value);if(!p.length)return;
 quickCommitBusy=true;const oldUnit=$('qtyUnit').value,oldQty=$('qtyInput').value;let saved=0;
 try{
  $('qtyUnit').value='porsi';
  for(const x of p){$('qtyInput').value=x.qty;if(await addFood(x.food.id)!==true)break;saved++;}
  if(saved===p.length){$('quickInput').value='';toast(`${saved} item dicatat`);}
  else if(saved){toast(`${saved} dari ${p.length} item dicatat. Sebagian gagal; periksa riwayat sebelum mencoba lagi.`);}
 }finally{$('qtyUnit').value=oldUnit;$('qtyInput').value=oldQty;quickCommitBusy=false;renderQuickPreview();}
};
let mealPackSaveBusy=false;
window.saveMealPack=async meal=>{
 if(mealPackSaveBusy)return;
 const items=logs.filter(l=>l.date===dashboardSelectedDate()&&l.meal===meal);if(!items.length)return;
 const name=prompt('Nama paket',`${meal} favorit`);if(!name)return;
 mealPackSaveBusy=true;
 const buttons=[...document.querySelectorAll('[data-save-pack]')].map(b=>[b,b.disabled]);buttons.forEach(([b])=>b.disabled=true);
 try{
  const nextPacks=[...packs,{id:'p_'+crypto.randomUUID(),name,items:items.map(({foodId,name,serving,qty,calories,protein,carbs,fat,...rest})=>({foodId,name,serving,qty,calories,protein,carbs,fat,...v17NutrientSnapshot(rest)}))}];
  await dbSetKV('packs',nextPacks);packs=nextPacks;
  if($('addDialog').open&&addMode==='packs')renderAddResults();
  toast('Paket tersimpan');
 }catch(e){toast('Paket favorit gagal disimpan. Silakan coba lagi.');}
 finally{mealPackSaveBusy=false;buttons.forEach(([b,disabled])=>b.disabled=disabled);}
};let packSaveBusy=false;
window.addPack=async id=>{
 if(packSaveBusy)return;
 const p=packs.find(x=>x.id===id);if(!p?.items?.length)return;
 packSaveBusy=true;
 const buttons=[...document.querySelectorAll('#addResults .add-btn')].map(b=>[b,b.disabled]);buttons.forEach(([b])=>b.disabled=true);
 try{
  const date=$('entryDate').value||localDate(),meal=$('mealSelect').value;
  const entries=p.items.map(i=>({...i,id:'l_'+crypto.randomUUID(),date,meal,createdAt:Date.now()+Math.random()}));
  await dbPutLogsReviewed(entries,[]);
  logs.push(...entries);renderToday();toast('Paket ditambahkan');
 }catch(e){toast('Paket gagal disimpan. Tidak ada item yang ditambahkan. Silakan coba lagi.');}
 finally{packSaveBusy=false;buttons.forEach(([b,disabled])=>b.disabled=disabled);}
};
function openCustom(){$('customDialog').showModal()}
async function saveCustom(e){
 e.preventDefault();if(customSaveBusy)return;
 const fields=['customCal','customP','customC','customF'],values=fields.map(id=>$(id).value.trim());
 if(values.some(v=>v===''||!Number.isFinite(Number(v))||Number(v)<0)){
  toast('Lengkapi kalori, protein, karbohidrat, dan lemak. Isi 0 hanya bila memang nol.');return;
 }
 const barcode=$('customBarcode').value.replace(/\s+/g,'');
 const format=$('customBarcode').dataset.code===barcode?$('customBarcode').dataset.format||'':'';
 if(barcode&&!barcodeValid(barcode,format)){toast('Barcode tidak valid. Periksa nomor dan digit pemeriksa kemasan.');return;}
 const f={id:'custom_'+crypto.randomUUID(),name:$('customName').value.trim(),category:'Custom',serving:$('customServing').value.trim(),calories:Number(values[0]),protein:Number(values[1]),carbs:Number(values[2]),fat:Number(values[3]),source_type:barcode?'label':'user',source_ref:barcode?'Diinput dari label produk':'Input pengguna',barcode,...v17ReadOptionalNutrients('custom')};
 if(!f.name||!f.serving)return;
 customSaveBusy=true;const controls=[...$('customForm').elements].map(el=>[el,el.disabled]);controls.forEach(([el])=>el.disabled=true);
 try{
  await dbPut('customFoods',f);customFoods.push(f);allFoods=[...staticFoods,...customFoods];
  $('customForm').reset();$('customDialog').close();renderDatabase();renderAddResults();if(typeof v15RenderAudit==='function')v15RenderAudit();toast('Makanan disimpan');
 }catch(e){toast('Makanan gagal disimpan. Periksa penyimpanan lalu coba lagi.');}
 finally{customSaveBusy=false;controls.forEach(([el,disabled])=>el.disabled=disabled);}
}
function openWeight(){if(weightSaveBusy)return;$('weightSaveStatus').textContent='';$('weightDate').value=selectedEntryDate();$('weightValue').value=profile.weight||'';$('weightDialog').showModal()}
let weightSaveBusy=false;
async function saveWeight(e){
 e.preventDefault();if(weightSaveBusy)return;
 const w={date:$('weightDate').value,weight:Number($('weightValue').value)};
 if(!w.date||!Number.isFinite(w.weight)||w.weight<20||w.weight>300){$('weightSaveStatus').textContent='Isi tanggal dan berat badan antara 20–300 kg.';return;}
 weightSaveBusy=true;$('weightSaveStatus').textContent='Menyimpan…';
 const controls=[...$('weightForm').querySelectorAll('input,button')].map(b=>[b,b.disabled]);controls.forEach(([b])=>b.disabled=true);
 try{
  await dbPut('weights',w);
  weights=weights.filter(x=>x.date!==w.date);weights.push(w);weights.sort((a,b)=>a.date.localeCompare(b.date));
  $('weightSaveStatus').textContent='';$('weightDialog').close();renderStats();toast('Berat badan tersimpan');
 }catch(e){$('weightSaveStatus').textContent='Berat badan gagal disimpan. Isian tetap tersedia; tekan Simpan untuk mencoba lagi.';toast('Berat badan gagal disimpan. Silakan coba lagi.');}
 finally{weightSaveBusy=false;controls.forEach(([b,disabled])=>b.disabled=disabled);}
}
function renderStats(){const days=[];for(let i=13;i>=0;i--){const d=offsetDate(localDate(),-i),t=total(logs.filter(x=>x.date===d));days.push({date:d,cal:logs.some(x=>x.date===d)?t.cal:null})}const last7=days.slice(-7).filter(x=>x.cal!==null);$('avg7').textContent=last7.length?`Rerata ${fmt(last7.reduce((s,x)=>s+x.cal,0)/last7.length)} kcal (${last7.length} hari tercatat)`:'Belum ada catatan 7 hari';drawBars($('calChart'),days,calcTarget().cal);const ws=[...weights].sort((a,b)=>a.date.localeCompare(b.date)).slice(-14);if(ws.length){const d=ws[ws.length-1].weight-ws[0].weight;$('weightSummary').innerHTML=`<div class="stats-grid"><div class="stat"><span>Terakhir</span><b>${ws.at(-1).weight} kg</b></div><div class="stat"><span>Perubahan</span><b>${d>0?'+':''}${d.toFixed(1)} kg</b></div></div>`;drawLine($('weightChart'),ws);$('weightRecent').innerHTML=ws.slice(-5).reverse().map(x=>`<div class="weight-row"><span>${parseDate(x.date).toLocaleDateString('id-ID',{day:'numeric',month:'short'})}</span><strong>${x.weight} kg</strong></div>`).join('')}else{$('weightSummary').innerHTML='<div class="empty">Belum ada data berat badan.</div>';clearCanvas($('weightChart'));$('weightRecent').innerHTML=''}}
function canvasSize(cv){const dpr=devicePixelRatio||1,w=cv.clientWidth||350,h=Math.round(w*.34);cv.width=w*dpr;cv.height=h*dpr;const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);return{c,w,h}}function clearCanvas(cv){const{x=0}=cv;const c=cv.getContext('2d');c.clearRect(0,0,cv.width,cv.height)}function drawBars(cv,a,target){const{c,w,h}=canvasSize(cv),pad=26,gap=5,max=Math.max(target,...a.map(x=>x.cal),1000)*1.15,bw=(w-pad*2-gap*(a.length-1))/a.length;c.clearRect(0,0,w,h);a.forEach((x,i)=>{const bh=x.cal/max*(h-32),left=pad+i*(bw+gap);c.fillStyle=x.cal===null?'#9ca3af':'#111827';if(x.cal===null){c.textAlign='center';c.font='12px system-ui';c.fillText('—',left+bw/2,h-25);}else c.fillRect(left,h-22-bh,bw,bh);if(i%2===0){c.fillStyle='#6b7280';c.font='9px system-ui';c.textAlign='center';c.fillText(parseDate(x.date).toLocaleDateString('id-ID',{day:'numeric'}),left+bw/2,h-7)}});const y=h-22-target/max*(h-32);c.strokeStyle='#9ca3af';c.setLineDash([4,4]);c.beginPath();c.moveTo(pad,y);c.lineTo(w-pad,y);c.stroke();c.setLineDash([])}function drawLine(cv,a){const{c,w,h}=canvasSize(cv);c.clearRect(0,0,w,h);if(!a.length)return;const min=Math.min(...a.map(x=>x.weight))-1,max=Math.max(...a.map(x=>x.weight))+1,p=25,range=Math.max(1,max-min),step=a.length===1?0:(w-p*2)/(a.length-1);c.strokeStyle='#111827';c.lineWidth=3;c.beginPath();a.forEach((x,i)=>{const px=a.length===1?w/2:p+i*step,py=h-p-(x.weight-min)/range*(h-p*2);i?c.lineTo(px,py):c.moveTo(px,py)});c.stroke();a.forEach((x,i)=>{const px=a.length===1?w/2:p+i*step,py=h-p-(x.weight-min)/range*(h-p*2);c.fillStyle='#111827';c.beginPath();c.arc(px,py,4,0,Math.PI*2);c.fill()})}
function renderProfile(){renderProfileFields();const t=calcTarget();$('targetSummary').innerHTML=`<div class="stat"><span>BMR</span><b>${t.bmr}</b></div><div class="stat"><span>TDEE</span><b>${t.tdee}</b></div><div class="stat"><span>Target</span><b>${t.cal}</b></div><div class="stat"><span>Protein</span><b>${t.protein} g</b></div>`;$('pwaStatus').textContent=matchMedia('(display-mode: standalone)').matches?'Terpasang':'Web/PWA'}function renderProfileFields(){$('age').value=profile.age;$('weight').value=profile.weight;$('height').value=profile.height;$('activity').value=profile.activity;$('goal').value=profile.goal;const mt=profile.macroTargets||{};$('macroProteinTarget').value=mt.protein??'';$('macroCarbTarget').value=mt.carb??'';$('macroFatTarget').value=mt.fat??'';document.querySelectorAll('#sexSegment button').forEach(b=>b.classList.toggle('on',b.dataset.v===profile.sex))}let profileSaveBusy=false;
async function saveProfile(){
 if(profileSaveBusy)return;
 const targetText=$('v16WeightTarget').value.trim(),weightTarget=targetText?Number(targetText):null;if(weightTarget!==null&&(!Number.isFinite(weightTarget)||weightTarget<20||weightTarget>400)){toast('Target berat badan harus 20–400 kg atau kosong');return}const nextProfile={...profile,sex:$('sexSegment').querySelector('button.on')?.dataset.v||profile.sex,weightTarget,age:Number($('age').value)||30,weight:Number($('weight').value)||70,height:Number($('height').value)||170,activity:Number($('activity').value)||1.375,goal:Number($('goal').value)||0,macroTargets:Object.fromEntries([['protein','macroProteinTarget',600],['carb','macroCarbTarget',900],['fat','macroFatTarget',300]].filter(x=>$(x[1]).value!=='').map(x=>[x[0],Math.min(x[2],Math.max(0,Number($(x[1]).value)||0))]))};
 profileSaveBusy=true;$('profileSaveStatus').textContent='Menyimpan…';
 const controls=[...$('saveProfileBtn').closest('article').querySelectorAll('input,select,button')].map(b=>[b,b.disabled]);controls.forEach(([b])=>b.disabled=true);
 try{
  await dbSetKV('profile',nextProfile);profile=nextProfile;
  $('profileSaveStatus').textContent='Profil tersimpan.';renderProfile();renderToday();toast('Profil disimpan');
 }catch(e){$('profileSaveStatus').textContent='Profil gagal disimpan. Isian tetap tersedia; tekan Simpan profil untuk mencoba lagi.';toast('Profil gagal disimpan. Silakan coba lagi.');}
 finally{profileSaveBusy=false;controls.forEach(([b,disabled])=>b.disabled=disabled);}
}
function download(name,type,text){const a=document.createElement('a'),u=URL.createObjectURL(new Blob([text],{type}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}async function blobToDataURL(blob){return await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(blob)})}
async function dataURLToBlob(url){const r=await fetch(url);return await r.blob()}
async function backup(){try{const data=await v20Snapshot();download(`KaloriKu_backup_${localDate()}.json`,'application/json',JSON.stringify(data,null,2))}catch(e){toast('Backup gagal: '+e.message)}}async function restore(file){return v17OpenRestorePreview(file)}function exportCSV(){
 const cols=['tanggal','waktu_makan','makanan','porsi','jumlah','kalori','protein','karbohidrat','lemak','serat_g','gula_g','natrium_mg','lemak_jenuh_g'];
 const lines=[cols.join(',')];
 for(const l of [...logs].sort((a,b)=>a.date.localeCompare(b.date)||a.createdAt-b.createdAt)){
  const values=[l.date,l.meal,l.name,l.serving,l.qty,l.calories*l.qty,l.protein*l.qty,l.carbs*l.qty,l.fat*l.qty,
   ...['fiber','sugar','sodium','saturatedFat'].map(k=>v17Numeric(l[k])?l[k]*l.qty:'')];
  lines.push(values.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(','));
 }
 download('KaloriKu_'+localDate()+'.csv','text/csv;charset=utf-8','\ufeff'+lines.join('\n'));
}
let barcodeRequest=null,barcodeSession=0,barcodeBusy=false,barcodeProductName='',barcodeLookupCode='',barcodeFallbackCode='',barcodeLookupFormat='';
function barcodeStatus(text){$('scanStatus').textContent=text;}
function barcodeFallback(code,text,name=''){
 barcodeProductName=name;barcodeFallbackCode=code;$('manualBarcode').value=code;$('customBarcode').value=code;
 barcodeStatus('Barcode '+code+' · '+text);$('barcodeAddLabel').classList.remove('hidden');
}
function barcodeStopCamera(){
 if(scanTimer)clearTimeout(scanTimer);scanTimer=null;
 if(scannerStream){scannerStream.getTracks().forEach(t=>t.stop());scannerStream=null}
 $('scannerVideo').srcObject=null;
}
async function startScanner(){
 stopScanner();if(!window.isSecureContext){toast('Scanner kamera membutuhkan HTTPS');return}
 $('scannerDialog').showModal();$('barcodeAddLabel').classList.add('hidden');barcodeProductName='';barcodeFallbackCode='';barcodeLookupCode='';
 barcodeStatus('Arahkan kamera ke barcode produk, atau ketik nomornya di bawah.');
 const session=barcodeSession;
 try{
  const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}});
  if(session!==barcodeSession){stream.getTracks().forEach(t=>t.stop());return}
  scannerStream=stream;$('scannerVideo').srcObject=stream;
 }catch(e){barcodeStatus('Kamera tidak dapat dibuka. Periksa izin kamera atau ketik nomor barcode.');return}
 if(!('BarcodeDetector' in window)){barcodeStatus('Browser belum mendukung scan otomatis. Ketik nomor barcode, lalu tekan Cari.');return}
 try{
  const supported=typeof BarcodeDetector.getSupportedFormats==='function'?await BarcodeDetector.getSupportedFormats():['ean_13','ean_8','upc_a','upc_e','code_128','code_39'];
  const formats=['ean_13','ean_8','upc_a','upc_e','code_128','code_39'].filter(f=>supported.includes(f));
  if(!formats.length)throw Error('unsupported');const detector=new BarcodeDetector({formats});
  const loop=async()=>{
   if(!scannerStream||session!==barcodeSession)return;
   try{const codes=await detector.detect($('scannerVideo'));if(session!==barcodeSession)return;
    if(codes[0]?.rawValue){barcodeStopCamera();await lookupBarcode(codes[0].rawValue,codes[0].format);return}
   }catch(e){/* Video may not have a decoded frame yet. */}
   scanTimer=setTimeout(loop,250);
  };loop();
 }catch(e){barcodeStatus('Deteksi otomatis tidak tersedia. Ketik nomor barcode, lalu tekan Cari.')}
}
function stopScanner(){
 barcodeSession++;barcodeRequest?.abort();barcodeRequest=null;barcodeBusy=false;
 barcodeStopCamera();$('manualLookup').disabled=false;$('scannerDialog').close();
}
// GS1 modulo-10 for EAN/UPC/GTIN; scanner format preserves non-retail codes.
function barcodeChecksum(code){
 let sum=0;for(let i=code.length-2,weight=3;i>=0;i--,weight=4-weight)sum+=Number(code[i])*weight;
 return (10-sum%10)%10===Number(code.at(-1));
}
function barcodeValid(code,format=''){
 if(!/^\d{8,14}$/.test(code))return false;
 if(format==='code_128'||format==='code_39')return true;
 if(format==='upc_e'){
  if(code.length!==8||!/[01]/.test(code[0]))return false;
  const [ns,a,b,c,d,e,last,check]=code;
  const body=Number(last)<=2?ns+a+b+last+'0000'+c+d+e:last==='3'?ns+a+b+c+'00000'+d+e:last==='4'?ns+a+b+c+d+'00000'+e:ns+a+b+c+d+e+'0000'+last;
  return barcodeChecksum(body+check);
 }
 if(!format&&code.length===8)return barcodeChecksum(code)||barcodeValid(code,'upc_e');
 const sizes={ean_8:8,ean_13:13,upc_a:12};
 if(format&&sizes[format]&&code.length!==sizes[format])return false;
 return ![8,12,13,14].includes(code.length)||barcodeChecksum(code);
}
async function lookupBarcode(raw,format=''){
 const code=String(raw||'').replace(/\s+/g,'');
 barcodeRequest?.abort();barcodeRequest=null;barcodeBusy=false;$('manualLookup').disabled=false;barcodeProductName='';barcodeFallbackCode='';barcodeLookupCode=code;barcodeLookupFormat=format;
 if(!barcodeValid(code,format)){$('barcodeAddLabel').classList.add('hidden');barcodeStatus('Masukkan nomor barcode 8–14 digit yang valid. Periksa digit pemeriksa EAN/UPC pada kemasan.');return}
 barcodeRequest?.abort();const controller=new AbortController();barcodeRequest=controller;barcodeBusy=true;
 const session=barcodeSession;barcodeStopCamera();$('manualBarcode').value=code;barcodeProductName='';
 $('barcodeAddLabel').classList.add('hidden');$('manualLookup').disabled=true;barcodeStatus('Barcode '+code+' · Mencari produk…');
 const active=()=>barcodeRequest===controller&&session===barcodeSession;
 const showFood=f=>{stopScanner();if(!$('addDialog').open)$('addDialog').showModal();$('foodSearch').value=f.name;renderAddResults()};
 let timer;
 try{
  const local=allFoods.find(f=>String(f.barcode||'').replace(/\s+/g,'')===code);
  if(local){showFood(local);toast('Produk ditemukan di perangkat');return}
  if(!navigator.onLine){barcodeFallback(code,'Perangkat offline; produk belum tersimpan di perangkat ini. Sambungkan internet dan tekan Cari lagi, atau isi dari label.');return}
  timer=setTimeout(()=>controller.abort(),15000);
  const u=`https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(code)}?fields=product_name,brands,serving_size,nutriments`;
  const response=await fetch(u,{signal:controller.signal});if(!active())return;
  if(response.status===404){barcodeFallback(code,'Produk belum tersedia di Open Food Facts. Isi dari label kemasan.');return}
  if(!response.ok){barcodeFallback(code,'Layanan pencarian gagal merespons (HTTP '+response.status+'). Tekan Cari untuk mencoba lagi.');return}
  const data=await response.json();if(!active())return;const product=data.product;
  if(!product){
   if(data.status===0||data.result?.id==='product_not_found'){barcodeFallback(code,'Produk belum tersedia di Open Food Facts. Isi dari label kemasan.')}
   else barcodeFallback(code,'Respons layanan pencarian tidak dapat dibaca. Tekan Cari untuk mencoba lagi.');
   return;
  }
  const name=product.product_name?(product.product_name+(product.brands?' · '+product.brands:'')):'';
  const n=product.nutriments||{},keys=['energy-kcal','proteins','carbohydrates','fat'];
  const complete=suffix=>keys.every(k=>typeof n[k+suffix]==='number'&&Number.isFinite(n[k+suffix])&&n[k+suffix]>=0);
  const suffix=product.serving_size&&complete('_serving')?'_serving':'_100g';
  const values=keys.map(k=>n[k+suffix]);
  if(!name||values.some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0)){
   barcodeFallback(code,'Produk ditemukan, tetapi nama atau data kalori/makro belum lengkap. Lengkapi dari label kemasan.',name);return;
  }
  const food={id:'off_'+code,name,category:'Produk kemasan',serving:suffix==='_serving'?product.serving_size:'100 g/ml',calories:values[0],protein:values[1],carbs:values[2],fat:values[3],source_type:'openfoodfacts',source_ref:'Open Food Facts · '+code,barcode:code,...v17FromOFF(n,suffix)};
  try{await dbPut('customFoods',food)}catch(e){if(active())barcodeFallback(code,'Produk ditemukan, tetapi gagal disimpan di perangkat. Periksa ruang penyimpanan lalu coba lagi.');return}
  // Persisted food remains available even if the dialog was closed during the write.
  customFoods=customFoods.filter(f=>f.id!==food.id);customFoods.push(food);allFoods=[...staticFoods,...customFoods];
  if(!active())return;showFood(food);toast('Produk ditemukan dan disimpan offline');
 }catch(e){if(active())barcodeFallback(code,controller.signal.aborted?'Pencarian melewati batas waktu. Tekan Cari untuk mencoba lagi.':'Koneksi ke layanan pencarian gagal atau respons tidak terbaca. Tekan Cari untuk mencoba lagi, atau isi dari label.')}
 finally{clearTimeout(timer);if(barcodeRequest===controller){barcodeRequest=null;barcodeBusy=false;$('manualLookup').disabled=false}}
}
document.addEventListener('DOMContentLoaded',()=>{
 $('barcodeAddLabel').onclick=()=>{const code=$('manualBarcode').value.replace(/\s+/g,'');
  if(!barcodeFallbackCode||code!==barcodeFallbackCode){$('barcodeAddLabel').classList.add('hidden');barcodeStatus('Nomor barcode berubah. Tekan Cari untuk memeriksa produk yang baru.');return}
  const name=barcodeProductName;stopScanner();$('customForm').reset();$('customBarcode').value=code;$('customBarcode').dataset.code=code;$('customBarcode').dataset.format=barcodeLookupFormat;$('customName').value=name;openCustom()};
 $('barcodeScanAgain').onclick=startScanner;
 $('manualBarcode').addEventListener('input',e=>{
  if(e.target.value.replace(/\s+/g,'')===barcodeLookupCode)return;
  barcodeSession++;barcodeRequest?.abort();barcodeRequest=null;barcodeBusy=false;barcodeStopCamera();
  barcodeProductName='';barcodeFallbackCode='';$('manualLookup').disabled=false;$('barcodeAddLabel').classList.add('hidden');
  barcodeStatus('Nomor barcode berubah. Tekan Cari untuk memeriksa produk yang baru.');
 });
 $('manualBarcode').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();lookupBarcode(e.target.value)}});
 $('scannerDialog').addEventListener('cancel',stopScanner);
 $('scannerDialog').addEventListener('close',()=>{if(!$('scannerDialog').open&&(scannerStream||barcodeRequest))stopScanner()});
});
function updateOnline(){$('offlineBanner').classList.toggle('hidden',navigator.onLine)}async function registerSW(){if('serviceWorker'in navigator)try{await navigator.serviceWorker.register('./sw.js')}catch(e){console.warn(e)}}let installBusy=false,installConfirmed=false;
function isInstalled(){return installConfirmed||matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}
function showInstall(){
 const installed=isInstalled();
 $('installBtn').classList.toggle('hidden',installed);$('installBtn2').classList.remove('hidden');
 $('installBtn').disabled=installed||installBusy;$('installBtn2').disabled=installed||installBusy;
 $('installBtn2').textContent=installed?'KaloriKu sudah terpasang':'Pasang aplikasi / Buat shortcut';
 if(installed)$('installStatus').textContent='KaloriKu sedang digunakan sebagai aplikasi.';
}
function showInstallHelp(){
 const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const android=/Android/i.test(navigator.userAgent);
 $('installHelpSteps').textContent=ios?'Buka KaloriKu di Safari. Ketuk Bagikan, lalu Tambahkan ke Layar Utama dan Tambahkan.':android?'Buka KaloriKu di Chrome. Ketuk menu ⋮, lalu Tambahkan ke layar utama atau Instal aplikasi. Ikuti konfirmasi browser.':'Buka KaloriKu di Chrome atau Edge. Cari ikon pemasangan di bilah alamat, atau buka menu browser dan pilih Instal aplikasi.';
 if(!$('installHelpDialog').open)$('installHelpDialog').showModal();
}
async function installPWA(){
 if(installBusy||isInstalled())return;
 if(!installPrompt){showInstallHelp();return;}
 const pending=installPrompt;installPrompt=null;installBusy=true;showInstall();
 try{
  await pending.prompt();const choice=await pending.userChoice;
  $('installStatus').textContent=choice.outcome==='accepted'?'Pemasangan dimulai. Ikuti konfirmasi browser.':'Pemasangan dibatalkan. Anda bisa mencoba lagi atau membuat shortcut lewat menu browser.';
 }catch(e){$('installStatus').textContent='Pemasangan langsung belum tersedia. Ikuti panduan membuat shortcut.';showInstallHelp();}
 finally{installBusy=false;showInstall();}
}
window.addFood=addFood;window.toggleFav=toggleFav;window.removeLog=removeLog;window.saveMealPack=saveMealPack;window.addPack=addPack;window.addEventListener('DOMContentLoaded',()=>init().catch(e=>{console.error(e);document.body.innerHTML='<div style="padding:30px;font-family:system-ui"><h2>KaloriKu gagal dimuat</h2><p>'+esc(e.message)+'</p></div>'}));