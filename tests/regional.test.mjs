import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const old=[...json('data/foods.json'),...json('data/foods-daily.json'),...json('data/foods-extra.json')];
const regional=json('data/foods-regional.json');
const src=fs.readFileSync('app.js','utf8');
const slice=src.slice(src.indexOf('function foodSearchNorm('),src.indexOf('function sourceLabel('));
const {foodSearchNorm,foodMatches,foodMatchRank}=new Function(slice+';return {foodSearchNorm,foodMatches,foodMatchRank}')();
const all=[...old,...regional];
test('new regional records have traceable estimated nutrition, no negative values',()=>{
 assert.ok(regional.length>=90);
 for(const f of regional){
  assert.ok(f.id&&f.name&&f.category&&f.serving&&f.source_ref&&Array.isArray(f.aliases));
  assert.equal(f.source_type,'estimate');
  for(const k of ['calories','protein','carbs','fat'])assert.ok(Number.isFinite(f[k])&&f[k]>=0, f.name+' '+k);
  assert.ok(Math.abs(f.calories-4*f.protein-4*f.carbs-9*f.fat)<=1, f.name);
 }
});
test('IDs and canonical names are not repeated after normalization',()=>{
 const ids=new Set(),names=new Set();
 for(const f of all){assert.ok(!ids.has(f.id),'Duplicate id '+f.id);ids.add(f.id);const n=foodSearchNorm(f.name);if(regional.includes(f))assert.ok(!names.has(n),'Duplicate name '+f.name);names.add(n)}
});
test('common regional labels and quantities can be searched',()=>{
 for(const q of ['sego tumpang','nasi tumpang','pecel tumpang','selat solo','sate kere','tempe garit','sambel bawang','sambal terasi','leker','wedang angsle','es tebu','kunir asem','soto kwali','jangan lombok','buntil','sambal bawang']){
  assert.ok(all.some(f=>foodMatches(f,q)),'Not found: '+q);
 }
});
test('precise named regional matches rank above generic menu',()=>{
 const hits=all.filter(f=>foodMatches(f,'pecel tumpang')).sort((a,b)=>foodMatchRank(a,'pecel tumpang')-foodMatchRank(b,'pecel tumpang'));
 assert.equal(hits[0].name,'Pecel tumpang');
});
test('catalog is fetched online and cached offline without requiring data resets',()=>{
 assert.ok(src.includes('data/foods-regional.json'));
 const sw=fs.readFileSync('sw.js','utf8');
 assert.ok(sw.includes('data/foods-regional.json'));
 assert.match(sw,/kaloriku-github-pages-v\d+\.\d+\.\d+/);
});
