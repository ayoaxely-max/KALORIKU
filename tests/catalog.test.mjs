import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const old=JSON.parse(fs.readFileSync('data/foods.json','utf8'));
const daily=JSON.parse(fs.readFileSync('data/foods-daily.json','utf8'));
const other=JSON.parse(fs.readFileSync('data/foods-extra.json','utf8'));
const src=fs.readFileSync('app.js','utf8');
const snippet=src.slice(src.indexOf('function foodSearchNorm('),src.indexOf('function sourceLabel('));
const {foodSearchNorm,foodMatches,foodMatchRank}=new Function(snippet+';return {foodSearchNorm,foodMatches,foodMatchRank}')();
const catalog=[...old,...daily,...other];
test('all new foods are valid and honestly marked as estimates',()=>{
 assert.ok(daily.length>=150);
 for(const f of daily){assert.ok(f.name&&f.serving&&f.category&&f.id);assert.equal(f.source_type,'estimate');assert.ok(Array.isArray(f.aliases));
  for(const n of ['calories','protein','carbs','fat'])assert.ok(Number.isFinite(f[n])&&f[n]>=0,f.name+' '+n);
  assert.ok(Math.abs(f.calories-(4*f.protein+4*f.carbs+9*f.fat))<=1);
 }
});
test('daily names and IDs are not duplicates of old entries',()=>{
 const ids=new Set([...old,...other].map(f=>f.id));
 for(const f of daily){assert.ok(!ids.has(f.id),f.id);assert.equal(catalog.filter(g=>foodSearchNorm(g.name)===foodSearchNorm(f.name)).length,1,f.name)}
});
test('plain-language foods and typo searches work',()=>{
 for(const q of ['telor goreng','telur goreng','telor ceplok','telur mata sapi','telur dadar','tempe mendoan','pisang goreng','risol mayo','es teh manis']){
  assert.ok(catalog.some(f=>foodMatches(f,q)),q);
 }
});
test('plain fried egg ranks ahead of complex fried-egg dishes',()=>{
 const matches=catalog.filter(f=>foodMatches(f,'telor goreng')).sort((a,b)=>foodMatchRank(a,'telor goreng')-foodMatchRank(b,'telor goreng'));
 assert.equal(matches[0].name,'Telur goreng (1 butir)');
});
test('loader, service worker and photo AI recognize new catalog',()=>{
 assert.ok(src.includes('data/foods-daily.json'));
 assert.ok(fs.readFileSync('sw.js','utf8').includes('data/foods-daily.json'));
 assert.ok(fs.readFileSync('ai-photo.js','utf8').includes('f.aliases'));
});
