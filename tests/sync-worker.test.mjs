import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
const source=fs.readFileSync('cloud-sync/worker.js','utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const origin='https://ayoaxely-max.github.io',account='a'.repeat(64),token='b'.repeat(64);
function environment(){const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync('cloud-sync/schema.sql','utf8'));return {db,env:{SYNC_DB:{prepare(sql){let args=[];return {bind(...values){args=values;return this;},async first(){return db.prepare(sql).get(...args)||null;},async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}};}};}}}};}
async function call(env,route,{method='GET',data,auth=token,from=origin}={}){const r=await worker.fetch(new Request('https://example.test'+route+(route.includes('?')?'&':'?')+'account='+account,{method,headers:{Origin:from,Authorization:'Bearer '+auth,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)}),env);return {status:r.status,headers:r.headers,body:await r.json()};}
test('sync worker accepts encrypted IV separator, enforces origin/auth, revision and incomplete upload guards',async()=>{
 const {db,env}=environment();try{
  assert.equal((await call(env,'/sync/init',{method:'POST',data:{}})).status,200);
  assert.equal((await call(env,'/sync/head',{from:'https://evil.test'})).status,403);
  assert.equal((await call(env,'/sync/head',{auth:'c'.repeat(64)})).status,401);
  const id=crypto.randomUUID();
  assert.equal((await call(env,'/sync/chunk',{method:'POST',data:{uploadId:id,index:0,data:'IV_base64.Ciphertext_base64-'}})).status,200);
  assert.equal((await call(env,'/sync/chunk',{method:'POST',data:{uploadId:id,index:1,data:'bad!data'}})).status,400);
  assert.equal((await call(env,'/sync/commit',{method:'POST',data:{uploadId:id,total:2,expectedRevision:0}})).status,400);
  const commit=await call(env,'/sync/commit',{method:'POST',data:{uploadId:id,total:1,expectedRevision:0}});assert.equal(commit.status,200);assert.equal(commit.body.revision,1);
  const read=await call(env,'/sync/read?upload='+id+'&index=0');assert.equal(read.body.data,'IV_base64.Ciphertext_base64-');assert.equal(read.headers.get('access-control-allow-origin'),origin);
  assert.equal((await call(env,'/sync/commit',{method:'POST',data:{uploadId:id,total:1,expectedRevision:0}})).status,409);
  const next=crypto.randomUUID();await call(env,'/sync/chunk',{method:'POST',data:{uploadId:next,index:0,data:'second'}});await call(env,'/sync/commit',{method:'POST',data:{uploadId:next,total:1,expectedRevision:1}});
  assert.equal((await call(env,'/sync/read?upload='+id+'&index=0')).status,409);
 }finally{db.close();}
});
