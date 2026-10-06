import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
const tools=createRequire(import.meta.url)('../nutrition-tools.js');
const snapshot=()=>({version:4,profile:{weight:70},logs:[],customFoods:[],weights:[],mealPhotos:[],packs:[],favorites:[],waterRecords:{},waterGoal:2000,foodMeasures:{}});
test('measures use food-specific serving weight, never a generic piece or ml weight',()=>{
 assert.equal(tools.measures({serving:'2 sdm (±45 g)'}).sdm,22.5);
 assert.equal(tools.measures({serving:'1 potong (±55 g)'}).potong,55);
 assert.deepEqual(tools.measures({serving:'1 potong'}),{});
 assert.deepEqual(tools.measures({serving:'1 gelas (250 ml)'}),{});
 assert.deepEqual(tools.measures({serving:'1 tusuk (3 butir)'}),{});
 assert.deepEqual(tools.measures({name:'Telur puyuh rebus (5 butir)',serving:'1 butir (±45 g)'}),{});
 assert.equal(tools.measures({serving:'2 sdm (±45 g)'},{sdm:18}).sdm,18);
 assert.equal(tools.servingGrams({serving:'1 porsi'},{porsi:120}),120);
});
test('recipe scales energy and macros with cooked yield while preserving unknown optional nutrients',()=>{
 const items=[{food:{serving:'100 g',calories:200,protein:20,carbs:10,fat:9,fiber:2},grams:200},{food:{serving:'100 g',calories:900,protein:0,carbs:0,fat:100},grams:10}];
 const r=tools.recipe(items,150,2);assert.equal(r.totals.calories,490);assert.equal(r.perPortion.calories,245);assert.equal(r.servingGrams,75);assert.equal(r.per100.calories,490/1.5);assert.equal(r.perPortion.fiber,undefined);
 assert.equal(tools.recipe(items,300,2).totals.calories,490);
 for(const grams of [0,-1,NaN,Infinity])assert.throws(()=>tools.recipe(items,grams,2));
 assert.throws(()=>tools.recipe([{food:{serving:'1 potong'},grams:50}],100,1));
});
test('merge is idempotent and detects collisions without summing water or duplicating records',()=>{
 const a=snapshot(),b=snapshot();a.logs=[{id:'one',qty:1}];b.logs=[{id:'one',qty:2},{id:'two',qty:1}];a.waterRecords={'2026-10-06':500};b.waterRecords={'2026-10-06':750};a.weights=[{date:'2026-10-06',weight:70}];b.weights=[{date:'2026-10-06',weight:71}];
 const local=tools.merge(a,b),cloud=tools.merge(a,b,'cloud');assert.equal(local.snapshot.logs.length,2);assert.equal(local.snapshot.logs[0].qty,1);assert.equal(local.snapshot.waterRecords['2026-10-06'],500);assert.equal(cloud.snapshot.waterRecords['2026-10-06'],750);assert.equal(cloud.snapshot.weights[0].weight,71);assert.equal(local.conflicts.length,3);
 assert.equal(tools.merge(local.snapshot,b).snapshot.logs.length,2);assert.equal(a.logs.length,1);
});
test('recipe definitions and personal measures survive union, with deterministic conflict resolution',()=>{
 const a=snapshot(),b=snapshot();a.foodMeasures={rice:{centong:100}};b.foodMeasures={rice:{centong:80},tempe:{potong:55}};b.customFoods=[{id:'recipe_1',recipe:{cookedGrams:350}}];const r=tools.merge(a,b,'cloud');assert.equal(r.snapshot.foodMeasures.rice.centong,80);assert.equal(r.snapshot.foodMeasures.tempe.potong,55);assert.equal(r.snapshot.customFoods[0].recipe.cookedGrams,350);
 assert.equal(tools.canonical({a:1,b:2}),tools.canonical({b:2,a:1}));
});
test('photo conflicts select a coherent photo and component log group',()=>{
 const a=snapshot(),b=snapshot();a.mealPhotos=[{id:'photo',items:[{qty:1}]}];b.mealPhotos=[{id:'photo',items:[{qty:2}]}];a.logs=[{id:'x',mealPhotoId:'photo',qty:1}];b.logs=[{id:'x',mealPhotoId:'photo',qty:2},{id:'y',mealPhotoId:'photo',qty:3}];const r=tools.merge(a,b);assert.equal(r.snapshot.logs.length,1);assert.equal(r.snapshot.logs[0].qty,1);assert.equal(tools.merge(a,b,'cloud').snapshot.logs.length,2);
});
test('all new assets are in the offline shell and backup paths include custom measures',()=>{
 const sw=fs.readFileSync('sw.js','utf8');for(const p of ['nutrition-tools.js','v24.js','db.js?v=2.4.0'])assert.ok(sw.includes(p));
 for(const f of ['app.js','v20.js','v17.js'])assert.ok(fs.readFileSync(f,'utf8').includes('foodMeasures'));
});
