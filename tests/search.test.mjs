import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync('app.js','utf8');
const snippet=src.slice(src.indexOf('function foodSearchNorm('),src.indexOf('function sourceLabel('));
const {foodMatches,foodMatchRank}=new Function(snippet+';return {foodMatches,foodMatchRank}')();
const food=name=>({name,aliases:[]});
test('search understands typos, transpositions, missing spaces, aliases and abbreviations',()=>{
 for(const [query,name] of [['tleur goreng','Telur goreng'],['telurr rebus','Telur rebus'],['teme goreng','Tempe goreng'],['nasigoreng','Nasi goreng'],['NASGOR','Nasi goreng'],['migor','Mie goreng'],['aym grg','Ayam goreng'],['goreng telur','Telur goreng'],['pisang goren','Pisang goreng'],['cappucino','Cappuccino']])assert.ok(foodMatches(food(name),query),query);
 assert.ok(foodMatches({name:'Makanan sendiri',aliases:['tempe mendoan']},'tempe mendoann'));
});
test('exact foods precede approximate ones and unrelated tokens/numbers stay excluded',()=>{
 assert.ok(foodMatchRank(food('Telur goreng'),'telur goreng')<foodMatchRank(food('Telur goren'),'telur goreng'));
 assert.ok(foodMatchRank(food('Nasi goreng'),'nasigoreng')<foodMatchRank(food('Nasi goreng ayam'),'nasigoreng'));
 for(const [q,n] of [['mi','Sapi'],['teh','Tempe'],['ayam 12','Ayam 13'],['nasi goreng ayam','Nasi goreng ikan'],['zzzzz','Nasi goreng']])assert.equal(foodMatches(food(n),q),false,q);
});
test('search cache notices changes in custom food names and aliases',()=>{
 const f=food('Tempe goreng');assert.ok(foodMatches(f,'tempe'));f.name='Tahu rebus';assert.equal(foodMatches(f,'tempe'),false);f.aliases=['tempe'];assert.ok(foodMatches(f,'tempe'));
});
